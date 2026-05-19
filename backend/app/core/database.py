"""
数据库连接和会话管理
"""

import logging
import os
import threading
import time
from datetime import datetime
from types import ModuleType
from typing import Generator, Optional, cast

from sqlalchemy import Table, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.logs.sqlalchemy import register_audit_listeners
from app.core.startup_logging import StepProfiler, should_profile_startup

from ..core.security import security_manager
from ..models import (  # 导入模型用于种子数据
    AccountBase,
)
from ..models.user import User, UserRole, UserStatus  # 导入用户模型
from .config import get_campus_config, settings

# 获取运行模式
_app_env = os.environ.get('APP_ENV', '')
_is_test_mode = _app_env == 'test'
logger = logging.getLogger("qm.database")

# psycopg3 默认使用 UTF-8 编码
print(f"[database] 运行模式: {'test' if _is_test_mode else 'normal'}")
print("[database] 使用 psycopg3 驱动，UTF-8 编码")


def safe_error_str(e: Exception) -> str:
    """安全地将异常转换为字符串"""
    try:
        return str(e)
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass
    
    try:
        if hasattr(e, 'args') and e.args:
            parts = []
            for arg in e.args:
                if isinstance(arg, bytes):
                    parts.append(arg.decode('utf-8', errors='replace'))
                elif isinstance(arg, str):
                    parts.append(arg)
                else:
                    try:
                        parts.append(str(arg))
                    except Exception:
                        parts.append(repr(arg))
            return '; '.join(parts)
    except Exception:
        pass
    
    try:
        return repr(e)
    except Exception:
        pass
    
    return f"<{type(e).__name__}: cannot convert to string>"


# 为 teaching_quality schema 创建独立的基类
# 直接在 database.py 中定义，避免循环导入
class TQBase(DeclarativeBase):
    pass

# psycopg3 原生支持 UTF-8 编码，所有平台统一使用 UTF-8
# 只需要设置 search_path
_db_connect_args = {
    'options': '-c search_path=market,teaching_quality,academic,public'
}

# 检查是否使用 Unix socket
print(f"[DB] DB_HOST = {settings.DB_HOST}")
print(f"[DB] settings.DB_HOST.startswith('/') = {settings.DB_HOST.startswith('/') if settings.DB_HOST else 'None'}")
if settings.DB_HOST and settings.DB_HOST.startswith('/'):
    _db_connect_args['host'] = settings.DB_HOST
    _db_connect_args['dbname'] = settings.DB_NAME
    _db_connect_args['user'] = settings.DB_USER
    # Unix socket 连接不需要密码
    _db_connect_args.pop('password', None)
    # 直接使用 Unix socket URL（使用 ?host= 参数指定 socket 路径）
    _db_url = f"postgresql+psycopg://{settings.DB_USER}@/{settings.DB_NAME}?host={settings.DB_HOST}"
    print(f"[DB] Using Unix socket URL: {_db_url}")
else:
    _db_url = settings.DATABASE_URL
    print(f"[DB] Using TCP URL: {_db_url}")

# 创建数据库引擎（单库 qmjy，表落 academic schema）
engine = create_engine(
    _db_url,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_timeout=getattr(settings, 'DB_POOL_TIMEOUT', 30),  # 获取连接超时
    echo=settings.SQL_ECHO,
    pool_pre_ping=True,  # 连接池预检查
    connect_args=_db_connect_args
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

_runtime_init_lock = threading.Lock()
_runtime_init_completed = False
_runtime_init_in_progress = False

register_audit_listeners()


def is_runtime_db_ready() -> bool:
    return _runtime_init_completed


def reset_runtime_db_ready() -> None:
    global _runtime_init_completed, _runtime_init_in_progress
    with _runtime_init_lock:
        _runtime_init_completed = False
        _runtime_init_in_progress = False


def ensure_runtime_db_ready() -> bool:
    global _runtime_init_completed, _runtime_init_in_progress
    started_at = time.perf_counter()

    if _runtime_init_completed:
        print("[DB] 运行期数据库已就绪，跳过重复初始化")
        return True

    print("[DB] 获取运行期初始化锁...")
    with _runtime_init_lock:
        if _runtime_init_completed:
            print("[DB] 运行期数据库已就绪，跳过重复初始化")
            return True

        print("[DB] 开始运行期初始化...")
        _runtime_init_in_progress = True
        try:
            init_ok = init_db()
            elapsed = time.perf_counter() - started_at
            if init_ok:
                _runtime_init_completed = True
                logger.info("[startup] ensure_runtime_db_ready complete elapsed=%.3fs", elapsed)
            else:
                logger.error("[startup] ensure_runtime_db_ready failed elapsed=%.3fs", elapsed)
            return init_ok
        finally:
            _runtime_init_in_progress = False

# 使用模型中的基类
# Base = declarative_base()  # 已在models中定义

# Alembic 迁移已废弃，所有表结构通过 SQLAlchemy create_all 一次性创建


def ensure_market_schema_column_types() -> bool:
    """
    确保 market schema 下的表列类型正确
    
    SQLAlchemy create_all 不会修改已存在列的类型，
    所以需要此函数来同步已存在表的列类型。
    """
    from sqlalchemy import text as sql_text
    
    column_type_updates = [
        # (schema, table, column, target_type, using_clause)
        ('market', '市场部剪辑周度汇报表', 'audience_type_count', 'DOUBLE PRECISION', 'audience_type_count::float'),
    ]
    
    try:
        with engine.begin() as conn:
            for schema, table, column, target_type, using in column_type_updates:
                # 先检查列当前类型
                check_sql = sql_text("""
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = :schema 
                    AND table_name = :table 
                    AND column_name = :column
                """)
                result = conn.execute(check_sql, {'schema': schema, 'table': table, 'column': column})
                row = result.fetchone()
                
                if row:
                    current_type = row[0].upper()
                    # 如果类型不是目标类型，则修改
                    if target_type.upper() not in current_type:
                        alter_sql = sql_text(f"""
                            ALTER TABLE {schema}."{table}" 
                            ALTER COLUMN {column} TYPE {target_type} 
                            USING {using}
                        """)
                        conn.execute(alter_sql)
                        print(f"[成功] {schema}.{table}.{column} 列类型已更新为 {target_type}")
                    else:
                        print(f"[跳过] {schema}.{table}.{column} 列类型已是 {target_type}")
                else:
                    print(f"[跳过] {schema}.{table}.{column} 列不存在，将由 create_all 创建")
        return True
    except Exception as e:
        print(f"[警告] 同步 market schema 列类型失败: {safe_error_str(e)}")
        return False


def ensure_consult_schema_columns() -> bool:
    """
    确保 consult schema 下的表列完整
    
    SQLAlchemy create_all 不会为已存在的表添加新列，
    所以需要此函数来同步已存在表的新列。
    """
    from sqlalchemy import text as sql_text
    
    # 需要确保存在的列定义: (schema, table, column, column_type, default_value)
    columns_to_ensure = [
        # 咨询量明细表_v2 的新增列
        ('consult', '咨询量明细表_v2', '缴费金额', 'INTEGER', '0'),
        ('consult', '咨询量明细表_v2', '是否退费', 'INTEGER', '0'),
        ('consult', '咨询量明细表_v2', '退费原因', 'VARCHAR(200)', None),
        ('consult', '咨询量明细表_v2', '退费金额', 'INTEGER', '0'),
        ('consult', '咨询量明细表_v2', '是否已交接', 'INTEGER', '0'),
        ('consult', '咨询量明细表_v2', '交接时间', 'TIMESTAMP', None),
        ('consult', '咨询量明细表_v2', '交接人', 'VARCHAR(50)', None),
        ('consult', '咨询量明细表_v2', '分期备注', 'VARCHAR(200)', None),
        ('consult', '咨询量明细表_v2', '来源类别', 'VARCHAR(50)', None),
    ]
    
    try:
        with engine.begin() as conn:
            for schema, table, column, col_type, default_val in columns_to_ensure:
                # 检查表是否存在
                check_table_sql = sql_text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = :schema 
                    AND table_name = :table
                """)
                table_result = conn.execute(check_table_sql, {'schema': schema, 'table': table})
                if not table_result.fetchone():
                    # 表不存在，跳过（将由 create_all 创建）
                    continue
                
                # 检查列是否存在
                check_col_sql = sql_text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = :schema 
                    AND table_name = :table 
                    AND column_name = :column
                """)
                result = conn.execute(check_col_sql, {'schema': schema, 'table': table, 'column': column})
                
                if not result.fetchone():
                    # 列不存在，添加
                    if default_val is not None:
                        alter_sql = sql_text(f'''
                            ALTER TABLE {schema}."{table}" 
                            ADD COLUMN "{column}" {col_type} DEFAULT {default_val}
                        ''')
                    else:
                        alter_sql = sql_text(f'''
                            ALTER TABLE {schema}."{table}" 
                            ADD COLUMN "{column}" {col_type}
                        ''')
                    conn.execute(alter_sql)
                    print(f"[成功] 添加列 {schema}.{table}.{column} ({col_type})")
        return True
    except Exception as e:
        print(f"[警告] 同步 consult schema 列失败: {safe_error_str(e)}")
        return False


