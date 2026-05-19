# 仓库迁移清单

本文档记录 2026-03-09 这一轮目录整理中，从仓库根目录迁移到分类目录的文件，便于团队过渡、查找旧路径以及修复历史引用。

## 1. 迁移规则

- 根目录尽量只保留运行入口、框架约定配置、容器与部署基础文件。
- 非运行时文档统一进入 `docs/` 下的分类目录。
- 脚本统一进入 `scripts/` 下的分类目录。
- 诊断结果进入 `exports/diagnostics/`。
- 临时文件和备份文件进入 `temp/ad-hoc/`。

## 2. 文档迁移

### 2.1 迁入 `docs/archive/`

| 原路径 | 新路径 |
| ---- | ---- |
| `MENU_CONFIGURATION_CONFIRMED.md` | `docs/archive/MENU_CONFIGURATION_CONFIRMED.md` |
| `TODO.md` | `docs/archive/TODO.md` |
| `start_system.html` | `docs/archive/start_system.html` |

### 2.2 迁入 `docs/deployment/`

| 原路径 | 新路径 |
| ---- | ---- |
| `DEPLOYMENT_CHECKLIST.md` | `docs/deployment/DEPLOYMENT_CHECKLIST.md` |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | `docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md` |
| `RBAC_QUICKSTART.md` | `docs/deployment/RBAC_QUICKSTART.md` |
| `START_BACKEND.md` | `docs/deployment/START_BACKEND.md` |
| `pg_hba.conf.new` | `docs/deployment/pg_hba.conf.new` |

### 2.3 迁入 `docs/guides/`

| 原路径 | 新路径 |
| ---- | ---- |
| `BAIDU_PROMOTION_AUTO_CALCULATION.md` | `docs/guides/BAIDU_PROMOTION_AUTO_CALCULATION.md` |
| `CAMPUS_NEWMEDIA_SEM_FIX_GUIDE.md` | `docs/guides/CAMPUS_NEWMEDIA_SEM_FIX_GUIDE.md` |
| `CONSULTANT_CHANNEL_EXPENSE_TEST_GUIDE.md` | `docs/guides/CONSULTANT_CHANNEL_EXPENSE_TEST_GUIDE.md` |
| `EXPENSE_SAVE_IMPLEMENTATION_GUIDE.md` | `docs/guides/EXPENSE_SAVE_IMPLEMENTATION_GUIDE.md` |
| `MANAGER_ROLE_PERMISSIONS.md` | `docs/guides/MANAGER_ROLE_PERMISSIONS.md` |
| `NETWORK_PARTNER_ANNUAL_QUICK_REFERENCE.md` | `docs/guides/NETWORK_PARTNER_ANNUAL_QUICK_REFERENCE.md` |
| `NETWORK_PARTNER_ANNUAL_TEST_GUIDE.md` | `docs/guides/NETWORK_PARTNER_ANNUAL_TEST_GUIDE.md` |
| `PROJECT_GRADE_REGISTER_REDESIGN.md` | `docs/guides/PROJECT_GRADE_REGISTER_REDESIGN.md` |
| `REMAINING_FILES_MODIFICATION_GUIDE.md` | `docs/guides/REMAINING_FILES_MODIFICATION_GUIDE.md` |
| `REPUTATION_AUTO_FETCH_QUICK_REFERENCE.md` | `docs/guides/REPUTATION_AUTO_FETCH_QUICK_REFERENCE.md` |
| `TRAINING_TABLE_OPTIMIZATION_CHECKLIST.md` | `docs/guides/TRAINING_TABLE_OPTIMIZATION_CHECKLIST.md` |
| `TRAINING_TABLE_PERFORMANCE_TEST_GUIDE.md` | `docs/guides/TRAINING_TABLE_PERFORMANCE_TEST_GUIDE.md` |

### 2.4 迁入 `docs/handover/`

