# 单元测试 vs 集成测试：Mock 原理详解

## 为什么单元测试不写数据库？

### 1. Mock 的基本原理

**Mock（模拟）** 是一种测试技术，用于替换真实的依赖项（如 API、数据库、文件系统等），让测试可以：
- ✅ 快速运行（不需要真实的网络请求）
- ✅ 独立运行（不依赖外部服务）
- ✅ 可预测（可以控制返回值）
- ✅ 不产生副作用（不会修改真实数据）

### 2. 我们的单元测试如何工作

让我们看看测试代码：

```typescript
// 步骤1: 创建 Mock API 对象
const { mockApi } = vi.hoisted(() => {
  return {
    mockApi: {
      get: vi.fn(),    // 模拟的 get 方法
      post: vi.fn(),   // 模拟的 post 方法
      put: vi.fn(),    // 模拟的 put 方法
      delete: vi.fn(), // 模拟的 delete 方法
    },
  }
})

// 步骤2: 替换真实的 API 模块
vi.mock('@/services/api', async () => {
  return {
    api: mockApi,  // 用 mock 替换真实的 api
  }
})

// 步骤3: 在测试中设置 Mock 返回值
mockApi.post.mockResolvedValue({ 
  data: { id: 1, name: '测试数据' } 
})

// 步骤4: 调用服务（实际调用的是 mock，不是真实 API）
const result = await classExamScoreService.create(request)
```

### 3. 执行流程对比

#### 单元测试（使用 Mock）流程：

```
测试代码
  ↓
调用 classExamScoreService.create()
  ↓
服务层调用 api.post()  ← 这里被 Mock 拦截了！
  ↓
Mock 返回预设的假数据
  ↓
测试验证结果
  ❌ 没有发送 HTTP 请求
  ❌ 没有连接数据库
  ❌ 没有真实数据写入
```

#### 集成测试（不使用 Mock）流程：

```
测试代码
  ↓
调用 classExamScoreService.create()
  ↓
服务层调用 api.post()  ← 这里是真实的 API！
  ↓
发送真实的 HTTP 请求到后端
  ↓
后端处理请求
  ↓
数据库写入真实数据
  ↓
返回真实响应
  ✅ 发送了 HTTP 请求
  ✅ 连接了数据库
  ✅ 写入了真实数据
```

### 4. Mock 的拦截机制

当使用 `vi.mock('@/services/api')` 时，Vitest 会：

1. **模块替换**：在模块加载时，将 `@/services/api` 替换为 mock 版本
2. **函数拦截**：所有对 `api.post()`、`api.get()` 等的调用都被拦截
3. **返回预设值**：根据 `mockResolvedValue()` 返回预设的数据
4. **跳过真实调用**：永远不会执行真实的 HTTP 请求

### 5. 代码示例对比

#### 单元测试（Mock 版本）：

```typescript
// ❌ 不会真正发送请求
mockApi.post.mockResolvedValue({ 
  data: { id: 1, name: '张三' } 
})

const result = await service.create({ name: '张三' })
// result 是 mock 返回的假数据，不是从数据库来的
```

#### 集成测试（真实版本）：

```typescript
// ✅ 会真正发送请求到后端
// 不需要 mockApi，直接使用真实的 api

const result = await service.create({ name: '张三' })
// result 是从数据库返回的真实数据
```

### 6. 为什么需要两种测试？

| 特性 | 单元测试（Mock） | 集成测试（真实） |
|------|-----------------|-----------------|
| **速度** | ⚡ 非常快（毫秒级） | 🐌 较慢（秒级） |
| **独立性** | ✅ 完全独立 | ❌ 依赖后端服务 |
| **数据库** | ❌ 不写数据库 | ✅ 写真实数据库 |
| **用途** | 验证代码逻辑 | 验证端到端流程 |
| **成本** | 免费 | 需要运行后端 |

### 7. 实际例子

假设我们测试创建考试成绩：

**单元测试（Mock）：**
```typescript
// 1. Mock 拦截 API 调用
mockApi.post.mockResolvedValue({ 
  data: { id: 1, studentName: '张三' } 
})

// 2. 调用服务（实际调用的是 mock）
const result = await classExamScoreService.create({
  studentName: '张三',
  score: 85
})

// 3. 验证结果（这是 mock 返回的假数据）
expect(result.studentName).toBe('张三')
// ✅ 测试通过，但数据库里没有数据！
```

**集成测试（真实）：**
```typescript
// 1. 直接调用服务（没有 mock）
const result = await classExamScoreService.create({
  studentName: '张三',
  score: 85
})

// 2. 验证结果（这是从数据库返回的真实数据）
expect(result.studentName).toBe('张三')
// ✅ 测试通过，数据库里真的有数据！
```

### 8. 总结

- **单元测试 + Mock** = 快速验证代码逻辑，不写数据库
- **集成测试** = 验证真实流程，会写数据库
- **两者互补**：单元测试保证代码正确，集成测试保证系统可用

## 如何识别测试类型？

### 单元测试的特征：
- ✅ 有 `vi.mock()` 调用
- ✅ 有 `mockApi` 或类似的 mock 对象
- ✅ 有 `mockResolvedValue()` 设置返回值
- ✅ 文件名通常是 `*.test.ts`

### 集成测试的特征：
- ✅ 没有 `vi.mock()` 调用
- ✅ 直接使用真实的 API
- ✅ 需要后端服务运行
- ✅ 文件名通常是 `*.integration.test.ts` 或 `*.e2e.test.ts`

