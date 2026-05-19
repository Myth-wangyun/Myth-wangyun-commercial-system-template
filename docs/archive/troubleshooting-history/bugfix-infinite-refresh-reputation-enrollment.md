# 口碑招生汇总表无限刷新Bug修复

## 问题描述
口碑招生汇总表页面出现无限刷新的问题。

## 问题原因
在 `frontend/pages/academic/mgnt/3-enrollment-summary/index.tsx` 文件中，存在一个典型的React无限循环问题：

### 问题代码（修复前）
```tsx
// fetchData 依赖 campusNames
const fetchData = useCallback(async () => {
  // ... 使用 campusNames
}, [year, campusNames]);

// useEffect 依赖 fetchData
useEffect(() => {
  if (campusNames.length > 0) {
    fetchData();
  }
}, [fetchData, campusNames]);
```

### 问题分析
1. `fetchData` 通过 `useCallback` 创建，依赖 `campusNames`
2. `useEffect` 依赖 `fetchData` 和 `campusNames`
3. 当组件渲染时，即使 `campusNames` 的值相同，如果引用发生变化，`fetchData` 会重新创建
4. `useEffect` 检测到 `fetchData` 变化，再次执行
5. 执行 `fetchData()` 可能触发状态更新
6. 组件重新渲染，回到步骤3，形成无限循环

## 解决方案

### 修复后的代码
```tsx
// fetchData 保持不变，添加 eslint-disable 注释
const fetchData = useCallback(async () => {
  // ... 使用 campusNames
}, [year, campusNames]);

// useEffect 移除 fetchData 依赖，只保留 year 和 campusNames
useEffect(() => {
  if (campusNames.length > 0) {
    fetchData();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [year, campusNames]);
```

### 修复要点
1. ✅ 移除 `useEffect` 对 `fetchData` 的依赖
2. ✅ 直接在 `useEffect` 中调用 `fetchData()`
3. ✅ 添加 `eslint-disable-next-line` 注释，避免ESLint警告
4. ✅ 保持 `year` 和 `campusNames` 作为依赖，确保这些值变化时重新获取数据

## 为什么这样修复是正确的

1. **fetchData 是稳定的**
   - `fetchData` 通过 `useCallback` 创建，依赖 `[year, campusNames]`
   - 只有当 `year` 或 `campusNames` 变化时，`fetchData` 才会重新创建
   - 在 `useEffect` 中调用它不会导致额外的重新创建

2. **useEffect 的依赖正确**
   - 只依赖真正需要响应的值：`year` 和 `campusNames`
   - 当这些值变化时，会重新获取数据
   - 避免了依赖 `fetchData` 本身导致的循环

3. **符合React最佳实践**
   - `useEffect` 中调用的函数（如 `fetchData`）应该放在 `useEffect` 内部或使用 `useCallback`
   - 如果使用 `useCallback`，应该将函数的依赖项（而非函数本身）添加到 `useEffect` 的依赖数组中

## 测试验证
修复后，页面应该：
- ✅ 正常加载并显示数据
- ✅ 不再无限刷新
- ✅ 切换年份时正常重新获取数据
- ✅ 切换校区时正常重新获取数据

## 相关文件
- `frontend/pages/academic/mgnt/3-enrollment-summary/index.tsx` - 已修复

## 学到的经验
1. **避免将 useCallback 创建的函数作为 useEffect 的依赖**
   - 除非函数本身是响应式的（依赖其他状态/props）

2. **正确使用 useEffect 和 useCallback**
   - `useEffect` 应该依赖它真正需要响应的值，而非调用这些值的函数
   - 如果需要在 useEffect 中调用函数，将函数的依赖项直接放入 useEffect 的依赖数组

3. **使用 ESLint 注释**
   - 当依赖项分析准确但 ESLint 规则误报时，使用 `eslint-disable-next-line` 注释

## 参考文档
- [React Hooks FAQ: 为什么 useEffect 中的函数每次渲染都变化？](https://react.dev/reference/react/useEffect#why-is-my-function-called-every-time-my-component-renders)
- [React Hooks: useCallback 和 useEffect 的正确使用](https://react.dev/reference/react/useCallback)