| 原路径 | 新路径 |
| ---- | ---- |
| `CONSULTANT_CHANNEL_COLUMNS_VERIFICATION.md` | `docs/handover/CONSULTANT_CHANNEL_COLUMNS_VERIFICATION.md` |
| `CONSULTANT_CHANNEL_EXPENSE_EDIT_SUMMARY.md` | `docs/handover/CONSULTANT_CHANNEL_EXPENSE_EDIT_SUMMARY.md` |
| `CONSULTANT_CHANNEL_SUMMARY_TABLE.md` | `docs/handover/CONSULTANT_CHANNEL_SUMMARY_TABLE.md` |
| `CONSULTATION_GENERATOR_UPDATE.md` | `docs/handover/CONSULTATION_GENERATOR_UPDATE.md` |
| `CONSULT_MOBILE_IMPLEMENTATION_SUMMARY.md` | `docs/handover/CONSULT_MOBILE_IMPLEMENTATION_SUMMARY.md` |
| `FACE_TO_FACE_IMPLEMENTATION_SUMMARY.md` | `docs/handover/FACE_TO_FACE_IMPLEMENTATION_SUMMARY.md` |
| `FINAL_IMPLEMENTATION_SUMMARY.md` | `docs/handover/FINAL_IMPLEMENTATION_SUMMARY.md` |
| `HANDOVER_SYNC_IMPLEMENTATION.md` | `docs/handover/HANDOVER_SYNC_IMPLEMENTATION.md` |
| `IMPLEMENTATION_SUMMARY.md` | `docs/handover/IMPLEMENTATION_SUMMARY.md` |
| `IMPLEMENTATION_SUMMARY_SEM.md` | `docs/handover/IMPLEMENTATION_SUMMARY_SEM.md` |
| `MENU_ACCESS_FIX_SUMMARY.md` | `docs/handover/MENU_ACCESS_FIX_SUMMARY.md` |
| `MOBILE_PAGES_GAP_ANALYSIS.md` | `docs/handover/MOBILE_PAGES_GAP_ANALYSIS.md` |
| `MODIFICATION_002_PLAN.md` | `docs/handover/MODIFICATION_002_PLAN.md` |
| `MODIFICATION_002_SUMMARY.md` | `docs/handover/MODIFICATION_002_SUMMARY.md` |
| `MODIFICATION_SUMMARY.md` | `docs/handover/MODIFICATION_SUMMARY.md` |
| `NETWORK_PARTNER_ANNUAL_AUTO_FILL_SUMMARY.md` | `docs/handover/NETWORK_PARTNER_ANNUAL_AUTO_FILL_SUMMARY.md` |
| `PERFORMANCE_OPTIMIZATION_SUMMARY.md` | `docs/handover/PERFORMANCE_OPTIMIZATION_SUMMARY.md` |
| `PHONE_CHECK_IMPLEMENTATION_SUMMARY.md` | `docs/handover/PHONE_CHECK_IMPLEMENTATION_SUMMARY.md` |
| `RBAC_IMPLEMENTATION_GUIDE.md` | `docs/handover/RBAC_IMPLEMENTATION_GUIDE.md` |
| `RBAC_IMPLEMENTATION_SUMMARY.md` | `docs/handover/RBAC_IMPLEMENTATION_SUMMARY.md` |
| `REPUTATION_DASHBOARD_UPDATE_SUMMARY.md` | `docs/handover/REPUTATION_DASHBOARD_UPDATE_SUMMARY.md` |
| `REPUTATION_DATA_AUTO_FILL_COMPLETE.md` | `docs/handover/REPUTATION_DATA_AUTO_FILL_COMPLETE.md` |
| `TRAINING_TABLE_DEEP_OPTIMIZATION.md` | `docs/handover/TRAINING_TABLE_DEEP_OPTIMIZATION.md` |
| `TRAINING_TABLE_PERFORMANCE_OPTIMIZATION.md` | `docs/handover/TRAINING_TABLE_PERFORMANCE_OPTIMIZATION.md` |
| `WORK_COMPLETED_2026-02-06.md` | `docs/handover/WORK_COMPLETED_2026-02-06.md` |
| `XIAOHONGSHU_ANALYSIS_UPDATE_SUMMARY.md` | `docs/handover/XIAOHONGSHU_ANALYSIS_UPDATE_SUMMARY.md` |

### 2.5 迁入 `docs/troubleshooting/`

| 原路径 | 新路径 |
| ---- | ---- |
| `DEBUG_EXPENSE_SAVE.md` | `docs/troubleshooting/DEBUG_EXPENSE_SAVE.md` |
| `GENERIC_DASHBOARD_EXPENSE_EDIT_FIX.md` | `docs/troubleshooting/GENERIC_DASHBOARD_EXPENSE_EDIT_FIX.md` |
| `JSONB_DEBUG_GUIDE.md` | `docs/troubleshooting/JSONB_DEBUG_GUIDE.md` |
| `PRESSURE_INTERVIEW_DATA_FIX.md` | `docs/troubleshooting/PRESSURE_INTERVIEW_DATA_FIX.md` |
| `PRESSURE_INTERVIEW_DATA_FIX_SUMMARY.md` | `docs/troubleshooting/PRESSURE_INTERVIEW_DATA_FIX_SUMMARY.md` |
| `QUICK_FIX_EXPENSE_SAVE.md` | `docs/troubleshooting/QUICK_FIX_EXPENSE_SAVE.md` |
| `TEST_DATA_FORMAT_FIX.md` | `docs/troubleshooting/TEST_DATA_FORMAT_FIX.md` |
| `error-deal.md` | `docs/troubleshooting/error-deal.md` |

