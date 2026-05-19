# 修复 @jridgewell/sourcemap-codec 缺失问题

## 问题描述

前端构建时出现错误：
```
Cannot find module '@jridgewell/sourcemap-codec'
```

## 原因分析

`@jridgewell/sourcemap-codec` 是 Babel 的传递依赖，用于处理 source map 编码。在某些情况下，npm 可能没有正确安装这个依赖。

## 解决方案

### 方案 1: 重新安装依赖（推荐）

```powershell
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json（可选）
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# 重新安装所有依赖
npm install
```

### 方案 2: 直接安装缺失的包

```powershell
npm install @jridgewell/sourcemap-codec@^1.4.15 --save-dev
```

### 方案 3: 使用 yarn 或 pnpm（如果 npm 有问题）

```powershell
# 使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

## 已完成的修复

1. ✅ 已在 `package.json` 的 `devDependencies` 中添加 `@jridgewell/sourcemap-codec: ^1.4.15`
2. ✅ 运行 `npm install` 安装依赖

## 验证修复

运行以下命令验证：

```powershell
# 检查依赖是否安装
Test-Path node_modules\@jridgewell\sourcemap-codec

# 检查版本
npm list @jridgewell/sourcemap-codec

# 尝试启动开发服务器
npm run dev
```

## 如果问题仍然存在

1. **检查 Node.js 版本**：确保使用 Node.js 16+ 版本
   ```powershell
   node --version
   ```

2. **检查 npm 版本**：确保使用最新版本的 npm
   ```powershell
   npm --version
   npm install -g npm@latest
   ```

3. **清理并重新安装**：
   ```powershell
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm install
   ```

4. **检查网络连接**：确保能访问 npm  registry
   ```powershell
   npm config get registry
   ```

## 相关依赖

`@jridgewell/sourcemap-codec` 被以下包使用：
- `@babel/core`
- `@babel/generator`
- `@vitejs/plugin-react`
- `vitest`

确保这些包的版本兼容。

---

*修复时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

