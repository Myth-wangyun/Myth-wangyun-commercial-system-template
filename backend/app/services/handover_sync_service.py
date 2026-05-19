"""
交接数据同步服务
实现咨询量交接到教化司的数据联动：
1. 交接时自动同步到「当月新生维稳明细表」
2. 同步缴费信息到「新生仍欠费明细表」（如有欠费）
3. 支持后续缴费更新时自动同步欠费状态
"""

from datetime import datetime
from typing import Any, Dict, Optional

from app.models.consult.consultation_record import 咨询量明细表
from app.models.consult.handover import 咨询量交接记录
from app.models.consult.payment_record import 咨询缴费记录表
from sqlalchemy import text
from sqlalchemy.orm import Session


def _get_payment_info(db: Session, 记录ID: int) -> Optional[咨询缴费记录表]:
    """获取咨询记录对应的缴费信息"""
    return db.query(咨询缴费记录表).filter(咨询缴费记录表.记录ID == 记录ID).first()


def _get_consultation_record(db: Session, 记录ID: int) -> Optional[咨询量明细表]:
    """获取咨询量明细记录"""
    return db.query(咨询量明细表).filter(咨询量明细表.记录ID == 记录ID).first()


def _normalize_campus_name(campus: str) -> str:
    """规范化神殿名称（去掉"神殿"后缀）"""
    if not campus:
        return ""
    campus = campus.strip()
    if campus.endswith("神殿"):
        return campus[:-2]
    return campus


def _get_next_seq(db: Session, table_name: str, 神殿名称: str, 年份: int, 月份: int) -> int:
    """获取指定表的下一个序号"""
    result = db.execute(text(f"""
        SELECT COALESCE(MAX("序号"), 0) + 1 as next_seq
        FROM teaching_quality."{table_name}"
        WHERE "神殿名称" = :campus
          AND "年份" = :year
          AND "月份" = :month
    """), {"campus": 神殿名称, "year": 年份, "month": 月份}).fetchone()
    return result.next_seq if result else 1


def _check_student_exists(db: Session, table_name: str, 神殿名称: str, 年份: int, 月份: int, 新生姓名: str) -> bool:
    """检查学生是否已存在于指定表"""
    result = db.execute(text(f"""
        SELECT COUNT(*) as cnt
        FROM teaching_quality."{table_name}"
        WHERE "神殿名称" = :campus
          AND "年份" = :year
          AND "月份" = :month
          AND "新生姓名" = :name
    """), {"campus": 神殿名称, "year": 年份, "month": 月份, "name": 新生姓名}).fetchone()
    return result.cnt > 0 if result else False


