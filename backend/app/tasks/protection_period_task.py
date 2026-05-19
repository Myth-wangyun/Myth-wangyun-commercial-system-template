"""
保护期自动更新定时任务

此任务用于自动检查和更新咨询量的保护期状态：
1. 私域保护期超过15天无追访，自动释放到校域
2. 校域保护期超过180天且90天内无追访，可释放到公域

建议执行频率：每天凌晨执行一次

使用方法：
    python -m app.tasks.protection_period_task
"""
from datetime import datetime

from app.core.database import SessionLocal
from app.services.consult.protection_period import 保护期服务


def run_protection_period_update():
    """执行保护期状态批量更新"""
    print(f"\n{'='*60}")
    print(f"保护期状态自动更新任务开始 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    db = SessionLocal()
    try:
        # 1. 执行批量更新
        result = 保护期服务.批量更新保护期状态(db)
        
        print("\n📊 更新结果:")
        print(f"  释放到校域: {result['释放到校域数量']} 条")
        print(f"  释放到公域: {result['释放到公域数量']} 条")
        print(f"  处理时间: {result['更新时间']}")
        
        # 2. 获取更新后的统计信息
        stats = 保护期服务.获取保护期统计(db)
        
        print("\n📈 当前状态统计:")
        print(f"  总记录数: {stats['总数']}")
        print(f"  私域保护中: {stats['私域保护中']}")
        print(f"  已释放到校域: {stats['已释放到校域']}")
        print(f"  已释放到公域: {stats['已释放到公域']}")
        print(f"  即将到期（3天内）: {stats['即将释放到校域（3天内）']}")
        
        print(f"\n{'='*60}")
        print("保护期状态自动更新任务完成")
        print(f"{'='*60}\n")
        
        return result
    finally:
        db.close()


def main():
    """命令行入口"""
    run_protection_period_update()


if __name__ == "__main__":
    main()