def ensure_public_users_columns() -> bool:
    """
    确保 public.users 表具备当前用户模型依赖的历史兼容列。

    SQLAlchemy create_all 不会为已存在表补新列，
    运行期初始化又会立即查询 User ORM，
    因此需要在首次查询前补齐缺失列。
    """
    from sqlalchemy import text as sql_text

    try:
        with engine.begin() as conn:
            table_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'users'
                    """
                )
            ).scalar()
            if not table_exists:
                return True

            column_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'users'
                      AND column_name = 'campus_access_list'
                    """
                )
            ).scalar()

            if not column_exists:
                conn.execute(
                    sql_text(
                        """
                        ALTER TABLE public.users
                        ADD COLUMN campus_access_list JSONB NOT NULL DEFAULT '[]'::jsonb
                        """
                    )
                )
                conn.execute(
                    sql_text(
                        """
                        COMMENT ON COLUMN public.users.campus_access_list IS '可访问神殿列表(JSON数组)'
                        """
                    )
                )
                conn.execute(
                    sql_text(
                        """
                        UPDATE public.users
                        SET campus_access_list = jsonb_build_array(campus)
                        WHERE campus IS NOT NULL
                          AND campus != ''
                          AND (campus_access_list IS NULL OR campus_access_list = '[]'::jsonb)
                        """
                    )
                )
                print("[成功] 补齐 public.users.campus_access_list 列")

        return True
    except Exception as e:
        print(f"[警告] 同步 public.users 列失败: {safe_error_str(e)}")
        return False


def ensure_training_application_columns() -> bool:
    """
    确保 humanresources.training_applications 表具备培训申请运行期依赖的新列。
    """
    from sqlalchemy import text as sql_text

    try:
        with engine.begin() as conn:
            table_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'humanresources' AND table_name = 'training_applications'
                    """
                )
            ).scalar()
            if not table_exists:
                return True

            column_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'humanresources'
                      AND table_name = 'training_applications'
                      AND column_name = 'include_chairman_approval'
                    """
                )
            ).scalar()

            if not column_exists:
                conn.execute(
                    sql_text(
                        """
                        ALTER TABLE humanresources.training_applications
                        ADD COLUMN include_chairman_approval BOOLEAN NOT NULL DEFAULT FALSE
                        """
                    )
                )
                conn.execute(
                    sql_text(
                        """
                        COMMENT ON COLUMN humanresources.training_applications.include_chairman_approval IS '是否启用董事长审批'
                        """
                    )
                )
                print("[成功] 补齐 humanresources.training_applications.include_chairman_approval 列")

        return True
    except Exception as e:
        print(f"[警告] 同步培训申请列失败: {safe_error_str(e)}")
        return False


def ensure_training_management_link_columns() -> bool:
    """
    确保培训成绩与培训满意度表具备来源培训申请关联列。
    """
    from sqlalchemy import text as sql_text

    table_configs = [
        (
            "training_results",
            "source_application_id",
            "来源培训申请ID",
            "ix_training_results_source_application_id",
        ),
        (
            "training_satisfaction_surveys",
            "source_application_id",
            "来源培训申请ID",
            "ix_training_satisfaction_surveys_source_application_id",
        ),
    ]

    try:
        with engine.begin() as conn:
            for table_name, column_name, comment, index_name in table_configs:
                table_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'humanresources' AND table_name = :table_name
                        """
                    ),
                    {"table_name": table_name},
                ).scalar()
                if not table_exists:
                    continue

                column_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'humanresources'
                          AND table_name = :table_name
                          AND column_name = :column_name
                        """
                    ),
                    {"table_name": table_name, "column_name": column_name},
                ).scalar()

                if not column_exists:
                    conn.execute(
                        sql_text(
                            f"""
                            ALTER TABLE humanresources.{table_name}
                            ADD COLUMN {column_name} INTEGER
                            """
                        )
                    )
                    conn.execute(
                        sql_text(
                            f"""
                            COMMENT ON COLUMN humanresources.{table_name}.{column_name} IS '{comment}'
                            """
                        )
                    )
                    print(f"[成功] 补齐 humanresources.{table_name}.{column_name} 列")

                index_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM pg_indexes
                        WHERE schemaname = 'humanresources' AND indexname = :index_name
                        """
                    ),
                    {"index_name": index_name},
                ).scalar()
                if not index_exists:
                    conn.execute(
                        sql_text(
                            f"""
                            CREATE INDEX {index_name}
                            ON humanresources.{table_name}({column_name})
                            """
                        )
                    )
                    print(f"[成功] 创建 humanresources.{index_name} 索引")

        return True
    except Exception as e:
        print(f"[警告] 同步培训管理关联列失败: {safe_error_str(e)}")
        return False

def ensure_promotion_application_salary_columns() -> bool:
    """
    确保晋升申请表拆分薪资字段存在，并为历史总薪资回填基础薪资。
    """
    from sqlalchemy import text as sql_text

    column_configs = [
        ("promoted_base_salary", "晋升后基础薪资"),
        ("promoted_performance_salary", "晋升后绩效薪资"),
    ]

    try:
        with engine.begin() as conn:
            table_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'humanresources'
                      AND table_name = 'promotion_applications'
                    """
                )
            ).scalar()
            if not table_exists:
                return True

            for column_name, comment in column_configs:
                column_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'humanresources'
                          AND table_name = 'promotion_applications'
                          AND column_name = :column_name
                        """
                    ),
                    {"column_name": column_name},
                ).scalar()
                if column_exists:
                    continue

                conn.execute(
                    sql_text(
                        f"""
                        ALTER TABLE humanresources.promotion_applications
                        ADD COLUMN {column_name} DOUBLE PRECISION
                        """
                    )
                )
                conn.execute(
                    sql_text(
                        f"""
                        COMMENT ON COLUMN humanresources.promotion_applications.{column_name}
                        IS '{comment}'
                        """
                    )
                )
                print(
                    f"[成功] 创建 humanresources.promotion_applications.{column_name} 字段"
                )

            conn.execute(
                sql_text(
                    """
                    UPDATE humanresources.promotion_applications
                    SET promoted_base_salary = promoted_salary
                    WHERE promoted_base_salary IS NULL
                      AND promoted_performance_salary IS NULL
                      AND promoted_salary IS NOT NULL
                    """
                )
            )

        return True
    except Exception as e:
        print(f"[警告] 同步晋升申请薪资拆分字段失败: {safe_error_str(e)}")
        return False


def ensure_transfer_application_salary_columns() -> bool:
    """
    确保调岗申请表已拆分基础薪资、绩效薪资字段，并为历史总薪资回填基础薪资。
    """
    from sqlalchemy import text as sql_text

    column_configs = [
        ("new_base_salary", "调岗后基础薪资"),
        ("new_performance_salary", "调岗后绩效薪资"),
    ]

    try:
        with engine.begin() as conn:
            table_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'humanresources'
                      AND table_name = 'transfer_applications'
                    """
                )
            ).scalar()
            if not table_exists:
                return True

            for column_name, comment in column_configs:
                column_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'humanresources'
                          AND table_name = 'transfer_applications'
                          AND column_name = :column_name
                        """
                    ),
                    {"column_name": column_name},
                ).scalar()
                if column_exists:
                    continue

                conn.execute(
                    sql_text(
                        f"""
                        ALTER TABLE humanresources.transfer_applications
                        ADD COLUMN {column_name} DOUBLE PRECISION
                        """
                    )
                )
                conn.execute(
                    sql_text(
                        f"""
                        COMMENT ON COLUMN humanresources.transfer_applications.{column_name}
                        IS '{comment}'
                        """
                    )
                )
                print(
                    f"[成功] 创建 humanresources.transfer_applications.{column_name} 字段"
                )

            conn.execute(
                sql_text(
                    """
                    UPDATE humanresources.transfer_applications
                    SET new_base_salary = new_salary
                    WHERE new_base_salary IS NULL
                      AND new_performance_salary IS NULL
                      AND new_salary IS NOT NULL
                    """
                )
            )

        return True
    except Exception as e:
        print(f"[警告] 同步调岗申请薪资拆分字段失败: {safe_error_str(e)}")
        return False


def ensure_promotion_process_link_columns() -> bool:
    """
    确保晋升申请、晋升面试、任命访谈之间的自动同步关联列存在。
    """
    from sqlalchemy import text as sql_text

    column_configs = [
        (
            "promotion_interviews",
            "source_application_id",
            "来源晋升申请ID",
            "uq_promotion_interviews_source_application_id",
            True,
        ),
        (
            "appointment_interview_records",
            "source_application_id",
            "来源晋升申请ID",
            "ix_appointment_interview_records_source_application_id",
            False,
        ),
        (
            "appointment_interview_records",
            "source_promotion_interview_id",
            "来源晋升面试ID",
            "uq_appointment_interview_records_source_promotion_interview_id",
            True,
        ),
    ]

    try:
        with engine.begin() as conn:
            for table_name, column_name, comment, index_name, is_unique in column_configs:
                table_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'humanresources' AND table_name = :table_name
                        """
                    ),
                    {"table_name": table_name},
                ).scalar()
                if not table_exists:
                    continue

                column_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'humanresources'
                          AND table_name = :table_name
                          AND column_name = :column_name
                        """
                    ),
                    {"table_name": table_name, "column_name": column_name},
                ).scalar()
                if not column_exists:
                    conn.execute(
                        sql_text(
                            f"""
                            ALTER TABLE humanresources.{table_name}
                            ADD COLUMN {column_name} INTEGER
                            """
                        )
                    )
                    conn.execute(
                        sql_text(
                            f"""
                            COMMENT ON COLUMN humanresources.{table_name}.{column_name} IS '{comment}'
                            """
                        )
                    )
                    print(f"[鎴愬姛] 琛ラ綈 humanresources.{table_name}.{column_name} 鍒?")

                index_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM pg_indexes
                        WHERE schemaname = 'humanresources' AND indexname = :index_name
                        """
                    ),
                    {"index_name": index_name},
                ).scalar()
                if index_exists:
                    continue

                unique_clause = "UNIQUE " if is_unique else ""
                conn.execute(
                    sql_text(
                        f"""
                        CREATE {unique_clause}INDEX {index_name}
                        ON humanresources.{table_name}({column_name})
                        """
                    )
                )
                print(f"[鎴愬姛] 鍒涘缓 humanresources.{index_name} 绱㈠紩")

        return True
    except Exception as e:
        print(f"[璀﹀憡] 鍚屾鏅嬪崌娴佺▼鍏宠仈鍒楀け璐? {safe_error_str(e)}")
        return False