def sync_to_stability_detail(
    db: Session,
    *,
    record: 咨询量明细表,
    handover: 咨询量交接记录,
    payment: Optional[咨询缴费记录表] = None,
    班主任姓名: str = "",
) -> bool:
    """
    同步到「当月新生维稳明细表」
    交接后自动触发，将咨询量信息同步到教化司新生维稳表
    
    Args:
        record: 咨询量明细记录
        handover: 交接记录
        payment: 缴费记录（可选）
        班主任姓名: 分配的班主任（可选）
    
    Returns:
        是否同步成功
    """
    try:
        # 确定年月（使用报名时间或交接时间）
        sync_time = record.报名时间 or handover.交接时间 or datetime.now()
        年份 = sync_time.year
        月份 = sync_time.month
        
        # 规范化神殿名称
        神殿名称 = _normalize_campus_name(record.神殿 or handover.神殿 or "")
        
        if not 神殿名称:
            print(f"[sync] 无法同步：神殿名称为空，记录ID={record.记录ID}")
            return False
        
        # 检查是否已存在
        if _check_student_exists(db, "当月新生维稳明细表", 神殿名称, 年份, 月份, record.咨询者姓名):
            print(f"[sync] 学生 {record.咨询者姓名} 已存在于 当月新生维稳明细表 ({神殿名称}/{年份}/{月份})")
            # 更新已存在记录
            return _update_stability_detail(db, record, handover, payment, 班主任姓名, 神殿名称, 年份, 月份)
        
        # 获取下一个序号
        next_seq = _get_next_seq(db, "当月新生维稳明细表", 神殿名称, 年份, 月份)
        
        # 准备字段值
        应收学费 = payment.应交金额 if payment else 0
        报名交费金额 = payment.首款金额 if payment else 0
        仍欠费金额 = payment.欠费金额 if payment else 0
        是否全款 = "是" if (payment and payment.欠费金额 == 0 and payment.已交总额 > 0) else (
            "是" if record.全款 == 1 else "否"
        )
        是否贷款 = "是" if record.贷款 == 1 else "否"
        是否退费 = "是" if record.是否退费 == 1 else "否"
        
        # 插入到当月新生维稳明细表
        db.execute(text("""
            INSERT INTO teaching_quality."当月新生维稳明细表" (
                "神殿名称", "年份", "月份", "序号",
                "班主任姓名", "新生姓名", "报名时间", "报道时间",
                "报名专业", "报名学制", "应收学费", "报名交费金额",
                "补款金额", "仍欠费金额", "是否全款", "是否贷款",
                "是否过课时", "试学周期", "是否退费", "退费时间",
                "退费情况说明", "咨询师", "教员", "是否住宿",
                "宿舍名", "备注", "创建时间"
            ) VALUES (
                :campus, :year, :month, :seq,
                :teacher, :name, :signup_time, :report_time,
                :major, :program, :tuition_should, :tuition_paid,
                :additional, :arrears, :full_payment, :is_loan,
                :attended, :trial_period, :is_refund, :refund_time,
                :refund_note, :consultant, :instructor, :has_dorm,
                :dorm_name, :remark, :create_time
            )
        """), {
            "campus": 神殿名称,
            "year": 年份,
            "month": 月份,
            "seq": next_seq,
            "teacher": 班主任姓名 or handover.分配班主任 or "",
            "name": record.咨询者姓名 or "",
            "signup_time": record.报名时间.strftime("%Y-%m-%d") if record.报名时间 else "",
            "report_time": "",  # 报道时间由教化司填写
            "major": record.报名专业 or "",
            "program": record.长期短期 or "",
            "tuition_should": 应收学费,
            "tuition_paid": 报名交费金额,
            "additional": 0,  # 补款金额初始为0
            "arrears": 仍欠费金额,
            "full_payment": 是否全款,
            "is_loan": 是否贷款,
            "attended": "",  # 是否过课时由教化司填写
            "trial_period": "",  # 试学周期由教化司填写
            "is_refund": 是否退费,
            "refund_time": record.退费金额 if record.是否退费 == 1 else "",  # 退费时间
            "refund_note": record.退费原因 or "",
            "consultant": record.咨询师 or "",
            "instructor": "",  # 教员由教化司填写
            "has_dorm": "",  # 是否住宿由教化司填写
            "dorm_name": "",  # 宿舍名由教化司填写
            "remark": f"从咨询系统交接同步 - 记录ID:{record.记录ID}",
            "create_time": datetime.now(),
        })
        
        db.flush()
        print(f"[sync] 成功同步到当月新生维稳明细表: {record.咨询者姓名} ({神殿名称}/{年份}/{月份})")
        return True
        
    except Exception as e:
        print(f"[sync] 同步到当月新生维稳明细表失败: {e}")
        return False


