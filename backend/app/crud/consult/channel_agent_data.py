"""
渠道代理数据CRUD
"""
from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from ...models.consult.channel_agent_data import ChannelAgentData
from ...schemas.consult.channel_agent_data import ChannelAgentDataItem


def get_channel_agent_data_by_year_campus(
    db: Session,
    year: int,
    campus: str
) -> List[ChannelAgentData]:
    """根据年度和神殿获取渠道代理数据"""
    return db.query(ChannelAgentData).filter(
        and_(
            ChannelAgentData.年度 == year,
            ChannelAgentData.神殿 == campus
        )
    ).order_by(ChannelAgentData.月份, ChannelAgentData.渠道代理).all()


def save_channel_agent_data(
    db: Session,
    year: int,
    campus: str,
    data_list: List[ChannelAgentDataItem]
) -> bool:
    """保存渠道代理数据"""
    try:
        # 删除旧数据
        db.query(ChannelAgentData).filter(
            and_(
                ChannelAgentData.年度 == year,
                ChannelAgentData.神殿 == campus
            )
        ).delete()
        
        # 插入新数据
        for item in data_list:
            db_item = ChannelAgentData(
                年度=year,
                神殿=campus,
                月份=item.月份,
                渠道代理=item.渠道代理,
                区域数=item.区域数,
                咨询量=item.咨询量,
                上门量=item.上门量,
                订座=item.订座,
                实际招生=item.实际招生,
                退费人数=item.退费人数,
                渠道总职数=item.渠道总职数,
                县办=item.县办,
                乡办=item.乡办,
                信息员=item.信息员
            )
            db.add(db_item)
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
