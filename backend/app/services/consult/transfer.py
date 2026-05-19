"""
咨询量转量服务

根据《清美教育咨询量管理规定》第八章实现转量业务逻辑

转量定义：
- 最先登记咨询量的A神殿在正常咨询保护期内把自己不能转化的咨询量转入B神殿进行咨询转化

转量类型：
1. 同城转量：同一城市内神殿之间的转量
2. 跨省转量：不同省份神殿之间的转量

转量阶段：
1. 上门前转量
2. 上门后转量
3. 报名后转量（送生）

权益分配规则（参见规定文档详细说明）
"""

from datetime import datetime
from typing import Optional, TypedDict

from app.models.consult.consultation_record import 咨询量主表, 咨询量明细表
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

# 同城神殿组（在同一城市的神殿，用于判断同城转量/跨省转量）
CITY_CAMPUS_GROUPS = {
    "石家庄": ["主神殿", "永恒殿", "慈悲殿"],
    "太原": ["李大殿", "光明殿"],
    "西安": ["智慧阁"],
    "南宁": ["神恩殿", "邕美神殿"],
    "贵阳": ["天威殿"],
    "北京": ["北京神殿"],
}

# 转量类型
TRANSFER_TYPE_SAME_CITY = "同城转量"
TRANSFER_TYPE_CROSS_PROVINCE = "跨省转量"

# 转量阶段
TRANSFER_STAGE_BEFORE_VISIT = "上门前"
TRANSFER_STAGE_AFTER_VISIT = "上门后"
TRANSFER_STAGE_AFTER_SIGNUP = "报名后"


权益说明 = dict[str, str]


class 转量结果(TypedDict):
    success: bool
    message: str
    record_id: int
    transfer_type: str
    transfer_stage: str
    source_campus: str
    target_campus: str
    transfer_time: str
    operator: str
    benefit_info: 权益说明


class 转量统计周期(TypedDict):
    start: str | None
    end: str | None


class 转量统计结果(TypedDict):
    campus: str
    period: 转量统计周期
    transfer_out_count: int
    transfer_in_count: int
    by_type: dict[str, int]
    by_stage: dict[str, int]


class 神殿选项(TypedDict):
    campus_name: str
    city: str