def ensure_employee_archive_columns() -> bool:
    """
    确保 humanresources.employees 表具备员工档案运行期依赖的新列。

    旧库里 employees 可能早于员工档案扩展字段创建，ORM 查询会在 SELECT 阶段直接引用这些列，
    因此要在任何业务查询前补齐缺失列。
    """
    from sqlalchemy import text as sql_text

    columns_to_ensure = [
        ("labor_relation_company", "VARCHAR(100)", "劳动关系所属公司"),
        ("actual_work_company", "VARCHAR(100)", "实际工作所在公司"),
        ("position_category", "VARCHAR(20)", "岗位类别"),
        ("position_nature_override", "VARCHAR(20)", "岗位性质手动覆盖值"),
        ("ethnicity", "VARCHAR(20)", "民族"),
        ("native_place", "VARCHAR(100)", "籍贯"),
        ("contract_sign_date", "DATE", "劳动合同签订日期"),
        ("contract_end_date", "DATE", "劳动合同终止日期"),
        ("id_number", "VARCHAR(50)", "身份证号"),
        ("birth_date", "DATE", "出生日期"),
        ("political_status", "VARCHAR(50)", "政治面貌"),
        ("first_education", "VARCHAR(50)", "第一学历"),
        ("first_major", "VARCHAR(100)", "第一学历专业"),
        ("first_school", "VARCHAR(200)", "第一学历院校"),
        ("first_remark", "VARCHAR(200)", "第一学历备注"),
        ("second_education", "VARCHAR(50)", "第二学历"),
        ("second_major", "VARCHAR(100)", "第二学历专业"),
        ("second_school", "VARCHAR(200)", "第二学历院校"),
        ("second_remark", "VARCHAR(200)", "第二学历备注"),
        ("title_level", "VARCHAR(100)", "职称"),
        ("hukou_address", "TEXT", "户籍地址"),
        ("current_address", "TEXT", "现住址"),
        ("emergency_contact_name", "VARCHAR(100)", "紧急联系人姓名"),
        ("emergency_contact_phone", "VARCHAR(50)", "紧急联系人电话"),
        ("emergency_contact", "VARCHAR(200)", "紧急联系人"),
        ("bank_account_name", "VARCHAR(100)", "银行卡开户姓名"),
        ("bank_name", "VARCHAR(200)", "银行卡开户行"),
        ("bank_card_number", "VARCHAR(100)", "银行卡号"),
        ("base_salary", "NUMERIC(12, 2)", "基础薪资"),
        ("performance_salary", "NUMERIC(12, 2)", "绩效薪资"),
        ("personnel_change", "VARCHAR(200)", "人事变动"),
        ("reward_welfare", "VARCHAR(200)", "奖励福利"),
        ("archive_remark", "TEXT", "员工档案备注"),
    ]

    try:
        with engine.begin() as conn:
            table_exists = conn.execute(
                sql_text(
                    """
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'humanresources' AND table_name = 'employees'
                    """
                )
            ).scalar()
            if not table_exists:
                return True

            for column_name, column_type, comment in columns_to_ensure:
                column_exists = conn.execute(
                    sql_text(
                        """
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'humanresources'
                          AND table_name = 'employees'
                          AND column_name = :column_name
                        """
                    ),
                    {"column_name": column_name},
                ).scalar()

                if column_exists:
                    continue

                conn.execute(
                    sql_text(
                        f"""
                        ALTER TABLE humanresources.employees
                        ADD COLUMN {column_name} {column_type}
                        """
                    )
                )
                conn.execute(
                    sql_text(
                        f"""
                        COMMENT ON COLUMN humanresources.employees.{column_name} IS '{comment}'
                        """
                    )
                )
                print(f"[成功] 补齐 humanresources.employees.{column_name} 列")

        return True
    except Exception as e:
        print(f"[警告] 同步员工档案列失败: {safe_error_str(e)}")
        return False


def ensure_media_source_config_columns() -> bool:
    """
    确保 config.media_sources / config.media_details 具备当前模型依赖的历史兼容列。

    这些表已广泛通过 ORM 直接查询；如果库里缺少 is_important，SQLAlchemy 会在 SELECT
    阶段直接引用该列，导致接口在首次读取时 500。
    """

    columns_to_ensure = (
        ("media_sources", "is_important"),
        ("media_details", "is_important"),
    )

    try:
        with engine.begin() as conn:
            for table_name, column_name in columns_to_ensure:
                table_exists = conn.execute(
                    text(
                        """
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'config' AND table_name = :table_name
                        """
                    ),
                    {"table_name": table_name},
                ).scalar()
                if not table_exists:
                    continue

                column_exists = conn.execute(
                    text(
                        """
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'config'
                          AND table_name = :table_name
                          AND column_name = :column_name
                        """
                    ),
                    {"table_name": table_name, "column_name": column_name},
                ).scalar()
                if column_exists:
                    continue

                conn.execute(
                    text(
                        f"""
                        ALTER TABLE config.{table_name}
                        ADD COLUMN {column_name} BOOLEAN NOT NULL DEFAULT FALSE
                        """
                    )
                )
                conn.execute(
                    text(
                        f"""
                        COMMENT ON COLUMN config.{table_name}.{column_name}
                        IS '是否重要来源（在统计表中单独显示列）'
                        """
                    )
                )
                print(f"[成功] 补齐 config.{table_name}.{column_name} 列")

        return True
    except Exception as e:
        print(f"[警告] 同步 media source config 列失败: {safe_error_str(e)}")
        return False


