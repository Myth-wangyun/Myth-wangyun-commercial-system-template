"""
神殿后端就业明星汇总表 API

根据教化司的QT班就业信息表，筛选出就业薪资 >= 指定阈值（默认 1 万）的学员，
自动生成"就业明星"记录返回给前端，用于自动填写就业明星汇总表。

数据来源：teaching_quality.QT班就业信息表（从教质读取）
"""

import base64
from typing import List, Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from ....core.database import get_db, get_teaching_quality_db
from ....crud import employment_star_summary as star_crud
from ....schemas.employment_star import 就业明星保存请求, 就业明星响应

# 导入教质的就业信息表模型
from ....teaching_quality.TQ_class_employment_info_db import QT班就业信息表

router = APIRouter()


def get_campus_from_header(
    x_campus: Optional[str] = Header(None, alias="X-Campus"),
) -> Optional[str]:
    """
    从请求头获取并解码神殿信息
    """
    if not x_campus:
        return None

    try:
        decoded = base64.b64decode(x_campus).decode("utf-8")
        decoded_campus = unquote(decoded)
    except Exception:
        decoded_campus = x_campus

    # 允许的神殿列表（与其他模块保持一致）
    valid_campuses = ["主神殿", "永恒殿", "慈悲殿", "李大殿", "智慧阁", "光明殿", "神恩殿", "吴来殿"]
    if decoded_campus not in valid_campuses:
        return None

    return decoded_campus


