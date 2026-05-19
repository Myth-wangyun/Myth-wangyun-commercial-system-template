"""
自动迁移运行器
在应用启动时自动执行未运行的迁移脚本。
使用 config.migration_history 表跟踪已执行的迁移。
"""

import os
import sys
import importlib.util
import inspect

# 确保项目根目录在路径中
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from app.core.database import engine


def _call_if_no_required_args(func) -> bool:
    signature = inspect.signature(func)
    for parameter in signature.parameters.values():
        if parameter.kind in {
            inspect.Parameter.POSITIONAL_ONLY,
            inspect.Parameter.POSITIONAL_OR_KEYWORD,
            inspect.Parameter.KEYWORD_ONLY,
        } and parameter.default is inspect.Parameter.empty:
            return False

    func()
    return True


def ensure_migration_table():
    """确保迁移记录表存在"""
    sql = """
    CREATE SCHEMA IF NOT EXISTS config;
    CREATE TABLE IF NOT EXISTS config.migration_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()


def get_executed_migrations():
    """获取已执行的迁移列表"""
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT migration_name FROM config.migration_history ORDER BY id"
        ))
        return {row[0] for row in result.fetchall()}


def record_migration(name: str):
    """记录已执行的迁移"""
    with engine.connect() as conn:
        conn.execute(text(
            "INSERT INTO config.migration_history (migration_name) VALUES (:name)"
        ), {"name": name})
        conn.commit()


def get_migration_scripts():
    """获取所有迁移脚本，按文件名排序"""
    migrations_dir = os.path.dirname(__file__)
    scripts = []

    for filename in sorted(os.listdir(migrations_dir)):
        # 跳过非迁移文件
        if filename in ('__init__.py', 'auto_migrate.py', 'README.md'):
            continue
        if filename.startswith('__'):
            continue
        if not (filename.endswith('.py') or filename.endswith('.sql')):
            continue

        filepath = os.path.join(migrations_dir, filename)
        if os.path.isfile(filepath):
            scripts.append((filename, filepath))

    return scripts


def run_sql_migration(filepath: str) -> bool:
    """执行 SQL 迁移脚本"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()
        with engine.connect() as conn:
            for statement in split_sql_statements(sql):
                statement = statement.strip()
                if statement:
                    conn.execute(text(statement))
            conn.commit()
        return True
    except Exception as e:
        print(f"  [错误] SQL 迁移执行失败: {e}")
        return False


def run_migration_script(name: str, filepath: str) -> bool:
    """执行单个迁移脚本"""
    if name.endswith('.sql'):
        return run_sql_migration(filepath)

    try:
        spec = importlib.util.spec_from_file_location(name.replace('.py', ''), filepath)
        if not spec or not spec.loader:
            print(f"  [跳过] 无法加载 {name}")
            return False

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # 优先执行显式入口
        run_migration = getattr(module, 'run_migration', None)
        if callable(run_migration):
            if not _call_if_no_required_args(run_migration):
                print(f"  [跳过] run_migration 需要参数: {name}")
                return False
            return True
        main = getattr(module, 'main', None)
        if callable(main):
            if not _call_if_no_required_args(main):
                print(f"  [跳过] main 需要参数: {name}")
                return False
            return True
        migrate = getattr(module, 'migrate', None)
        if callable(migrate):
            if not _call_if_no_required_args(migrate):
                print(f"  [跳过] migrate 需要参数: {name}")
                return None  # 需要参数不算失败
            return True

        # 执行所有符合命名规范且定义在当前模块中的公开函数（稳定顺序）
        callable_funcs = []
        for attr_name in dir(module):
            if attr_name.startswith('_'):
                continue
            attr = getattr(module, attr_name)
            if callable(attr) and not isinstance(attr, type):
                # 跳过导入的函数/可调用对象，避免误执行如 sqlalchemy.create_engine
                if getattr(attr, '__module__', None) != module.__name__:
                    continue
                callable_funcs.append(attr_name)

        prefixes = ['create_', 'add_', 'insert_', 'migrate_', 'update_', 'fix_', 'move_', 'ensure_']
        pref_index = {p: i for i, p in enumerate(prefixes)}

        matched = []
        for func_name in callable_funcs:
            for prefix in prefixes:
                if func_name.startswith(prefix):
                    matched.append((pref_index[prefix], func_name))
                    break

        if not matched:
            print(f"  [跳过] 未找到可执行函数 {name}")
            return True

        for _, func_name in sorted(matched, key=lambda x: (x[0], x[1])):
            try:
                getattr(module, func_name)()
            except TypeError as e:
                # 函数需要参数，跳过
                print(f"  [跳过] {name} 需要参数: {e}")
                return None

        return True
    except Exception as e:
        print(f"  [错误] {name}: {e}")
        return False


