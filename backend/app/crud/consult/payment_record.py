"""
咨询缴费记录CRUD操作
与咨询量深度绑定，支持教质班主任查看细节
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.consult.consultation_record import 咨询量明细表
from app.models.consult.payment_record import 咨询缴费明细表, 咨询缴费记录表
from app.schemas.consult.payment_record import (
    缴费明细创建,
    缴费记录创建,
    缴费记录更新,
)


class 缴费记录CRUD:
    """缴费记录CRUD操作（与咨询量一对一）"""

    @staticmethod
    def create(db: Session, obj_in: 缴费记录创建, 创建人: Optional[str] = None) -> 咨询缴费记录表:
        """创建缴费记录"""
        # 计算已交总额（首款）
        已交总额 = obj_in.首款金额 or 0
        欠费金额 = max(0, (obj_in.应交金额 or 0) - 已交总额)
        
        # 确定缴费状态
        if 已交总额 == 0:
            缴费状态 = '未缴费'
        elif 已交总额 >= (obj_in.应交金额 or 0) and (obj_in.应交金额 or 0) > 0:
            缴费状态 = '已缴清'
        else:
            缴费状态 = '部分缴费'
        
        db_obj = 咨询缴费记录表(
            记录ID=obj_in.记录ID,
            对象ID=obj_in.对象ID or 0,
            应交金额=obj_in.应交金额 or 0,
            首款金额=obj_in.首款金额 or 0,
            首款时间=obj_in.首款时间,
            首款方式=obj_in.首款方式,
            首款收款人=obj_in.首款收款人,
            首款备注=obj_in.首款备注,
            已交总额=已交总额,
            欠费金额=欠费金额,
            缴费状态=缴费状态,
            班主任=obj_in.班主任,
            班级=obj_in.班级,
            创建人=创建人,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, 缴费ID: int) -> Optional[咨询缴费记录表]:
        """根据缴费ID获取记录"""
        return db.query(咨询缴费记录表).filter(咨询缴费记录表.缴费ID == 缴费ID).first()

    @staticmethod
    def get_by_record_id(db: Session, 记录ID: int) -> Optional[咨询缴费记录表]:
        """根据咨询量明细记录ID获取缴费记录（一对一）"""
        return db.query(咨询缴费记录表).filter(咨询缴费记录表.记录ID == 记录ID).first()

    @staticmethod
    def get_or_create(db: Session, 记录ID: int, 对象ID: int | None = None, 创建人: str | None = None) -> 咨询缴费记录表:
        """获取或创建缴费记录"""
        record = db.query(咨询缴费记录表).filter(咨询缴费记录表.记录ID == 记录ID).first()
        if not record:
            record = 咨询缴费记录表(
                记录ID=记录ID,
                对象ID=对象ID or 0,
                创建人=创建人,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    def update(db: Session, 缴费ID: int, obj_in: 缴费记录更新, 更新人: str | None = None) -> Optional[咨询缴费记录表]:
        """更新缴费记录"""
        db_obj = db.query(咨询缴费记录表).filter(咨询缴费记录表.缴费ID == 缴费ID).first()
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)
        
        # 重新计算欠费和状态
        缴费记录CRUD._recalculate(db, db_obj)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update_应交金额(db: Session, 记录ID: int, 应交金额: int, 对象ID: int | None = None, 创建人: str | None = None) -> 咨询缴费记录表:
        """更新应交金额"""
        record = 缴费记录CRUD.get_or_create(db, 记录ID, 对象ID, 创建人)
        record.应交金额 = 应交金额
        缴费记录CRUD._recalculate(db, record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def update_首款(
        db: Session,
        记录ID: int,
        首款金额: int,
        首款时间: datetime | None = None,
        首款方式: str | None = None,
        首款收款人: str | None = None,
        首款凭证号: str | None = None,
        首款备注: str | None = None,
        对象ID: int | None = None,
        创建人: str | None = None
    ) -> 咨询缴费记录表:
        """更新首款信息"""
        record = 缴费记录CRUD.get_or_create(db, 记录ID, 对象ID, 创建人)
        record.首款金额 = 首款金额
        record.首款时间 = 首款时间 or datetime.now()
        if 首款方式 is not None:
            record.首款方式 = 首款方式
        if 首款收款人 is not None:
            record.首款收款人 = 首款收款人
        if 首款凭证号 is not None:
            record.首款凭证号 = 首款凭证号
        if 首款备注 is not None:
            record.首款备注 = 首款备注
        缴费记录CRUD._recalculate(db, record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def _recalculate(db: Session, record: 咨询缴费记录表):
        """重新计算已交总额、欠费金额和缴费状态"""
        # 获取所有后续缴费明细
        details = db.query(咨询缴费明细表).filter(咨询缴费明细表.缴费ID == record.缴费ID).all()
        
        # 计算已交总额 = 首款 + 后续缴费
        后续总额 = sum(d.缴费金额 or 0 for d in details)
        record.已交总额 = (record.首款金额 or 0) + 后续总额
        record.后续缴费次数 = len(details)
        
        # 计算欠费金额
        record.欠费金额 = max(0, (record.应交金额 or 0) - record.已交总额)
        
        # 更新缴费状态
        if record.已交总额 == 0:
            record.缴费状态 = '未缴费'
        elif record.欠费金额 == 0 and (record.应交金额 or 0) > 0:
            record.缴费状态 = '已缴清'
        else:
            record.缴费状态 = '部分缴费'
        
        # 同步到咨询量明细表的已交学费和缴费金额字段
        缴费记录CRUD._sync_to_consultation_detail(db, record)

    @staticmethod
    def _sync_to_consultation_detail(db: Session, record: 咨询缴费记录表):
        """同步缴费信息到咨询量明细表"""
        try:
            consultation = db.query(咨询量明细表).filter(
                咨询量明细表.记录ID == record.记录ID
            ).first()
            
            if consultation:
                # 已交学费字段存储已交总额（字符串格式）
                consultation.已交学费 = str(record.已交总额 or 0)
                # 缴费金额字段存储已交总额（整数格式）
                consultation.缴费金额 = record.已交总额 or 0
                db.flush()
                print(f"[payment-sync] 已同步到咨询量明细表: 记录ID={record.记录ID}, 已交学费={record.已交总额}")
        except Exception as e:
            print(f"[payment-sync] 同步到咨询量明细表失败: {e}")

    @staticmethod
    def delete(db: Session, 缴费ID: int) -> bool:
        """删除缴费记录（同时删除明细）"""
        db_obj = db.query(咨询缴费记录表).filter(咨询缴费记录表.缴费ID == 缴费ID).first()
        if not db_obj:
            return False
        
        # 先删除明细
        db.query(咨询缴费明细表).filter(咨询缴费明细表.缴费ID == 缴费ID).delete()
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def get_by_班主任(db: Session, 班主任: str, 缴费状态: str | None = None) -> List[咨询缴费记录表]:
        """根据班主任获取缴费列表"""
        query = db.query(咨询缴费记录表).filter(咨询缴费记录表.班主任 == 班主任)
        if 缴费状态:
            query = query.filter(咨询缴费记录表.缴费状态 == 缴费状态)
        return query.order_by(desc(咨询缴费记录表.创建时间)).all()

    @staticmethod
    def get_欠费列表(db: Session, 班主任: str | None = None) -> List[咨询缴费记录表]:
        """获取欠费列表"""
        query = db.query(咨询缴费记录表).filter(咨询缴费记录表.欠费金额 > 0)
        if 班主任:
            query = query.filter(咨询缴费记录表.班主任 == 班主任)
        return query.order_by(desc(咨询缴费记录表.欠费金额)).all()


class 缴费明细CRUD:
    """缴费明细CRUD操作（后续缴费）"""

    @staticmethod
    def create(db: Session, obj_in: 缴费明细创建, 创建人: str | None = None) -> 咨询缴费明细表:
        """创建缴费明细"""
        db_obj = 咨询缴费明细表(
            缴费ID=obj_in.缴费ID,
            缴费金额=obj_in.缴费金额,
            缴费时间=obj_in.缴费时间,
            缴费方式=obj_in.缴费方式,
            收款人=obj_in.收款人,
            凭证号=obj_in.凭证号,
            备注=obj_in.备注,
            创建人=创建人,
        )
        db.add(db_obj)
        
        # 更新缴费记录的汇总
        record = db.query(咨询缴费记录表).filter(咨询缴费记录表.缴费ID == obj_in.缴费ID).first()
        if record:
            db.flush()
            缴费记录CRUD._recalculate(db, record)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_payment_id(db: Session, 缴费ID: int) -> List[咨询缴费明细表]:
        """根据缴费ID获取所有明细"""
        return db.query(咨询缴费明细表).filter(
            咨询缴费明细表.缴费ID == 缴费ID
        ).order_by(咨询缴费明细表.缴费时间).all()

    @staticmethod
    def get_by_id(db: Session, 明细ID: int) -> Optional[咨询缴费明细表]:
        """根据明细ID获取记录"""
        return db.query(咨询缴费明细表).filter(咨询缴费明细表.明细ID == 明细ID).first()

    @staticmethod
    def delete(db: Session, 明细ID: int) -> bool:
        """删除缴费明细并更新汇总"""
        db_obj = db.query(咨询缴费明细表).filter(咨询缴费明细表.明细ID == 明细ID).first()
        if not db_obj:
            return False
        
        缴费ID = db_obj.缴费ID
        db.delete(db_obj)
        
        # 更新缴费记录的汇总
        record = db.query(咨询缴费记录表).filter(咨询缴费记录表.缴费ID == 缴费ID).first()
        if record:
            db.flush()
            缴费记录CRUD._recalculate(db, record)
        
        db.commit()
        return True


class 缴费服务:
    """缴费服务 - 业务逻辑封装"""

    @staticmethod
    def get_payment_info(db: Session, 记录ID: int) -> dict:
        """
        获取完整的缴费信息（记录+明细+咨询量信息）
        为教质班主任提供完整视图
        
        返回格式与前端 PaymentInfo 接口匹配：
        - summary: 缴费汇总信息
        - first_payment: 首款记录（如果有首款金额）
        - subsequent_payments: 后续缴费明细列表
        """
        # 获取缴费记录
        record = 缴费记录CRUD.get_by_record_id(db, 记录ID)
        
        # 获取后续缴费明细
        details = []
        if record:
            details = 缴费明细CRUD.get_by_payment_id(db, record.缴费ID)
        
        # 获取咨询量信息
        consultation = db.query(咨询量明细表).filter(咨询量明细表.记录ID == 记录ID).first()
        
        # 构建 summary（缴费汇总）
        summary = None
        if record:
            summary = {
                "汇总ID": record.缴费ID,
                "记录ID": record.记录ID,
                "对象ID": record.对象ID,
                "应交金额": record.应交金额 or 0,
                "首款金额": record.首款金额 or 0,
                "已交金额": record.已交总额 or 0,
                "欠费金额": record.欠费金额 or 0,
                "缴费状态": record.缴费状态 or '未缴费',
                "后续交费次数": record.后续缴费次数 or 0,
                "创建时间": record.创建时间.isoformat() if record.创建时间 else None,
                "更新时间": record.更新时间.isoformat() if record.更新时间 else None,
            }
        
        # 构建 first_payment（首款记录）
        first_payment = None
        if record and record.首款金额 and record.首款金额 > 0:
            first_payment = {
                "缴费ID": record.缴费ID,
                "记录ID": record.记录ID,
                "对象ID": record.对象ID,
                "缴费类型": "首款",
                "缴费金额": record.首款金额 or 0,
                "缴费时间": record.首款时间.isoformat() if record.首款时间 else None,
                "缴费方式": record.首款方式,
                "收款人": record.首款收款人,
                "凭证号": record.首款凭证号,
                "备注": record.首款备注,
                "创建时间": record.创建时间.isoformat() if record.创建时间 else None,
            }
        
        # 构建 subsequent_payments（后续缴费列表）
        subsequent_payments = []
        for d in details:
            subsequent_payments.append({
                "缴费ID": d.缴费ID,
                "明细ID": d.明细ID,
                "记录ID": record.记录ID if record else None,
                "对象ID": record.对象ID if record else None,
                "缴费类型": "后续交费",
                "缴费金额": d.缴费金额 or 0,
                "缴费时间": d.缴费时间.isoformat() if d.缴费时间 else None,
                "缴费方式": d.缴费方式,
                "收款人": d.收款人,
                "凭证号": d.凭证号,
                "备注": d.备注,
                "创建时间": d.创建时间.isoformat() if d.创建时间 else None,
                "创建人": d.创建人,
            })
        
        return {
            "summary": summary,
            "first_payment": first_payment,
            "subsequent_payments": subsequent_payments,
            # 保留咨询者信息供前端使用
            "咨询者姓名": consultation.咨询者姓名 if consultation else None,
            "电话": consultation.电话 if consultation else None,
            "报名专业": consultation.报名专业 if consultation else None,
            "神殿": consultation.神殿 if consultation else None,
            "咨询师": consultation.咨询师 if consultation else None,
            "报名时间": consultation.报名时间.isoformat() if consultation and consultation.报名时间 else None,
        }

    @staticmethod
    def add_subsequent_payment(
        db: Session,
        记录ID: int,
        缴费金额: int,
        缴费时间: datetime,
        缴费方式: str | None = None,
        收款人: str | None = None,
        凭证号: str | None = None,
        备注: str | None = None,
        创建人: str | None = None
    ) -> dict:
        """
        添加后续缴费
        """
        # 获取或创建缴费记录
        record = 缴费记录CRUD.get_by_record_id(db, 记录ID)
        if not record:
            return {
                "success": False,
                "message": "未找到缴费记录，请先创建缴费记录"
            }
        
        # 创建缴费明细
        detail = 咨询缴费明细表(
            缴费ID=record.缴费ID,
            缴费金额=缴费金额,
            缴费时间=缴费时间,
            缴费方式=缴费方式,
            收款人=收款人,
            凭证号=凭证号,
            备注=备注,
            创建人=创建人,
        )
        db.add(detail)
        db.flush()
        
        # 重新计算汇总
        缴费记录CRUD._recalculate(db, record)
        
        db.commit()
        db.refresh(detail)
        db.refresh(record)
        
        return {
            "success": True,
            "message": "后续缴费添加成功",
            "data": {
                "缴费明细": detail.to_dict(),
                "缴费记录": record.to_dict()
            }
        }

    @staticmethod
    def get_班主任统计(db: Session, 班主任: str) -> dict:
        """获取班主任的缴费统计"""
        records = 缴费记录CRUD.get_by_班主任(db, 班主任)
        
        总学员数 = len(records)
        已缴清人数 = len([r for r in records if r.缴费状态 == '已缴清'])
        部分缴费人数 = len([r for r in records if r.缴费状态 == '部分缴费'])
        未缴费人数 = len([r for r in records if r.缴费状态 == '未缴费'])
        应收总额 = sum(r.应交金额 or 0 for r in records)
        已收总额 = sum(r.已交总额 or 0 for r in records)
        欠费总额 = sum(r.欠费金额 or 0 for r in records)
        
        return {
            "success": True,
            "data": {
                "总学员数": 总学员数,
                "已缴清人数": 已缴清人数,
                "部分缴费人数": 部分缴费人数,
                "未缴费人数": 未缴费人数,
                "应收总额": 应收总额,
                "已收总额": 已收总额,
                "欠费总额": 欠费总额,
            }
        }

    @staticmethod
    def delete_payment(db: Session, 缴费ID: int) -> dict:
        """删除缴费记录"""
        success = 缴费记录CRUD.delete(db, 缴费ID)
        if success:
            return {"success": True, "message": "缴费记录删除成功"}
        return {"success": False, "message": "缴费记录不存在"}


# 保持向后兼容
class 缴费汇总CRUD:
    """兼容旧接口"""
    
    @staticmethod
    def get_or_create(db: Session, 记录ID: int, 对象ID: int, 创建人: str | None = None):
        return 缴费记录CRUD.get_or_create(db, 记录ID, 对象ID, 创建人)
    
    @staticmethod
    def get_by_record_id(db: Session, 记录ID: int):
        return 缴费记录CRUD.get_by_record_id(db, 记录ID)
    
    @staticmethod
    def update_应交金额(db: Session, 记录ID: int, 应交金额: int, 对象ID: int | None = None, 创建人: str | None = None):
        return 缴费记录CRUD.update_应交金额(db, 记录ID, 应交金额, 对象ID, 创建人)
