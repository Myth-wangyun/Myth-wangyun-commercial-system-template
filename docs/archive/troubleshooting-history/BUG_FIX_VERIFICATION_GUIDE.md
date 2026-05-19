# 重复数据Bug修复验证指南

## 已实施的修复

### 1. 前端代码修复 ✅

#### 修复1：移除重复的 fetchSummary 调用
**文件：** `frontend/pages/teaching-quality/campus/1-core-data/2-student-employment/TAB2ClassEmploymentInfoTable/1-ClassEmploymentInfoTable.tsx`

**修改内容：**
```tsx
// 修改前：班级 Select 的 onChange
onChange={(v) => {
  setSelectedClass(v)
  ensureKey(selectedYear, v, selectedCampus)
  fetchSummary(selectedCampus, selectedYear, v)  // ← 重复调用，已删除
}}

// 修改后
onChange={(v) => {
  setSelectedClass(v)
  ensureKey(selectedYear, v, selectedCampus)
  // fetchSummary 由 useEffect 自动调用，避免重复
}}
```

**效果：** 避免了选择班级时 `fetchSummary` 被调用两次的问题。

#### 修复2：年份切换时清空班级选择
**文件：** 同上

**修改内容：**
```tsx
// 修改前：年份 Select 的 onChange
onChange={(v) => {
  setSelectedYear(v)
  if (selectedClass) ensureKey(v, selectedClass, selectedCampus)
}}

// 修改后
onChange={(v) => {
  setSelectedYear(v)
  // 年份切换时清空班级选择，避免重复保存问题
  setSelectedClass('')
  setSummary(null)
  setSummaryInputs({})
}}
```

**效果：** 年份切换后必须重新选择班级，防止用户误操作将同一班级数据保存到多个年份。

#### 修复3：增强保存成功提示
**文件：** 同上

**修改内容：**
```tsx
// 修改前
message.success('保存成功')

// 修改后
message.success(`已保存 ${selectedCampus} ${selectedYear}年 ${selectedClass}班 的数据`)
```

**效果：** 用户保存时能清楚看到保存的是哪个校区、哪一年、哪个班级的数据，避免误操作。

#### 修复4：添加空数据验证
**文件：** 同上

**修改内容：**
```tsx
// 在 saveEmploymentRows 函数开头添加
const validRows = rows.filter((r) => Object.values(r).some((v) => v !== '' && v !== null))
if (validRows.length === 0) {
  message.warning('没有有效数据，无需保存')
  return
}
```

**效果：** 防止用户在表格为空时误点保存按钮。

### 2. 数据清理脚本 ✅

**文件：** `backend/scripts/clean_duplicate_employment_data.py`

**功能：**
- 自动扫描数据库中重复的班级数据（同一班级在多个年份有数据）
- 显示详细的重复统计和清理方案
- 保留最新年份的数据，删除其他年份的重复数据
- 提供交互式确认，避免误删除

**使用方法：**
```bash
cd backend
python scripts/clean_duplicate_employment_data.py
```

## 测试验证步骤

### 前置条件
1. 确保前端代码已更新
2. 重启前端开发服务器（如果正在运行）
3. 清除浏览器缓存（Ctrl+Shift+Delete）

### 测试用例1：验证年份切换清空功能

**目的：** 确认年份切换时班级选择被清空

**步骤：**
1. 打开 `http://localhost:5173/teaching-quality/campus/employment-goals-results`
2. 选择 TAB2："班级就业信息表"
3. 选择校区："河北盛邦"
4. 选择年份："2026"
5. 选择班级："001"
6. 切换年份到："2027"
7. **预期结果：** 班级选择框自动清空，表格显示为空

✅ **通过标准：** 年份切换后，班级选择框显示"请选择班级"，表格为20行空白行

### 测试用例2：验证保存提示信息

**目的：** 确认保存成功时显示完整的校区/年份/班级信息

**步骤：**
1. 选择校区："河北盛邦"
2. 选择年份："2026"
3. 选择班级："001"
4. 在第一行填写学生数据：
   - 姓名：测试学生
   - 性别：男
5. 点击"保存"按钮
6. **预期结果：** 提示"已保存 河北盛邦 2026年 001班 的数据"

✅ **通过标准：** 成功提示信息包含完整的校区名称、年份和班级名称

### 测试用例3：验证空数据保存拦截

**目的：** 确认空表格无法保存

**步骤：**
1. 选择校区："河北盛邦"
2. 选择年份："2028"（新年份，无数据）
3. 选择班级："001"
4. 不填写任何数据，直接点击"保存"按钮
5. **预期结果：** 提示"没有有效数据，无需保存"

✅ **通过标准：** 空表格保存时显示警告，不发送请求

