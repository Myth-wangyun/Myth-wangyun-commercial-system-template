# 班级档案表字段拆分实施总结

## 需求说明
将班级档案表中的"承诺注册学历性质、级别、名称"字段拆分为3个独立字段，便于更规范的数据录入和查询。

## 修改内容

### 1. 数据库模型 (后端)

**文件：** `backend/app/teaching-quality/TQclass_file_record_db.py`

**修改：**
- 将 `承诺注册学历性质级别名称 = Column(Text)` 拆分为：
  - `承诺注册学历性质 = Column(String(50))` - 如：全日制、非全日制、成人教育
  - `承诺注册学历级别 = Column(String(50))` - 如：中专、大专、本科
  - `学历学校名称 = Column(String(200))` - 如：清美动漫学校

**自动迁移：**
```python
def _migrate():
    # ...现有代码...
    with engine.begin() as conn:
        # 添加新列（如果不存在）
        conn.execute(text('ALTER TABLE teaching_quality."班级档案表" ADD COLUMN IF NOT EXISTS "承诺注册学历性质" VARCHAR(50)'))
        conn.execute(text('ALTER TABLE teaching_quality."班级档案表" ADD COLUMN IF NOT EXISTS "承诺注册学历级别" VARCHAR(50)'))
        conn.execute(text('ALTER TABLE teaching_quality."班级档案表" ADD COLUMN IF NOT EXISTS "学历学校名称" VARCHAR(200)'))
```

**功能：** init_class_file_tables() 调用时自动添加新列

### 2. API 接口 (后端)

**文件：** `backend/app/teaching-quality/TQclass_file_record_api.py`

**修改：**

**Row 和 StudentSearchResult 模型：**
```python
# 旧字段
promisedEducationDetail: Optional[str] = None

# 新字段
promisedEducationNature: Optional[str] = None
promisedEducationLevel: Optional[str] = None
educationSchoolName: Optional[str] = None
```

**_row_to_dict 函数：**
```python
# 旧映射
"promisedEducationDetail": r.承诺注册学历性质级别名称,

# 新映射
"promisedEducationNature": r.承诺注册学历性质,
"promisedEducationLevel": r.承诺注册学历级别,
"educationSchoolName": r.学历学校名称,
```

**search_students SQL查询：**
- SELECT 子句中添加了3个新字段
- 结果集索引从 r[25] 改为 r[25], r[26], r[27]

### 3. 前端接口定义

**文件：** `frontend/pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record/index.tsx`

**修改：**

**ClassFileRecordRow 接口：**
```typescript
// 旧字段
promisedEducationDetail: string

// 新字段
promisedEducationNature: string
promisedEducationLevel: string
educationSchoolName: string
```

**createEmptyRow 函数：**
```typescript
promisedEducationNature: '',
promisedEducationLevel: '',
educationSchoolName: '',
```

### 4. 前端表格列配置

**文件：** `frontend/pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record/index.tsx`

**修改：** 将1个宽列拆分为3个独立列

```typescript
// 旧配置 (1列)
{
  title: '承诺注册学历性质、级别、名称',
  dataIndex: 'promisedEducationDetail',
  width: 260,
  render: (text, record) => (
    <Input
      placeholder="如：全日制中专清美/不限性质、大专等"
      onChange={(e) => handleChange(record.key, 'promisedEducationDetail', e.target.value)}
    />
  )
}

// 新配置 (3列)
{
  title: '承诺注册学历性质',
  dataIndex: 'promisedEducationNature',
  width: 150,
  render: (text, record) => (
    <Input
      placeholder="如：全日制"
      onChange={(e) => handleChange(record.key, 'promisedEducationNature', e.target.value)}
    />
  )
},
{
  title: '承诺注册学历级别',
  dataIndex: 'promisedEducationLevel',
  width: 150,
  render: (text, record) => (
    <Input
      placeholder="如：中专/大专"
      onChange={(e) => handleChange(record.key, 'promisedEducationLevel', e.target.value)}
    />
  )
},
{
  title: '学历学校名称',
  dataIndex: 'educationSchoolName',
  width: 220,
  render: (text, record) => (
    <Input
      placeholder="如：清美动漫学校"
      onChange={(e) => handleChange(record.key, 'educationSchoolName', e.target.value)}
    />
  )
}
```

