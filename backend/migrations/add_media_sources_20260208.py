"""
数据库迁移脚本：添加新的媒体来源配置
1. 网络 → 常规SEM平台 → 新增细分媒体 "直接上门"

运行方式: python backend/migrations/add_media_sources_20260208.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from app.models.media_source_config import MediaCategory, MediaSource, MediaDetail


def migrate():
    """添加新的细分媒体"""
    db = SessionLocal()
    try:
        # 查找 网络 → 常规SEM平台
        category = db.query(MediaCategory).filter(
            MediaCategory.name == "网络",
            MediaCategory.is_active == True
        ).first()
        
        if not category:
            print("⚠️  未找到量来源 '网络'")
            return
        
        sem_source = db.query(MediaSource).filter(
            MediaSource.media_category_id == category.id,
            MediaSource.name == "常规SEM平台",
            MediaSource.is_active == True
        ).first()
        
        if not sem_source:
            print("⚠️  未找到来源类别 '常规SEM平台'")
            return
        
        # 检查 "直接上门" 是否已存在
        existing = db.query(MediaDetail).filter(
            MediaDetail.media_source_id == sem_source.id,
            MediaDetail.name == "直接上门"
        ).first()
        
        if existing:
            print("✅ '常规SEM平台' → '直接上门' 已存在，跳过")
        else:
            # 获取当前最大排序号
            max_order = db.query(MediaDetail.sort_order).filter(
                MediaDetail.media_source_id == sem_source.id
            ).order_by(MediaDetail.sort_order.desc()).first()
            next_order = (max_order[0] + 1) if max_order else 0
            
            new_detail = MediaDetail(
                media_source_id=sem_source.id,
                name="直接上门",
                sort_order=next_order,
                is_active=True
            )
            db.add(new_detail)
            print(f"✅ 已添加细分媒体: '常规SEM平台' → '直接上门' (排序: {next_order})")
        
        db.commit()
        print("\n✅ 迁移完成！")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 迁移失败: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