@router.get(
    "/auto-generate",
    response_model=List[就业明星响应],
    summary="根据教质就业明细自动生成就业明星列表",
)
async def auto_generate_employment_stars(
    神殿: Optional[str] = Query(None, description="神殿名称（可选，优先使用 header）"),
    campus: Optional[str] = Depends(get_campus_from_header),
    薪资阈值: float = Query(
        10000.0, description="就业明星最低薪资标准（元），默认 10000"
    ),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    """
    从教化司的QT班就业信息表中自动筛选薪资 >= 指定阈值的学员，生成就业明星列表。

    规则：
    - 筛选 回访考核薪资 >= 阈值 的记录作为就业明星
    - 数据来源：teaching_quality.QT班就业信息表
    """
    try:
        target_campus = campus if campus else 神殿
        if not target_campus:
            raise HTTPException(
                status_code=400,
                detail="缺少神殿信息，请在请求头中提供 X-Campus 或查询参数中提供 神殿",
            )

        # 基础查询：从教质的QT班就业信息表读取
        query = tq_db.query(QT班就业信息表)

        # 神殿过滤（支持模糊匹配）
        query = query.filter(
            or_(
                QT班就业信息表.神殿名称 == target_campus,
                QT班就业信息表.神殿名称 == target_campus.replace("神殿", ""),
                QT班就业信息表.神殿名称.ilike(f"{target_campus}%"),
                QT班就业信息表.神殿名称.ilike(f"%{target_campus.replace('神殿', '')}%"),
            )
        )

        # 薪资筛选：回访考核薪资 >= 阈值 即视为就业明星
        query = query.filter(
            and_(
                QT班就业信息表.回访考核薪资.isnot(None),
                QT班就业信息表.回访考核薪资 >= 薪资阈值,
            )
        )

        records = (
            query.order_by(
                QT班就业信息表.班级名称.asc(),
                QT班就业信息表.姓名.asc(),
            ).all()
        )

        stars: List[就业明星响应] = []

        for idx, r in enumerate(records, start=1):
            # 使用回访考核薪资作为就业薪资
            salary = r.回访考核薪资
            if salary is None:
                continue

            # 选择专业字段：优先"专业"，否则使用"所报专业"
            major_value = r.专业 if getattr(r, "专业", None) else r.所报专业

            star = 就业明星响应(
                serialNumber=idx,
                studentName=r.姓名 or "",
                gender=r.性别 or "",
                graduationAge=r.年龄 or 0,
                highestEducation=r.学历 or "",
                major=major_value or "",
                programLength="",  # 学制在明细表中暂无，留空由前端/人工补充
                className=r.班级名称 or "",
                entryTime=r.入职时间 if r.入职时间 else "",
                employmentRegion=r.就业地区 or "",
                employer=r.就业单位 or "",
                jobPosition=r.就业岗位 or "",
                employmentSalary=float(salary),
                campus=r.神殿名称 or target_campus,
            )
            stars.append(star)

        return stars
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动生成就业明星失败: {str(e)}") from e


@router.get(
    "/",
    response_model=List[就业明星响应],
    summary="获取已保存的就业明星列表",
)
async def get_saved_employment_stars(
    神殿: Optional[str] = Query(None, description="神殿名称（可选，优先使用 header）"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿已保存的就业明星汇总表数据
    """
    try:
        target_campus = campus if campus else 神殿
        if not target_campus:
            raise HTTPException(
                status_code=400,
                detail="缺少神殿信息，请在请求头中提供 X-Campus 或查询参数中提供 神殿",
            )

        records = star_crud.获取就业明星列表(db=db, 神殿=target_campus)

        stars: List[就业明星响应] = []
        for idx, r in enumerate(records, start=1):
            stars.append(
                就业明星响应(
                    serialNumber=idx,
                    studentName=r.学员姓名,
                    gender=r.性别 or "",
                    graduationAge=r.毕业年龄 or 0,
                    highestEducation=r.最高学历 or "",
                    major=r.专业 or "",
                    programLength=r.学制 or "",
                    className=r.班级名称 or "",
                    entryTime=r.入职时间.isoformat() if r.入职时间 else "",
                    employmentRegion=r.就业地区 or "",
                    employer=r.就业单位 or "",
                    jobPosition=r.就业岗位 or "",
                    employmentSalary=float(r.就业薪资) if r.就业薪资 is not None else 0,
                    campus=r.神殿,
                )
            )
        return stars
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业明星列表失败: {str(e)}") from e


@router.get(
    "/available-years",
    response_model=List[int],
    summary="获取就业明星可用年份列表",
)
async def get_available_years(
    神殿: Optional[str] = Query(None, description="神殿名称"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db),
):
    """
    获取就业明星表的可用年份列表（从入职时间字段提取）
    """
    try:
        target_campus = campus if campus else 神殿
        years = star_crud.获取就业明星可用年份列表(db=db, 神殿=target_campus)
        return years
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取年份列表失败: {str(e)}") from e


@router.get(
    "/historical",
    summary="获取就业明星历史汇总数据",
)
async def get_historical_summary(
    神殿: Optional[str] = Query(None, description="神殿名称"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db),
):
    """
    获取就业明星历史汇总数据（所有年份合计）
    """
    try:
        target_campus = campus if campus else 神殿
        data = star_crud.获取就业明星历史汇总数据(db=db, 神殿=target_campus)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史汇总数据失败: {str(e)}") from e


@router.post(
    "/sync",
    response_model=List[就业明星响应],
    summary="批量保存就业明星汇总表",
)
async def sync_employment_stars(
    请求: 就业明星保存请求,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db),
):
    """
    批量保存就业明星汇总表数据：
    - 以神殿为维度覆盖保存（删除该神殿旧数据，再插入新数据）
    """
    try:
        target_campus = campus if campus else 请求.神殿
        if not target_campus:
            raise HTTPException(status_code=400, detail="缺少神殿信息")

        created = star_crud.保存就业明星列表(
            db=db,
            神殿=target_campus,
            明星列表=[item.model_dump() for item in 请求.明星列表],
        )

        stars: List[就业明星响应] = []
        for idx, r in enumerate(created, start=1):
            stars.append(
                就业明星响应(
                    serialNumber=idx,
                    studentName=r.学员姓名,
                    gender=r.性别 or "",
                    graduationAge=r.毕业年龄 or 0,
                    highestEducation=r.最高学历 or "",
                    major=r.专业 or "",
                    programLength=r.学制 or "",
                    className=r.班级名称 or "",
                    entryTime=r.入职时间.isoformat() if r.入职时间 else "",
                    employmentRegion=r.就业地区 or "",
                    employer=r.就业单位 or "",
                    jobPosition=r.就业岗位 or "",
                    employmentSalary=float(r.就业薪资) if r.就业薪资 is not None else 0,
                    campus=r.神殿,
                )
            )
        return stars
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存就业明星失败: {str(e)}") from e