### 5. 前端数据加载和保存

**loadData 函数：**
```typescript
// 旧映射
promisedEducationDetail: r.promisedEducationDetail || '',

// 新映射
promisedEducationNature: r.promisedEducationNature || '',
promisedEducationLevel: r.promisedEducationLevel || '',
educationSchoolName: r.educationSchoolName || '',
```

**saveData 函数：**
- payload 构建时包含3个新字段
- 响应数据映射时从3个字段读取

**generateTestData 函数：**
```typescript
// 旧代码
promisedEducationDetail: `${educations[...]}学历`,

// 新代码
promisedEducationNature: ['全日制', '非全日制', '成人教育'][...],
promisedEducationLevel: educations[...],
educationSchoolName: `XX${['职业技术学校', '职业学院', '大学'][...]}`,
```

### 6. 退费详情页适配

**文件：** `frontend/pages/teaching-quality/campus/1-core-data/6-stu-movement/2-campus-refund-detail.tsx`

**修改：**

**StudentSearchResult 接口：**
```typescript
// 旧字段
promisedEducationDetail: string

// 新字段
promisedEducationNature: string
promisedEducationLevel: string
educationSchoolName: string
```

**自动填充逻辑：**
```typescript
// 旧代码
registrationCommitmentDetails: student.promisedEducationDetail || '',

// 新代码（组合显示）
registrationCommitmentDetails: [
  student.promisedEducationNature,
  student.promisedEducationLevel,
  student.educationSchoolName
].filter(Boolean).join(' ') || '',
```

### 7. 数据迁移脚本

**文件：** `backend/scripts/migrate_promised_education_fields.py`

**功能：**
1. 添加3个新列（如果不存在）
2. 检查现有数据统计
3. 验证新列已创建
4. 提供清理旧列的SQL命令

**使用方法：**
```bash
python backend/scripts/migrate_promised_education_fields.py
```

## 部署步骤

### 1. 数据库迁移（自动）
- init_class_file_tables() 被调用时自动执行
- 或手动运行迁移脚本：`python backend/scripts/migrate_promised_education_fields.py`

### 2. 重启后端服务
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 3. 前端无需特殊操作
- 打开班级档案表页面即可看到3个新输入框
- 旧数据的 `承诺注册学历性质级别名称` 字段暂时保留，不影响功能

### 4. 数据清理（可选）
确认所有数据已迁移到新字段后，可删除旧列：
```sql
ALTER TABLE teaching_quality."班级档案表" 
DROP COLUMN IF EXISTS "承诺注册学历性质级别名称";
```

## 兼容性说明

### 向后兼容
- ✅ 旧数据库自动添加新列
- ✅ 旧字段暂时保留（可手动删除）
- ✅ API同时支持新旧字段读取

### 数据迁移
- ⚠️ 旧字段是自由文本，无法自动解析
- 建议：用户在前端重新填写新的3个字段

## 测试清单

- [x] 后端：数据库模型更新
- [x] 后端：API接口字段映射
- [x] 后端：学生搜索SQL查询
- [x] 前端：接口定义更新
- [x] 前端：表格列配置
- [x] 前端：数据加载和保存
- [x] 前端：测试数据生成
- [x] 退费详情页：接口和自动填充
- [x] 数据库迁移脚本
- [x] init_db自动迁移集成

## 影响范围

### 修改的文件
1. `backend/app/teaching-quality/TQclass_file_record_db.py` - 数据库模型
2. `backend/app/teaching-quality/TQclass_file_record_api.py` - API接口
3. `frontend/pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record/index.tsx` - 班级档案表页面
4. `frontend/pages/teaching-quality/campus/1-core-data/6-stu-movement/2-campus-refund-detail.tsx` - 退费详情页

### 新增的文件
1. `backend/scripts/migrate_promised_education_fields.py` - 数据迁移脚本

## URL访问测试

访问以下URL测试功能：
```
http://localhost:5173/teaching-quality/campus/class-file-record?class=Y001&campus=测试
```

预期效果：
- 看到3个独立的输入框：承诺注册学历性质、承诺注册学历级别、学历学校名称
- 每个输入框有相应的placeholder提示
- 数据保存和加载正常