def ensure_default_campuses() -> bool:
    """
    确保 fresh DB 至少具备人事模块依赖的默认神殿主数据。

    员工档案表、教师/班级等 config 外键都依赖 config.campuses。
    在空库冷启动时，如果没有任何神殿主数据，后续员工档案首次创建会直接触发外键错误。
    """
    from app.models.config_master import CampusProfile

    default_campuses = [
        ("最高议事厅", "hq_center", "最高议事厅", "石家庄"),
        ("最高议事厅神殿", "hq_center_campus", "最高议事厅", "石家庄"),
        ("总部", "hq", "总部", "石家庄"),
        ("主神殿", "shengbang", "盛邦", "石家庄"),
        ("永恒殿", "jimei", "冀美", "石家庄"),
        ("慈悲殿", "shimei", "石美", "石家庄"),
        ("李大殿", "jinmei", "晋美", "太原"),
        ("智慧阁", "yuanmei", "原美", "太原"),
        ("光明殿", "taimei", "太美", "太原"),
        ("神恩殿", "guimei", "桂美", "南宁"),
        ("天威殿", "qianmei", "黔美", "贵阳"),
    ]

    session = SessionLocal()
    try:
        existing = {
            name
            for (name,) in session.query(CampusProfile.name).all()
        }
        created = 0
        for name, code, short_name, city in default_campuses:
            if name in existing:
                continue
            session.add(
                CampusProfile(
                    name=name,
                    code=code,
                    short_name=short_name,
                    city=city,
                    is_active=True,
                )
            )
            created += 1
        if created:
            session.commit()
        else:
            session.rollback()
        print(f"[DB] 已补齐默认神殿主数据 {created} 条")
        return True
    except Exception as e:
        session.rollback()
        print(f"[DB] 补齐默认神殿主数据失败: {safe_error_str(e)}")
        return False
    finally:
        session.close()


