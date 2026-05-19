# Deployment Error and Warning Analysis

## Primary failures (blockers)

1) Alembic migrations fail due to encoding mismatch.
   - Evidence: UnicodeDecodeError occurs while reading `alembic.ini` during `run_alembic_migrations`.
   - Cause: Alembic reads the ini with locale encoding (GBK on Windows), but `alembic.ini` contains non-ASCII comments and is UTF-8. The read fails before any migration runs.
   - Impact: Migrations are skipped, leaving schema drift.

2) Schema mismatch for `config.classes`.
   - Evidence: UndefinedColumn errors for `classes.major_name` (and related fields) when hitting `/api/v1/config/classes` and `/api/v1/config/assignments`, and during config import.
   - Cause: ORM expects `major_name`, `homeroom_teacher_name`, and `program_length` in `ClassProfile` (see `backend/app/models/config_master.py`), but the SQL init schema in `backend/sql/init/config_schema.sql` does not create those columns.
   - Impact: Class list queries and import pipelines fail.

3) Missing academic class list table.
   - Evidence: UndefinedTable errors when querying the academic class list in `/api/v1/teaching-quality/class-list`.
   - Cause: Queries in `backend/app/teaching-quality/TQclass_list_api.py` and `backend/app/teaching-quality/TQemployee_function_analysis_api.py` reference an academic class list table that is not created by the init SQL (and migrations are not running).
   - Impact: Class list endpoints and related analytics fail.

4) Refund time filtering uses `LEFT` on a date column.
   - Evidence: UndefinedFunction errors for `left(date, integer)` when fetching refund counts.
   - Cause: `backend/app/api/v1/endpoints/campus_core_data_summary.py` uses `LEFT(refund_time_column, 4)` and assumes a text column, but the DB column is a date or timestamp.
   - Impact: Refund-related metrics fail and return 0.

## Repeated warnings / secondary issues

- Duplicate SQLAlchemy mappings from dynamic imports.
  - Evidence: Warnings about "class already in declarative base" and "Table is already defined for this MetaData instance".
  - Cause: Dynamic loaders import the same DB module multiple times under different module names (for example, `TQclass_file_record_db_dynamic` vs `class_file_record_db_dynamic`) or reload per request. This redefines the same table/class on the same Base.
  - Impact: Module load failures and missing attributes (for example, `CampusPersonalEnterpriseContractSummary`).

- AttributeError for missing `CampusPersonalEnterpriseContractSummary`.
  - Cause: The class definition fails during import because the table is already registered; the module loads but the class is not created.

- Database `qmjy` not found during early startup.
  - Evidence: OperationalError when creating schema or tables before the pre-init database creation step.
  - Cause: Init order tries to connect to the target DB before it exists.

- Index drop warnings (`DependentObjectsStillExist` / `InFailedSqlTransaction`).
  - Cause: Attempting to drop indexes that are owned by constraints. Once a drop fails, the transaction is aborted and subsequent drops fail in the same transaction.
  - Impact: Mostly noisy, but it hides which indexes actually get cleaned.

- Pydantic v2 config warnings.
  - Cause: Legacy keys `schema_extra` and `orm_mode` are still used; they were renamed to `json_schema_extra` and `from_attributes`.

- Hypercorn workers warning.
  - Cause: `workers` has no effect when using `serve`. This is informational but may cause confusion about process count.

- JWT "signature has expired" errors.
  - Cause: Tokens are expired or server time is out of sync.