### 测试用例4：验证不重复保存

**目的：** 确认修复后不会重复保存数据

**步骤：**
1. 选择校区："河北盛邦"
2. 选择年份："2026"
3. 选择班级："002"
4. 填写4个学生数据并保存
5. **关键步骤：** 切换年份到"2027"
6. **观察：** 班级选择框应该被清空
7. 如果尝试重新选择"002"班并保存：
   - 需要手动重新选择班级
   - 用户会意识到这是在保存2027年的数据

✅ **通过标准：** 
- 年份切换后班级选择被清空
- 用户必须重新选择班级才能保存
- 保存提示明确显示年份信息

### 测试用例5：验证班主任就业汇总表不重复统计

**目的：** 确认清理重复数据后，统计结果正确

**步骤：**
1. **先运行清理脚本：**
   ```bash
   cd backend
   python scripts/clean_duplicate_employment_data.py
   ```
   按提示输入 `YES` 确认清理

2. 打开 `http://localhost:5173/teaching-quality/core-data`
3. 选择"校区后端班主任就业汇总表"
4. 选择校区："河北盛邦"
5. 检查郭彩兰老师的统计数据：
   - 档案人数应该正确（不重复计算）
   - 就业人数应该正确
   - 薪资平均值应该正确

✅ **通过标准：** 
- 每个班级只统计一次
- 档案人数、就业人数、薪资数据准确
- 合计行数据正确

## 复现原Bug的方法（验证修复前的问题）

如果需要验证修复前的问题，可以临时回退代码：

1. **暂存当前修复：**
   ```bash
   git stash
   ```

2. **尝试复现Bug：**
   - 选择"河北盛邦 + 2026年 + 002班"
   - 填写数据并保存
   - 切换到"2027年"
   - **Bug现象：** 班级仍然是"002"，表格仍有数据
   - 直接点击保存 → 数据被重复保存到2027年

3. **恢复修复代码：**
   ```bash
   git stash pop
   ```

## 数据库验证查询

### 检查重复数据
```sql
-- 查找同一班级在多个年份有数据的情况
SELECT 校区名称, 班级名称, 
       COUNT(DISTINCT 年份) as year_count,
       STRING_AGG(DISTINCT 年份::TEXT, ', ') as years,
       COUNT(*) as total_records
FROM teaching_quality."QT班就业信息表"
GROUP BY 校区名称, 班级名称
HAVING COUNT(DISTINCT 年份) > 1
ORDER BY 校区名称, 班级名称;
```

### 查看某个班级的所有年份数据
```sql
-- 查看"河北盛邦 002班"的数据分布
SELECT 年份, 序号, 姓名, 性别, 年龄
FROM teaching_quality."QT班就业信息表"
WHERE 校区名称 = '河北盛邦' AND 班级名称 = '002'
ORDER BY 年份 DESC, 序号;
```

### 验证清理后的数据
```sql
-- 清理后应该没有重复（结果应为0行）
SELECT 校区名称, 班级名称
FROM teaching_quality."QT班就业信息表"
GROUP BY 校区名称, 班级名称
HAVING COUNT(DISTINCT 年份) > 1;
```

## 预期修复效果总结

✅ **已修复的问题：**
1. 年份切换时自动清空班级选择，防止误操作
2. 移除了重复的 API 调用
3. 保存时显示明确的上下文信息（校区/年份/班级）
4. 空数据无法保存
5. 提供数据清理脚本清除历史重复数据

✅ **用户体验改进：**
1. 年份切换后必须重新选择班级（防止误操作）
2. 保存成功提示更明确，减少用户困惑
3. 空表格保存提示友好的警告信息

✅ **数据质量保障：**
1. 历史重复数据可通过脚本清理
2. 新数据不会再重复保存
3. 班主任就业汇总表统计准确

## 注意事项

⚠️ **重要：**
1. 运行清理脚本前务必备份数据库
2. 清理脚本会删除除最新年份外的所有重复数据
3. 如果某些历史年份的数据是有意保存的（不是误操作），请手动调整清理逻辑
4. 建议在测试环境先验证清理脚本的效果

## 后续建议

1. **数据库约束：** 考虑添加唯一约束防止重复
   ```sql
   ALTER TABLE teaching_quality."QT班就业信息表" 
   ADD CONSTRAINT unique_class_year_student 
   UNIQUE (校区名称, 年份, 班级名称, 序号);
   ```

2. **监控告警：** 定期运行检查脚本，发现重复数据时发送告警

3. **用户培训：** 告知用户年份切换的新行为（自动清空班级选择）

4. **日志记录：** 在保存 API 中记录操作日志，便于追溯问题