def init_db():
    """
    初始化数据库（单库 qmjy + 多 schema）
    删库后一次性创建所有表，无需增量同步
    """
    import time
    start_time = time.perf_counter()
    profiler = StepProfiler(
        logger,
        "init_db",
        enabled=should_profile_startup(os.environ.get("APP_ENV") or os.environ.get("APP_MODE")),
    )
    logger.info("[startup] init_db begin")
    
    print("[DB] 开始数据库初始化...")

    # 1. 创建数据库和 schema
    try:
        with profiler.step("schema create"):
            create_database_if_not_exists()
            ensure_required_schemas()
    except Exception as e:
        print(f"[DB] 创建数据库/schema失败: {safe_error_str(e)}")
        return False

    # 1.1 确保权限相关表存在（避免登录时缺表导致事务中断）
    try:
        with profiler.step("permission tables"):
            ensure_permission_tables()
    except Exception as e:
        print(f"[DB] 创建权限表失败: {safe_error_str(e)}")

    # 2. 创建 users 表并导入管理员
    try:
        AccountBase.metadata.create_all(bind=engine, tables=[cast(Table, User.__table__)])
        if not ensure_public_users_columns():
            return False
        session = SessionLocal()
        try:
            if session.query(User).filter(User.username == "admin").count() == 0:
                admin_password_hash = security_manager.get_password_hash("admin123")
                session.add(User(
                    username="admin",
                    password_hash=admin_password_hash,
                    real_name="系统管理员",
                    email="admin@zhushendian.com",
                    department="最高议事厅",
                    position="系统管理员",
                    campus="总部",
                    role=UserRole.ADMIN,
                    status=UserStatus.ACTIVE,
                    is_superuser=True,
                    gender="男"
                ))
                session.commit()
            total_users = session.query(User).count()
            if total_users <= 1:
                import_employees_from_json()
        finally:
            session.close()
    except Exception as e:
        print(f"[DB] 创建users表失败: {safe_error_str(e)}")
        return False

    # 3. 按依赖顺序创建业务表
    # 先创建 config，再创建 humanresources，最后补齐其余 public/academic 表。
    # 测试环境下如果 config.campuses 缺失，直接创建 humanresources 会因外键约束整批回滚。
    try:
        tables_to_create = [t for t in AccountBase.metadata.tables.values() if not t.name.startswith("v_")]
        config_tables = [t for t in tables_to_create if t.schema == "config"]
        human_resources_tables = [t for t in tables_to_create if t.schema == "humanresources"]
        remaining_tables = [
            t for t in tables_to_create
            if t.schema not in {"config", "humanresources"}
        ]

        for label, grouped_tables in (
            ("config", config_tables),
            ("humanresources", human_resources_tables),
            ("remaining", remaining_tables),
        ):
            if not grouped_tables:
                continue
            AccountBase.metadata.create_all(bind=engine, tables=grouped_tables)
            print(f"[DB] 已创建 {label} 表，共 {len(grouped_tables)} 张")
            if label == "config":
                if not ensure_media_source_config_columns():
                    return False
                if not ensure_default_campuses():
                    return False
            if label == "humanresources":
                if not ensure_employee_archive_columns():
                    return False
                if not ensure_training_application_columns():
                    return False
                if not ensure_training_management_link_columns():
                    return False
                if not ensure_promotion_application_salary_columns():
                    return False
                if not ensure_transfer_application_salary_columns():
                    return False
                if not ensure_promotion_process_link_columns():
                    return False
    except Exception as e:
        print(f"[DB] 创建academic/config表失败: {safe_error_str(e)}")
        return False

    # 4. 创建 teaching_quality 表（动态加载模块）
    try:
        import importlib.util
        from pathlib import Path
        
        teaching_quality_dir = Path(__file__).resolve().parents[1] / "teaching_quality"
        TQBase.metadata.clear()
        
        teaching_quality_modules = [
            ("TQactivity_plan_arrangement_db", "init_activity_plan_tables"),
            ("TQadult_exam_registration_roster_db", "init_adult_exam_registration_roster_tables"),
            ("TQadult_exam_to_register_roster_db", "init_adult_exam_to_register_roster_tables"),
            ("TQcampus_refund_detail_db", "init_refund_detail_tables"),
            ("TQcampus_dormitory_rent_payment_info_db", "init_dormitory_rent_payment_tables"),
            ("TQcampus_dormitory_statistics_summary_db", "init_campus_dormitory_statistics_summary_tables"),
            ("TQcampus_enrollment_statistics_db", "init_campus_enrollment_statistics_tables"),
            ("TQcampus_enterprise_contract_goal_db", "init_db_table"),
            ("TQcampus_female_dormitory_detail_db", "init_female_dormitory_detail_tables"),
            ("TQcampus_long_absence_detail_db", "init_long_absence_detail_tables"),
            ("TQcampus_long_leave_detail_db", "init_long_leave_detail_tables"),
            ("TQcampus_male_dormitory_detail_db", "init_male_dormitory_detail_tables"),
            ("TQcampus_manager_analysis_db", "init_campus_manager_analysis_tables"),
            ("TQcampus_monthly_class_promotion_goals_results_db", "init_monthly_class_promotion_tables"),
            ("TQcampus_monthly_new_stu_stability_detail_db", "init_monthly_new_stu_stability_detail_tables"),
            ("TQcampus_monthly_personal_dormitory_mgmt_db", "init_campus_monthly_personal_dorm_tables"),
            ("TQcampus_monthly_personal_new_stu_stability_db", "init_monthly_personal_new_stu_stability_tables"),
            ("TQcampus_monthly_personal_promotion_goals_results_db", "init_monthly_personal_promotion_tables"),
            ("TQcampus_monthly_personal_reputation_enrollment_goals_results_db", "init_monthly_personal_reputation_enrollment_tables"),
            ("TQcampus_monthly_personal_stu_movement_db", "init_monthly_personal_stu_movement_tables"),
            ("TQcampus_new_stu_arrears_detail_db", "init_new_stu_arrears_detail_tables"),
            ("TQcampus_other_situation_detail_db", "init_other_situation_detail_tables"),
            ("TQcampus_personal_dormitory_mgmt_summary_db", "init_personal_dormitory_mgmt_manual_tables"),
            ("TQcampus_personal_enrollment_statistics_db", "init_campus_personal_enrollment_statistics_tables"),
            ("TQcampus_personal_enterprise_contract_goals_results_db", "init_db_table"),
            ("TQcampus_personal_promotion_goals_results_db", "init_personal_promotion_tables"),
            ("TQcampus_personal_reputation_enrollment_goals_results_db", "init_campus_personal_reputation_enrollment_tables"),
            ("TQcampus_personal_stu_movement_db", "init_personal_stu_movement_tables"),
            ("TQcampus_promotion_plan_summary_db", "init_campus_promotion_plan_summary_tables"),
            ("TQcampus_reputation_enrollment_goals_results_db", "init_campus_reputation_enrollment_goals_results_tables"),
            ("TQcampus_stu_movement_summary_db", "init_campus_stu_movement_summary_tables"),
            ("TQcampus_suspension_detail_db", "init_suspension_detail_tables"),
            ("TQcampus_teacher_ratio_db", "init_teacher_ratio_tables"),
            ("TQcampus_training_plan_score_detail_db", "init_training_plan_score_tables"),
            ("TQcampus_training_plan_performance_db", "init_campus_training_plan_performance_tables"),
            ("TQcampus_training_plan_performance_mgnt_db", "init_training_plan_performance_mgnt_tables"),
            ("TQcampus_vacation_students_detail_db", "init_vacation_students_detail_tables"),
            ("TQclass_activity_plan_db", "init_class_activity_plan_tables"),
            ("TQclass_attendance_db", "init_class_attendance_tables"),
            ("TQclass_committee_meeting_status_db", "init_class_committee_meeting_status_tables"),
            ("TQclass_employment_period_plan_supervision_db", "init_class_employment_period_plan_supervision_tables"),
            ("TQclass_file_record_db", "init_class_file_tables"),
            ("TQclass_intensify_plan_supervision_db", "init_class_intensify_plan_supervision_tables"),
            ("TQclass_list_db", "init_class_list_tables"),
            ("TQclass_meeting_status_db", "init_class_meeting_status_tables"),
            ("TQclass_onboarding_plan_supervision_db", "init_class_onboarding_plan_supervision_tables"),
            ("TQclass_pressure_interview_score_db", "init_class_pressure_interview_score_tables"),
            ("TQclass_thousand_score_db", "init_thousand_score_tables"),
            ("TQcot_exam_score_db", "init_cot_exam_score_tables"),
            ("TQculture_exam_plan_db", "init_culture_exam_plan_tables"),
            ("TQculture_presentation_plan_db", "init_culture_presentation_plan_tables"),
            ("TQdaily_new_student_schedule_db", "init_daily_new_student_tables"),
            ("TQdormitory_self_check_monthly_db", "init_dormitory_self_check_tables"),
            ("TQemployee_function_analysis_db", "init_employee_function_tables"),
            ("TQemployee_interview_db", "init_employee_interview_tables"),
            ("TQevening_self_study_attendance_db", "init_evening_attendance_tables"),
            ("TQfee_reminder_db", "init_fee_reminder_tables"),
            ("TQgraduate_interview_record_db", "init_graduate_interview_tables"),
            ("TQhomeroom_daily_work_db", "init_homeroom_daily_work_tables"),
            ("TQhomeroom_enterprise_contract_db", "init_db_table"),
            ("TQhomeroom_teacher_standardization_db", "init_standardization_tables"),
            ("TQhomework_db", "init_homework_tables"),
            ("TQmajor_exam_score_db", "init_major_exam_score_tables"),
            ("TQmanager_kpi_plan_db", "init_manager_kpi_tables"),
            ("TQmeeting_record_db", "init_meeting_tables"),
            ("TQmgnt_employment_goals_results_manual_db", "init_manual_table"),
            ("TQopen_university_registration_roster_db", "init_open_university_registration_roster_tables"),
            ("TQopen_university_to_register_roster_db", "init_open_university_to_register_roster_tables"),
            ("TQother_higher_education_registration_roster_db", "init_other_higher_education_registration_roster_tables"),
            ("TQother_higher_education_to_register_roster_db", "init_other_higher_education_to_register_roster_tables"),
            ("TQother_secondary_registration_roster_db", "init_other_secondary_registration_roster_tables"),
            ("TQother_secondary_to_register_roster_db", "init_other_secondary_to_register_roster_tables"),
            ("TQparent_interview_record_db", "init_parent_interview_tables"),
            ("TQpromotion_interview_db", "init_promotion_interview_tables"),
            ("TQpromotion_plan_db", "init_promotion_plan_tables"),
            ("TQpromotion_virtual_class_db", "init_promotion_tables"),
            ("TQquality_training_db", "init_quality_training_tables"),
            ("TQreputation_keypoint_summary_db", "init_reputation_keypoint_tables"),
            ("TQreputation_keypoint_yearly_db", "init_reputation_keypoint_yearly_tables"),
            ("TQreputation_registration_detail_db", "init_reputation_registration_tables"),
            ("TQreputation_self_check_db", "init_reputation_self_check_tables"),
            ("TQsecondary_1year_registration_roster_db", "init_secondary_1year_registration_roster_tables"),
            ("TQsecondary_1year_to_register_roster_db", "init_secondary_1year_to_register_roster_tables"),
            ("TQsecondary_3year_registration_roster_db", "init_secondary_3year_registration_roster_tables"),
            ("TQsecondary_3year_to_register_roster_db", "init_secondary_3year_to_register_roster_tables"),
            ("TQself_study_signin_db", "init_self_study_signin_tables"),
            ("TQspeech_score_db", "init_speech_score_tables"),
            ("TQstudent_interview_record_db", "init_student_interview_tables"),
            ("TQteacher_kpi_plan_db", "init_teacher_kpi_tables"),
            ("TQgraduate_parent_interview_record_db", "init_graduate_parent_interview_tables"),
            ("TQother_interview_record_db", "init_other_interview_tables"),
            ("TQ_campus_recruitment_plan_summary_db", "init_db_table"),
            ("TQ_class_employment_info_db", "init_qt_class_employment_tables"),
            ("TQ_class_employment_summary_db", "init_qt_class_employment_summary_tables"),
            ("TQ_salary_estimate_db", "init_qt_salary_estimate_tables"),
        ]
        
        for module_name, init_func_name in teaching_quality_modules:
            module_path = teaching_quality_dir / f"{module_name}.py"
            if not module_path.exists():
                continue
            try:
                spec = importlib.util.spec_from_file_location(module_name, module_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    init_func = getattr(module, init_func_name, None)
                    if init_func:
                        init_func()
            except Exception:
                pass  # 静默处理，表可能已存在
        
        # 创建 teaching_quality 视图
        for module_name, view_func_name in [
            ("TQcampus_monthly_new_stu_stability_summary_db", "ensure_monthly_new_stu_stability_view"),
            ("TQcampus_personal_new_stu_stability_summary_db", "ensure_personal_new_stu_stability_view"),
        ]:
            module_path = teaching_quality_dir / f"{module_name}.py"
            if module_path.exists():
                try:
                    spec = importlib.util.spec_from_file_location(module_name, module_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        view_func = getattr(module, view_func_name, None)
                        if view_func:
                            view_func()
                except Exception:
                    pass
    except Exception as e:
        print(f"[DB] 创建teaching_quality表失败: {safe_error_str(e)}")

    # 5. 创建 market 表
    try:
        from app.models.market import (
            MarketBase,
        )
        
        MarketBase.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[DB] 创建market表失败: {safe_error_str(e)}")

    # 6. 创建 consult 表
    try:
        from app.models.consult import (
            ConsultBase,
            祈福司会议记录表,
            祈福司访谈记录表,
        )
        ConsultBase.metadata.create_all(bind=engine)
        AccountBase.metadata.create_all(
            bind=engine,
            tables=[
                cast(Table, 祈福司会议记录表.__table__),
                cast(Table, 祈福司访谈记录表.__table__),
            ],
        )
        # 确保 consult 表的列完整（为已存在的表添加新列）
        ensure_consult_schema_columns()
    except Exception as e:
        print(f"[DB] 创建consult表失败: {safe_error_str(e)}")

    # 7. 创建视图
    try:
        ensure_academic_views()
    except Exception:
        pass

    # 8. 导入基础配置数据
    try:
        with profiler.step("config data import"):
            import_all_config_data()
    except Exception as e:
        print(f"[DB] 导入配置数据失败: {safe_error_str(e)}")
        return False

    # 9. 初始化班主任列表
    try:
        with profiler.step("homeroom bootstrap"):
            from app.models.config_master import HomeroomTeacherProfile, TeacherProfile
            session = SessionLocal()
            try:
                if not session.query(HomeroomTeacherProfile.id).first():
                    teachers = session.query(TeacherProfile).all()
                    for t in teachers:
                        session.add(HomeroomTeacherProfile(
                            name=t.name, campus_name=t.campus_name, teacher_code=t.teacher_code,
                            title=t.title, phone=t.phone, email=t.email, specialty=t.specialty,
                            is_active=t.is_active, participate_kpi=t.participate_kpi, notes=t.notes,
                        ))
                    session.commit()
            finally:
                session.close()
    except Exception:
        pass

    with profiler.step("audit log sync"):
        ensure_audit_log_schema()

    # 10. 运行自动迁移（执行 migrations/ 下未运行的脚本）
    try:
        with profiler.step("migrations"):
            from migrations.auto_migrate import run_pending_migrations
            migration_ok = run_pending_migrations()
        if not migration_ok:
            print("[DB] 自动迁移执行失败")
            return False
    except Exception as e:
        print(f"[DB] 自动迁移执行失败: {safe_error_str(e)}")
        return False

    elapsed = time.perf_counter() - start_time
    logger.info("[startup] init_db complete elapsed=%.3fs", elapsed)
    profiler.log_summary()
    print(f"[DB] 数据库初始化完成 ({elapsed:.2f}s)")
    return True

# ========= 教学质量模块 Session（固定 schema：teaching_quality） =========
def get_teaching_quality_db() -> Generator[Session, None, None]:
    """教学质量模块 Session（不做 schema_translate_map）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话
    用于FastAPI依赖注入
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_market_db() -> Generator[Session, None, None]:
    """
    获取市场数据库会话
    用于FastAPI依赖注入
    注意：单库模式下，市场模块使用同一个数据库，只是不同的 schema
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_employment_db() -> Generator[Session, None, None]:
    """
    获取就业数据库会话
    用于FastAPI依赖注入
    注意：单库模式下，就业模块使用同一个数据库，只是不同的 schema
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _load_module_from_path(module_name: str, module_path) -> Optional[ModuleType]:
    import importlib.util

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        return None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def get_database_engine(db_name: Optional[str] = None, campus_code: Optional[str] = None):
    """
    根据数据库名称或神殿代码创建数据库引擎
    
    Args:
        db_name: 数据库名称，如 'account', 'shengbang_db' 等
        campus_code: 神殿代码，如 'center', 'shengbang' 等
    
    Returns:
        SQLAlchemy Engine对象
    """
    if campus_code:
        # 通过神殿代码获取数据库名称
        campus_config = get_campus_config(campus_code)
        target_db = campus_config["db_name"]
    elif db_name:
        # 直接使用指定的数据库名称
        target_db = db_name
    else:
        # 使用默认数据库
        target_db = settings.DB_NAME
    
    # 构建数据库连接URL
    database_url = settings.get_database_url(target_db)
    
    # 创建引擎 - psycopg3 原生支持 UTF-8，无需特殊编码配置
    engine = create_engine(
        database_url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_recycle=settings.DB_POOL_RECYCLE,
        echo=settings.SQL_ECHO,
        pool_pre_ping=True,
        connect_args={'options': '-c search_path=market,teaching_quality,academic,public'}
    )
    
    return engine


def get_database_session(db_name: Optional[str] = None, campus_code: Optional[str] = None) -> Session:
    """
    根据数据库名称或神殿代码获取数据库会话
    
    Args:
        db_name: 数据库名称，如 'account', 'shengbang_db' 等
        campus_code: 神殿代码，如 'center', 'shengbang' 等
    
    Returns:
        SQLAlchemy Session对象
    """
    engine = get_database_engine(db_name, campus_code)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def create_database_if_not_exists():
    """
    创建数据库（如果不存在）
    根据当前配置的数据库名称创建数据库（PostgreSQL）
    """
    try:
        # 连接到PostgreSQL服务器（连接到默认postgres数据库）
        # 如果密码为空，使用默认密码 "postgres"（仅用于开发环境）
        if not settings.DB_PASSWORD:
            password_part = ""
        else:
            password_part = f":{settings.DB_PASSWORD}"
        
        # 根据是否使用 Unix socket 构建连接URL
        if settings.DB_HOST and settings.DB_HOST.startswith('/'):
            # Unix socket 方式：使用 connect_args 指定 socket 路径
            # URL 中只需要包含用户信息，host 部分留空
            connection_url = f"postgresql+psycopg://{settings.DB_USER}{password_part}@localhost/postgres"
            connect_args = {
                'host': settings.DB_HOST,
                'dbname': 'postgres'
            }
            if settings.DB_PASSWORD:
                connect_args['password'] = settings.DB_PASSWORD
            print(f"[调试] 使用 Unix socket 连接: socket={settings.DB_HOST}, dbname=postgres")
        else:
            # TCP 格式
            connection_url = f"postgresql+psycopg://{settings.DB_USER}{password_part}@{settings.DB_HOST}:{settings.DB_PORT}/postgres"
            print(f"[调试] 使用 TCP 连接信息: postgresql+psycopg://{settings.DB_USER}:***@{settings.DB_HOST}:{settings.DB_PORT}/postgres")
        print(f"[调试] 目标数据库: {settings.DB_NAME}")
        print(f"[调试] 密码是否为空: {not settings.DB_PASSWORD}")
        
        # psycopg3 原生支持 UTF-8，无需特殊编码配置
        if settings.DB_HOST and settings.DB_HOST.startswith('/'):
            # Unix socket 使用 connect_args
            server_engine = create_engine(
                connection_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False,
                connect_args=connect_args
            )
        else:
            # TCP 方式
            server_engine = create_engine(
                connection_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False,
            )
        
        with server_engine.connect() as conn:
            # PostgreSQL需要手动提交DDL语句
            conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            
            # 先测试连接是否正常
            test_result = conn.execute(text("SELECT current_user, current_database();"))
            test_row = test_result.fetchone()
            print(f"[调试] 连接测试成功 - 用户: {test_row[0]}, 数据库: {test_row[1]}")
            
            # 检查数据库是否存在
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": settings.DB_NAME}
            )
            if result.fetchone():
                print(f"数据库 '{settings.DB_NAME}' 已存在")
            else:
                # 创建数据库（PostgreSQL语法）
                conn.execute(text(f"CREATE DATABASE {settings.DB_NAME} ENCODING 'UTF8'"))
                print(f"[成功] 成功创建数据库: {settings.DB_NAME}")
                
    except Exception as e:
        error_str = safe_error_str(e)
        print(f"[失败] 创建数据库失败: {error_str}")
        print(f"[调试] 错误类型: {type(e).__name__}")
        print(f"[调试] 当前配置 - 用户: {settings.DB_USER}, 主机: {settings.DB_HOST}, 端口: {settings.DB_PORT}")
        print(f"[调试] 密码长度: {len(settings.DB_PASSWORD) if settings.DB_PASSWORD else 0}")
        raise


def create_all_campus_databases():
    """
    创建所有神殿的数据库（PostgreSQL）
    """
    try:
        # 连接到PostgreSQL服务器（连接到默认postgres数据库）
        # 如果密码为空，使用默认密码 "postgres"（仅用于开发环境）
        if not settings.DB_PASSWORD:
            password_part = ":postgres"
        else:
            password_part = f":{settings.DB_PASSWORD}"
        
        # psycopg3 原生支持 UTF-8
        server_engine = create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/postgres"
        )
        
        with server_engine.connect() as conn:
            print("开始创建所有神殿数据库...")
            # PostgreSQL需要手动提交DDL语句
            conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            
            # 获取所有神殿配置
            from .config import CAMPUS_CONFIGS
            
            for _campus_code, config in CAMPUS_CONFIGS.items():
                db_name = config["db_name"]
                campus_name = config["name"]
                
                try:
                    # 检查数据库是否存在（PostgreSQL语法）
                    result = conn.execute(
                        text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                        {"db_name": db_name}
                    )
                    if result.fetchone():
                        print(f"数据库 '{db_name}' ({campus_name}) 已存在")
                    else:
                        # 创建数据库（PostgreSQL语法）
                        conn.execute(text(f"CREATE DATABASE {db_name} ENCODING 'UTF8'"))
                        print(f"[成功] 成功创建数据库: {db_name} ({campus_name})")
                        
                except Exception as e:
                    print(f"[失败] 创建数据库失败 {db_name} ({campus_name}): {safe_error_str(e)}")
            
            print("所有神殿数据库创建完成!")
                
    except Exception as e:
        print(f"[失败] 创建神殿数据库失败: {safe_error_str(e)}")
        raise


def create_all_module_databases():
    """
    创建所有功能模块的数据库（PostgreSQL）
    """
    try:
        # 连接到PostgreSQL服务器（连接到默认postgres数据库）
        # 如果密码为空，使用默认密码 "postgres"（仅用于开发环境）
        if not settings.DB_PASSWORD:
            password_part = ":postgres"
        else:
            password_part = f":{settings.DB_PASSWORD}"
        
        # psycopg3 原生支持 UTF-8
        server_engine = create_engine(
            f"postgresql+psycopg://{settings.DB_USER}{password_part}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/postgres"
        )
        
        with server_engine.connect() as conn:
            print("开始创建所有功能模块数据库...")
            # PostgreSQL需要手动提交DDL语句
            conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            
            # 兼容旧多数据库配置：当前仓库可能未定义 MODULE_CONFIGS
            from . import config as app_config

            module_configs = getattr(app_config, "MODULE_CONFIGS", None)
            if not module_configs:
                print("未配置 MODULE_CONFIGS，跳过功能模块数据库创建")
                return

            for _module_code, config in module_configs.items():
                db_name = config["db_name"]
                module_name = config["name"]
                
                try:
                    # 检查数据库是否存在（PostgreSQL语法）
                    result = conn.execute(
                        text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                        {"db_name": db_name}
                    )
                    if result.fetchone():
                        print(f"数据库 '{db_name}' ({module_name}) 已存在")
                    else:
                        # 创建数据库（PostgreSQL语法）
                        conn.execute(text(f"CREATE DATABASE {db_name} ENCODING 'UTF8'"))
                        print(f"[成功] 成功创建数据库: {db_name} ({module_name})")
                        
                except Exception as e:
                    print(f"[失败] 创建数据库失败 {db_name} ({module_name}): {safe_error_str(e)}")
            
            print("所有功能模块数据库创建完成!")
                
    except Exception as e:
        print(f"[失败] 创建功能模块数据库失败: {safe_error_str(e)}")
        raise


def create_all_databases():
    """
    创建业务数据库（单库模式），并确保academic schema存在
    """
    print("开始创建业务数据库...")
    print("=" * 60)
    try:
        create_database_if_not_exists()
        ensure_required_schemas()
        AccountBase.metadata.create_all(bind=engine)
        print(f"[成功] 数据库 {settings.DB_NAME} 及核心 schema 已就绪")
    except Exception as e:
        print(f"[失败] 创建业务数据库或表失败: {safe_error_str(e)}")
        raise
    print("=" * 60)
    print("[完成] 业务数据库创建完成!")


# Schema 缓存和锁（避免并发创建导致的连接池溢出）
_schema_cache = set()
_schema_lock = threading.Lock()

def ensure_schema(schema_name: str):
    """
    确保指定 schema 存在（线程安全，带缓存）
    """
    # 如果已经在缓存中，直接返回（避免重复创建）
    if schema_name in _schema_cache:
        return True
    
    # 使用锁确保线程安全
    with _schema_lock:
        # 双重检查（double-check）
        if schema_name in _schema_cache:
            return True
        
        try:
            # 使用 engine.begin() 而不是 engine.connect()，自动管理事务
            with engine.begin() as conn:
                conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
            
            # 创建成功，加入缓存
            _schema_cache.add(schema_name)
            print(f"[成功] {schema_name} schema 已就绪")
            return True
        except Exception as e:
            # 安全地转换错误消息为字符串（处理 Windows GBK 编码问题）
            error_str = safe_error_str(e)
            
            # 检查是否是编码错误，如果是则忽略并继续（schema 可能已存在）
            if "codec" in error_str.lower() or "decode" in error_str.lower() or "encoding" in error_str.lower():
                print(f"[警告] 创建 {schema_name} schema 时遇到编码问题，尝试继续")
                _schema_cache.add(schema_name)  # 假设已存在，加入缓存
                return True
            if "does not exist" in error_str.lower() or "database" in error_str.lower():
                print("[警告] 数据库可能不存在，将在后续步骤中创建")
                return False
            # 如果是 schema 已存在的错误，也加入缓存
            if "already exists" in error_str.lower() or "duplicate" in error_str.lower():
                _schema_cache.add(schema_name)
                return True
            print(f"[失败] 创建 {schema_name} schema 失败: {error_str}")
            # 不抛出异常，让程序继续执行
            return False


def ensure_required_schemas():
    """
    创建系统运行依赖的 schema（config/academic/teaching_quality/market/consult/humanresources）
    """
    for schema_name in (
        "config",
        "academic",
        "teaching_quality",
        "market",
        "consult",
        "humanresources",
    ):
        ensure_schema(schema_name)


def ensure_permission_tables() -> None:
    """Ensure permission tables exist in public schema."""
    try:
        with engine.begin() as conn:
            users_exists = conn.execute(text("SELECT to_regclass('public.users')")).scalar()
            if not users_exists:
                print("[提示] public.users 尚未就绪，跳过权限表初始化")
                return
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.user_permissions_direct (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
                    permission_code VARCHAR(200) NOT NULL,
                    granted_by VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uix_user_perm_direct UNIQUE (user_id, permission_code)
                )
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_upd_user_id
                ON public.user_permissions_direct (user_id)
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.permission_route_map (
                    route_key VARCHAR(200) NOT NULL,
                    permission_code VARCHAR(200) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (route_key, permission_code)
                )
            """))
        print("[成功] 权限表已就绪")
    except Exception as e:
        print(f"[警告] 权限表创建失败: {safe_error_str(e)}")


