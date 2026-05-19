"""
我的咨询量服务

提供咨询师和分量人员查看咨询量的功能：
1. 我的私域咨询量（当前分配给我的，15天保护期内）
2. 可再分配咨询量（校域内，过了15天私域保护期，标记"再"）
3. 可新分配咨询量（公域，过了180天+90天无追访，标记"新"）
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from app.models.consult.consultation_record import 咨询量主表, 咨询量明细表
from app.services.consult.protection_period import (
    CAMPUS_PROTECTION_DAYS,
    PRIVATE_PROTECTION_DAYS,
    保护期状态,
)
from sqlalchemy import and_, desc, or_, select
from sqlalchemy.orm import Session


class 咨询量分类(str, Enum):
    """咨询量分类枚举"""
    我的私域 = "我的私域"  # 当前分配给我的，在保护期内
    可再分配 = "可再分配"  # 校域内可重新分配（标记"再"）
    可新分配 = "可新分配"  # 公域可新分配（标记"新"）


class 我的咨询量服务:
    """我的咨询量服务类"""
    
    @staticmethod
    def 获取我的私域咨询量(
        db: Session,
        咨询师姓名: str,
        神殿: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        获取当前咨询师的私域咨询量
        
        条件：
        - 首次咨询师 = 当前用户
        - 保护期状态 = 私域保护中
        
        Args:
            db: 数据库会话
            咨询师姓名: 当前登录的咨询师姓名
            神殿: 神殿筛选（可选）
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            (咨询量列表, 总数)
        """
        query = db.query(咨询量主表).filter(
            咨询量主表.首次咨询师 == 咨询师姓名,
            咨询量主表.保护期状态 == 保护期状态.私域保护中
        )
        
        if 神殿:
            query = query.filter(咨询量主表.神殿 == 神殿)
        
        total = query.count()
        records = query.order_by(desc(咨询量主表.首次登记时间)).offset(skip).limit(limit).all()
        
        当前时间 = datetime.now()
        result = []
        for record in records:
            # 计算剩余保护天数
            参考时间 = record.最后追访时间 or record.首次登记时间
            到期时间 = 参考时间 + timedelta(days=PRIVATE_PROTECTION_DAYS) if 参考时间 else None
            剩余天数 = (到期时间 - 当前时间).days if 到期时间 and 到期时间 > 当前时间 else 0
            
            result.append({
                "对象ID": record.对象ID,
                "电话列表": record.电话列表,
                "最新咨询者姓名": record.最新咨询者姓名,
                "最新状态": record.最新状态,
                "首次登记时间": record.首次登记时间.isoformat() if record.首次登记时间 else None,
                "最后追访时间": record.最后追访时间.isoformat() if record.最后追访时间 else None,
                "神殿": record.神殿,
                "咨询师": record.首次咨询师,
                "咨询次数": record.咨询次数,
                "保护期到期时间": 到期时间.isoformat() if 到期时间 else None,
                "剩余保护天数": max(0, 剩余天数),
                "分类": 咨询量分类.我的私域.value,
                "可编辑": True,  # 私域内咨询师可编辑
            })
        
        return result, total
    
    @staticmethod
    def 获取校域可再分配咨询量(
        db: Session,
        神殿: str,
        当前咨询师: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        获取校域内可再分配的咨询量（标记"再"）
        
        条件：
        - 保护期状态 = 已释放到校域
        - 神殿 = 指定神殿
        - 排除当前咨询师自己的（如果指定）
        
        这些咨询量：
        - 私域保护期（15天）已过
        - 仍在校域保护期（180天）内
        - 同神殿其他咨询师可以直接联系，无须同意
        
        Args:
            db: 数据库会话
            神殿: 神殿
            当前咨询师: 当前咨询师（可选，用于排除自己的量）
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            (咨询量列表, 总数)
        """
        query = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.已释放到校域,
            咨询量主表.神殿 == 神殿
        )
        
        # 可选：排除自己原来的量
        if 当前咨询师:
            query = query.filter(咨询量主表.首次咨询师 != 当前咨询师)
        
        total = query.count()
        records = query.order_by(desc(咨询量主表.释放时间)).offset(skip).limit(limit).all()
        
        当前时间 = datetime.now()
        result = []
        for record in records:
            # 计算校域保护期剩余天数
            到期时间 = record.首次登记时间 + timedelta(days=CAMPUS_PROTECTION_DAYS) if record.首次登记时间 else None
            剩余天数 = (到期时间 - 当前时间).days if 到期时间 and 到期时间 > 当前时间 else 0
            
            result.append({
                "对象ID": record.对象ID,
                "电话列表": record.电话列表,
                "最新咨询者姓名": record.最新咨询者姓名,
                "最新状态": record.最新状态,
                "首次登记时间": record.首次登记时间.isoformat() if record.首次登记时间 else None,
                "最后追访时间": record.最后追访时间.isoformat() if record.最后追访时间 else None,
                "释放时间": record.释放时间.isoformat() if record.释放时间 else None,
                "神殿": record.神殿,
                "原咨询师": record.首次咨询师,
                "咨询次数": record.咨询次数,
                "校域保护期到期时间": 到期时间.isoformat() if 到期时间 else None,
                "校域剩余保护天数": max(0, 剩余天数),
                "分类": 咨询量分类.可再分配.value,
                "标记": "再",  # 系统自动标记
                "可直接联系": True,  # 同神殿可直接联系
                "需要同意": False,  # 无须原咨询师同意
            })
        
        return result, total
    
    @staticmethod
    def 获取公域可新分配咨询量(
        db: Session,
        排除神殿: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        获取公域内可新分配的咨询量（标记"新"）
        
        条件：
        - 保护期状态 = 已释放到公域
        
        这些咨询量：
        - 登记超过180天
        - 过去90天内无追访记录
        - 可以重新加"新"字录入新神殿
        - 重新计算媒体来源和分配咨询师
        
        Args:
            db: 数据库会话
            排除神殿: 排除的神殿（可选，排除自己神殿的）
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            (咨询量列表, 总数)
        """
        query = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.已释放到公域
        )
        
        # 可选：排除某个神殿
        if 排除神殿:
            query = query.filter(咨询量主表.神殿 != 排除神殿)
        
        total = query.count()
        records = query.order_by(desc(咨询量主表.释放时间)).offset(skip).limit(limit).all()
        
        result = []
        for record in records:
            result.append({
                "对象ID": record.对象ID,
                "电话列表": record.电话列表,
                "最新咨询者姓名": record.最新咨询者姓名,
                "最新状态": record.最新状态,
                "首次登记时间": record.首次登记时间.isoformat() if record.首次登记时间 else None,
                "最后追访时间": record.最后追访时间.isoformat() if record.最后追访时间 else None,
                "释放时间": record.释放时间.isoformat() if record.释放时间 else None,
                "原神殿": record.神殿,
                "原咨询师": record.首次咨询师,
                "咨询次数": record.咨询次数,
                "分类": 咨询量分类.可新分配.value,
                "标记": "新",  # 系统自动标记
                "可跨神殿录入": True,
                "重新计算来源": True,
            })
        
        return result, total
    
    @staticmethod
    def 获取我的全部咨询量(
        db: Session,
        咨询师姓名: str,
        神殿: str,
        分类筛选: Optional[str] = None,
        状态筛选: Optional[str] = None,
        来源筛选: Optional[str] = None,
        地区筛选: Optional[str] = None,
        关键字: Optional[str] = None,
        开始日期: Optional[datetime] = None,
        结束日期: Optional[datetime] = None,
        今日回访: bool = False,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        获取咨询师可见的全部咨询量（分门别类）
        
        支持多种筛选条件：
        - 分类筛选：私域/可再分配/可新分配
        - 状态筛选：状态字段
        - 来源筛选：量来源字段
        - 关键字搜索：电话、姓名、备注
        - 日期范围：登记日期
        
        Args:
            db: 数据库会话
            咨询师姓名: 当前登录的咨询师姓名
            神殿: 咨询师所在神殿
            分类筛选: 可选，筛选特定分类
            状态筛选: 可选，状态筛选
            来源筛选: 可选，量来源筛选
            关键字: 可选，关键字搜索
            开始日期: 可选，开始日期
            结束日期: 可选，结束日期
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            分类汇总的咨询量数据，包含明细列表
        """
        # 基础查询 - 使用明细表
        base_query = db.query(咨询量明细表)
        
        # 构建分类条件
        私域条件 = and_(
            咨询量明细表.咨询师 == 咨询师姓名,
        )
        
        可再分配条件 = and_(
            咨询量明细表.神殿 == 神殿,
            咨询量明细表.咨询师 != 咨询师姓名,
        )
        
        可新分配条件 = and_(
            # 可新分配 - 公域数据，对所有人可见
            # 简化条件：超过180天的数据
            咨询量明细表.创建时间 < datetime.now() - timedelta(days=180)
        ) if not 神殿 else and_(
            咨询量明细表.神殿 != 神殿,
            咨询量明细表.创建时间 < datetime.now() - timedelta(days=180)
        )
        
        # 根据分类筛选应用条件
        if 分类筛选 == 咨询量分类.我的私域.value:
            base_query = base_query.filter(私域条件)
        elif 分类筛选 == 咨询量分类.可再分配.value:
            base_query = base_query.filter(可再分配条件)
        elif 分类筛选 == 咨询量分类.可新分配.value:
            base_query = base_query.filter(可新分配条件)
        else:
            # 不筛选分类时，返回所有与当前咨询师相关的数据
            base_query = base_query.filter(
                or_(
                    咨询量明细表.咨询师 == 咨询师姓名,
                    咨询量明细表.分量人 == 咨询师姓名,
                )
            )
        
        # 应用状态筛选
        if 状态筛选:
            base_query = base_query.filter(咨询量明细表.状态 == 状态筛选)
        
        # 应用来源筛选
        if 来源筛选:
            base_query = base_query.filter(咨询量明细表.量来源 == 来源筛选)
        
        # 应用地区筛选（按家庭住址地区）
        if 地区筛选:
            region_filter = or_(
                咨询量明细表.地区.ilike(f"%{地区筛选}%"),
                咨询量明细表.县.ilike(f"%{地区筛选}%"),
                咨询量明细表.详细地址.ilike(f"%{地区筛选}%"),
            )
            base_query = base_query.filter(region_filter)
        
        # 应用关键字搜索
        if 关键字:
            keyword_filter = or_(
                咨询量明细表.电话.ilike(f"%{关键字}%"),
                咨询量明细表.咨询者姓名.ilike(f"%{关键字}%"),
                咨询量明细表.备注.ilike(f"%{关键字}%"),
                咨询量明细表.位置.ilike(f"%{关键字}%"),
            )
            base_query = base_query.filter(keyword_filter)
        
        # 应用日期筛选
        if 开始日期:
            base_query = base_query.filter(咨询量明细表.创建时间 >= 开始日期)
        if 结束日期:
            base_query = base_query.filter(咨询量明细表.创建时间 <= 结束日期)
        
        # 今日回访筛选：通过沟通记录表的预定回访时间关联
        if 今日回访:
            from app.models.consult.consultation_communication import 咨询沟通记录表
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start.replace(hour=23, minute=59, second=59)
            # 子查询：找出今日有预定回访的记录ID
            followup_subquery = db.query(咨询沟通记录表.记录ID).filter(
                咨询沟通记录表.预定回访时间 >= today_start,
                咨询沟通记录表.预定回访时间 <= today_end,
            ).distinct().subquery()
            base_query = base_query.filter(
                咨询量明细表.记录ID.in_(select(followup_subquery.c.记录ID))
            )
        
        # 获取总数
        total = base_query.count()
        
        # 获取分页数据
        records = base_query.order_by(desc(咨询量明细表.创建时间)).offset(skip).limit(limit).all()
        
        # 转换为字典列表并添加分类标记
        data_list = []
        for record in records:
            record_dict = record.to_dict() if hasattr(record, 'to_dict') else {
                "记录ID": record.记录ID,
                "对象ID": record.对象ID,
                "登记日期": str(record.登记日期) if record.登记日期 else None,
                "登记时间": str(record.登记时间) if record.登记时间 else None,
                "电话": record.电话,
                "咨询者姓名": record.咨询者姓名,
                "性别": record.性别,
                "年龄": record.年龄,
                "状态": record.状态,
                "量来源": record.量来源,
                "来源类别": record.来源类别,
                "媒体来源": record.媒体来源,
                "咨询师": record.咨询师,
                "分量人": record.分量人,
                "神殿": record.神殿,
                "位置": record.位置,
                "报名意向": record.报名意向,
                "备注": record.备注,
                "是否上门": record.是否上门,
                "上门时间": str(record.上门时间) if record.上门时间 else None,
                "是否报名": record.是否报名,
                "报名时间": str(record.报名时间) if record.报名时间 else None,
                "创建时间": str(record.创建时间) if record.创建时间 else None,
                "更新时间": str(record.更新时间) if record.更新时间 else None,
            }
            
            # 添加分类标记
            if record.咨询师 == 咨询师姓名:
                record_dict["_category_tag"] = "私域"
            elif record.神殿 == 神殿 and record.咨询师 != 咨询师姓名:
                record_dict["_category_tag"] = "再"
            else:
                record_dict["_category_tag"] = "新"
            
            data_list.append(record_dict)
        
        # 计算各分类统计
        私域数量 = db.query(咨询量明细表).filter(
            咨询量明细表.咨询师 == 咨询师姓名
        ).count()
        
        可再分配数量 = db.query(咨询量明细表).filter(
            咨询量明细表.神殿 == 神殿,
            咨询量明细表.咨询师 != 咨询师姓名
        ).count()
        
        可新分配数量 = 0
        if 神殿:
            可新分配数量 = db.query(咨询量明细表).filter(
                咨询量明细表.神殿 != 神殿,
                咨询量明细表.创建时间 < datetime.now() - timedelta(days=180)
            ).count()
        
        # 今日回访数量：预定回访时间在今天的记录数
        from app.models.consult.consultation_communication import 咨询沟通记录表
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59)
        followup_subquery = db.query(咨询沟通记录表.记录ID).filter(
            咨询沟通记录表.预定回访时间 >= today_start,
            咨询沟通记录表.预定回访时间 <= today_end,
        ).distinct().subquery()
        今日回访数量 = db.query(咨询量明细表).filter(
            or_(
                咨询量明细表.咨询师 == 咨询师姓名,
                咨询量明细表.分量人 == 咨询师姓名,
            ),
            咨询量明细表.记录ID.in_(select(followup_subquery.c.记录ID))
        ).count()
        
        total_pages = (total + limit - 1) // limit if total > 0 else 0
        
        return {
            "咨询师": 咨询师姓名,
            "神殿": 神殿,
            "说明": "当前咨询师可见的全部咨询量",
            "总记录数": total,
            "总页数": total_pages,
            "当前页": (skip // limit) + 1,
            "每页数量": limit,
            "数据列表": data_list,
            "私域数量": 私域数量,
            "可再分配数量": 可再分配数量,
            "可新分配数量": 可新分配数量,
            "今日回访数量": 今日回访数量,
        }
    
    @staticmethod
    def 检查咨询量操作权限(
        db: Session,
        对象ID: int,
        操作者姓名: str,
        操作者神殿: str,
        操作者角色: str
    ) -> Dict[str, Any]:
        """
        检查用户对指定咨询量的操作权限
        
        权限规则：
        1. 私域保护中：只有被分配的咨询师可编辑
        2. 已释放到校域：同神殿咨询师可联系，咨询助理可重新分配
        3. 已释放到公域：所有咨询师可重新录入，市场部经理可跨省分配
        
        Args:
            db: 数据库会话
            对象ID: 咨询量对象ID
            操作者姓名: 当前操作者姓名
            操作者神殿: 操作者所在神殿
            操作者角色: 操作者角色（咨询师/咨询助理/市场部经理等）
            
        Returns:
            权限信息字典
        """
        record = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if not record:
            return {
                "有权限": False,
                "原因": "咨询量不存在"
            }
        
        保护期 = record.保护期状态 or 保护期状态.私域保护中.value
        
        # 默认权限
        权限 = {
            "对象ID": 对象ID,
            "保护期状态": 保护期,
            "可查看": True,  # 所有人都可查看
            "可编辑": False,
            "可追访": False,
            "可重新分配": False,
            "可跨神殿分配": False,
            "原因": ""
        }
        
        # 根据保护期状态判断权限
        if 保护期 == 保护期状态.私域保护中.value or 保护期 == 保护期状态.私域保护中:
            # 私域保护中：只有被分配的咨询师可操作
            if record.首次咨询师 == 操作者姓名:
                权限["可编辑"] = True
                权限["可追访"] = True
                权限["原因"] = "您是该咨询量的负责咨询师"
            else:
                权限["原因"] = f"该咨询量在私域保护期内，只有咨询师 {record.首次咨询师} 可操作"
                
        elif 保护期 == 保护期状态.已释放到校域.value or 保护期 == 保护期状态.已释放到校域:
            # 已释放到校域：同神殿可操作
            if record.神殿 == 操作者神殿:
                权限["可追访"] = True
                权限["原因"] = "该咨询量已释放到校域，同神殿咨询师可直接联系"
                
                # 咨询助理可重新分配
                if 操作者角色 in ["咨询助理", "校长", "管理员", "admin"]:
                    权限["可重新分配"] = True
                    权限["原因"] = f'{权限["原因"]}，您有重新分配权限'
            else:
                权限["原因"] = f"该咨询量属于 {record.神殿}，您无权操作其他神殿的校域咨询量"
                
        elif 保护期 == 保护期状态.已释放到公域.value or 保护期 == 保护期状态.已释放到公域:
            # 已释放到公域：所有人可操作
            权限["可追访"] = True
            权限["可编辑"] = True
            权限["原因"] = "该咨询量已释放到公域，可重新录入"
            
            # 市场部经理可跨省分配
            if 操作者角色 in ["市场部经理", "管理员", "admin"]:
                权限["可跨神殿分配"] = True
                权限["原因"] = f'{权限["原因"]}，您有跨神殿分配权限'
        
        权限["有权限"] = 权限["可编辑"] or 权限["可追访"] or 权限["可重新分配"]
        
        return 权限
    
    @staticmethod
    def 获取分量人员视图(
        db: Session,
        神殿: str,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        获取分量人员（咨询助理）的视图
        
        分量人员需要看到：
        1. 待分配的新咨询量
        2. 需要再分配的咨询量（私域保护期过期）
        3. 可从公域获取的咨询量
        
        Args:
            db: 数据库会话
            神殿: 分量人员所在神殿
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            分量视图数据
        """
        result: Dict[str, Any] = {
            "神殿": 神殿,
            "统计时间": datetime.now().isoformat(),
        }
        
        # 统计各类数量
        # 1. 本神殿待再分配的咨询量
        待再分配数量 = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.已释放到校域,
            咨询量主表.神殿 == 神殿
        ).count()
        
        # 2. 公域可获取的咨询量
        公域可获取数量 = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.已释放到公域
        ).count()
        
        # 3. 即将到期的私域咨询量（3天内）
        当前时间 = datetime.now()
        三天后到期 = 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS - 3)
        
        即将到期数量 = db.query(咨询量主表).filter(
            咨询量主表.保护期状态 == 保护期状态.私域保护中,
            咨询量主表.神殿 == 神殿,
            or_(
                and_(
                    咨询量主表.最后追访时间 != None,
                    咨询量主表.最后追访时间 < 三天后到期,
                    咨询量主表.最后追访时间 >= 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS)
                ),
                and_(
                    咨询量主表.最后追访时间 == None,
                    咨询量主表.首次登记时间 < 三天后到期,
                    咨询量主表.首次登记时间 >= 当前时间 - timedelta(days=PRIVATE_PROTECTION_DAYS)
                )
            )
        ).count()
        
        result["统计"] = {
            "待再分配（标记'再'）": 待再分配数量,
            "可从公域获取（标记'新'）": 公域可获取数量,
            "即将到期（3天内）": 即将到期数量,
        }
        
        # 获取待再分配列表
        待再分配列表, _ = 我的咨询量服务.获取校域可再分配咨询量(
            db, 神殿, None, skip, limit
        )
        result["待再分配列表"] = 待再分配列表
        
        # 获取公域可获取列表
        公域列表, _ = 我的咨询量服务.获取公域可新分配咨询量(
            db, None, 0, 10  # 只显示前10条
        )
        result["公域可获取列表"] = 公域列表
        
        return result
