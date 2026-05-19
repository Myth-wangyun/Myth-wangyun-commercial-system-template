# 重复数据保存问题诊断与修复方案

## 问题现象

数据库 `teaching_quality."QT班就业信息表"` 中出现同一个班级的数据被保存多次，只是年份不同：
- 河北盛邦 2025 002班 有4个学生（id 37-40）
- 河北盛邦 2026 002班 有4个学生（id 25-28）  
- 河北盛邦 2027 002班 有4个学生（id 29-32）

这导致班主任就业汇总表统计时，数据被重复计算。

## 根本原因分析

### 1. **前端状态管理问题（主要原因）**

在 `1-ClassEmploymentInfoTable.tsx` 中：

```tsx
// 问题代码：当用户选择班级时会触发 fetchSummary
onChange={(v) => {
  setSelectedClass(v)
  ensureKey(selectedYear, v, selectedCampus)
  fetchSummary(selectedCampus, selectedYear, v)  // ← 这里
}}
```

**触发链路：**
1. 用户选择班级 → `setSelectedClass(v)` → 触发 `useEffect`
2. `useEffect` 监听 `selectedClass` 变化 → 调用 `fetchEmploymentRows` 和 `fetchSummary`
3. 但是 `onChange` 里也手动调用了 `fetchSummary`
4. **结果：`fetchSummary` 被调用了两次！**

### 2. **年份切换时的数据持久化问题**

当用户：
1. 选择"河北盛邦 + 2026年 + 002班" → 填写数据 → 保存
2. 切换到"河北盛邦 + 2027年 + 002班" → **前端显示上次的数据缓存** → 保存
3. 切换到"河北盛邦 + 2025年 + 002班" → **前端显示上次的数据缓存** → 保存

**原因：**
- 前端使用 `dataMap` 缓存不同年份/班级的数据
- 当年份切换时，如果 `dataMap` 中没有该 key，会调用 `createInitialRows()` 创建空白行
- 但空白行可能被自动填充或用户误认为是之前的数据，导致重复保存

### 3. **后端删除逻辑的缺陷**

在 `TQ_class_employment_info_db.py` 的 `replace_rows` 函数中：

```python
# 删除所有变体的旧数据，避免重复
if variants:
    db.query(QT班就业信息表).filter(
        or_(*[QT班就业信息表.校区名称 == v for v in variants]),
        QT班就业信息表.年份 == 年份,
        QT班就业信息表.班级名称 == 班级名称,
    ).delete(synchronize_session=False)
```

**问题：**
- 删除逻辑是正确的（按校区+年份+班级删除）
- 但如果用户在不同年份保存同一个班级的数据，后端会认为这是"不同的数据"（因为年份不同）
- **后端无法识别这是重复数据**

## 复现步骤

1. 打开 `https://data.qingmei.co/teaching-quality/campus/employment-goals-results`
2. 选择"TAB2：班级就业信息表"
3. 选择校区："河北盛邦"
4. 选择年份："2026"
5. 选择班级："002"
6. 填写4个学生的数据，点击"保存"
7. **切换年份到"2027"** ← 关键步骤
8. 不修改任何数据，直接点击"保存" ← **会保存一份 2027年的数据**
9. **切换年份到"2025"**
10. 不修改任何数据，直接点击"保存" ← **会保存一份 2025年的数据**

结果：数据库中有3份相同的学生数据，只是年份不同。

## 修复方案

### 修复1：移除 `onChange` 中的重复调用

```tsx
// 修改前
onChange={(v) => {
  setSelectedClass(v)
  ensureKey(selectedYear, v, selectedCampus)
  fetchSummary(selectedCampus, selectedYear, v)  // ← 删除这行
}}

// 修改后
onChange={(v) => {
  setSelectedClass(v)
  ensureKey(selectedYear, v, selectedCampus)
}}
```

**原因：** `useEffect` 已经监听了 `selectedClass` 的变化，会自动调用 `fetchSummary`，无需手动调用。

### 修复2：年份切换时清空表单数据

```tsx
// 在年份 Select 的 onChange 中添加清空逻辑
<Select
  value={selectedYear}
  onChange={(year) => {
    setSelectedYear(year)
    setSelectedClass('') // ← 清空班级选择
    setDataMap((prev) => {
      // 删除当前 key 的缓存，强制重新加载
      const { [currentKey]: _, ...rest } = prev
      return rest
    })
  }}
>
```

### 修复3：添加数据验证警告

在 `saveEmploymentRows` 函数中添加验证：