def ensure_audit_log_schema() -> bool:
    """
    开发期兜底：确保日志表字段与 users 同步所需字段存在
    """
    try:
        with engine.begin() as conn:
            logs_exists = conn.execute(text("SELECT to_regclass('public.logs')")).scalar()
            if not logs_exists:
                print("[警告] public.logs 不存在，跳过日志字段同步")
                return False
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS public.logs "
                    "ADD COLUMN IF NOT EXISTS real_name VARCHAR(50)"
                )
            )
            users_exists = conn.execute(text("SELECT to_regclass('public.users')")).scalar()
            if users_exists:
                conn.execute(
                    text(
                        """
                        UPDATE public.logs AS l
                        SET real_name = u.real_name
                        FROM public.users AS u
                        WHERE l.real_name IS NULL AND l.user_id = u.user_id
                        """
                    )
                )
                conn.execute(
                    text(
                        """
                        UPDATE public.logs AS l
                        SET real_name = u.real_name
                        FROM public.users AS u
                        WHERE l.real_name IS NULL AND l.username = u.username
                        """
                    )
                )
        print("[成功] 日志表 real_name 字段已同步")
        return True
    except Exception as e:
        print(f"[警告] 日志表字段同步失败: {safe_error_str(e)}")
        return False


_tq_batch_migrated = False