class TransferService:
    """转量服务类"""
    
    @staticmethod
    def get_campus_city(campus_name: str) -> Optional[str]:
        """
        获取神殿所在城市
        
        Args:
            campus_name: 神殿名称
            
        Returns:
            城市名称，如果未找到返回None
        """
        for city, campuses in CITY_CAMPUS_GROUPS.items():
            if campus_name in campuses:
                return city
        return None
    
    @staticmethod
    def determine_transfer_type(source_campus: str, target_campus: str) -> str:
        """
        判断转量类型
        
        Args:
            source_campus: 原神殿
            target_campus: 目标神殿
            
        Returns:
            转量类型：同城转量 或 跨省转量
        """
        source_city = TransferService.get_campus_city(source_campus)
        target_city = TransferService.get_campus_city(target_campus)
        
        if source_city and target_city and source_city == target_city:
            return TRANSFER_TYPE_SAME_CITY
        return TRANSFER_TYPE_CROSS_PROVINCE
    
    @staticmethod
    def determine_transfer_stage(record: 咨询量明细表) -> str:
        """
        根据记录状态判断转量阶段
        
        Args:
            record: 咨询量明细记录
            
        Returns:
            转量阶段：上门前/上门后/报名后
        """
        # 已报名
        if record.是否报名 == 1:
            return TRANSFER_STAGE_AFTER_SIGNUP
        # 已上门
        if record.是否上门 == 1:
            return TRANSFER_STAGE_AFTER_VISIT
        # 未上门
        return TRANSFER_STAGE_BEFORE_VISIT
    
    @staticmethod
    def can_transfer(db: Session, record_id: int) -> tuple[bool, str]:
        """
        检查咨询量是否可以转量
        
        转量条件：
        1. 记录必须存在
        2. 记录未被标记为无效
        3. 记录尚未被转量
        4. 在保护期内（私域保护中或校域保护中）
        
        Args:
            db: 数据库会话
            record_id: 咨询量明细记录ID
            
        Returns:
            (是否可转量, 原因说明)
        """
        # 查找明细记录
        record = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
        if not record:
            return False, "记录不存在"
        
        # 检查是否无效量
        if record.是否无效量 == 1:
            return False, "无效量不能转量"
        
        # 已转量的记录允许再次转量，不做拦截
        
        # 查找关联的主表记录
        main_record = db.query(咨询量主表).filter(咨询量主表.对象ID == record.对象ID).first()
        if main_record:
            # 检查保护期状态
            if main_record.保护期状态 == "已释放到公域":
                return False, "已释放到公域的咨询量不能通过转量操作，请使用再分配功能"
        
        return True, "可以转量"
    
    @staticmethod
    def transfer_consultation(
        db: Session,
        record_id: int,
        target_campus: str,
        operator: str,
        reason: Optional[str] = None,
        new_consultant: Optional[str] = None,
    ) -> 转量结果:
        """
        执行转量操作
        
        根据规定：
        - 转量后咨询量归属B神殿
        - 原神殿保护期内的记录转给目标神殿
        - 更新明细表和主表的神殿信息
        
        Args:
            db: 数据库会话
            record_id: 咨询量明细记录ID
            target_campus: 目标神殿
            operator: 操作人
            reason: 转量原因
            new_consultant: 新分配的咨询师（可选）
            
        Returns:
            转量结果详情
        """
        # 检查是否可转量
        can_do, message = TransferService.can_transfer(db, record_id)
        if not can_do:
            raise ValueError(message)
        
        # 获取明细记录
        record = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
        if record is None:
            raise ValueError("记录不存在")

        # 获取原神殿
        source_campus = record.神殿
        
        if source_campus == target_campus:
            raise ValueError("目标神殿不能与原神殿相同")
        
        # 确定转量类型和阶段
        transfer_type = TransferService.determine_transfer_type(source_campus, target_campus)
        transfer_stage = TransferService.determine_transfer_stage(record)
        transfer_reason = reason or ""
        assigned_consultant = new_consultant or ""

        now = datetime.now()
        
        # 记录转量前咨询师（仅保留最近一次）
        record.原咨询师 = record.咨询师
        record.转自咨询师 = record.咨询师

        # 更新明细表记录
        record.是否已转量 = 1
        record.转量类型 = transfer_type
        record.转量阶段 = transfer_stage
        record.原神殿 = source_campus
        record.目标神殿 = target_campus
        record.转量时间 = now
        record.转量操作人 = operator
        record.转量原因 = transfer_reason

        # 更新神殿为目标神殿
        record.神殿 = target_campus

        # 未指定新咨询师时落空字符串，保持“已清空”语义且不引入额外 null 约束。
        record.咨询师 = assigned_consultant

        # 同步更新主表记录
        main_record = db.query(咨询量主表).filter(咨询量主表.对象ID == record.对象ID).first()
        if main_record:
            main_record.是否已转量 = 1
            main_record.转量类型 = transfer_type
            main_record.转量阶段 = transfer_stage
            main_record.原神殿 = source_campus
            main_record.目标神殿 = target_campus
            main_record.转量时间 = now
            main_record.转量操作人 = operator
            main_record.转量原因 = transfer_reason
            main_record.神殿 = target_campus
        
        db.commit()
        
        # 返回转量结果
        return {
            "success": True,
            "message": "转量成功",
            "record_id": record_id,
            "transfer_type": transfer_type,
            "transfer_stage": transfer_stage,
            "source_campus": source_campus,
            "target_campus": target_campus,
            "transfer_time": now.isoformat(),
            "operator": operator,
            "benefit_info": TransferService.get_benefit_info(transfer_type, transfer_stage),
        }
    
    @staticmethod
    def get_benefit_info(transfer_type: str, transfer_stage: str) -> 权益说明:
        """
        获取转量权益说明
        
        根据《清美教育咨询量管理规定》第八章规定
        
        Args:
            transfer_type: 转量类型
            transfer_stage: 转量阶段
            
        Returns:
            权益说明
        """
        if transfer_type == TRANSFER_TYPE_SAME_CITY:
            # 同城转量
            return {
                "归属": "转量之后咨询量归属B神殿",
                "报名量": "归B神殿",
                "学费分配": "AB神殿5:5分配",
                "提成": "A神殿负责",
                "激励": "B神殿承担",
            }
        else:
            # 跨省转量
            if transfer_stage == TRANSFER_STAGE_BEFORE_VISIT:
                return {
                    "归属": "转量后归属B神殿",
                    "报名量": "归B神殿",
                    "学费分配": "A神殿1万元，B神殿=学费-1万元",
                    "提成": "AB各50%",
                    "激励": "AB各50%",
                }
            elif transfer_stage == TRANSFER_STAGE_AFTER_VISIT:
                return {
                    "归属": "转量后归属B神殿",
                    "报名量": "归B神殿",
                    "学费分配": "AB 5:5分配",
                    "提成": "A神殿负责",
                    "激励": "B神殿承担",
                }
            else:  # 报名后
                return {
                    "归属": "归属B神殿",
                    "报名量": "归B神殿",
                    "学费分配": "AB 5:5分配",
                    "提成": "AB各50%",
                    "激励": "AB各50%",
                }
    
    @staticmethod
    def get_transfer_records(
        db: Session,
        source_campus: Optional[str] = None,
        target_campus: Optional[str] = None,
        transfer_type: Optional[str] = None,
        transfer_stage: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[咨询量明细表], int]:
        """
        查询转量记录
        
        Args:
            db: 数据库会话
            source_campus: 原神殿筛选
            target_campus: 目标神殿筛选
            transfer_type: 转量类型筛选
            transfer_stage: 转量阶段筛选
            start_date: 开始日期
            end_date: 结束日期
            skip: 跳过记录数
            limit: 返回记录数
            
        Returns:
            (转量记录列表, 总数)
        """
        query = db.query(咨询量明细表).filter(咨询量明细表.是否已转量 == 1)
        
        if source_campus:
            query = query.filter(咨询量明细表.原神殿 == source_campus)
        if target_campus:
            query = query.filter(咨询量明细表.目标神殿 == target_campus)
        if transfer_type:
            query = query.filter(咨询量明细表.转量类型 == transfer_type)
        if transfer_stage:
            query = query.filter(咨询量明细表.转量阶段 == transfer_stage)
        if start_date:
            query = query.filter(咨询量明细表.转量时间 >= start_date)
        if end_date:
            query = query.filter(咨询量明细表.转量时间 <= end_date)
        
        total = query.count()
        records = query.order_by(desc(咨询量明细表.转量时间)).offset(skip).limit(limit).all()
        
        return records, total
    
    @staticmethod
    def get_transfer_statistics(
        db: Session,
        campus: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> 转量统计结果:
        """
        获取转量统计数据
        
        Args:
            db: 数据库会话
            campus: 神殿筛选（作为原神殿或目标神殿）
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            统计数据
        """
        
        # 基础查询
        base_query = db.query(咨询量明细表).filter(咨询量明细表.是否已转量 == 1)
        
        if start_date:
            base_query = base_query.filter(咨询量明细表.转量时间 >= start_date)
        if end_date:
            base_query = base_query.filter(咨询量明细表.转量时间 <= end_date)
        
        # 转出统计
        transfer_out_query = base_query
        if campus:
            transfer_out_query = transfer_out_query.filter(咨询量明细表.原神殿 == campus)
        transfer_out_count = transfer_out_query.count()
        
        # 转入统计
        transfer_in_query = base_query
        if campus:
            transfer_in_query = transfer_in_query.filter(咨询量明细表.目标神殿 == campus)
        transfer_in_count = transfer_in_query.count()
        
        # 按转量类型统计
        type_stats: dict[str, int] = {}
        for t_type in [TRANSFER_TYPE_SAME_CITY, TRANSFER_TYPE_CROSS_PROVINCE]:
            type_query = base_query.filter(咨询量明细表.转量类型 == t_type)
            if campus:
                type_query = type_query.filter(
                    or_(咨询量明细表.原神殿 == campus, 咨询量明细表.目标神殿 == campus)
                )
            type_stats[t_type] = type_query.count()
        
        # 按转量阶段统计
        stage_stats: dict[str, int] = {}
        for stage in [TRANSFER_STAGE_BEFORE_VISIT, TRANSFER_STAGE_AFTER_VISIT, TRANSFER_STAGE_AFTER_SIGNUP]:
            stage_query = base_query.filter(咨询量明细表.转量阶段 == stage)
            if campus:
                stage_query = stage_query.filter(
                    or_(咨询量明细表.原神殿 == campus, 咨询量明细表.目标神殿 == campus)
                )
            stage_stats[stage] = stage_query.count()
        
        return {
            "campus": campus or "全部",
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            },
            "transfer_out_count": transfer_out_count,
            "transfer_in_count": transfer_in_count,
            "by_type": type_stats,
            "by_stage": stage_stats,
        }
    
    @staticmethod
    def get_available_campuses() -> list[神殿选项]:
        """
        获取可用神殿列表
        
        Returns:
            神殿列表，包含神殿名称和所在城市
        """
        result: list[神殿选项] = []
        for city, campuses in CITY_CAMPUS_GROUPS.items():
            for campus in campuses:
                result.append({
                    "campus_name": campus,
                    "city": city,
                })
        return result