def _update_stability_detail(
    db: Session,
    record: 咨询量明细表,
    handover: 咨询量交接记录,
    payment: Optional[咨询缴费记录表],
    班主任姓名: str,
    神殿名称: str,
    年份: int,
    月份: int,
) -> bool:
    """更新已存在的新生维稳明细记录"""
    try:
        应收学费 = payment.应交金额 if payment else 0
        报名交费金额 = payment.首款金额 if payment else 0
        仍欠费金额 = payment.欠费金额 if payment else 0
        是否全款 = "是" if (payment and payment.欠费金额 == 0 and payment.已交总额 > 0) else "否"
        是否贷款 = "是" if record.贷款 == 1 else "否"
        是否退费 = "是" if record.是否退费 == 1 else "否"
        
        # 只更新可自动获取的字段，不覆盖教化司已填写的字段
        db.execute(text("""
            UPDATE teaching_quality."当月新生维稳明细表"
            SET "应收学费" = COALESCE(NULLIF(:tuition_should, 0), "应收学费"),
                "报名交费金额" = COALESCE(NULLIF(:tuition_paid, 0), "报名交费金额"),
                "仍欠费金额" = :arrears,
                "是否全款" = :full_payment,
                "是否贷款" = :is_loan,
                "是否退费" = :is_refund,
                "退费情况说明" = COALESCE(NULLIF(:refund_note, ''), "退费情况说明"),
                "班主任姓名" = COALESCE(NULLIF(:teacher, ''), "班主任姓名"),
                "更新时间" = :update_time
            WHERE "神殿名称" = :campus
              AND "年份" = :year
              AND "月份" = :month
              AND "新生姓名" = :name
        """), {
            "campus": 神殿名称,
            "year": 年份,
            "month": 月份,
            "name": record.咨询者姓名,
            "tuition_should": 应收学费,
            "tuition_paid": 报名交费金额,
            "arrears": 仍欠费金额,
            "full_payment": 是否全款,
            "is_loan": 是否贷款,
            "is_refund": 是否退费,
            "refund_note": record.退费原因 or "",
            "teacher": 班主任姓名 or handover.分配班主任 or "",
            "update_time": datetime.now(),
        })
        
        db.flush()
        print(f"[sync] 成功更新当月新生维稳明细表: {record.咨询者姓名}")
        return True
        
    except Exception as e:
        print(f"[sync] 更新当月新生维稳明细表失败: {e}")
        return False


def sync_to_arrears_detail(
    db: Session,
    *,
    record: 咨询量明细表,
    handover: 咨询量交接记录,
    payment: 咨询缴费记录表,
    班主任姓名: str = "",
) -> bool:
    """
    同步到「新生仍欠费明细表」
    仅当学生有欠费时才同步
    
    Args:
        record: 咨询量明细记录
        handover: 交接记录
        payment: 缴费记录
        班主任姓名: 分配的班主任（可选）
    
    Returns:
        是否同步成功
    """
    try:
        # 只有欠费才同步到欠费明细表
        if not payment or payment.欠费金额 <= 0:
            print(f"[sync] 学生 {record.咨询者姓名} 无欠费，跳过同步到欠费明细表")
            return True
        
        # 确定年月
        sync_time = record.报名时间 or handover.交接时间 or datetime.now()
        年份 = sync_time.year
        月份 = sync_time.month
        
        # 规范化神殿名称
        神殿名称 = _normalize_campus_name(record.神殿 or handover.神殿 or "")
        
        if not 神殿名称:
            print(f"[sync] 无法同步：神殿名称为空，记录ID={record.记录ID}")
            return False
        
        # 检查是否已存在
        if _check_student_exists(db, "新生仍欠费明细表", 神殿名称, 年份, 月份, record.咨询者姓名):
            print(f"[sync] 学生 {record.咨询者姓名} 已存在于 新生仍欠费明细表 ({神殿名称}/{年份}/{月份})")
            # 更新已存在记录
            return _update_arrears_detail(db, record, handover, payment, 班主任姓名, 神殿名称, 年份, 月份)
        
        # 获取下一个序号
        next_seq = _get_next_seq(db, "新生仍欠费明细表", 神殿名称, 年份, 月份)
        
        # 准备字段值
        是否全款 = "否"  # 有欠费肯定不是全款
        是否贷款 = "是" if record.贷款 == 1 else "否"
        是否退费 = "是" if record.是否退费 == 1 else "否"
        
        # 插入到新生仍欠费明细表
        db.execute(text("""
            INSERT INTO teaching_quality."新生仍欠费明细表" (
                "神殿名称", "年份", "月份", "序号",
                "班主任姓名", "新生姓名", "报名时间", "报道时间",
                "报名专业", "报名学制", "应收学费", "报名交费金额",
                "补款金额", "仍欠费金额", "是否全款", "是否贷款",
                "是否过课时", "试学周期", "是否退费", "退费情况说明",
                "咨询师", "是否住宿", "宿舍名称", "备注", "创建时间"
            ) VALUES (
                :campus, :year, :month, :seq,
                :teacher, :name, :signup_time, :report_time,
                :major, :program, :tuition_should, :tuition_paid,
                :additional, :arrears, :full_payment, :is_loan,
                :attended, :trial_period, :is_refund, :refund_note,
                :consultant, :has_dorm, :dorm_name, :remark, :create_time
            )
        """), {
            "campus": 神殿名称,
            "year": 年份,
            "month": 月份,
            "seq": next_seq,
            "teacher": 班主任姓名 or handover.分配班主任 or "",
            "name": record.咨询者姓名 or "",
            "signup_time": record.报名时间.strftime("%Y-%m-%d") if record.报名时间 else "",
            "report_time": "",
            "major": record.报名专业 or "",
            "program": record.长期短期 or "",
            "tuition_should": payment.应交金额 or 0,
            "tuition_paid": payment.首款金额 or 0,
            "additional": 0,
            "arrears": payment.欠费金额 or 0,
            "full_payment": 是否全款,
            "is_loan": 是否贷款,
            "attended": "",
            "trial_period": "",
            "is_refund": 是否退费,
            "refund_note": record.退费原因 or "",
            "consultant": record.咨询师 or "",
            "has_dorm": "",
            "dorm_name": "",
            "remark": f"从咨询系统交接同步 - 记录ID:{record.记录ID}",
            "create_time": datetime.now(),
        })
        
        db.flush()
        print(f"[sync] 成功同步到新生仍欠费明细表: {record.咨询者姓名} ({神殿名称}/{年份}/{月份})")
        return True
        
    except Exception as e:
        print(f"[sync] 同步到新生仍欠费明细表失败: {e}")
        return False


