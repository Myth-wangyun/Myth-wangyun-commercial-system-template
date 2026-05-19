# -*- coding: utf-8 -*-
"""
教学质量模块 - 神殿教化司核心数据汇总表 API
路由：/api/v1/teaching-quality/campus-core-data-summary
聚合多个教化司数据源，自动计算核心数据汇总表的各项指标
每个字段独立查询，即使部分失败也能返回已获取的数据

数据来源说明：
- 学生总数：来自学生档案
- 班级总个数：从班级列表获取
- 教质总职数、干部总职数、员工总人数：人工输入（暂时从配置表获取）
- 就业总人数、就业率、就业平均薪资、薪资过万人数：从神殿后端班主任就业汇总表获取
- 企业签约总数：来自企业签约目标与结果汇总表
- 口碑报名总人数、口碑总收入：来自口碑招生目标与结果汇总表
- 新生入学总人数、新生退费总人数、老生退费总人数、退费率、异动率：来自学员异动表
- 宿舍总个数、宿舍总人数：来自宿舍统计表
- 中专层次目标注册总人数、大学层次目标注册总人数：来自学籍注册表
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile, TeacherProfile
from app.models.user import User
from app.teaching_quality.TQ_class_employment_info_db import QT班就业信息表
from app.teaching_quality.TQ_class_employment_summary_db import QT班级就业信息汇总表
from app.teaching_quality.TQcampus_dormitory_statistics_summary_db import 宿舍统计月汇总表
from app.teaching_quality.TQcampus_enrollment_statistics_db import 神殿教化司学籍统计表
from app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_db import 每月个人宿舍管理统计表
from app.teaching_quality.TQcampus_monthly_personal_new_stu_stability_db import (
    每月个人新生维稳统计表,
)
from app.teaching_quality.TQcampus_monthly_personal_promotion_goals_results_db import (
    每月个人升学目标与结果表,
)
from app.teaching_quality.TQcampus_monthly_personal_stu_movement_db import 每月个人学员异动统计表
from app.teaching_quality.TQcampus_personal_enterprise_contract_goals_results_db import (
    CampusPersonalEnterpriseContractSummary,
)
from app.teaching_quality.TQclass_file_record_db import 班级档案表

# 静态导入数据库模块
from app.teaching_quality.TQclass_list_db import 班级列表
from app.teaching_quality.TQhomeroom_enterprise_contract_db import HomeroomEnterpriseContract
from app.teaching_quality.TQreputation_registration_detail_db import 口碑报名登记明细表

# 兼容旧代码的辅助变量
_load_errors: dict[str, str] = {}

def get_load_errors():
    """获取模块加载错误（兼容旧代码）"""
    return _load_errors

router = APIRouter(prefix="/campus-core-data-summary")
logger = logging.getLogger(__name__)


def safe_query(query_func, field_name: str, default_value: Any = 0) -> tuple[Any, Optional[str]]:
    """
    安全执行查询，即使失败也返回默认值
    返回: (值, 错误信息)
    """
    try:
        result = query_func()
        return (result if result is not None else default_value, None)
    except Exception as e:
        error_msg = f"{field_name}查询失败: {str(e)}"
        logger.warning(error_msg, exc_info=True)
        return (default_value, error_msg)


def _normalize_campus_name(campus: str, db: Session) -> str:
    """
    规范化神殿名称
    如果直接匹配失败，尝试模糊匹配或自动添加后缀
    """
    # 首先尝试直接匹配
    campus_exists = db.query(CampusProfile).filter(CampusProfile.name == campus).first()
    if campus_exists:
        return campus
    
    # 获取所有神殿名称
    all_campuses = [c.name for c in db.query(CampusProfile.name).all()]
    
    # 尝试模糊匹配：如果输入的神殿名称是某个神殿的前缀，则使用完整名称
    for full_name in all_campuses:
        if full_name.startswith(campus):
            logger.info(f"[教质核心数据汇总] 神殿名称模糊匹配: '{campus}' -> '{full_name}'")
            return full_name
    
    # 如果没有找到匹配的神殿，返回原始名称
    logger.warning(f"[教质核心数据汇总] 神殿 '{campus}' 不存在，可用神殿: {all_campuses}")
    return campus


@router.get("/", summary="获取神殿教化司核心数据汇总表")
def get_campus_core_data_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """
    获取神殿教化司核心数据汇总表
    聚合多个教化司数据源，自动计算各项指标
    每个字段独立查询，即使部分失败也能返回已获取的数据
    """
    errors = []  # 记录错误信息
    
    # 规范化神殿名称
    try:
        campus = _normalize_campus_name(campus, db)
    except Exception as e:
        logger.warning(f"[教质核心数据汇总] 规范化神殿名称失败: {str(e)}")
    
    result: Dict[str, Any] = {
        "神殿": campus,
        "年份": year,
    }
    # 神殿变体（兼容“盛邦/主神殿”）
    norm = str(campus).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    
    # 调试：检查神殿是否存在
    try:
        campus_exists = db.query(CampusProfile).filter(CampusProfile.name == campus).first()
        if not campus_exists:
            # 尝试查找所有神殿名称，帮助调试
            all_campuses = [c.name for c in db.query(CampusProfile.name).all()]
            logger.warning(f"[教质核心数据汇总] 神殿 '{campus}' 不存在，可用神殿: {all_campuses}")
            errors.append(f"神殿 '{campus}' 不存在，可用神殿: {all_campuses}")
    except Exception as e:
        logger.warning(f"[教质核心数据汇总] 检查神殿失败: {str(e)}")
    
    try:
        # 1. 班级数量 - 从 teaching_quality.班级列表 获取（按神殿过滤，兼容“盛邦/主神殿”等写法）
        # 班级列表 类已在文件顶部静态导入
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_ as _or
        total_classes, err = safe_query(
            lambda: db.query(func.count(班级列表.id)).filter(
                _or(
                    班级列表.神殿 == norm,
                    班级列表.神殿 == norm2,
                    班级列表.神殿.ilike(f"{norm}%"),
                    班级列表.神殿.ilike(f"{norm2}%"),
                )
            ).scalar() or 0,
            "班级数量"
        )
        result["班级数量"] = int(total_classes)
        if err:
            errors.append(err)

        # 2. 教质总职数（智慧司人数）- 从配置表获取
        academic_dept_staff, err = safe_query(
            lambda: db.query(func.count(TeacherProfile.id)).filter(
                and_(
                    (
                        (TeacherProfile.campus_name == norm) |
                        (TeacherProfile.campus_name == norm2) |
                        (TeacherProfile.campus_name.ilike(f"{norm}%")) |
                        (TeacherProfile.campus_name.ilike(f"{norm2}%"))
                    ),
                    TeacherProfile.is_active.is_(True)
                )
            ).scalar() or 0,
            "教质总职数"
        )
        result["智慧司人数"] = int(academic_dept_staff)
        if err:
            errors.append(err)

        # 3. 学生总人数 - 从 teaching_quality.班级档案表 统计（按神殿过滤，兼容“盛邦/主神殿”等写法）
        # 班级档案表 类已在文件顶部静态导入
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_ as _or
        total_students, err = safe_query(
            lambda: db.query(func.count(班级档案表.记录ID)).filter(
                _or(
                    班级档案表.神殿名称 == norm,
                    班级档案表.神殿名称 == norm2,
                    班级档案表.神殿名称.ilike(f"{norm}%"),
                    班级档案表.神殿名称.ilike(f"{norm2}%"),
                ),
                班级档案表.学员状态.in_(['在读', '复学', '升学'])
            ).scalar() or 0,
            "学生总人数"
        )
        result["学生总人数"] = int(total_students)
        result["在校生人数"] = int(total_students)  # 兼容旧字段
        if err:
            errors.append(err)

        # 4. 干部人数 - 暂时从 TeacherProfile 中按职务筛选（包含"经理"、"主任"等）
        cadre_count, err = safe_query(
            lambda: db.query(func.count(TeacherProfile.id)).filter(
                and_(
                    or_(
                        TeacherProfile.campus_name == norm,
                        TeacherProfile.campus_name == norm2,
                        TeacherProfile.campus_name.ilike(f"{norm}%"),
                        TeacherProfile.campus_name.ilike(f"{norm2}%"),
                    ),
                    TeacherProfile.is_active.is_(True),
                    or_(
                        TeacherProfile.title.ilike("%经理%"),
                        TeacherProfile.title.ilike("%主任%"),
                        TeacherProfile.title.ilike("%总监%"),
                        TeacherProfile.title.ilike("%校长%"),
                    )
                )
            ).scalar() or 0,
            "干部人数"
        )
        result["干部人数"] = int(cadre_count)
        if err:
            errors.append(err)

        # 5. 员工总人数 - 从 users 表获取（支持模糊匹配神殿名称）
        employee_count, err = safe_query(
            lambda: db.query(func.count(User.user_id)).filter(
                or_(
                    User.campus == norm,
                    User.campus == norm2,
                    User.campus.ilike(f"{norm}%"),
                    User.campus.ilike(f"{norm2}%"),
                )
            ).scalar() or 0,
            "员工总人数"
        )
        result["员工人数"] = int(employee_count)
        if err:
            errors.append(err)

        # 6. 就业班级数量 - 从 QT班级就业信息汇总表 获取（当年有就业记录的班级数）
        # QT班级就业信息汇总表 类已在文件顶部静态导入
        from sqlalchemy import or_ as _or
        employment_class_count, err = safe_query(
            lambda: db.query(func.count(func.distinct(QT班级就业信息汇总表.班级名称))).filter(
                _or(
                    QT班级就业信息汇总表.神殿名称 == norm,
                    QT班级就业信息汇总表.神殿名称 == norm2,
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
                ),
                QT班级就业信息汇总表.年份 == year
            ).scalar() or 0,
            "就业班级数量"
        )
        result["就业班级数量"] = int(employment_class_count)
        if err:
            errors.append(err)

        # 7. 就业总人数 - 从 QT班级就业信息汇总表 汇总
        # 注意：前端字段期望是 totalEmployedStudents（而不是 "就业总人数"）
        # 同时这里也需要兼容“xx/xx神殿”等神殿写法
        from sqlalchemy import or_ as _or
        total_employed_students, err = safe_query(
            lambda: db.query(func.sum(QT班级就业信息汇总表.实际就业人数)).filter(
                _or(
                    QT班级就业信息汇总表.神殿名称 == norm,
                    QT班级就业信息汇总表.神殿名称 == norm2,
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
                ),
                QT班级就业信息汇总表.年份 == year,
            ).scalar() or 0,
            "就业总人数"
        )
        result["就业总人数"] = int(total_employed_students)  # 兼容中文字段
        result["totalEmployedStudents"] = int(total_employed_students)  # 前端读取该字段
        if err:
            errors.append(err)

        # 8. 就业率 - 从 QT班级就业信息汇总表 计算
        employment_rate = 0.0
        try:
            from sqlalchemy import or_ as _or
            employment_data = db.query(
                func.sum(QT班级就业信息汇总表.实际就业人数).label('total_employed'),
                func.sum(QT班级就业信息汇总表.需就业人数).label('total_need_employment')
            ).filter(
                _or(
                    QT班级就业信息汇总表.神殿名称 == norm,
                    QT班级就业信息汇总表.神殿名称 == norm2,
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
                ),
                QT班级就业信息汇总表.年份 == year
            ).first()
            
            if employment_data and employment_data.total_need_employment and employment_data.total_need_employment > 0:
                employment_rate = (employment_data.total_employed or 0) / employment_data.total_need_employment
        except Exception as e:
            errors.append(f"就业率查询失败: {str(e)}")
        result["就业率"] = round(employment_rate, 4)

        # 9. 就业平均薪资 - 从 QT班级就业信息汇总表 计算平均薪资
        from sqlalchemy import or_ as _or
        average_employment_salary, err = safe_query(
            lambda: float(db.query(func.avg(QT班级就业信息汇总表.实际平均薪资)).filter(
                _or(
                    QT班级就业信息汇总表.神殿名称 == norm,
                    QT班级就业信息汇总表.神殿名称 == norm2,
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
                ),
                QT班级就业信息汇总表.年份 == year
            ).scalar() or 0),
            "就业薪资"
        )
        result["就业薪资"] = round(average_employment_salary, 2)
        if err:
            errors.append(err)

        # 10. 薪资过万人数 - 从 QT班就业信息表 统计（>=10000，任一薪资字段）
        salary_over_10k_count = 0
        # QT班就业信息表 类已在文件顶部静态导入
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import and_ as _and
        from sqlalchemy import or_ as _or
        salary_over_10k_count, err = safe_query(
            lambda: db.query(func.count(QT班就业信息表.记录ID)).filter(
                _and(
                    QT班就业信息表.年份 == year,
                    _or(
                        QT班就业信息表.神殿名称 == norm,
                        QT班就业信息表.神殿名称 == norm2,
                        QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                        QT班就业信息表.神殿名称.ilike(f"{norm2}%"),
                    ),
                    _or(
                        QT班就业信息表.试用期薪资 >= 10000,
                        QT班就业信息表.转正薪资 >= 10000,
                        QT班就业信息表.回访考核薪资 >= 10000,
                    ),
                )
            ).scalar() or 0,
            "薪资过万人数"
        )
        if err:
            errors.append(err)
        result["薪资过万人数"] = int(salary_over_10k_count)

        # 11. 企业签约总数 - 从多个来源获取实际签约数
        enterprise_contract_count = 0
        enterprise_debug_info: dict[str, object] = {"模块加载错误": str(get_load_errors())}
        
        # 方法1：从班主任企业签约汇总表获取（班主任录入的明细数据聚合）
        # HomeroomEnterpriseContract 类已在文件顶部静态导入
        enterprise_debug_info["班主任表模块"] = str(HomeroomEnterpriseContract)
        enterprise_debug_info["模块加载错误_after"] = str(get_load_errors())
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        enterprise_debug_info["norm"] = norm
        enterprise_debug_info["norm2"] = norm2
        from sqlalchemy import or_ as _or
        try:
            contract_from_homeroom = (
                db.query(func.sum(HomeroomEnterpriseContract.实际签约数))
                .filter(
                    _or(
                        HomeroomEnterpriseContract.神殿名称 == norm,
                        HomeroomEnterpriseContract.神殿名称 == norm2,
                        HomeroomEnterpriseContract.神殿名称.ilike(f"{norm}%"),
                        HomeroomEnterpriseContract.神殿名称.ilike(f"{norm2}%"),
                    ),
                    HomeroomEnterpriseContract.年份 == year,
                )
                .scalar()
                or 0
            )
            enterprise_contract_count = int(contract_from_homeroom)
            enterprise_debug_info["班主任表查询结果"] = int(contract_from_homeroom)
        except Exception as e:
            errors.append(f"企业签约总数(班主任表)查询失败: {str(e)}")
            enterprise_debug_info["班主任表查询错误"] = str(e)
        
        print(f"[DEBUG-企业签约] 当前enterprise_contract_count={enterprise_contract_count}")
        # 方法2：如果班主任表没有数据，尝试从个人汇总表获取
        if enterprise_contract_count == 0:
            norm = str(campus).strip()
            norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
            from sqlalchemy import or_ as _or
            try:
                contract_from_personal = (
                    db.query(func.sum(CampusPersonalEnterpriseContractSummary.实际签约数))
                    .filter(
                        _or(
                            CampusPersonalEnterpriseContractSummary.神殿名称 == norm,
                            CampusPersonalEnterpriseContractSummary.神殿名称 == norm2,
                            CampusPersonalEnterpriseContractSummary.神殿名称.ilike(f"{norm}%"),
                            CampusPersonalEnterpriseContractSummary.神殿名称.ilike(f"{norm2}%"),
                        ),
                        CampusPersonalEnterpriseContractSummary.年份 == year,
                    )
                    .scalar()
                    or 0
                )
                enterprise_contract_count = int(contract_from_personal)
            except Exception as e:
                errors.append(f"企业签约总数(个人表)查询失败: {str(e)}")
        else:
            errors.append("企业签约总数: 无法加载班主任企业签约表模块")
        
        result["企业签约总数"] = enterprise_contract_count
        print(f"[DEBUG-企业签约] 最终企业签约总数: {enterprise_contract_count}")

        # 12. 口碑报名总人数/收入 - 改为从 口碑报名登记明细表 汇总（全年）
        # 口碑报名登记明细表 类已在文件顶部静态导入
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_ as _or
        # 人数：统计已报名
        reputation_enrollment_count, err = safe_query(
            lambda: db.query(func.count(口碑报名登记明细表.记录ID)).filter(
                _or(
                    口碑报名登记明细表.神殿名称 == norm,
                    口碑报名登记明细表.神殿名称 == norm2,
                    口碑报名登记明细表.神殿名称.ilike(f"{norm}%"),
                    口碑报名登记明细表.神殿名称.ilike(f"{norm2}%"),
                ),
                口碑报名登记明细表.年份 == year,
                口碑报名登记明细表.是否报名.ilike("是%")
            ).scalar() or 0,
            "口碑报名总人数"
        )
        result["口碑招生人数"] = int(reputation_enrollment_count)
        if err:
            errors.append(err)
        # 收入：合计实交学费
        reputation_enrollment_revenue, err = safe_query(
            lambda: float(db.query(func.sum(口碑报名登记明细表.实交学费)).filter(
                _or(
                    口碑报名登记明细表.神殿名称 == norm,
                    口碑报名登记明细表.神殿名称 == norm2,
                    口碑报名登记明细表.神殿名称.ilike(f"{norm}%"),
                    口碑报名登记明细表.神殿名称.ilike(f"{norm2}%"),
                ),
                口碑报名登记明细表.年份 == year
            ).scalar() or 0.0),
            "口碑总收入"
        )
        result["口碑招生收入"] = round(reputation_enrollment_revenue, 2)
        if err:
            errors.append(err)

        # 13. 升学总人数/升学总收入/升学率（金额） - 从 每月个人升学目标与结果表 汇总（全年）
        # 每月个人升学目标与结果表 类已在文件顶部静态导入
        logger.info(f"[升学数据] 模块加载结果: {每月个人升学目标与结果表}")
        
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        logger.info(f"[升学数据] 查询神殿: norm={norm}, norm2={norm2}, year={year}")
        from sqlalchemy import or_ as _or
        
        # 先查询一下表中有哪些数据
        try:
            all_records = db.query(每月个人升学目标与结果表).filter(
                每月个人升学目标与结果表.年份 == year
            ).all()
            logger.info(f"[升学数据] 表中{year}年的所有记录数: {len(all_records)}")
            for rec in all_records[:5]:  # 只打印前5条
                logger.info(f"[升学数据] 记录: 神殿={rec.神殿名称}, 年份={rec.年份}, 月份={rec.月份}, 实际升学人数={rec.实际升学总人数}, 实际升学收入={rec.实际升学收入}")
        except Exception as e:
            logger.error(f"[升学数据] 查询所有记录失败: {e}")
        
        total_actual_promo_count, err1 = safe_query(
            lambda: db.query(func.sum(每月个人升学目标与结果表.实际升学总人数)).filter(
                _or(
                    每月个人升学目标与结果表.神殿名称 == norm,
                    每月个人升学目标与结果表.神殿名称 == norm2,
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm}%"),
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人升学目标与结果表.年份 == year
            ).scalar() or 0,
            "升学总人数"
        )
        logger.info(f"[升学数据] 升学总人数查询结果: {total_actual_promo_count}, 错误: {err1}")
        
        # 尝试从实际升学收入字段获取，如果为空则使用应收字段
        total_actual_promo_revenue_from_actual, err2a = safe_query(
            lambda: float(db.query(func.sum(每月个人升学目标与结果表.实际升学收入)).filter(
                _or(
                    每月个人升学目标与结果表.神殿名称 == norm,
                    每月个人升学目标与结果表.神殿名称 == norm2,
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm}%"),
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人升学目标与结果表.年份 == year
            ).scalar() or 0.0),
            "升学总收入(实际升学收入字段)"
        )
        
        total_actual_promo_revenue_from_receivable, err2b = safe_query(
            lambda: float(db.query(func.sum(每月个人升学目标与结果表.应收)).filter(
                _or(
                    每月个人升学目标与结果表.神殿名称 == norm,
                    每月个人升学目标与结果表.神殿名称 == norm2,
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm}%"),
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人升学目标与结果表.年份 == year
            ).scalar() or 0.0),
            "升学总收入(应收字段)"
        )
        
        # 优先使用实际升学收入，如果为0则使用应收
        total_actual_promo_revenue = total_actual_promo_revenue_from_actual if total_actual_promo_revenue_from_actual > 0 else total_actual_promo_revenue_from_receivable
        err2 = err2a or err2b
        
        logger.info(f"[升学数据] 升学总收入查询结果: 实际升学收入={total_actual_promo_revenue_from_actual}, 应收={total_actual_promo_revenue_from_receivable}, 最终使用={total_actual_promo_revenue}, 错误: {err2}")
        
        # 查询应收总额（用于计算升学率金额）
        total_receivable, err3 = safe_query(
            lambda: float(db.query(func.sum(每月个人升学目标与结果表.应收)).filter(
                _or(
                    每月个人升学目标与结果表.神殿名称 == norm,
                    每月个人升学目标与结果表.神殿名称 == norm2,
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm}%"),
                    每月个人升学目标与结果表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人升学目标与结果表.年份 == year
            ).scalar() or 0.0),
            "应收总额"
        )
        logger.info(f"[升学数据] 应收总额查询结果: {total_receivable}, 错误: {err3}")
        
        result["升学总人数"] = int(total_actual_promo_count)
        result["升学总收入"] = round(total_actual_promo_revenue, 2)
        # 升学率（金额） = (实际升学收入 / 应收) × 100%
        result["升学率（金额）"] = round((total_actual_promo_revenue / total_receivable * 100) if total_receivable > 0 else 0.0, 2)
        for query_error in (err1, err2, err3):
            if query_error:
                errors.append(query_error)

        # 14. 新生入学总人数 - 改为从 每月个人新生维稳统计表 汇总（全年，报到人数）
        # 每月个人新生维稳统计表 类已在文件顶部静态导入
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_ as _or
        new_student_enrollment_count, err = safe_query(
            lambda: db.query(func.sum(每月个人新生维稳统计表.报到人数)).filter(
                _or(
                    每月个人新生维稳统计表.神殿名称 == norm,
                    每月个人新生维稳统计表.神殿名称 == norm2,
                    每月个人新生维稳统计表.神殿名称.ilike(f"{norm}%"),
                    每月个人新生维稳统计表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人新生维稳统计表.年份 == year
            ).scalar() or 0,
            "新生入学人数"
        )
        result["新生入学人数"] = int(new_student_enrollment_count)
        if err:
            errors.append(err)

        # 15-18. 退费/异动 - 改为从 每月个人学员异动统计表 汇总（全年）
        # 每月个人学员异动统计表 类已在文件顶部静态导入
        refund_rate = 0.0
        turnover_rate = 0.0
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_ as _or
        # 新生退费
        new_student_refund_count, err = safe_query(
            lambda: db.query(func.sum(每月个人学员异动统计表.新生退费人数)).filter(
                _or(
                    每月个人学员异动统计表.神殿名称 == norm,
                    每月个人学员异动统计表.神殿名称 == norm2,
                    每月个人学员异动统计表.神殿名称.ilike(f"{norm}%"),
                    每月个人学员异动统计表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人学员异动统计表.年份 == year
            ).scalar() or 0,
            "新生退费人数"
        )
        result["新生流失人数"] = int(new_student_refund_count)
        if err:
            errors.append(err)
        # 老生退费
        old_student_refund_count, err = safe_query(
            lambda: db.query(func.sum(每月个人学员异动统计表.老生退费人数)).filter(
                _or(
                    每月个人学员异动统计表.神殿名称 == norm,
                    每月个人学员异动统计表.神殿名称 == norm2,
                    每月个人学员异动统计表.神殿名称.ilike(f"{norm}%"),
                    每月个人学员异动统计表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人学员异动统计表.年份 == year
            ).scalar() or 0,
            "老生退费人数"
        )
        result["老生流失人数"] = int(old_student_refund_count)
        if err:
            errors.append(err)
        # 退费率 / 异动率
        totals = db.query(
            func.sum(每月个人学员异动统计表.退费总人数).label('total_refund'),
            func.sum(每月个人学员异动统计表.异动总人数).label('total_movement'),
            func.sum(每月个人学员异动统计表.累计带生人数).label('total_students')
        ).filter(
            _or(
                每月个人学员异动统计表.神殿名称 == norm,
                每月个人学员异动统计表.神殿名称 == norm2,
                每月个人学员异动统计表.神殿名称.ilike(f"{norm}%"),
                每月个人学员异动统计表.神殿名称.ilike(f"{norm2}%"),
            ),
            每月个人学员异动统计表.年份 == year
        ).first()
        ts = (totals.total_students or 0) if totals else 0
        if ts > 0:
            refund_rate = float(totals.total_refund or 0) / ts * 100
            turnover_rate = float(totals.total_movement or 0) / ts * 100
        result["退费率"] = round(refund_rate, 2)
        result["异动率"] = round(turnover_rate, 2)

        # 19. 宿舍总个数 - 从 宿舍统计月汇总表 获取（取最新月份数据）
        # 宿舍统计月汇总表 类已在文件顶部静态导入
        from sqlalchemy import or_ as _or
        dormitory_count, err = safe_query(
            lambda: db.query(func.sum(宿舍统计月汇总表.宿舍总数量)).filter(
                _or(
                    宿舍统计月汇总表.神殿名称 == norm,
                    宿舍统计月汇总表.神殿名称 == norm2,
                    宿舍统计月汇总表.神殿名称.ilike(f"{norm}%"),
                    宿舍统计月汇总表.神殿名称.ilike(f"{norm2}%"),
                ),
                宿舍统计月汇总表.年份 == year
            ).scalar() or 0,
            "宿舍总个数"
        )
        result["宿舍总个数"] = int(dormitory_count)
        if err:
            errors.append(err)

        # 20. 宿舍总人数 - 改为从 每月个人宿舍管理统计表 获取（全年合计 住宿总人数）
        # 每月个人宿舍管理统计表 类已在文件顶部静态导入
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        from sqlalchemy import or_ as _or
        dormitory_residents, err = safe_query(
            lambda: db.query(func.sum(每月个人宿舍管理统计表.住宿总人数)).filter(
                _or(
                    每月个人宿舍管理统计表.神殿名称 == norm,
                    每月个人宿舍管理统计表.神殿名称 == norm2,
                    每月个人宿舍管理统计表.神殿名称.ilike(f"{norm}%"),
                    每月个人宿舍管理统计表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月个人宿舍管理统计表.年份 == year
            ).scalar() or 0,
            "宿舍总人数"
        )
        result["宿舍总人数"] = int(dormitory_residents)
        if err:
            errors.append(err)

        # 21. 中专层次目标注册总人数 - 从 神殿教化司学籍统计表 获取
        # 神殿教化司学籍统计表 类已在文件顶部静态导入
        from sqlalchemy import or_ as _or
        secondary_registrations, err = safe_query(
            lambda: db.query(func.sum(神殿教化司学籍统计表.中专实际注册人数)).filter(
                _or(
                    神殿教化司学籍统计表.神殿名称 == norm,
                    神殿教化司学籍统计表.神殿名称 == norm2,
                    神殿教化司学籍统计表.神殿名称.ilike(f"{norm}%"),
                    神殿教化司学籍统计表.神殿名称.ilike(f"{norm2}%"),
                ),
                神殿教化司学籍统计表.年份 == year
            ).scalar() or 0,
            "中专层次目标注册总人数"
        )
        result["中专层次目标注册总人数"] = int(secondary_registrations)
        if err:
            errors.append(err)

        # 22. 大学层次目标注册总人数 - 从 神殿教化司学籍统计表 获取
        from sqlalchemy import or_ as _or
        university_registrations, err = safe_query(
            lambda: db.query(func.sum(神殿教化司学籍统计表.大学实际注册人数)).filter(
                _or(
                    神殿教化司学籍统计表.神殿名称 == norm,
                    神殿教化司学籍统计表.神殿名称 == norm2,
                    神殿教化司学籍统计表.神殿名称.ilike(f"{norm}%"),
                    神殿教化司学籍统计表.神殿名称.ilike(f"{norm2}%"),
                ),
                神殿教化司学籍统计表.年份 == year
            ).scalar() or 0,
            "大学层次目标注册总人数"
        )
        result["大学层次目标注册总人数"] = int(university_registrations)
        if err:
            errors.append(err)

        # 添加错误信息和调试信息
        if errors:
            result["_warnings"] = errors
            logger.warning(f"[教质核心数据汇总] 神殿={campus}, 年份={year}, 部分字段查询失败: {errors}")
        
        # 添加调试信息（可选，生产环境可以移除）
        result["_debug"] = {
            "查询的神殿": campus,
            "查询的年份": year,
            "错误数量": len(errors),
            "企业签约调试": enterprise_debug_info,
        }
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"[教质核心数据汇总] 严重错误: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取教质核心数据汇总失败: {str(e)}") from e
