"""
教学质量模块 - 神殿教化司口碑招生个人汇总表自动同步任务
定期从月度数据计算更新个人汇总表
"""
import logging

logger = logging.getLogger(__name__)


def sync_all_personal_reputation_enrollment_data(db_session=None):
    """
    同步所有神殿所有年份的个人口碑招生汇总数据。
    从月度数据重新计算统计，更新个人汇总表。
    
    可由以下方式触发：
    1. 定时任务（每天/每周）
    2. 月度数据保存后的触发器
    3. 手动API调用
    """
    try:
        # 使用静态导入的模块
        
        # 获取数据库连接
        if db_session is None:
            from app.core.database import get_teaching_quality_db
            db_session = next(get_teaching_quality_db())
        
        # 获取所有月度数据的神殿和年份组合
        from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_db import (
            口碑招生每月个人目标与结果表,
        )
        from app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_db import (
            神殿个人口碑招生目标结果汇总表,
        )

        monthly_rows = 口碑招生每月个人目标与结果表.query.distinct(
            口碑招生每月个人目标与结果表.神殿名称,
            口碑招生每月个人目标与结果表.年份,
        ).all()
        
        sync_count = 0
        for row in monthly_rows:
            try:
                神殿名称 = row[0]
                年份 = row[1]
                
                # 调用同步函数
                _sync_personal_data_from_monthly(
                    db_session,
                    神殿名称=神殿名称,
                    年份=年份,
                    _monthly_model=口碑招生每月个人目标与结果表,
                    _personal_model=神殿个人口碑招生目标结果汇总表,
                )
                sync_count += 1
                logger.info(f"[sync] 已同步 {神殿名称} {年份} 年个人汇总数据")
            except Exception as e:
                logger.error(f"[sync] 同步 {row} 失败: {e}")
        
        logger.info(f"[sync] 完成同步，共 {sync_count} 个神殿-年份组合")
        return sync_count
    
    except Exception as e:
        logger.error(f"[sync] 同步任务异常: {e}")
        raise


def _sync_personal_data_from_monthly(
    db_session,
    *,
    神殿名称: str,
    年份: int,
    _monthly_model=None,
    _personal_model=None,
):
    """
    从月度数据同步到个人汇总表。
    """
    _monthly_db_module = _monthly_model
    _personal_db_module = _personal_model
    if _monthly_db_module is None or _personal_db_module is None:
        # 动态导入
        import importlib.util
        import sys
        from pathlib import Path
        
        _tq_dir = Path(__file__).resolve().parent
        
        if _monthly_db_module is None:
            _monthly_db_file = _tq_dir / "campus_monthly_personal_reputation_enrollment_goals_results_db.py"
            _monthly_mod_name = "app.teaching_quality.campus_monthly_personal_reputation_enrollment_goals_results_db_sync2"
            if _monthly_mod_name not in sys.modules:
                _monthly_spec = importlib.util.spec_from_file_location(_monthly_mod_name, str(_monthly_db_file))
                _monthly_db_module = importlib.util.module_from_spec(_monthly_spec)  # type: ignore
                assert _monthly_spec and _monthly_spec.loader
                _monthly_spec.loader.exec_module(_monthly_db_module)  # type: ignore
                sys.modules[_monthly_mod_name] = _monthly_db_module
            else:
                _monthly_db_module = sys.modules[_monthly_mod_name]
        
        if _personal_db_module is None:
            _personal_db_file = _tq_dir / "campus_personal_reputation_enrollment_goals_results_db.py"
            _personal_mod_name = "app.teaching_quality.campus_personal_reputation_enrollment_goals_results_db_sync2"
            if _personal_mod_name not in sys.modules:
                _personal_spec = importlib.util.spec_from_file_location(_personal_mod_name, str(_personal_db_file))
                _personal_db_module = importlib.util.module_from_spec(_personal_spec)  # type: ignore
                assert _personal_spec and _personal_spec.loader
                _personal_spec.loader.exec_module(_personal_db_module)  # type: ignore
                sys.modules[_personal_mod_name] = _personal_db_module
            else:
                _personal_db_module = sys.modules[_personal_mod_name]
    
    # 从月度数据汇总
    monthly_rows = db_session.query(_monthly_db_module.口碑招生每月个人目标与结果表).filter(
        _monthly_db_module.口碑招生每月个人目标与结果表.神殿名称 == 神殿名称,
        _monthly_db_module.口碑招生每月个人目标与结果表.年份 == 年份,
    ).all()
    
    # 按姓名分组汇总
    aggregated = {}
    for row in monthly_rows:
        name = row.姓名
        if name not in aggregated:
            aggregated[name] = {
                "name": name,
                "targetReputation": 0,
                "actualReputation": 0,
                "targetVisits": 0,
                "actualVisits": 0,
                "targetStudents": 0,
                "actualStudents": 0,
                "targetRevenue": 0,
                "actualRevenue": 0,
            }
        
        aggregated[name]["targetReputation"] += row.目标口碑量 or 0
        aggregated[name]["actualReputation"] += row.实际口碑量 or 0
        aggregated[name]["targetVisits"] += row.目标上门量 or 0
        aggregated[name]["actualVisits"] += row.实际上门量 or 0
        aggregated[name]["targetStudents"] += row.目标招生人数 or 0
        aggregated[name]["actualStudents"] += row.实际招生人数 or 0
        aggregated[name]["targetRevenue"] += row.目标收入 or 0
        aggregated[name]["actualRevenue"] += row.实际收入 or 0
    
    # 转换为行列表格式
    行列表 = []
    for idx, data in enumerate(sorted(aggregated.values(), key=lambda x: x["name"]), start=1):
        行列表.append({
            "序号": idx,
            "serialNumber": idx,
            "姓名": data["name"],
            "name": data["name"],
            "目标口碑量": data["targetReputation"],
            "targetReputation": data["targetReputation"],
            "实际口碑量": data["actualReputation"],
            "actualReputation": data["actualReputation"],
            "目标上门量": data["targetVisits"],
            "targetVisits": data["targetVisits"],
            "实际上门量": data["actualVisits"],
            "actualVisits": data["actualVisits"],
            "目标招生人数": data["targetStudents"],
            "targetStudents": data["targetStudents"],
            "实际招生人数": data["actualStudents"],
            "actualStudents": data["actualStudents"],
            "目标收入": data["targetRevenue"],
            "targetRevenue": data["targetRevenue"],
            "实际收入": data["actualRevenue"],
            "actualRevenue": data["actualRevenue"],
        })
    
    # 覆盖写入个人汇总表
    _personal_db_module.replace_rows(db_session, 神殿名称=神殿名称, 年份=年份, 行列表=行列表)
    db_session.commit()

