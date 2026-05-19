# JSONB 字段处理问题诊断指南

## 问题描述

用户反馈：表头数据能正常获取，但表格内容（JSONB字段）可能有问题。

## 可能的问题点

### 1. 字段命名不一致（驼峰 vs 下划线）

**测试数据生成**（`press-interview-scores.integration.test.ts`）：
```typescript
projectScores[String(p)] = {
  instructor1Score: ...,
  instructor2Score: ...,
  homeroomTeacher1Score: ...,
  // 使用驼峰命名
}
```

**后端 Schema**（`backend/app/schemas/press_interview_score.py`）：
```python
class ProjectScore(BaseModel):
    instructor1_score: int = 0  # 下划线命名
    instructor2_score: int = 0
    homeroom_teacher1_score: int = 0
```

**前端映射函数**（`023-project-defense.tsx`）：
```typescript
const mappedScore = {
  instructor1Score: Number(scoreData.instructor1Score ?? scoreData.instructor1_score ?? 0),
  // 同时支持两种格式
}
```

✅ **已处理**：`mapFromApi` 函数同时支持驼峰和下划线命名。

### 2. 项目键名类型问题（字符串 vs 数字）

**测试数据生成**：
```typescript
projectScores[String(p)] = { ... }  // 键名为字符串 "1", "2", "3"
```

**前端访问**：
```typescript
record.projectScores[project.number]  // project.number 是数字 1, 2, 3
```

**映射函数**：
```typescript
Object.entries(rawProjectScores).forEach(([k, v]) => {
  const keyNum = Number(k);  // 将字符串键转换为数字
  scores[keyNum] = mappedScore;
});
```

✅ **已处理**：`mapFromApi` 函数将字符串键转换为数字键。

### 3. 数据为空或未正确加载

**可能原因**：
- 后端返回的 `project_scores` 字段为空 `{}`
- 数据映射过程中出错
- 前端过滤条件太严格，导致没有匹配的数据

## 已添加的调试日志

在 `mapFromApi` 函数中添加了详细的调试日志：

1. **原始数据结构**：打印后端返回的原始 `projectScores`
2. **键名类型**：显示每个键的类型（字符串/数字）
3. **映射过程**：显示每个项目的映射结果
4. **最终结果**：显示每个学员的完整 `projectScores`

在 `loadData` 函数中也添加了日志：

1. **数据列表**：打印加载的完整数据列表
2. **数据条数**：显示加载的数据条数
3. **第一条数据**：显示第一条数据的 `projectScores` 结构

## 如何查看调试信息

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 刷新页面或重新加载数据
4. 查找以下日志前缀：
   - `🔍 mapFromApi` - 数据映射过程
   - `📥 loadData` - 数据加载过程
   - `✅` - 成功操作
   - `⚠️` - 警告信息

## 检查清单

### 步骤1：检查后端数据

```bash
# 检查后端API返回的数据
curl "http://localhost:8000/api/v1/press-interview-scores/?campus_name=盛邦校区&class_name=S32106&major_name=数字媒体&course_name=压力面试&instructor_name=杜鹏涛&page_size=1"
```

查看返回的 JSON 中 `project_scores` 字段：
- 是否为空 `{}`？
- 键名是字符串还是数字？
- 字段名是驼峰还是下划线？

### 步骤2：检查前端控制台

打开浏览器控制台，查看：
- 是否有 `🔍 mapFromApi` 日志？
- `projectScores` 的键名是什么类型？
- 映射后的数据是否正确？

### 步骤3：检查表格渲染

在表格渲染时，检查：
- `record.projectScores[project.number]` 是否能正确访问？
- `project.number` 的值是什么？（应该是数字 1, 2, 3...）
- `record.projectScores` 的键是什么类型？

## 常见问题排查

### 问题1：projectScores 为空对象

**症状**：控制台显示 `projectScores: {}`

**可能原因**：
- 测试数据生成时 `projectScores` 为空
- 后端存储时数据丢失
- 数据映射时出错

**解决方案**：
1. 检查测试数据生成逻辑
2. 检查后端数据库中的实际数据
3. 查看 `mapFromApi` 的日志，确认映射过程

### 问题2：键名类型不匹配

**症状**：`record.projectScores[1]` 返回 `undefined`，但 `record.projectScores['1']` 有值

**可能原因**：
- 后端返回的键是字符串，但前端使用数字访问

**解决方案**：
- 已通过 `Number(k)` 转换处理，但需要确认转换是否正确

### 问题3：字段名不匹配

**症状**：所有分数都是 0

**可能原因**：
- 后端返回的字段名与前端期望的不一致

**解决方案**：
- 已通过 `??` 运算符同时支持两种命名方式
- 查看日志确认实际使用的字段名

## 下一步行动

1. **运行测试并查看日志**：
   - 打开页面
   - 查看浏览器控制台
   - 记录所有相关日志

2. **如果数据为空**：
   - 检查测试数据是否已正确创建
   - 检查后端API是否返回数据
   - 检查过滤条件是否太严格

3. **如果数据存在但显示不正确**：
   - 查看 `mapFromApi` 的日志
   - 确认键名和字段名的转换是否正确
   - 检查表格渲染逻辑

4. **如果问题仍然存在**：
   - 提供控制台日志截图
   - 提供后端API返回的原始JSON
   - 提供数据库中的实际数据

## 临时调试代码

如果需要更详细的调试信息，可以在表格渲染时添加：

```typescript
render: (_, record: PressureInterviewRecord) => {
  console.log('🔍 渲染单元格 - project.number:', project.number);
  console.log('🔍 渲染单元格 - record.projectScores:', record.projectScores);
  console.log('🔍 渲染单元格 - 访问结果:', record.projectScores[project.number]);
  
  return (
    <InputNumber
      value={record.projectScores[project.number]?.instructor1Score || 0}
      // ...
    />
  );
}
```

