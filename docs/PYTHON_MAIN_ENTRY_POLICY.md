# Python Main Entry Policy

## 目标

项目必须保证以下启动约束长期成立：

1. 在仓库根目录执行 `python main.py` 可以启动后端主进程。
2. 这一入口在开发机和 Linux 服务器上保持一致。
3. 后续任何变更都不能引入“只能 `cd backend && python main.py` 才能跑”的隐式依赖。
4. 与数据库初始化、动态路由、环境变量加载相关的改动，不能破坏该入口。

## 当前实现

- 根目录统一入口：[main.py](/home/user/Workspace/qm-system/main.py)
- 实际应用入口：`backend/main.py`
- 根目录入口负责：
  - 切换到 `backend` 目录
  - 把 `backend` 加入 `sys.path`
  - 原样透传命令行参数给 `backend/main.py`

## 推荐启动方式

```bash
python main.py --mode dev
python main.py --mode test --port 8001
python main.py --mode prod --host 0.0.0.0 --port 8000
```

## 最低验证要求

涉及启动或数据库落点相关变更时，至少执行：

```bash
python main.py --help
python backend/scripts/checks/system/check_root_python_main_entry.py
python backend/scripts/checks/db/check_humanresources_employee_storage.py
```
