"""
数据迁移脚本：将旧表（经理功能分析月表）的数据迁移到新表（教质经理功能分析月表和教质副经理功能分析月表）

使用方法（在项目根目录下运行）：
    python -m backend.app.teaching-quality.migrate_manager_analysis_tables
    或者（在 backend 目录下）：
    python -m app.teaching-quality.migrate_manager_analysis_tables
"""
import importlib.util
import sys
from pathlib import Path

# 获取项目根目录和 backend 目录
_script_file = Path(__file__).resolve()
_backend_root = _script_file.parent.parent  # backend/app/teaching-quality -> backend
_project_root = _backend_root.parent  # backend -> project root

# 添加 backend 目录到路径（因为目录名包含连字符，不能直接用 import）
sys.path.insert(0, str(_backend_root))
sys.path.insert(0, str(_project_root))

# 导入数据库相关模块
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db

# 动态导入 TQcampus_manager_analysis_db（处理目录名包含连字符的情况）
_tq_dir = _script_file.parent
_db_file = _tq_dir / "TQcampus_manager_analysis_db.py"
_spec = importlib.util.spec_from_file_location("TQcampus_manager_analysis_db", _db_file)
assert _spec is not None and _spec.loader is not None
_db_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_db_module)
migrate_old_data = _db_module.migrate_old_data


def main():
    """执行数据迁移"""
    print("=" * 60)
    print("开始数据迁移：经理功能分析月表 -> 教质经理/副经理功能分析月表")
    print("=" * 60)
    
    db: Session = next(get_teaching_quality_db())
    try:
        migrate_old_data(db)
        print("\n数据迁移完成！")
    except Exception as e:
        print(f"\n数据迁移失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