def ensure_teaching_quality_schema():
    """
    确保 teaching_quality schema 存在（用于教学质量模块）
    """
    ensure_schema("teaching_quality")


def batch_ensure_teaching_quality_tables() -> bool:
    """
    一次性创建所有 teaching_quality 表（替代逐模块 _migrate）。
    启动时调用一次，之后各模块的 _migrate() 检查 _tq_batch_migrated 跳过。
    """
    global _tq_batch_migrated
    if _tq_batch_migrated:
        return True
    ensure_teaching_quality_schema()
    TQBase.metadata.create_all(bind=engine, checkfirst=True)
    _tq_batch_migrated = True
    return True


def ensure_academic_views():
    """
    确保 academic schema 下的视图被正确创建
    """
    try:
        ensure_schema("academic")
        
        # 创建学员满意度平均视图
        view_sql = text("""
        CREATE OR REPLACE VIEW academic.v_student_satisfaction_avg AS
        SELECT
            s.campus_name,
            s.year,
            s.teacher_name,
            AVG(CASE WHEN (elem ->> 'm1') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm1')::NUMERIC ELSE NULL END) AS m1,
            AVG(CASE WHEN (elem ->> 'm2') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm2')::NUMERIC ELSE NULL END) AS m2,
            AVG(CASE WHEN (elem ->> 'm3') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm3')::NUMERIC ELSE NULL END) AS m3,
            AVG(CASE WHEN (elem ->> 'm4') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm4')::NUMERIC ELSE NULL END) AS m4,
            AVG(CASE WHEN (elem ->> 'm5') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm5')::NUMERIC ELSE NULL END) AS m5,
            AVG(CASE WHEN (elem ->> 'm6') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm6')::NUMERIC ELSE NULL END) AS m6,
            AVG(CASE WHEN (elem ->> 'm7') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm7')::NUMERIC ELSE NULL END) AS m7,
            AVG(CASE WHEN (elem ->> 'm8') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm8')::NUMERIC ELSE NULL END) AS m8,
            AVG(CASE WHEN (elem ->> 'm9') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm9')::NUMERIC ELSE NULL END) AS m9,
            AVG(CASE WHEN (elem ->> 'm10') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm10')::NUMERIC ELSE NULL END) AS m10,
            AVG(CASE WHEN (elem ->> 'm11') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm11')::NUMERIC ELSE NULL END) AS m11,
            AVG(CASE WHEN (elem ->> 'm12') ~ '^-?\\d+(\\.\\d+)?$' THEN (elem ->> 'm12')::NUMERIC ELSE NULL END) AS m12
        FROM academic.student_satisfaction_details s,
             LATERAL jsonb_array_elements(s.rows) elem
        GROUP BY s.campus_name, s.year, s.teacher_name;
        """)
        
        with engine.begin() as conn:
            conn.execute(view_sql)
        
        print("[成功] academic.v_student_satisfaction_avg 视图已创建/更新")
        return True
    except Exception as e:
        error_msg = safe_error_str(e)
        print(f"[警告] 创建 academic 视图时出错: {error_msg}")
        import traceback
        traceback.print_exc()
        return False


