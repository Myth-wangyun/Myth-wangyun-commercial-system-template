"""
咨询量录入系统CRUD操作
"""

import re
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session


def _is_phone_number(s: str) -> bool:
    """判断字符串是否像手机号（纯数字且11位，以1开头）"""
    return bool(re.match(r'^1\d{10}$', s.strip())) if s else False

from app.models.consult.consultation_record import 咨询量主表, 咨询量明细表
from app.schemas.consult.consultation_record import (
    咨询量主表创建,
    咨询量主表更新,
    咨询量明细表创建,
    咨询量明细表更新,
)


class 咨询量主表CRUD:
    """咨询量主表CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 咨询量主表创建) -> 咨询量主表:
        """创建咨询量主表记录"""
        db_obj = 咨询量主表(
            电话列表=obj_in.电话列表,
            咨询日期列表=obj_in.咨询日期列表 or [],
            最新咨询者姓名=obj_in.最新咨询者姓名,
            最新状态=obj_in.最新状态,
            咨询次数=1,
            首次登记时间=obj_in.首次登记时间,
            首次分量人=obj_in.首次分量人,
            首次咨询师=obj_in.首次咨询师,
            神殿=obj_in.神殿,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, 对象ID: int) -> Optional[咨询量主表]:
        """根据对象ID获取记录"""
        return db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()

    @staticmethod
    def get_by_phone(db: Session, phone: str) -> Optional[咨询量主表]:
        """根据电话号码查找记录（支持多电话）"""
        # PostgreSQL: 使用 JSONB 的 @> 操作符检查数组是否包含元素
        import json

        from sqlalchemy import cast, text
        from sqlalchemy.dialects.postgresql import JSONB
        # 将电话号码序列化为 JSON 数组字符串
        json_array = json.dumps([phone])
        return db.query(咨询量主表).filter(
            cast(咨询量主表.电话列表, JSONB).op('@>')(cast(text(f"'{json_array}'"), JSONB))
        ).first()

    @staticmethod
    def check_duplicate(db: Session, phones: List[str]) -> Optional[咨询量主表]:
        """检查是否有重量（任意一个电话匹配即为重量）"""
        for phone in phones:
            if phone:
                result = 咨询量主表CRUD.get_by_phone(db, phone)
                if result:
                    return result
        return None

    @staticmethod
    def check_duplicate_wechat(db: Session, wechat: str) -> Optional[咨询量主表]:
        """检查微信号是否重复（通过明细表查找，再关联主表）"""
        if not wechat or not wechat.strip():
            return None
        wechat = wechat.strip()
        # 在明细表中查找匹配的微信号
        detail = db.query(咨询量明细表).filter(
            咨询量明细表.微信 == wechat
        ).order_by(咨询量明细表.记录ID.desc()).first()
        if detail and detail.对象ID:
            # 通过对象ID找到主表记录
            return 咨询量主表CRUD.get_by_id(db, detail.对象ID)
        return None

    @staticmethod
    def update(db: Session, db_obj: 咨询量主表, obj_in: 咨询量主表更新) -> 咨询量主表:
        """更新咨询量主表记录"""
        update_data = obj_in.model_dump(exclude_unset=True, exclude={'对象ID'})
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def increment_count(db: Session, db_obj: 咨询量主表) -> 咨询量主表:
        """增加咨询次数"""
        db_obj.咨询次数 = (db_obj.咨询次数 or 0) + 1
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def add_phone(db: Session, db_obj: 咨询量主表, phone: str) -> 咨询量主表:
        """添加新电话到电话列表"""
        phone_list = db_obj.电话列表 or []
        if phone not in phone_list:
            phone_list.append(phone)
            db_obj.电话列表 = phone_list
            db.commit()
            db.refresh(db_obj)
        return db_obj

    @staticmethod
    def add_consultation_date(db: Session, db_obj: 咨询量主表, date: datetime) -> 咨询量主表:
        """添加咨询日期到列表"""
        date_list = db_obj.咨询日期列表 or []
        date_str = date.isoformat() if isinstance(date, datetime) else str(date)
        date_list.append(date_str)
        db_obj.咨询日期列表 = date_list
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update_latest_info(
        db: Session,
        db_obj: 咨询量主表,
        咨询者姓名: Optional[str] = None,
        状态: Optional[str] = None
    ) -> 咨询量主表:
        """更新最新咨询信息"""
        if 咨询者姓名:
            db_obj.最新咨询者姓名 = 咨询者姓名
        if 状态:
            db_obj.最新状态 = 状态
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_multi(
        db: Session,
        phone: Optional[str] = None,
        name: Optional[str] = None,
        campus: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[咨询量主表], int]:
        """获取咨询量主表列表"""
        query = db.query(咨询量主表)

        conditions = []
        
        if phone:
            # PostgreSQL: 使用 JSONB 的 @> 操作符检查数组是否包含元素
            import json

            from sqlalchemy import cast, text
            from sqlalchemy.dialects.postgresql import JSONB
            json_array = json.dumps([phone])
            conditions.append(cast(咨询量主表.电话列表, JSONB).op('@>')(cast(text(f"'{json_array}'"), JSONB)))
        
        if name:
            conditions.append(咨询量主表.最新咨询者姓名.like(f"%{name}%"))
        
        if campus:
            conditions.append(咨询量主表.神殿 == campus)
        
        if start_date:
            conditions.append(咨询量主表.首次登记时间 >= start_date)
        
        if end_date:
            conditions.append(咨询量主表.首次登记时间 <= end_date)

        if conditions:
            query = query.filter(and_(*conditions))

        total = query.count()
        records = query.order_by(desc(咨询量主表.最后更新时间)).offset(skip).limit(limit).all()

        return records, total

    @staticmethod
    def delete(db: Session, 对象ID: int) -> bool:
        """删除咨询量主表记录"""
        db_obj = db.query(咨询量主表).filter(咨询量主表.对象ID == 对象ID).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False


class 咨询量明细表CRUD:
    """咨询量明细表CRUD操作"""

    @staticmethod
    def create(db: Session, obj_in: 咨询量明细表创建, 对象ID: int) -> 咨询量明细表:
        """创建咨询量明细记录"""
        # 自动计算咨询次数：查询该对象已有的明细记录数量 + 1
        existing_count = db.query(咨询量明细表).filter(咨询量明细表.对象ID == 对象ID).count()
        咨询次数 = existing_count + 1
        
        db_obj = 咨询量明细表(
            对象ID=对象ID,
            咨询次数=咨询次数,
            登记日期=obj_in.登记日期,
            登记时间=getattr(obj_in, '登记时间', None),
            分量人=obj_in.分量人,
            咨询师=obj_in.咨询师,
            咨询者姓名=obj_in.咨询者姓名,
            年龄=obj_in.年龄,
            性别=obj_in.性别,
            电话=obj_in.电话,
            QQ=obj_in.QQ,
            微信=obj_in.微信,
            抖音=obj_in.抖音,
            快手=obj_in.快手,
            学历=obj_in.学历,
            状态=obj_in.状态,
            位置=obj_in.位置,
            报名意向=obj_in.报名意向,
            咨询类别=obj_in.咨询类别,
            量来源=obj_in.量来源,
            来源类别=getattr(obj_in, '来源类别', None),
            媒体来源=obj_in.媒体来源,
            关键字=obj_in.关键字,
            口碑提供人=obj_in.口碑提供人,
            备注=obj_in.备注,
            神殿=obj_in.神殿,
            录量人=obj_in.录量人,
            创建人ID=obj_in.创建人ID,
            创建人姓名=obj_in.创建人姓名,
            # 标记字段
            是否无效量=getattr(obj_in, '是否无效量', 0),
            无效原因=getattr(obj_in, '无效原因', None),
            是否不算量=getattr(obj_in, '是否不算量', 0),
            不算量原因=getattr(obj_in, '不算量原因', None),
            是否上门=getattr(obj_in, '是否上门', 0),
            上门时间=getattr(obj_in, '上门时间', None),
            是否报名=getattr(obj_in, '是否报名', 0),
            报名时间=getattr(obj_in, '报名时间', None),
            是否订座=getattr(obj_in, '是否订座', 0),
            订座时间=getattr(obj_in, '订座时间', None),
            订座金额=getattr(obj_in, '订座金额', None),
            是否校园量=getattr(obj_in, '是否校园量', 0),
            是否已交接=getattr(obj_in, '是否已交接', 0),
            # 来源分类标记
            网转上门=getattr(obj_in, '网转上门', 0),
            网络新媒体=getattr(obj_in, '网络新媒体', 0),
            口碑上门=getattr(obj_in, '口碑上门', 0),
            渠道上门=getattr(obj_in, '渠道上门', 0),
            校园新渠道=getattr(obj_in, '校园新渠道', 0),
            新媒体来源=getattr(obj_in, '新媒体来源', None),
            # 网聊/渠道专员
            网聊专员=getattr(obj_in, '网聊专员', None),
            渠道专员=getattr(obj_in, '渠道专员', None),
            代咨=getattr(obj_in, '代咨', None),
            # 扩展信息
            地区=getattr(obj_in, '地区', None),
            县=getattr(obj_in, '县', None),
            就读学校=getattr(obj_in, '就读学校', None),
            目前状态=getattr(obj_in, '目前状态', None),
            咨询时间=getattr(obj_in, '咨询时间', None),
            咨询结果=getattr(obj_in, '咨询结果', None),
            报名专业=getattr(obj_in, '报名专业', None),
            # 报名相关字段
            全款=getattr(obj_in, '全款', 0),
            分期=getattr(obj_in, '分期', 0),
            分期备注=getattr(obj_in, '分期备注', None),
            注册=getattr(obj_in, '注册', 0),
            贷款=getattr(obj_in, '贷款', 0),
            长期短期=getattr(obj_in, '长期短期', None),
            课程=getattr(obj_in, '课程', None),
            已交学费=getattr(obj_in, '已交学费', None),
            缴费金额=getattr(obj_in, '缴费金额', None),
            详细地址=getattr(obj_in, '详细地址', None),
            # 退费相关字段
            是否退费=getattr(obj_in, '是否退费', 0),
            退费原因=getattr(obj_in, '退费原因', None),
            退费金额=getattr(obj_in, '退费金额', 0),
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, 记录ID: int) -> Optional[咨询量明细表]:
        """根据记录ID获取明细"""
        return db.query(咨询量明细表).filter(咨询量明细表.记录ID == 记录ID).first()

    @staticmethod
    def get_by_object_id(db: Session, 对象ID: int) -> List[咨询量明细表]:
        """根据对象ID获取所有明细记录"""
        return db.query(咨询量明细表).filter(
            咨询量明细表.对象ID == 对象ID
        ).order_by(desc(咨询量明细表.登记日期)).all()

    @staticmethod
    def get_latest_by_object_id(db: Session, 对象ID: int) -> Optional[咨询量明细表]:
        """获取对象的最新咨询记录"""
        return db.query(咨询量明细表).filter(
            咨询量明细表.对象ID == 对象ID
        ).order_by(desc(咨询量明细表.登记日期)).first()

    @staticmethod
    def update(db: Session, db_obj: 咨询量明细表, obj_in: 咨询量明细表更新) -> 咨询量明细表:
        """更新咨询量明细记录"""
        update_data = obj_in.model_dump(exclude_unset=True, exclude={'记录ID'})
        for field, value in update_data.items():
            if field != '第二电话':  # 跳过第二电话，它需要特殊处理
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_multi(
        db: Session,
        phone: Optional[str] = None,
        name: Optional[str] = None,
        distributor: Optional[str] = None,
        consultant: Optional[str] = None,
        recorder: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        media_source: Optional[str] = None,
        specific_source: Optional[str] = None,
        category: Optional[str] = None,
        campus: Optional[str] = None,
        education: Optional[str] = None,
        is_invalid: Optional[int] = None,
        is_signup_or_reserve: Optional[int] = None,
        is_handovered: Optional[int] = None,
        is_unassigned: Optional[int] = None,
        keyword: Optional[str] = None,
        referrer: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[咨询量明细表], int]:
        """获取咨询量明细列表"""
        query = db.query(咨询量明细表)

        conditions = []
        
        if phone:
            conditions.append(咨询量明细表.电话.like(f"%{phone}%"))
        
        if name:
            conditions.append(咨询量明细表.咨询者姓名.like(f"%{name}%"))
        
        if distributor:
            conditions.append(咨询量明细表.分量人 == distributor)
        
        if consultant:
            conditions.append(咨询量明细表.咨询师 == consultant)
        
        # 筛选未分配咨询量（咨询师为空）
        if is_unassigned == 1:
            conditions.append(or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == ''))
        
        if recorder:
            conditions.append(咨询量明细表.录量人 == recorder)
        
        if status:
            conditions.append(咨询量明细表.状态 == status)
        
        if source:
            conditions.append(咨询量明细表.量来源 == source)
        
        if media_source:
            conditions.append(咨询量明细表.媒体来源 == media_source)
        
        if category:
            conditions.append(咨询量明细表.咨询类别 == category)
        
        if campus:
            conditions.append(咨询量明细表.神殿 == campus)
        
        if education:
            conditions.append(咨询量明细表.学历 == education)
        
        if is_invalid is not None:
            conditions.append(咨询量明细表.是否无效量 == is_invalid)
        
        # 筛选报名或订座的记录（用于交接功能）
        if is_signup_or_reserve == 1:
            conditions.append(or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1))
        
        # 筛选未交接/已交接的记录
        if is_handovered is not None:
            conditions.append(咨询量明细表.是否已交接 == is_handovered)
        
        if specific_source:
            # 具体来源可能在媒体来源字段中
            conditions.append(咨询量明细表.媒体来源 == specific_source)
        
        if referrer:
            # 口碑提供人搜索（模糊匹配）
            conditions.append(咨询量明细表.口碑提供人.like(f"%{referrer}%"))
        
        if start_date:
            conditions.append(咨询量明细表.登记日期 >= start_date)
        
        if end_date:
            conditions.append(咨询量明细表.登记日期 <= end_date)
        
        # 全文模糊搜索关键字 - 在多个字段中搜索
        if keyword:
            keyword_pattern = f"%{keyword}%"
            keyword_conditions = or_(
                咨询量明细表.电话.like(keyword_pattern),
                咨询量明细表.咨询者姓名.like(keyword_pattern),
                咨询量明细表.备注.like(keyword_pattern),
                咨询量明细表.位置.like(keyword_pattern),
                咨询量明细表.QQ.like(keyword_pattern),
                咨询量明细表.微信.like(keyword_pattern),
                咨询量明细表.抖音.like(keyword_pattern),
                咨询量明细表.快手.like(keyword_pattern),
                咨询量明细表.关键字.like(keyword_pattern),
                咨询量明细表.咨询结果.like(keyword_pattern),
                咨询量明细表.就读学校.like(keyword_pattern),
                咨询量明细表.地区.like(keyword_pattern),
                咨询量明细表.报名专业.like(keyword_pattern),
                咨询量明细表.口碑提供人.like(keyword_pattern),
            )
            conditions.append(keyword_conditions)

        if conditions:
            query = query.filter(and_(*conditions))

        total = query.count()
        records = query.order_by(desc(咨询量明细表.登记日期)).offset(skip).limit(limit).all()

        return records, total

    @staticmethod
    def count_by_object_id(db: Session, 对象ID: int) -> int:
        """统计对象的咨询次数"""
        return db.query(咨询量明细表).filter(咨询量明细表.对象ID == 对象ID).count()

    @staticmethod
    def delete(db: Session, 记录ID: int) -> bool:
        """删除咨询量明细记录"""
        db_obj = db.query(咨询量明细表).filter(咨询量明细表.记录ID == 记录ID).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False

    @staticmethod
    def recalculate_consultation_count(db: Session, 对象ID: int) -> None:
        """
        重新计算对象的所有明细记录的咨询次数
        根据登记日期排序，从1开始递增编号
        """
        records = db.query(咨询量明细表).filter(
            咨询量明细表.对象ID == 对象ID
        ).order_by(咨询量明细表.登记日期.asc(), 咨询量明细表.记录ID.asc()).all()
        
        for index, record in enumerate(records, start=1):
            record.咨询次数 = index
        
        db.commit()


class 咨询量服务:
    """咨询量业务服务"""

    @staticmethod
    def 录入咨询量(
        db: Session,
        obj_in: 咨询量明细表创建
    ) -> Tuple[咨询量主表, 咨询量明细表, bool]:
        """
        录入咨询量
        返回: (主表记录, 明细记录, 是否为重复咨询)
        
        业务规则：
        - 如果电话已存在，返回重量标记，阻止录入
        - 新咨询创建主表和明细记录
        """
        # 准备电话列表（过滤空值）
        phones = []
        if obj_in.电话 and obj_in.电话.strip():
            phones.append(obj_in.电话.strip())
        if obj_in.第二电话 and obj_in.第二电话.strip():
            phones.append(obj_in.第二电话.strip())
        # 微信号如果是手机号格式，也加入电话联合查重
        wechat = obj_in.微信.strip() if obj_in.微信 and obj_in.微信.strip() else None
        if wechat and _is_phone_number(wechat) and wechat not in phones:
            phones.append(wechat)

        # 检查电话重量（含手机号格式的微信号）
        existing = None
        if phones:
            existing = 咨询量主表CRUD.check_duplicate(db, phones)
        
        if existing:
            raise ValueError(f"电话号码已存在，不允许重复录入。对象ID: {existing.对象ID}")

        # 检查微信重量（微信号作为微信号查重）
        if wechat:
            wechat_existing = 咨询量主表CRUD.check_duplicate_wechat(db, wechat)
            if wechat_existing:
                raise ValueError(f"微信号已存在，不允许重复录入。对象ID: {wechat_existing.对象ID}")

        # 新咨询 - 创建主表和明细
        # 首次咨询日期列表
        consultation_dates = [obj_in.登记日期.isoformat() if isinstance(obj_in.登记日期, datetime) else str(obj_in.登记日期)]
        
        主表创建 = 咨询量主表创建(
            电话列表=phones,
            咨询日期列表=consultation_dates,
            最新咨询者姓名=obj_in.咨询者姓名,
            最新状态=obj_in.状态,
            首次登记时间=obj_in.登记日期,
            首次分量人=obj_in.分量人,
            首次咨询师=obj_in.咨询师,
            神殿=obj_in.神殿,
        )
        主表 = 咨询量主表CRUD.create(db, 主表创建)

        # 创建明细记录
        明细 = 咨询量明细表CRUD.create(db, obj_in, 主表.对象ID)

        return 主表, 明细, False

    @staticmethod
    def 检查重量(db: Session, phone: str, second_phone: Optional[str] = None, wechat: Optional[str] = None) -> dict:
        """
        检查是否重量
        1. 电话和第二电话联合查重：任意一个号码在数据库中存在就算重量
        2. 微信号单独查重：微信号在数据库中已存在就算重量
        返回重量信息
        """
        phones = []
        if phone and phone.strip():
            phones.append(phone.strip())
        if second_phone and second_phone.strip():
            phones.append(second_phone.strip())
        # 微信号如果是手机号格式，也加入电话联合查重
        wechat_clean = wechat.strip() if wechat else None
        if wechat_clean and _is_phone_number(wechat_clean) and wechat_clean not in phones:
            phones.append(wechat_clean)
        
        not_found = {
            "是否重量": False,
            "对象ID": None,
            "咨询次数": None,
            "最新咨询信息": None,
            "电话列表": None,
            "咨询日期列表": None,
            "重量神殿": None,
            "重量类型": None,
            "重量微信": None,
        }

        # 1. 电话查重（第一电话和第二电话联合查重）
        if phones:
            existing = 咨询量主表CRUD.check_duplicate(db, phones)
            if existing:
                latest_detail = 咨询量明细表CRUD.get_latest_by_object_id(db, existing.对象ID)
                return {
                    "是否重量": True,
                    "对象ID": existing.对象ID,
                    "咨询次数": existing.咨询次数,
                    "最新咨询信息": latest_detail,
                    "电话列表": existing.电话列表,
                    "咨询日期列表": existing.咨询日期列表,
                    "重量神殿": existing.神殿,
                    "重量类型": "电话重复",
                    "重量微信": None,
                }

        # 2. 微信号单独查重
        if wechat and wechat.strip():
            existing = 咨询量主表CRUD.check_duplicate_wechat(db, wechat)
            if existing:
                latest_detail = 咨询量明细表CRUD.get_latest_by_object_id(db, existing.对象ID)
                return {
                    "是否重量": True,
                    "对象ID": existing.对象ID,
                    "咨询次数": existing.咨询次数,
                    "最新咨询信息": latest_detail,
                    "电话列表": existing.电话列表,
                    "咨询日期列表": existing.咨询日期列表,
                    "重量神殿": existing.神殿,
                    "重量类型": "微信重复",
                    "重量微信": wechat.strip(),
                }

        return not_found

    @staticmethod
    def 获取完整咨询信息(db: Session, 对象ID: int) -> dict | None:
        """获取咨询量的完整信息（主表+所有明细）"""
        主表 = 咨询量主表CRUD.get_by_id(db, 对象ID)
        if not 主表:
            return None
        
        明细列表 = 咨询量明细表CRUD.get_by_object_id(db, 对象ID)
        
        return {
            "主表信息": 主表,
            "明细列表": 明细列表,
        }
