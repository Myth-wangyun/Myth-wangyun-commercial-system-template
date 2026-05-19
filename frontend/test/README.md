# 单元测试说明

## 测试文件

本目录包含以下三个表的单元测试：

1. **`class-exam-scores.test.ts`** - 班考试成绩表测试
2. **`project-grade-register.test.ts`** - 班项目成绩表测试
3. **`press-interview-scores.test.ts`** - 班压力面试成绩表测试

## 测试类型

### 单元测试（使用 Mock，不写数据库）

- **文件**: `*.test.ts`
- **特点**: 使用 `vi.mock` 模拟 API，不发送真实请求
- **速度**: ⚡ 非常快（毫秒级）
- **数据库**: ❌ 不写数据库
- **用途**: 验证代码逻辑和 API 调用格式

### 集成测试（真实 API，会写数据库）

- **文件**: `*.integration.test.ts`
- **特点**: 不使用 mock，调用真实 API
- **速度**: 🐌 较慢（秒级）
- **数据库**: ✅ 会写真实数据库
- **用途**: 验证端到端流程

## 运行测试

### 运行单元测试（Mock 版本，不写数据库）

```bash
# 运行所有单元测试
npm test

# 运行特定测试文件
npm test class-exam-scores
npm test project-grade-register
npm test press-interview-scores
```

### 运行集成测试（真实 API，会写数据库）

```bash
# ⚠️ 注意：这会真正向数据库写入数据！
# 运行前请确保：
# 1. 后端服务正在运行
# 2. 数据库连接正常
# 3. 有有效的认证 token（如果需要）

npm run test:integration
```

### 运行测试并查看UI

```bash
npm run test:ui
```

### 运行测试并监听文件变化

```bash
npm test -- --watch
```

## 测试覆盖范围

### 班考试成绩表 (`class-exam-scores.test.ts`)

#### ✅ 创建操作
- 创建包含首考成绩的记录
- 创建包含补考成绩的记录
- 创建同时包含首考和补考成绩的记录
- IT专业的成绩（包含单词成绩）
- 设计专业的成绩（包含平时成绩）

#### ✅ 更新操作
- 更新现有记录
- 部分更新（只更新补考成绩）

#### ✅ 查询操作
- 查询所有记录
- 分页查询
- 搜索查询

#### ✅ 删除操作
- 删除记录

#### ✅ 边界情况
- 空成绩列表
- 缺失的可选字段
- 大量学生数据（100个学生）

### 班项目成绩表 (`project-grade-register.test.ts`)

#### ✅ 创建操作
- 创建包含单个项目成绩的记录
- 创建包含多个项目成绩的记录（3个项目）
- 项目尝试次数不足3次的情况
- 只有点评没有分数的情况
- 大量项目和学生的数据（30个学生，5个项目）

#### ✅ 更新操作
- 更新现有记录
- 部分更新（只更新统计信息）

#### ✅ 查询操作
- 查询所有记录
- 分页查询

#### ✅ 删除操作
- 删除记录

#### ✅ 边界情况
- 空学生列表
- 项目数量为0的情况

### 班压力面试成绩表 (`press-interview-scores.test.ts`)

#### ✅ 创建操作
- 创建包含单个项目成绩的记录
- 创建包含多个项目成绩的记录（3个项目）
- 正确计算平均分
- 不同年份和月份的处理
- 多个学生的批量创建

#### ✅ 更新操作
- 更新现有记录
- 添加新项目
- 部分更新单个项目的分数

#### ✅ 查询操作
- 查询所有记录
- 分页查询
- 搜索查询

#### ✅ 删除操作
- 删除记录

#### ✅ 边界情况
- 空项目成绩
- 分数边界值（0分和100分）
- 大量项目的成绩（10个项目）

## 测试用例统计

| 测试文件 | 测试套件数 | 测试用例数 | 覆盖功能 |
|---------|-----------|-----------|---------|
| `class-exam-scores.test.ts` | 5 | 14+ | CRUD操作、IT/设计专业、边界情况 |
| `project-grade-register.test.ts` | 5 | 12+ | CRUD操作、多项目、3次尝试、边界情况 |
| `press-interview-scores.test.ts` | 5 | 15+ | CRUD操作、多项目、5个评分人、平均分计算 |

## Mock 原理说明

详细说明请查看：[UNIT_TEST_VS_INTEGRATION_TEST.md](./UNIT_TEST_VS_INTEGRATION_TEST.md)

### 快速理解

**单元测试（Mock）：**
```typescript
// ❌ 不会真正发送请求
mockApi.post.mockResolvedValue({ data: { id: 1 } })
const result = await service.create(data)
// result 是 mock 返回的假数据，数据库里没有数据
```

**集成测试（真实）：**
```typescript
// ✅ 会真正发送请求到后端
const result = await service.create(data)
// result 是从数据库返回的真实数据，数据库里有数据
```

## 测试数据说明

### 单元测试
- 所有测试用例都使用模拟数据
- 不会影响实际数据库
- 测试数据在每次测试前会被清理（`beforeEach`）

### 集成测试
- 使用真实数据，会写入数据库
- 测试结束后会自动清理（`afterAll`）
- 如果测试中断，可能需要手动清理测试数据

## 注意事项

1. **单元测试**：使用 `vi.mock` 模拟 API 调用，不会发送真实的 HTTP 请求
2. **集成测试**：需要后端服务运行，会真正写入数据库
3. **测试数据**：集成测试会在测试结束后自动清理，但如果测试中断可能需要手动清理
4. **认证**：集成测试可能需要有效的认证 token

## 添加新测试

要添加新的测试用例，请遵循以下模式：

### 单元测试模式

```typescript
describe('功能描述', () => {
  it('应该成功执行某个操作', async () => {
    // 准备测试数据
    const request = { ... }
    
    // Mock API响应
    mockApi.post.mockResolvedValue({ data: mockResponse })
    
    // 执行操作
    const result = await service.create(request)
    
    // 验证结果
    expect(result).toEqual(expectedResult)
    expect(mockApi.post).toHaveBeenCalledWith(...)
  })
})
```

### 集成测试模式

```typescript
describe('功能描述（真实数据库）', () => {
  const createdIds: (string | number)[] = []

  afterAll(async () => {
    // 清理测试数据
    for (const id of createdIds) {
      await service.delete(id)
    }
  })

  it('应该成功执行某个操作', async () => {
    // 准备测试数据
    const request = { ... }
    
    // 执行操作（真实 API）
    const result = await service.create(request)
    
    // 保存 ID 用于清理
    if (result.id) {
      createdIds.push(result.id)
    }
    
    // 验证结果
    expect(result.id).toBeDefined()
  })
})
```

## 故障排查

如果测试失败，请检查：

1. **单元测试失败**
   - API Mock 是否正确设置
   - Mock 返回值格式是否正确
   - 类型定义是否匹配

2. **集成测试失败**
   - 后端服务是否运行
   - 数据库连接是否正常
   - 认证 token 是否有效
   - 网络连接是否正常

3. **测试数据问题**
   - 检查测试数据是否完整
   - 确保所有必需字段都已提供
   - 检查可选字段的处理
