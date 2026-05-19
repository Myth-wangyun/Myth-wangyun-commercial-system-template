# 调试模式启动指南

## 🎯 为什么需要 debug.py？

原来的 `main.py` 在模块级别执行了 `argparse`，这会劫持 uvicorn 的 CLI 参数，导致：

1. ❌ 无法使用 `uvicorn main:app --reload --log-level debug`
2. ❌ 日志输出混乱（多进程 + 重定向 stdout）
3. ❌ 无法使用断点调试
4. ❌ print 语句在 worker 进程中不可见

`debug.py` 解决了这些问题：

- ✅ 不劫持 uvicorn 的 CLI 参数
- ✅ 单进程模式（dev 时），可 print、可 pdb、可断点
- ✅ 日志配置简单清晰
- ✅ 不重定向 stdout/stderr
- ✅ 让 uvicorn 直接管理日志

## 🚀 使用方法

### 1. 开发模式（推荐）

```bash
# 进入 backend 目录
cd backend

# 启动调试模式（单进程，支持断点）
uvicorn debug:app --reload --log-level debug
```

### 2. 指定端口

```bash
uvicorn debug:app --reload --log-level debug --port 8000
```

### 3. 指定运行模式（通过环境变量）

```bash
# Windows PowerShell
$env:APP_MODE="dev"; uvicorn debug:app --reload --log-level debug

# Windows CMD
set APP_MODE=dev && uvicorn debug:app --reload --log-level debug

# Linux/Mac
APP_MODE=dev uvicorn debug:app --reload --log-level debug
```

### 4. 生产模式（多进程）

```bash
uvicorn debug:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🔍 调试功能

### 1. Print 语句

在 API 路由中直接使用 `print`，现在可以正常看到输出：

```python
@app.get("/test")
def test():
    print("🔥 这里一定能看到！")
    return {"status": "ok"}
```

### 2. 使用 logging

推荐使用 `uvicorn.error` logger：

```python
import logging
log = logging.getLogger("uvicorn.error")

@app.get("/test")
def test():
    log.warning("🔥 这里一定能看到！")
    log.error("🔥 错误信息也能看到！")
    return {"status": "ok"}
```

### 3. 断点调试

在 VS Code 或其他 IDE 中：

1. 在代码中设置断点
2. 启动调试模式：`uvicorn debug:app --reload --log-level debug`
3. 访问对应的 API 端点
4. 断点会被触发

### 4. PDB 调试

```python
import pdb

@app.get("/test")
def test():
    pdb.set_trace()  # 这里会进入调试器
    return {"status": "ok"}
```

## 📊 日志级别

uvicorn 支持的日志级别：

- `critical` - 只显示严重错误
- `error` - 显示错误
- `warning` - 显示警告和错误
- `info` - 显示信息、警告和错误（默认）
- `debug` - 显示所有日志（推荐调试时使用）
- `trace` - 显示最详细的日志

## 🔧 环境变量配置

`debug.py` 通过环境变量 `APP_MODE` 来设置运行模式：

- `dev` 或 `development` - 开发模式（默认）
- `test` - 测试模式
- `prod` 或 `production` - 生产模式

对应的 `.env` 文件：

- `.env.development` - 开发环境配置
- `.env.test` - 测试环境配置
- `.env.production` - 生产环境配置

## ⚠️ 注意事项

1. **不要同时运行 `main.py` 和 `debug.py`**
   - 它们会使用相同的端口，导致冲突

2. **生产环境建议使用 `main.py`**
   - `main.py` 更适合生产环境的多进程部署
   - `debug.py` 主要用于开发和调试

3. **日志输出位置**
   - 所有日志都会输出到启动 uvicorn 的终端
   - 不再有"日志消失"的问题

## 🐛 常见问题

### Q: 为什么我的 print 还是看不到？

A: 确保你使用的是 `uvicorn debug:app` 而不是 `python debug.py`。`debug.py` 不包含 `if __name__ == "__main__"` 启动逻辑，必须通过 uvicorn 启动。

### Q: 如何确认我使用的是 debug.py？

A: 启动时应该看到：

```
✅ 调试模式启动器已就绪
============================================================
启动命令:
  uvicorn debug:app --reload --log-level debug
============================================================
```

### Q: 断点不工作怎么办？

A: 确保：
1. 使用 `--reload` 参数（开发模式）
2. IDE 的调试器已正确配置
3. 代码已保存

### Q: 如何查看所有日志？

A: 使用 `--log-level debug` 参数：

```bash
uvicorn debug:app --reload --log-level debug
```

## 📝 对比

| 特性 | main.py | debug.py |
|------|---------|----------|
| 启动方式 | `python main.py` | `uvicorn debug:app` |
| CLI 参数 | 自定义（--mode, --port） | uvicorn 标准参数 |
| 多进程 | 支持（reload=True） | 支持（--workers） |
| 调试支持 | ❌ 困难 | ✅ 完整 |
| Print 可见 | ❌ 部分可见 | ✅ 完全可见 |
| 断点调试 | ❌ 困难 | ✅ 支持 |
| 日志管理 | 自定义配置 | uvicorn 管理 |

## 🎉 开始调试

现在你可以：

1. 启动调试模式：
   ```bash
   cd backend
   uvicorn debug:app --reload --log-level debug
   ```

2. 在代码中添加 print 或断点

3. 访问 API 端点，查看日志输出

4. 享受真正的调试体验！
