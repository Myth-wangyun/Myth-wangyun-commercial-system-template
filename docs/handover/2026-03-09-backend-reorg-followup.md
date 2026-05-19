# 2026-03-09 Backend Reorg Follow-up

## 背景

这份记录承接 backend 根目录重组后的后续收口工作，目标是把剩余改动继续拆成独立可审阅的批次，而不是把文档、部署说明和历史脚本清洗混成一个提交。

## 本轮提交

1. `4e693225` `chore(backend): reorganize scripts and manual assets`
   - 收口 backend 脚本迁移、manual SQL、manual test、temp archive
   - 新增 `backend/scripts/_paths.py`
   - 完成 database、init、maintenance 第一轮路径清洗

2. `8562e251` `docs: migrate backend guides and indexes`
   - 将 backend 根目录下的排障、迁移、RBAC 文档迁入 `docs/guides/` 与 `docs/troubleshooting/`
   - 更新 `docs/README.md`、`docs/CODE_INDEX.md`、`backend/docs/README.md`

3. `42d89b86` `docs: reorganize deployment guides`
   - 将 backend 根目录下的部署文档迁入 `docs/deployment/`
   - 修正文档中的启动脚本路径引用

4. `57ea893a` `chore(backend): clean debug and check scripts`
   - 对 `backend/scripts/debug/` 与 `backend/scripts/checks/` 做第二轮历史脚本清洗
   - 移除 `sys.path.insert(0, '.')`、错误的 `backend` 拼接路径、脚本目录相对 `.env` 假设
   - 统一使用 `Path(__file__).resolve().parents[...]` 定位 backend root
   - 让检查脚本优先接入已有的 `scripts._paths` 环境变量加载逻辑
   - 顺手修正 `check_database_connection.py` 中仍按 MySQL 编写的 PostgreSQL 检查 SQL

## 第二轮脚本清洗覆盖范围

- `backend/scripts/debug/debug.py`
- `backend/scripts/debug/diagnose.py`
- `backend/scripts/debug/debug_employment_data.py`
- `backend/scripts/debug/temp_query.py`
- `backend/scripts/checks/users/check_admin_password.py`
- `backend/scripts/checks/users/check_user_dept.py`
- `backend/scripts/checks/users/check_user_permissions.py`
- `backend/scripts/checks/db/check_all.py`
- `backend/scripts/checks/db/check_column.py`
- `backend/scripts/checks/db/check_exam_scores.py`
- `backend/scripts/checks/db/check_qudaodaili_column.py`
- `backend/scripts/checks/db/check_database_connection.py`

## 验证

- 对 `backend/scripts/debug/**/*.py` 和 `backend/scripts/checks/**/*.py` 复扫旧路径模式，结果为 `No matches found`
- VS Code 错误检查结果：本轮修改文件均为 `No errors found`
- 使用 `.venv/bin/python -m py_compile` 对上述 12 个脚本做编译验证，通过

## 本轮明确未纳入的内容

- `docs/guides/HR_DASHBOARD_BACKEND_TEST_GUIDE.md`
- `docs/hr_dashboard_implementation_progress.md`
- `frontend/services/humanresources/*`
- `frontend/test/humanresources-services.test.ts`
- `tests/human-resources.spec.ts`
- `docs/archive/TODO.md`

这些文件仍保持在工作区，继续归属于人资功能联调与测试批次，不与 backend 重组后续提交混合。