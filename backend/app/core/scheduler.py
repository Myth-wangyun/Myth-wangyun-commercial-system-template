"""
定时任务调度器

使用 APScheduler 管理所有后台定时任务：
1. 保护期状态自动更新 - 每天凌晨 2:00 执行
2. 其他定时任务可在此添加

该调度器会随应用启动自动运行，无需手动配置 cron 或 Windows 任务计划。
"""

import logging
from datetime import datetime

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import SessionLocal
from app.services.consult.protection_period import 保护期服务

# 配置日志
logger = logging.getLogger("scheduler")
logger.setLevel(logging.INFO)

# 全局调度器实例
scheduler: BackgroundScheduler | None = None


def _run_protection_period_update():
    """执行保护期状态更新（内部函数）"""
    logger.info(f"[定时任务] 开始执行保护期状态更新 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    db = SessionLocal()
    try:
        result = 保护期服务.批量更新保护期状态(db)
        
        logger.info("[定时任务] 保护期状态更新完成:")
        logger.info(f"  - 释放到校域: {result['释放到校域数量']} 条")
        logger.info(f"  - 释放到公域: {result['释放到公域数量']} 条")
        
        # 获取统计信息
        stats = 保护期服务.获取保护期统计(db)
        logger.info("[定时任务] 当前状态统计:")
        logger.info(f"  - 总数: {stats['总数']}")
        logger.info(f"  - 私域保护中: {stats['私域保护中']}")
        logger.info(f"  - 已释放到校域: {stats['已释放到校域']}")
        logger.info(f"  - 已释放到公域: {stats['已释放到公域']}")
        
        return result
    except Exception as e:
        logger.error(f"[定时任务] 保护期状态更新失败: {str(e)}")
        raise
    finally:
        db.close()


def _job_listener(event):
    """任务执行监听器"""
    if event.exception:
        logger.error(f"[定时任务] 任务执行失败: {event.job_id}, 错误: {event.exception}")
    else:
        logger.info(f"[定时任务] 任务执行成功: {event.job_id}")


def _run_dashboard_refresh_recovery():
    from app.crud.human_resources.dashboard import run_pending_dashboard_refreshes

    logger.info("[定时任务] 开始扫描待处理 dashboard 刷新")
    result = run_pending_dashboard_refreshes(limit=20)
    logger.info(
        "[定时任务] dashboard 刷新扫描完成 processed=%s timed_out=%s",
        len(result.get("processed", [])),
        result.get("timed_out_count", 0),
    )


def init_scheduler():
    """
    初始化并启动定时任务调度器
    
    在应用启动时调用此函数，会自动配置并启动所有定时任务。
    """
    global scheduler
    
    if scheduler is not None and scheduler.running:
        logger.warning("[定时任务] 调度器已在运行中，跳过初始化")
        return scheduler
    
    logger.info("[定时任务] 初始化定时任务调度器...")
    
    # 创建后台调度器
    scheduler = BackgroundScheduler(
        timezone="Asia/Shanghai",
        job_defaults={
            'coalesce': True,  # 错过的任务合并执行
            'max_instances': 1,  # 同一任务最多同时运行1个实例
            'misfire_grace_time': 3600,  # 错过执行时间后的宽限期（1小时）
        }
    )
    
    # 添加任务监听器
    scheduler.add_listener(_job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    
    # ==================== 添加定时任务 ====================
    
    # 1. 保护期状态更新 - 每天凌晨 2:00 执行
    scheduler.add_job(
        _run_protection_period_update,
        CronTrigger(hour=2, minute=0),
        id="protection_period_update",
        name="保护期状态自动更新",
        replace_existing=True
    )
    logger.info("[定时任务] 已添加: 保护期状态更新 (每天 02:00)")
    
    # 2. 可以在这里添加更多定时任务...
    # scheduler.add_job(
    #     some_function,
    #     CronTrigger(hour=3, minute=0),
    #     id="some_task",
    #     name="某个任务",
    #     replace_existing=True
    # )
    
    # 启动调度器
    scheduler.start()
    logger.info("[定时任务] 调度器已启动")
    
    # 打印所有已注册的任务
    jobs = scheduler.get_jobs()
    logger.info(f"[定时任务] 已注册 {len(jobs)} 个定时任务:")
    for job in jobs:
        logger.info(f"  - {job.id}: {job.name}, 下次执行: {job.next_run_time}")
    
    return scheduler


def shutdown_scheduler():
    """
    关闭定时任务调度器
    
    在应用关闭时调用此函数。
    """
    global scheduler
    
    if scheduler is not None and scheduler.running:
        logger.info("[定时任务] 正在关闭调度器...")
        scheduler.shutdown(wait=False)
        logger.info("[定时任务] 调度器已关闭")
    
    scheduler = None


def get_scheduler_status():
    """
    获取调度器状态信息
    
    Returns:
        调度器状态字典
    """
    global scheduler
    
    if scheduler is None:
        return {
            "running": False,
            "message": "调度器未初始化"
        }
    
    jobs = scheduler.get_jobs()
    job_list = []
    for job in jobs:
        job_list.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger)
        })
    
    return {
        "running": scheduler.running,
        "job_count": len(jobs),
        "jobs": job_list,
        "timezone": str(scheduler.timezone)
    }


def run_job_now(job_id: str):
    """
    立即执行指定的定时任务
    
    Args:
        job_id: 任务ID
        
    Returns:
        执行结果
    """
    global scheduler
    
    if scheduler is None or not scheduler.running:
        return {"success": False, "message": "调度器未运行"}
    
    job = scheduler.get_job(job_id)
    if job is None:
        return {"success": False, "message": f"任务 {job_id} 不存在"}
    
    # 触发立即执行
    scheduler.modify_job(job_id, next_run_time=datetime.now())
    
    return {
        "success": True,
        "message": f"任务 {job_id} 已触发执行",
        "job_name": job.name
    }