```tsx
const saveEmploymentRows = async () => {
  if (!selectedClass) {
    message.warning('请选择班级')
    return
  }
  
  // 新增：检查是否有有效数据
  const validRows = rows.filter((r) => Object.values(r).some((v) => v !== '' && v !== null))
  if (validRows.length === 0) {
    message.warning('没有有效数据，无需保存')
    return
  }
  
  // 新增：检查是否与其他年份重复
  try {
    const checkRes = await fetch(buildApiUrl(`/teaching-quality/check-duplicate-class?campus=${encodeURIComponent(selectedCampus)}&clazz=${encodeURIComponent(selectedClass)}`))
    if (checkRes.ok) {
      const existing = await checkRes.json()
      if (existing.years && existing.years.length > 0 && !existing.years.includes(selectedYear)) {
        const confirmed = window.confirm(
          `检测到班级"${selectedClass}"在其他年份已有数据：${existing.years.join('、')}\n` +
          `当前年份：${selectedYear}\n\n` +
          `是否确认保存？这可能导致数据重复统计。`
        )
        if (!confirmed) return
      }
    }
  } catch (e) {
    // 检查失败不阻止保存
    console.warn('检查重复数据失败', e)
  }
  
  // 原有的保存逻辑...
}
```

### 修复4：后端添加重复检测接口（可选）

在 `TQclass_employment_info_api.py` 中添加：

```python
@router.get(
    "/check-duplicate-class",
    summary="检查班级是否在其他年份有数据",
)
def check_duplicate_class(
    campus: str = Query(...),
    clazz: str = Query(...),
    db: Session = Depends(get_db)
):
    """检查指定班级是否在多个年份有数据（可能重复）"""
    from sqlalchemy import distinct
    
    years = db.query(distinct(QT班就业信息表.年份)).filter(
        QT班就业信息表.校区名称.in_(_campus_variants(campus)),
        QT班就业信息表.班级名称 == clazz
    ).all()
    
    return {"years": [y[0] for y in years]}
```

### 修复5：数据清理脚本

创建脚本删除重复数据：

```python
# backend/scripts/clean_duplicate_employment_data.py
"""
清理重复的班级就业数据
保留最新年份的数据，删除其他年份的相同班级数据
"""
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

# 连接数据库
engine = create_engine("postgresql://...")
Session = sessionmaker(bind=engine)
db = Session()

# 查找重复数据
duplicates = db.execute("""
    SELECT 校区名称, 班级名称, COUNT(DISTINCT 年份) as year_count
    FROM teaching_quality."QT班就业信息表"
    GROUP BY 校区名称, 班级名称
    HAVING COUNT(DISTINCT 年份) > 1
""").fetchall()

print(f"发现 {len(duplicates)} 个重复班级")

for campus, clazz, count in duplicates:
    # 获取该班级的所有年份
    years = db.execute("""
        SELECT DISTINCT 年份 
        FROM teaching_quality."QT班就业信息表"
        WHERE 校区名称 = :campus AND 班级名称 = :clazz
        ORDER BY 年份 DESC
    """, {"campus": campus, "clazz": clazz}).fetchall()
    
    # 保留最新年份，删除其他年份
    keep_year = years[0][0]
    delete_years = [y[0] for y in years[1:]]
    
    print(f"  {campus} - {clazz}: 保留 {keep_year}, 删除 {delete_years}")
    
    for year in delete_years:
        db.execute("""
            DELETE FROM teaching_quality."QT班就业信息表"
            WHERE 校区名称 = :campus AND 班级名称 = :clazz AND 年份 = :year
        """, {"campus": campus, "clazz": clazz, "year": year})

db.commit()
print("清理完成！")
```

## 推荐修复顺序

1. **立即修复：** 修复1（移除重复调用）- 5分钟
2. **短期修复：** 修复2（年份切换清空）- 10分钟  
3. **中期修复：** 修复3（数据验证警告）- 20分钟
4. **长期优化：** 修复4（后端接口）+ 修复5（数据清理）- 30分钟

## 预防措施

1. **前端表单状态管理规范：**
   - 避免在 `onChange` 中调用异步请求，统一交给 `useEffect` 处理
   - 关键字段（年份、班级）切换时清空表单数据

2. **后端数据完整性约束：**
   - 考虑在数据库层面添加唯一约束：`UNIQUE(校区名称, 年份, 班级名称, 序号)`
   - 防止相同班级在同一年份有重复数据

3. **用户操作提示：**
   - 年份切换时显示明确提示："切换年份后将加载新数据"
   - 保存前二次确认："确认保存 XX校区 XXXX年 XXX班 的数据？"

## 影响范围评估

- **前端文件：** 1个（`1-ClassEmploymentInfoTable.tsx`）
- **后端文件：** 1个（`TQclass_employment_info_api.py`，可选）
- **数据库影响：** 需要清理历史重复数据
- **用户影响：** 修复后需要用户重新检查已保存的数据

## 测试建议

1. 测试年份切换：选择班级 → 切换年份 → 验证表单是否清空
2. 测试重复保存：尝试在不同年份保存同一班级 → 验证是否有警告
3. 测试数据统计：保存后刷新班主任就业汇总表 → 验证数据是否正确（不重复）
4. 测试边界情况：空表单保存、校区名称变体、特殊字符班级名