def split_sql_statements(sql: str) -> list[str]:
    """拆分 SQL 语句，支持引号和 $$ / $tag$ 块，避免错误分割。"""
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    length = len(sql)
    in_single = False
    in_double = False
    dollar_tag: str | None = None

    while i < length:
        ch = sql[i]

        # 处理单引号字符串
        if not in_double and dollar_tag is None and ch == "'":
            buf.append(ch)
            if in_single and i + 1 < length and sql[i + 1] == "'":
                # 转义单引号
                buf.append(sql[i + 1])
                i += 2
                continue
            in_single = not in_single
            i += 1
            continue

        # 处理双引号标识符
        if not in_single and dollar_tag is None and ch == '"':
            buf.append(ch)
            if in_double and i + 1 < length and sql[i + 1] == '"':
                buf.append(sql[i + 1])
                i += 2
                continue
            in_double = not in_double
            i += 1
            continue

        # 处理美元引用块 $tag$ ... $tag$
        if not in_single and not in_double and ch == '$':
            # 尝试匹配起始/结束 tag
            j = i + 1
            while j < length and sql[j] != '$' and (sql[j].isalnum() or sql[j] == '_'):
                j += 1
            if j < length and sql[j] == '$':
                tag = sql[i:j + 1]  # 包含两侧 $
                buf.append(tag)
                i = j + 1
                if dollar_tag is None:
                    dollar_tag = tag
                elif dollar_tag == tag:
                    dollar_tag = None
                continue

        # 分号分割（仅在非字符串/非美元块内）
        if ch == ';' and not in_single and not in_double and dollar_tag is None:
            statement = ''.join(buf).strip()
            if statement:
                statements.append(statement)
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    tail = ''.join(buf).strip()
    if tail:
        statements.append(tail)

    return statements


def run_pending_migrations():
    """执行所有未运行的迁移"""
    print("[Migration] 检查待执行的数据库迁移...")
    
    ensure_migration_table()
    executed = get_executed_migrations()
    scripts = get_migration_scripts()
    
    pending = [(name, path) for name, path in scripts if name not in executed]
    
    if not pending:
        print("[Migration] 没有待执行的迁移")
        return True
    
    print(f"[Migration] 发现 {len(pending)} 个待执行迁移")
    
    success_count = 0
    fail_count = 0
    
    for name, filepath in pending:
        print(f"  [执行] {name} ...")
        result = run_migration_script(name, filepath)
        if result is True:
            record_migration(name)
            success_count += 1
            print(f"  [完成] {name}")
        elif result is None:
            # 被跳过（需要参数），不计入失败
            print(f"  [跳过] {name}")
        else:
            fail_count += 1
            print(f"  [失败] {name}")
    
    print(f"[Migration] 迁移完成: {success_count} 成功, {fail_count} 失败")
    return fail_count == 0


def mark_all_as_executed():
    """将所有现有迁移标记为已执行（首次初始化用）"""
    ensure_migration_table()
    executed = get_executed_migrations()
    scripts = get_migration_scripts()
    
    for name, _ in scripts:
        if name not in executed:
            record_migration(name)
            print(f"  [标记] {name}")
    
    print("[Migration] 所有现有迁移已标记为已执行")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='数据库迁移工具')
    parser.add_argument('--mark-all', action='store_true',
                        help='将所有迁移标记为已执行（不实际运行）')
    parser.add_argument('--run', action='store_true', 
                        help='执行所有待运行的迁移')
    parser.add_argument('--status', action='store_true',
                        help='查看迁移状态')
    args = parser.parse_args()
    
    if args.mark_all:
        mark_all_as_executed()
    elif args.status:
        ensure_migration_table()
        executed = get_executed_migrations()
        scripts = get_migration_scripts()
        print(f"\n{'迁移脚本':<50} {'状态'}")
        print("-" * 60)
        for name, _ in scripts:
            status = "✅ 已执行" if name in executed else "⏳ 待执行"
            print(f"{name:<50} {status}")
    else:
        # 默认执行待运行的迁移
        run_pending_migrations()