def import_employees_from_json() -> bool:
    """
    调用 data.json 员工导入脚本（避免包路径问题，直接按文件加载）
    """
    from pathlib import Path
    
    try:
        module_path = Path(__file__).resolve().parents[2] / "sql" / "init" / "import_employees_account_data" / "import_employees_account.py"
        if not module_path.exists():
            print(f"[提示] 未发现员工导入脚本，跳过默认员工导入: {module_path}")
            return False
        module = _load_module_from_path("import_employees_account", module_path)
        if module is None:
            print(f"[错误] 无法加载员工导入脚本: {module_path}")
            return False
        return bool(module.import_from_json())
    except Exception as e:
        print(f"[错误] 调用 import_employees_account 失败: {safe_error_str(e)}")
        return False


def import_campuses_from_json() -> bool:
    """
    调用 campus.json 神殿数据导入脚本
    """
    from pathlib import Path

    try:
        module_path = (
            Path(__file__).resolve().parents[2]
            / "sql"
            / "init"
            / "import_data_config"
            / "import_data.py"
        )
        if not module_path.exists():
            print(f"[错误] 找不到神殿导入脚本: {module_path}")
            return False
        module = _load_module_from_path("import_data_config", module_path)
        if module is None:
            print(f"[错误] 无法加载神殿导入脚本: {module_path}")
            return False
        importer = getattr(module, "import_campuses_from_json", None)
        if not importer:
            print("[错误] import_data.py 缺少 import_campuses_from_json() 函数")
            return False
        return bool(importer())
    except Exception as e:
        print(f"[错误] 调用 import_data_config 失败: {safe_error_str(e)}")
        return False


def import_teachers_from_json() -> bool:
    """
    调用 teachers.json 教员数据导入脚本
    """
    from pathlib import Path

    try:
        module_path = (
            Path(__file__).resolve().parents[2]
            / "sql"
            / "init"
            / "import_data_config"
            / "import_data.py"
        )
        if not module_path.exists():
            print(f"[错误] 找不到教员导入脚本: {module_path}")
            return False
        module = _load_module_from_path("import_data_config", module_path)
        if module is None:
            print(f"[错误] 无法加载教员导入脚本: {module_path}")
            return False
        importer = getattr(module, "import_teachers_from_json", None)
        if not importer:
            print("[错误] import_data.py 缺少 import_teachers_from_json() 函数")
            return False
        return bool(importer())
    except Exception as e:
        print(f"[错误] 调用 import_data_config 导入教员失败: {safe_error_str(e)}")
        return False


def import_all_config_data() -> bool:
    """
    调用旧版 import_data.py 的 import_all_config_data 函数，批量导入配置中心数据。

    说明：
    - 这是兼容旧初始化包的可选步骤
    - 新环境如果未携带该旧脚本，不应阻断 `python main.py` 启动链路
    """
    from pathlib import Path

    try:
        module_path = (
            Path(__file__).resolve().parents[2]
            / "sql"
            / "init"
            / "import_data_config"
            / "import_data.py"
        )
        if not module_path.exists():
            print(f"[提示] 未发现可选配置导入脚本，跳过自动导入: {module_path}")
            return True
        module = _load_module_from_path("import_data_config", module_path)
        if module is None:
            print(f"[错误] 无法加载配置导入脚本: {module_path}")
            return False
        importer = getattr(module, "import_all_config_data", None)
        if not importer:
            print("[错误] import_data.py 缺少 import_all_config_data() 函数")
            return False
        return bool(importer())
    except Exception as e:
        print(f"[错误] 调用 import_data_config 导入全量配置失败: {safe_error_str(e)}")
        return False


def import_all_campus_employees():
    """
    导入所有神殿员工数据到Account数据库 - 优化版本
    使用批量导入提升性能
    """
    import subprocess
    import sys
    from pathlib import Path
    
    print("开始批量导入所有神殿员工数据...")
    
    project_root = Path(__file__).resolve().parents[2]
    module_name = "backend.tools.import_employees_account_data.batch_import_all_employees"
    try:
        print("[开始] 执行批量导入脚本 (模块调用)...")
        start_time = datetime.now()
        result = subprocess.run(
            [sys.executable, "-m", module_name],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            cwd=str(project_root),
        )
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        if result.returncode == 0:
            print(f"[成功] 批量导入完成，耗时: {duration:.2f} 秒")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"[失败] 批量导入失败 (错误代码: {result.returncode})")
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(result.stderr)
            return False
    except Exception as e:
        print(f"[错误] 执行批量导入时发生错误: {safe_error_str(e)}")
        return False

def insert_partner_data():
    """
    插入合作方联系方式表数据（市场模块未启用，跳过）
    """
    print("[步骤X] 合作方联系方式表插入已跳过（市场模块未启用）")
    return True

def drop_db():
    """
    删除所有表（谨慎使用）
    """
    AccountBase.metadata.drop_all(bind=engine)
    print("数据库表已删除")