def _update_arrears_detail(
    db: Session,
    record: 咨询量明细表,
    handover: 咨询量交接记录,
    payment: 咨询缴费记录表,
    班主任姓名: str,
    神殿名称: str,
    年份: int,
    月份: int,
) -> bool:
    """更新已存在的欠费明细记录"""
    try:
        是否贷款 = "是" if record.贷款 == 1 else "否"
        是否退费 = "是" if record.是否退费 == 1 else "否"
        
        db.execute(text("""
            UPDATE teaching_quality."新生仍欠费明细表"
            SET "应收学费" = COALESCE(NULLIF(:tuition_should, 0), "应收学费"),
                "报名交费金额" = COALESCE(NULLIF(:tuition_paid, 0), "报名交费金额"),
                "仍欠费金额" = :arrears,
                "是否贷款" = :is_loan,
                "是否退费" = :is_refund,
                "退费情况说明" = COALESCE(NULLIF(:refund_note, ''), "退费情况说明"),
                "班主任姓名" = COALESCE(NULLIF(:teacher, ''), "班主任姓名"),
                "更新时间" = :update_time
            WHERE "神殿名称" = :campus
              AND "年份" = :year
              AND "月份" = :month
              AND "新生姓名" = :name
        """), {
            "campus": 神殿名称,
            "year": 年份,
            "month": 月份,
            "name": record.咨询者姓名,
            "tuition_should": payment.应交金额 or 0,
            "tuition_paid": payment.首款金额 or 0,
            "arrears": payment.欠费金额 or 0,
            "is_loan": 是否贷款,
            "is_refund": 是否退费,
            "refund_note": record.退费原因 or "",
            "teacher": 班主任姓名 or handover.分配班主任 or "",
            "update_time": datetime.now(),
        })
        
        db.flush()
        print(f"[sync] 成功更新新生仍欠费明细表: {record.咨询者姓名}")
        return True
        
    except Exception as e:
        print(f"[sync] 更新新生仍欠费明细表失败: {e}")
        return False


def remove_from_arrears_detail(
    db: Session,
    *,
    神殿名称: str,
    新生姓名: str,
) -> bool:
    """
    从欠费明细表中移除记录（当学生缴清欠费时调用）
    """
    try:
        神殿名称 = _normalize_campus_name(神殿名称)
        
        db.execute(text("""
            DELETE FROM teaching_quality."新生仍欠费明细表"
            WHERE "神殿名称" = :campus
              AND "新生姓名" = :name
        """), {"campus": 神殿名称, "name": 新生姓名})
        
        db.flush()
        print(f"[sync] 已从新生仍欠费明细表移除: {新生姓名}")
        return True
        
    except Exception as e:
        print(f"[sync] 从欠费明细表移除失败: {e}")
        return False


