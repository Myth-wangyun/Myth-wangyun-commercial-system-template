"""
我的渠道咨询量服务

为渠道部人员提供查看名下咨询量的功能：
- 查询 咨询量明细表 中 渠道专员 = 当前用户姓名 的所有记录
- 支持按状态/来源/日期/关键字等筛选
- 提供统计汇总（总量、已上门、已报名、已退费等）
"""

from datetime import datetime
from typing import Any, Dict, Optional

from app.models.consult.consultation_record import 咨询量明细表
from sqlalchemy import and_, case, desc, func, or_
from sqlalchemy.orm import Session


class 渠道咨询量服务:
    """渠道部人员查看名下咨询量的服务"""

    @staticmethod
    def 获取我的渠道咨询量(
        db: Session,
        渠道人员姓名: str,
        神殿: Optional[str] = None,
        状态筛选: Optional[str] = None,
        来源筛选: Optional[str] = None,
        关键字: Optional[str] = None,
        开始日期: Optional[datetime] = None,
        结束日期: Optional[datetime] = None,
        分配状态: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        获取渠道人员名下的全部咨询量
        
        匹配条件：渠道专员 = 渠道人员姓名（即自己录入的或他人帮录入时填写了渠道专员为自己的）
        """
        # 基础查询
        base_query = db.query(咨询量明细表).filter(
            咨询量明细表.渠道专员 == 渠道人员姓名
        )

        # 神殿筛选
        if 神殿:
            base_query = base_query.filter(咨询量明细表.神殿 == 神殿)

        # 状态筛选
        if 状态筛选:
            base_query = base_query.filter(咨询量明细表.状态 == 状态筛选)

        # 来源筛选
        if 来源筛选:
            base_query = base_query.filter(咨询量明细表.量来源 == 来源筛选)

        # 分配状态筛选
        if 分配状态 == "未分配":
            base_query = base_query.filter(
                or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == '')
            )
        elif 分配状态 == "已分配":
            base_query = base_query.filter(
                and_(咨询量明细表.咨询师.isnot(None), 咨询量明细表.咨询师 != '')
            )

        # 关键字搜索
        if 关键字:
            kw = f"%{关键字}%"
            keyword_filter = or_(
                咨询量明细表.电话.ilike(kw),
                咨询量明细表.咨询者姓名.ilike(kw),
                咨询量明细表.备注.ilike(kw),
                咨询量明细表.位置.ilike(kw),
                咨询量明细表.地区.ilike(kw),
                咨询量明细表.咨询师.ilike(kw),
                咨询量明细表.县办.ilike(kw),
                咨询量明细表.乡办.ilike(kw),
                咨询量明细表.信息员.ilike(kw),
            )
            base_query = base_query.filter(keyword_filter)

        # 日期筛选
        if 开始日期:
            base_query = base_query.filter(咨询量明细表.登记日期 >= 开始日期)
        if 结束日期:
            base_query = base_query.filter(咨询量明细表.登记日期 <= 结束日期)

        # 总数
        total = base_query.count()

        # 分页数据
        records = base_query.order_by(desc(咨询量明细表.登记日期)).offset(skip).limit(limit).all()
        data_list = [record.to_dict() for record in records]

        total_pages = (total + limit - 1) // limit if total > 0 else 0

        return {
            "渠道人员": 渠道人员姓名,
            "总记录数": total,
            "总页数": total_pages,
            "当前页": (skip // limit) + 1,
            "每页数量": limit,
            "数据列表": data_list,
        }

    @staticmethod
    def 获取渠道咨询量统计(
        db: Session,
        渠道人员姓名: str,
        神殿: Optional[str] = None,
        开始日期: Optional[datetime] = None,
        结束日期: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        获取渠道人员的咨询量统计汇总
        """
        base_query = db.query(咨询量明细表).filter(
            咨询量明细表.渠道专员 == 渠道人员姓名
        )

        if 神殿:
            base_query = base_query.filter(咨询量明细表.神殿 == 神殿)
        if 开始日期:
            base_query = base_query.filter(咨询量明细表.登记日期 >= 开始日期)
        if 结束日期:
            base_query = base_query.filter(咨询量明细表.登记日期 <= 结束日期)

        stats = base_query.with_entities(
            func.count().label("总量"),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("已上门"),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("已报名"),
            func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label("已订座"),
            func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("已退费"),
            func.sum(case((咨询量明细表.是否无效量 == 1, 1), else_=0)).label("无效量"),
            func.sum(case((
                and_(咨询量明细表.咨询师.isnot(None), 咨询量明细表.咨询师 != ''), 1
            ), else_=0)).label("已分配"),
            func.sum(case((
                or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == ''), 1
            ), else_=0)).label("未分配"),
        ).first()

        return {
            "渠道人员": 渠道人员姓名,
            "统计时间": datetime.now().isoformat(),
            "统计": {
                "总量": stats.总量 or 0,
                "已上门": stats.已上门 or 0,
                "已报名": stats.已报名 or 0,
                "已订座": stats.已订座 or 0,
                "已退费": stats.已退费 or 0,
                "无效量": stats.无效量 or 0,
                "已分配": stats.已分配 or 0,
                "未分配": stats.未分配 or 0,
            },
        }
