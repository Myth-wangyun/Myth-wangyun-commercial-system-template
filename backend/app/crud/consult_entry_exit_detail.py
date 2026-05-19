"""
祈福司入职离职明细表 CRUD
"""

from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from app.models.consult.entry_exit_detail import 祈福司入职离职明细表
from app.schemas.consult_entry_exit_detail import 入职离职明细行


def 获取年度明细列表(db: Session, year: int) -> List[祈福司入职离职明细表]:
    """获取指定年份的所有明细记录"""
    return (
        db.query(祈福司入职离职明细表)
        .filter(祈福司入职离职明细表.年份 == year)
        .order_by(祈福司入职离职明细表.记录ID)
        .all()
    )


def 批量保存明细(db: Session, year: int, 明细列表: List[入职离职明细行]) -> List[祈福司入职离职明细表]:
    """批量保存明细（覆盖该年份的所有数据）"""
    
    # 删除该年份的所有旧数据
    db.query(祈福司入职离职明细表).filter(祈福司入职离职明细表.年份 == year).delete()
    
    # 插入新数据
    新记录列表 = []
    for 明细 in 明细列表:
        # 处理日期字段
        入职时间 = None
        if 明细.入职时间:
            try:
                入职时间 = datetime.strptime(明细.入职时间, '%Y-%m-%d').date()
            except:
                pass
        
        离职时间 = None
        if 明细.离职时间:
            try:
                离职时间 = datetime.strptime(明细.离职时间, '%Y-%m-%d').date()
            except:
                pass
        
        记录 = 祈福司入职离职明细表(
            年份=year,
            板块=明细.板块 or '',
            岗位=明细.岗位 or '',
            类别=明细.类别 or '',
            姓名=明细.姓名 or '',
            入职时间=入职时间,
            离职时间=离职时间,
            备注=明细.备注 or '',
        )
        db.add(记录)
        新记录列表.append(记录)
    
    db.commit()
    
    # 刷新记录以获取ID
    for 记录 in 新记录列表:
        db.refresh(记录)
    
    return 新记录列表


def 删除年度明细(db: Session, year: int) -> int:
    """删除指定年份的所有明细记录"""
    count = db.query(祈福司入职离职明细表).filter(祈福司入职离职明细表.年份 == year).delete()
    db.commit()
    return count