def sync_handover_to_teaching_quality(
    db: Session,
    handover: 咨询量交接记录,
    班主任姓名: str = "",
) -> Dict[str, Any]:
    """
    完整的交接同步流程
    交接记录分配班级后自动调用，同步到教化司相关表
    
    Args:
        db: 数据库会话
        handover: 交接记录
        班主任姓名: 分配的班主任
    
    Returns:
        同步结果 {"success": bool, "stability": bool, "arrears": bool, "message": str}
    """
    result = {
        "success": False,
        "stability_synced": False,
        "arrears_synced": False,
        "message": "",
    }
    
    try:
        # 获取咨询量明细记录
        record = _get_consultation_record(db, handover.咨询记录ID)
        if not record:
            result["message"] = f"咨询记录不存在: {handover.咨询记录ID}"
            return result
        
        # 获取缴费记录
        payment = _get_payment_info(db, handover.咨询记录ID)
        
        # 同步到当月新生维稳明细表
        result["stability_synced"] = sync_to_stability_detail(
            db,
            record=record,
            handover=handover,
            payment=payment,
            班主任姓名=班主任姓名,
        )
        
        # 如果有欠费，同步到新生仍欠费明细表
        if payment and payment.欠费金额 > 0:
            result["arrears_synced"] = sync_to_arrears_detail(
                db,
                record=record,
                handover=handover,
                payment=payment,
                班主任姓名=班主任姓名,
            )
        else:
            result["arrears_synced"] = True  # 无欠费，视为成功
        
        result["success"] = result["stability_synced"]
        result["message"] = "同步成功" if result["success"] else "同步失败"
        
        return result
        
    except Exception as e:
        result["message"] = f"同步异常: {str(e)}"
        return result


def update_payment_sync(
    db: Session,
    记录ID: int,
) -> Dict[str, Any]:
    """
    缴费信息更新后同步
    当学生补交学费或缴清欠费时调用
    
    Args:
        db: 数据库会话
        记录ID: 咨询量明细记录ID
    
    Returns:
        同步结果
    """
    result = {
        "success": False,
        "message": "",
    }
    
    try:
        # 获取记录
        record = _get_consultation_record(db, 记录ID)
        if not record:
            result["message"] = f"咨询记录不存在: {记录ID}"
            return result
        
        # 检查是否已交接
        if record.是否已交接 != 1:
            result["message"] = "记录未交接，无需同步"
            result["success"] = True
            return result
        
        # 获取交接记录
        handover = db.query(咨询量交接记录).filter(
            咨询量交接记录.咨询记录ID == 记录ID
        ).first()
        
        if not handover:
            result["message"] = "交接记录不存在"
            return result
        
        # 获取缴费记录
        payment = _get_payment_info(db, 记录ID)
        if not payment:
            result["message"] = "缴费记录不存在"
            return result
        
        # 更新当月新生维稳明细表中的缴费信息
        神殿名称 = _normalize_campus_name(record.神殿 or handover.神殿 or "")
        sync_time = record.报名时间 or handover.交接时间 or datetime.now()
        年份 = sync_time.year
        月份 = sync_time.month
        
        # 更新维稳明细表
        _update_stability_detail(
            db, record, handover, payment,
            handover.分配班主任 or "",
            神殿名称, 年份, 月份
        )
        
        # 处理欠费明细表
        if payment.欠费金额 > 0:
            # 有欠费，更新或插入欠费记录
            if _check_student_exists(db, "新生仍欠费明细表", 神殿名称, 年份, 月份, record.咨询者姓名):
                _update_arrears_detail(
                    db, record, handover, payment,
                    handover.分配班主任 or "",
                    神殿名称, 年份, 月份
                )
            else:
                sync_to_arrears_detail(
                    db,
                    record=record,
                    handover=handover,
                    payment=payment,
                    班主任姓名=handover.分配班主任 or "",
                )
        else:
            # 已缴清，从欠费明细表移除
            remove_from_arrears_detail(
                db,
                神殿名称=神殿名称,
                新生姓名=record.咨询者姓名,
            )
        
        # 提交更改
        db.commit()
        
        result["success"] = True
        result["message"] = "缴费信息同步成功"
        return result
        
    except Exception as e:
        db.rollback()
        result["message"] = f"同步异常: {str(e)}"
        return result