## 3. 脚本迁移

### 3.1 迁入 `scripts/database/`

| 原路径 | 新路径 |
| ---- | ---- |
| `create_table_temp.py` | `scripts/database/create_table_temp.py` |

### 3.2 迁入 `scripts/deployment/`

| 原路径 | 新路径 |
| ---- | ---- |
| `check_production.sh` | `scripts/deployment/check_production.sh` |
| `restart-backend.ps1` | `scripts/deployment/restart-backend.ps1` |
| `start-backend-env.ps1` | `scripts/deployment/start-backend-env.ps1` |
| `start-backend.ps1` | `scripts/deployment/start-backend.ps1` |
| `start-production-preview.bat` | `scripts/deployment/start-production-preview.bat` |
| `start-production-preview.ps1` | `scripts/deployment/start-production-preview.ps1` |
| `start-production-single.sh` | `scripts/deployment/start-production-single.sh` |
| `start-test.bat` | `scripts/deployment/start-test.bat` |
| `start-test.sh` | `scripts/deployment/start-test.sh` |
| `start_server.sh` | `scripts/deployment/start_server.sh` |

### 3.3 迁入 `scripts/development/`

| 原路径 | 新路径 |
| ---- | ---- |
| `generate-docs.ps1` | `scripts/development/generate-docs.ps1` |
| `generate-routes.cjs` | `scripts/development/generate-routes.cjs` |
| `open_service_pages.py` | `scripts/development/open_service_pages.py` |
| `run_api_tests.py` | `scripts/development/run_api_tests.py` |
| `test-api.ps1` | `scripts/development/test-api.ps1` |
| `test-env.ts` | `scripts/development/test-env.ts` |
| `test-promotion-summary.ps1` | `scripts/development/test-promotion-summary.ps1` |
| `test-weekly-date-ranges.cjs` | `scripts/development/test-weekly-date-ranges.cjs` |
| `test_channel_agent_fix.py` | `scripts/development/test_channel_agent_fix.py` |
| `test_consultant_sem_plan.py` | `scripts/development/test_consultant_sem_plan.py` |
| `test_plan_sync.py` | `scripts/development/test_plan_sync.py` |
| `test_promotion_summary.py` | `scripts/development/test_promotion_summary.py` |
| `test_teacher_api.py` | `scripts/development/test_teacher_api.py` |
| `test_teacher_plan_api.py` | `scripts/development/test_teacher_plan_api.py` |

## 4. 产物与临时文件迁移

### 4.1 迁入 `exports/diagnostics/`

| 原路径 | 新路径 |
| ---- | ---- |
| `result.txt` | `exports/diagnostics/result.txt` |
| `schema-diff.txt` | `exports/diagnostics/schema-diff.txt` |
| `test-summary-data.json` | `exports/diagnostics/test-summary-data.json` |

### 4.2 迁入 `temp/ad-hoc/`

| 原路径 | 新路径 |
| ---- | ---- |
| `1.txt` | `temp/ad-hoc/1.txt` |
| `2.txt` | `temp/ad-hoc/2.txt` |
| `gitlog.txt` | `temp/ad-hoc/gitlog.txt` |
| `temp_fix_script.cjs` | `temp/ad-hoc/temp_fix_script.cjs` |
| `vite.config.ts.bak` | `temp/ad-hoc/vite.config.ts.bak` |

## 5. 迁移后的约定

1. 如果历史文档提到根目录旧文件名，请优先查本清单找到新路径。
2. 如果需要新增文档，请先判断它属于 deployment、guides、troubleshooting、handover 还是 archive。
3. 如果新增的是高频入口文档，请同步更新 `docs/README.md`；如果影响阅读路径或代码入口，再同步更新 `docs/CODE_INDEX.md` 和项目阅读指南。
4. 新增脚本时，不要再放回根目录，直接进入 `scripts/` 对应子目录。
