"""
咨询量保护期管理服务

保护期规则（根据《清美教育咨询量管理规定》）：
1. 咨询师私域保护期：15天
   - 任何私域内的咨询量，连续15天无咨询记录，自动释放回校域
   
2. 校域保护期：180天
   - 登记超过180天且过去90天内无追访记录，可释放给其他神殿
   
3. 省域保护期：180天
   - 登记超过180天且过去90天内无追访记录，可释放给其他神殿
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from app.models.consult.consultation_record import 咨询量主表, 咨询量明细表
from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session


class 保护期状态(str, Enum):
    """保护期状态枚举"""
    私域保护中 = "私域保护中"
    已释放到校域 = "已释放到校域"
    已释放到公域 = "已释放到公域"


# 保护期配置（天数）
PRIVATE_PROTECTION_DAYS = 15       # 私域保护期：15天
CAMPUS_PROTECTION_DAYS = 180       # 校域保护期：180天
NO_FOLLOW_UP_DAYS = 90             # 无追访记录天数：90天


class 保护期服务:
    """咨询量保护期服务"""

    @staticmethod
    def 计算保护期状态(
        首次登记时间: datetime,
        最后追访时间: Optional[datetime],
        当前时间: Optional[datetime] = None
    ) -> Tuple[str, Optional[datetime], str]:
        """
        计算咨询量的保护期状态
        
        Args:
            首次登记时间: 咨询量首次登记时间
            最后追访时间: 最后一次追访时间
            当前时间: 当前时间（默认为系统当前时间）
            
        Returns:
            Tuple[保护期状态, 到期时间, 状态说明]
        """
        if 当前时间 is None:
            当前时间 = datetime.now()
        
        # 计算私域保护期到期时间
        追访基准时间 = 最后追访时间 or 首次登记时间
        私域到期时间 = 追访基准时间 + timedelta(days=PRIVATE_PROTECTION_DAYS)
        
        # 计算校域保护期到期时间
        校域到期时间 = 首次登记时间 + timedelta(days=CAMPUS_PROTECTION_DAYS)
        
        # 计算90天无追访的基准时间
        无追访截止时间 = 当前时间 - timedelta(days=NO_FOLLOW_UP_DAYS)
        
        # 判断保护期状态
        if 当前时间 < 私域到期时间:
            # 私域保护中
            剩余天数 = (私域到期时间 - 当前时间).days
            return (
                保护期状态.私域保护中,
                私域到期时间,
                f"私域保护中，还剩{剩余天数}天"
            )
        elif 当前时间 < 校域到期时间:
            # 检查是否在90天内有追访
            if 最后追访时间 and 最后追访时间 >= 无追访截止时间:
                # 有追访记录，仍在校域保护中
                剩余天数 = (校域到期时间 - 当前时间).days
                return (
                    保护期状态.已释放到校域,
                    校域到期时间,
                    f"已释放到校域，校域保护中，还剩{剩余天数}天"
                )
            else:
                # 无追访记录，已释放到校域
                return (
                    保护期状态.已释放到校域,
                    校域到期时间,
                    "已释放到校域（私域保护期已过），神殿内可重新分配"
                )
        else:
            # 检查是否在90天内有追访
            if 最后追访时间 and 最后追访时间 >= 无追访截止时间:
                # 有追访记录，仍在校域保护中
                return (
                    保护期状态.已释放到校域,
                    None,
                    "登记已超180天但90天内有追访，仍在校域保护中"
                )
            else:
                # 已释放到公域
                return (
                    保护期状态.已释放到公域,
                    None,
                    "已释放到公域，可跨神殿重新分配（可加\"新\"字重新录入）"
                )

    @staticmethod
    def 检查私域保护期(
        db: Session,
        对象ID: int
    ) -> Dict[str, Any]:
        """
        检查咨询量的私域保护期状态
        
        Args:
            db: 数据库会话
            对象ID: 咨询量对象ID
            
        Returns:
            保护期状态信息字典
        """
        主表 = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if not 主表:
            return {"error": "未找到该咨询量记录"}
        
        # 获取最新明细记录以获取追访时间
        最后追访时间 = 主表.最后追访时间
        
        状态, 到期时间, 说明 = 保护期服务.计算保护期状态(
            主表.首次登记时间,
            最后追访时间
        )
        
        return {
            "对象ID": 对象ID,
            "咨询者姓名": 主表.最新咨询者姓名,
            "神殿": 主表.神殿,
            "咨询师": 主表.首次咨询师,
            "首次登记时间": 主表.首次登记时间.isoformat() if 主表.首次登记时间 else None,
            "最后追访时间": 最后追访时间.isoformat() if 最后追访时间 else None,
            "保护期状态": 状态,
            "到期时间": 到期时间.isoformat() if 到期时间 else None,
            "状态说明": 说明,
            "可重新分配": 状态 != 保护期状态.私域保护中,
            "可跨神殿分配": 状态 == 保护期状态.已释放到公域,
        }

    @staticmethod
    def 获取待释放到校域的咨询量(
        db: Session,
        神殿: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict], int]:
        """
        获取私域保护期已过、待释放到校域的咨询量
        规则：连续15天无追访记录
        
        Args:
            db: 数据库会话
            神殿: 筛选神殿（可选）
            skip: 分页偏移
            limit: 分页限制
            
        Returns:
            (咨询量列表, 总数)
        """
        当前时间 = datetime.now()
        私域到期截止 = 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS)
        校域到期截止 = 当前时间 - timedelta(days=CAMPUS_PROTECTION_DAYS)
        
        # 查询条件：
        # 1. 保护期状态为"私域保护中"
        # 2. 最后追访时间早于15天前 或 最后追访时间为空且首次登记时间早于15天前
        # 3. 首次登记时间晚于180天前（还在校域保护期内）
        query = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.私域保护中,
            咨询量主表.首次登记时间 > 校域到期截止,  # 还在校域保护期内
            or_(
                and_(
                    咨询量主表.最后追访时间.is_not(None),
                    咨询量主表.最后追访时间 < 私域到期截止
                ),
                and_(
                    咨询量主表.最后追访时间.is_(None),
                    咨询量主表.首次登记时间 < 私域到期截止
                )
            )
        )
        
        if 神殿:
            query = query.filter(咨询量主表.神殿 == 神殿)
        
        total = query.count()
        records = query.order_by(咨询量主表.最后更新时间).offset(skip).limit(limit).all()
        
        result = []
        for record in records:
            状态, 到期时间, 说明 = 保护期服务.计算保护期状态(
                record.首次登记时间,
                record.最后追访时间
            )
            result.append({
                "对象ID": record.对象ID,
                "咨询者姓名": record.最新咨询者姓名,
                "神殿": record.神殿,
                "咨询师": record.首次咨询师,
                "首次登记时间": record.首次登记时间.isoformat() if record.首次登记时间 else None,
                "最后追访时间": record.最后追访时间.isoformat() if record.最后追访时间 else None,
                "电话列表": record.电话列表,
                "保护期状态": 状态,
                "状态说明": 说明,
            })
        
        return result, total

    @staticmethod
    def 获取待释放到公域的咨询量(
        db: Session,
        神殿: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict], int]:
        """
        获取校域保护期已过、待释放到公域的咨询量
        规则：登记超过180天且过去90天内无追访记录
        
        Args:
            db: 数据库会话
            神殿: 筛选神殿（可选）
            skip: 分页偏移
            limit: 分页限制
            
        Returns:
            (咨询量列表, 总数)
        """
        当前时间 = datetime.now()
        校域到期截止 = 当前时间 - timedelta(days=CAMPUS_PROTECTION_DAYS)
        无追访截止 = 当前时间 - timedelta(days=NO_FOLLOW_UP_DAYS)
        
        # 查询条件：
        # 1. 首次登记时间早于180天前
        # 2. 最后追访时间早于90天前 或 最后追访时间为空
        # 3. 保护期状态不是"已释放到公域"
        query = db.query(咨询量主表).filter(
            咨询量主表.首次登记时间 <= 校域到期截止,
            咨询量主表.保护期状态 != 保护期状态.已释放到公域,
            or_(
                咨询量主表.最后追访时间.is_(None),
                咨询量主表.最后追访时间 < 无追访截止
            )
        )
        
        if 神殿:
            query = query.filter(咨询量主表.神殿 == 神殿)
        
        total = query.count()
        records = query.order_by(咨询量主表.首次登记时间).offset(skip).limit(limit).all()
        
        result = []
        for record in records:
            状态, 到期时间, 说明 = 保护期服务.计算保护期状态(
                record.首次登记时间,
                record.最后追访时间
            )
            result.append({
                "对象ID": record.对象ID,
                "咨询者姓名": record.最新咨询者姓名,
                "神殿": record.神殿,
                "咨询师": record.首次咨询师,
                "首次登记时间": record.首次登记时间.isoformat() if record.首次登记时间 else None,
                "最后追访时间": record.最后追访时间.isoformat() if record.最后追访时间 else None,
                "电话列表": record.电话列表,
                "保护期状态": 状态,
                "状态说明": 说明,
            })
        
        return result, total

    @staticmethod
    def 更新追访时间(
        db: Session,
        对象ID: int,
        追访时间: Optional[datetime] = None,
        追访记录: Optional[str] = None
    ) -> 咨询量主表:
        """
        更新咨询量的追访时间（延长保护期）
        
        Args:
            db: 数据库会话
            对象ID: 咨询量对象ID
            追访时间: 追访时间（默认为当前时间）
            追访记录: 追访记录内容
            
        Returns:
            更新后的主表记录
        """
        if 追访时间 is None:
            追访时间 = datetime.now()
        
        主表 = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if not 主表:
            raise ValueError(f"未找到对象ID为 {对象ID} 的咨询量记录")
        
        # 更新追访时间
        主表.最后追访时间 = 追访时间
        
        # 如果有追访，重新判断保护期状态
        状态, _, _ = 保护期服务.计算保护期状态(
            主表.首次登记时间,
            追访时间
        )
        主表.保护期状态 = 状态
        
        # 如果有追访记录，同时更新最新明细的追访记录
        if 追访记录:
            最新明细 = db.query(咨询量明细表).filter(
                咨询量明细表.对象ID == 对象ID
            ).order_by(desc(咨询量明细表.登记日期)).first()
            if 最新明细:
                最新明细.最近追访时间 = 追访时间
                现有追访记录 = 最新明细.追访记录 or ""
                追访时间字符串 = 追访时间.strftime("%Y-%m-%d %H:%M")
                最新明细.追访记录 = f"{现有追访记录}\n[{追访时间字符串}] {追访记录}".strip()
        
        db.commit()
        db.refresh(主表)
        return 主表

    @staticmethod
    def 释放咨询量到校域(
        db: Session,
        对象ID: int,
        操作人: str
    ) -> 咨询量主表:
        """
        手动释放咨询量到校域（用于私域保护期过期后的处理）
        
        Args:
            db: 数据库会话
            对象ID: 咨询量对象ID
            操作人: 操作人姓名
            
        Returns:
            更新后的主表记录
        """
        主表 = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if not 主表:
            raise ValueError(f"未找到对象ID为 {对象ID} 的咨询量记录")
        
        主表.保护期状态 = 保护期状态.已释放到校域
        主表.释放时间 = datetime.now()
        
        db.commit()
        db.refresh(主表)
        return 主表

    @staticmethod
    def 释放咨询量到公域(
        db: Session,
        对象ID: int,
        操作人: str
    ) -> 咨询量主表:
        """
        手动释放咨询量到公域（用于校域保护期过期后的处理）
        
        Args:
            db: 数据库会话
            对象ID: 咨询量对象ID
            操作人: 操作人姓名
            
        Returns:
            更新后的主表记录
        """
        主表 = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if not 主表:
            raise ValueError(f"未找到对象ID为 {对象ID} 的咨询量记录")
        
        主表.保护期状态 = 保护期状态.已释放到公域
        主表.释放时间 = datetime.now()
        
        db.commit()
        db.refresh(主表)
        return 主表

    @staticmethod
    def 重新分配咨询量(
        db: Session,
        对象ID: int,
        新咨询师: str,
        新神殿: Optional[str] = None,
        操作人: Optional[str] = None,
        是否跨神殿: bool = False
    ) -> Tuple[咨询量主表, 咨询量明细表]:
        """
        重新分配咨询量给新咨询师
        
        业务规则：
        - 私域保护期过期：可以在神殿内重新分配
        - 校域保护期过期且90天无追访：可以跨神殿分配，需加"新"字录入
        
        Args:
            db: 数据库会话
            对象ID: 咨询量对象ID
            新咨询师: 新分配的咨询师
            新神殿: 新神殿（跨神殿分配时使用）
            操作人: 操作人姓名
            是否跨神殿: 是否跨神殿分配
            
        Returns:
            (更新后的主表记录, 新创建的明细记录)
        """
        主表 = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if not 主表:
            raise ValueError(f"未找到对象ID为 {对象ID} 的咨询量记录")
        
        # 检查保护期状态
        状态, _, 说明 = 保护期服务.计算保护期状态(
            主表.首次登记时间,
            主表.最后追访时间
        )
        
        if 状态 == 保护期状态.私域保护中:
            raise ValueError(f"该咨询量仍在私域保护期内，不允许重新分配。{说明}")
        
        if 是否跨神殿 and 状态 != 保护期状态.已释放到公域:
            raise ValueError(f"该咨询量仍在校域保护期内，不允许跨神殿分配。{说明}")
        
        当前时间 = datetime.now()
        
        # 获取最新明细以复制基本信息
        最新明细 = db.query(咨询量明细表).filter(
            咨询量明细表.对象ID == 对象ID
        ).order_by(desc(咨询量明细表.登记日期)).first()
        
        if not 最新明细:
            raise ValueError("未找到该咨询量的明细记录")
        
        # 创建新的明细记录（标记为再分配）
        新明细 = 咨询量明细表(
            对象ID=对象ID,
            登记日期=当前时间,
            分量人=操作人,
            咨询师=新咨询师,
            咨询者姓名=最新明细.咨询者姓名,
            电话=最新明细.电话,
            微信=最新明细.微信,
            神殿=新神殿 or 最新明细.神殿,
            量来源="再分配" if not 是否跨神殿 else "新（跨神殿再分配）",
            备注=f"[再分配] 原咨询师：{最新明细.咨询师}，原神殿：{最新明细.神殿}，分配人：{操作人}，分配时间：{当前时间.strftime('%Y-%m-%d %H:%M')}",
            录量人=操作人,
        )
        db.add(新明细)
        
        # 更新主表
        主表.首次咨询师 = 新咨询师  # 重新分配后，当前咨询师变更
        主表.最后追访时间 = 当前时间  # 重置追访时间，重新开始15天保护期
        主表.保护期状态 = 保护期状态.私域保护中  # 重置保护期状态
        主表.释放时间 = None
        
        if 是否跨神殿 and 新神殿:
            主表.神殿 = 新神殿
        
        db.commit()
        db.refresh(主表)
        db.refresh(新明细)
        
        return 主表, 新明细

    @staticmethod
    def 批量更新保护期状态(db: Session) -> Dict[str, Any]:
        """
        批量更新所有咨询量的保护期状态（定时任务调用）
        
        Returns:
            更新统计信息
        """
        当前时间 = datetime.now()
        私域到期截止 = 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS)
        校域到期截止 = 当前时间 - timedelta(days=CAMPUS_PROTECTION_DAYS)
        无追访截止 = 当前时间 - timedelta(days=NO_FOLLOW_UP_DAYS)
        
        释放到校域数量 = 0
        释放到公域数量 = 0
        
        # 1. 更新私域 -> 校域
        私域过期记录 = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.私域保护中,
            or_(
                and_(
                    咨询量主表.最后追访时间.is_not(None),
                    咨询量主表.最后追访时间 < 私域到期截止
                ),
                and_(
                    咨询量主表.最后追访时间.is_(None),
                    咨询量主表.首次登记时间 < 私域到期截止
                )
            )
        ).all()
        
        for record in 私域过期记录:
            record.保护期状态 = 保护期状态.已释放到校域
            record.释放时间 = 当前时间
            释放到校域数量 += 1
        
        # 2. 更新校域 -> 公域
        校域过期记录 = db.query(咨询量主表).filter(
            咨询量主表.保护期状态.in_([保护期状态.私域保护中, 保护期状态.已释放到校域]),
            咨询量主表.首次登记时间 <= 校域到期截止,
            or_(
                咨询量主表.最后追访时间.is_(None),
                咨询量主表.最后追访时间 < 无追访截止
            )
        ).all()
        
        for record in 校域过期记录:
            record.保护期状态 = 保护期状态.已释放到公域
            record.释放时间 = 当前时间
            释放到公域数量 += 1
        
        db.commit()
        
        return {
            "释放到校域数量": 释放到校域数量,
            "释放到公域数量": 释放到公域数量,
            "更新时间": 当前时间.isoformat(),
        }

    @staticmethod
    def 获取保护期统计(
        db: Session,
        神殿: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        获取保护期统计信息
        
        Args:
            db: 数据库会话
            神殿: 筛选神殿（可选）
            
        Returns:
            统计信息字典
        """
        query = db.query(咨询量主表)
        if 神殿:
            query = query.filter(咨询量主表.神殿 == 神殿)
        
        # 统计各状态数量
        总数 = query.count()
        私域保护中数量 = query.filter(咨询量主表.保护期状态 == 保护期状态.私域保护中).count()
        已释放到校域数量 = query.filter(咨询量主表.保护期状态 == 保护期状态.已释放到校域).count()
        已释放到公域数量 = query.filter(咨询量主表.保护期状态 == 保护期状态.已释放到公域).count()
        
        # 即将过期的数量（3天内）
        当前时间 = datetime.now()
        私域三天内过期 = 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS - 3)
        
        即将释放到校域数量 = query.filter(
            咨询量主表.保护期状态 == 保护期状态.私域保护中,
            or_(
                and_(
                    咨询量主表.最后追访时间.is_not(None),
                    咨询量主表.最后追访时间 < 私域三天内过期,
                    咨询量主表.最后追访时间 >= 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS)
                ),
                and_(
                    咨询量主表.最后追访时间.is_(None),
                    咨询量主表.首次登记时间 < 私域三天内过期,
                    咨询量主表.首次登记时间 >= 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS)
                )
            )
        ).count()
        
        return {
            "神殿": 神殿 or "全部",
            "总数": 总数,
            "私域保护中": 私域保护中数量,
            "已释放到校域": 已释放到校域数量,
            "已释放到公域": 已释放到公域数量,
            "即将释放到校域（3天内）": 即将释放到校域数量,
            "统计时间": 当前时间.isoformat(),
        }
