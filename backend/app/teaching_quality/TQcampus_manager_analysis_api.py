"""
教学质量模块 - 神殿教化司经理、副经理功能分析（月度）API
前缀：/api/v1/teaching-quality

GET  /campus-manager-analysis?campus=主神殿&year=2025 -> 返回指定神殿年份的12个月数据（每月可包含多个人）
PUT  /campus-manager-analysis/{year}/{month}  {campus, name, values?, ...} -> 新增或更新指定月份、指定人员
POST /campus-manager-analysis  {神殿名称, 年份, 行列表:[{month, name, ...}]} -> 批量 upsert（不会清空当年，支持同月多人）
"""

from typing import Any, Dict, List, Optional, Protocol, cast

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import Path as FPath
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

import app.teaching_quality.TQcampus_manager_analysis_db as dbm
from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_manager_analysis_db import (
    fetch_rows,
    replace_rows,
    upsert_row,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    init_campus_manager_analysis_tables as init_tables,
)


def _to_dict(m: BaseModel) -> Dict[str, Any]:
    """兼容 Pydantic v1/v2：把模型转成 dict"""
    if hasattr(m, "model_dump"):
        return m.model_dump()  # type: ignore[attr-defined]
    return m.dict()  # type: ignore[call-arg]


def _is_valid_month(m: Any) -> bool:
    try:
        mm = int(m)
    except Exception:
        return False
    return 1 <= mm <= 12

router = APIRouter()


class _ManagerAnalysisDbRow(Protocol):
    记录ID: int
    神殿名称: str
    姓名: str
    年份: int
    月份: int


def _as_manager_analysis_row(row: object) -> _ManagerAnalysisDbRow:
    return cast(_ManagerAnalysisDbRow, row)


class Row(BaseModel):
    month: int
    campus: Optional[str] = None
    name: str  # 改为必填，支持多个姓名
    # 思想
    values: int = 0
    responsibility: int = 0
    execution: int = 0
    # 管理
    planning: int = 0
    organization: int = 0
    leadership: int = 0
    control: int = 0
    # 业务能力
    studentEmployment: int = 0
    reputationEnrollment: int = 0
    studentAttrition: int = 0
    furtherEducation: int = 0
    academicManagement: int = 0
    dormitoryManagement: int = 0
    remark: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "month": 1,
                "campus": "主神殿",
                "name": "张经理",
                "values": 86,
                "responsibility": 88,
                "execution": 82,
                "planning": 90,
                "organization": 87,
                "leadership": 85,
                "control": 83,
                "studentEmployment": 88,
                "reputationEnrollment": 85,
                "studentAttrition": 80,
                "furtherEducation": 87,
                "academicManagement": 89,
                "dormitoryManagement": 84,
            }
        },
    )


class MonthData(BaseModel):
    """一个月的数据，可能包含多个人的记录"""

    month: int
    campus: Optional[str] = None
    names: List[Row] = Field(default_factory=list)  # 同一月份的多个人


class ListOutput(BaseModel):
    campus: str
    year: int
    rows: List[MonthData] = Field(
        default_factory=list
    )  # 按月份分组（每月 names 为多人列表）


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化经理功能分析月表失败: {e}")


@router.get(
    "/campus-manager-analysis",
    response_model=Dict[str, Any],
    summary="获取神殿经理功能分析（按年，支持同月多人；返回扁平 rows 兼容前端）",
)
def get_manager_analysis(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    position: str = Query(
        "manager",
        alias="position",
        description="职位类型: manager(经理) 或 deputy(副经理)",
    ),
    db: Session = Depends(get_db),
):
    # 最早的日志：确认函数被调用
    print("[get_manager_analysis] ===== 函数被调用 =====")
    print(
        f"[get_manager_analysis] 接收到的参数: campus={campus}, year={year}, position={position}"
    )

    init_tables()

    # 验证职位类型
    if position not in ["manager", "deputy"]:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的职位类型: {position}，必须是 'manager' 或 'deputy'",
        )

    # 调试日志
    print(
        f"[get_manager_analysis] 开始查询: 神殿={campus}, 年份={year}, 职位类型={position}"
    )

    # --- 修改开始：合并所有神殿变体的结果 ---
    # fetch_rows 内部已经支持神殿名称变体查询，所以直接调用一次即可
    all_rows = fetch_rows(db, 神殿名称=campus, 年份=year, 职位类型=position)

    print(f"[get_manager_analysis] fetch_rows 返回 {len(all_rows)} 条记录")

    # 使用字典去重，确保每个 (神殿, 年, 月, 姓名) 组合唯一
    # 注意：神殿名称需要规范化，避免"河北盛邦"和"河北主神殿"被当作不同的神殿
    try:
        from ._utils import normalize_campus

        def normalize_campus_for_key(campus: str) -> str:
            """规范化神殿名称用于去重：统一添加"神殿"后缀"""
            base = normalize_campus(campus)
            # 如果基础名称不为空，统一添加"神殿"后缀
            if base:
                return f"{base}神殿"
            # 如果基础名称为空，检查原始名称是否以"神殿"结尾
            campus_trimmed = (campus or "").strip()
            if campus_trimmed and not campus_trimmed.endswith("神殿"):
                return f"{campus_trimmed}神殿"
            return campus_trimmed or campus

    except ImportError:

        def normalize_campus_for_key(campus: str) -> str:
            """规范化神殿名称用于去重：统一添加"神殿"后缀"""
            campus_trimmed = (campus or "").strip()
            if campus_trimmed and not campus_trimmed.endswith("神殿"):
                return f"{campus_trimmed}神殿"
            return campus_trimmed

    # 使用记录ID作为主键去重，避免同一条记录被多次查询时重复
    seen_ids: set[int] = set()
    unique_rows: Dict[tuple[str, int, int, str], object] = {}
    for r in all_rows:
        record_id = getattr(r, "记录ID", None)
        # 如果记录ID已存在，说明是同一条记录被多次查询到，跳过
        if record_id and record_id in seen_ids:
            continue
        if record_id:
            seen_ids.add(record_id)

        # 使用规范化后的神殿名称作为去重key的一部分
        normalized_campus = normalize_campus_for_key(r.神殿名称)
        # 确保姓名字段正确获取
        name_attr = getattr(r, "姓名", None)
        name_for_key = str(name_attr).strip() if name_attr is not None else ""

        # 使用 (神殿, 年份, 月份, 姓名) 作为唯一key
        # 注意：如果姓名为空，不参与去重（因为前端会生成占位记录）
        if not name_for_key:
            continue

        key = (normalized_campus, r.年份, r.月份, name_for_key)

        # 如果key已存在，说明是真正的重复记录（同一神殿、同一年、同一月、同一姓名）
        # 保留记录ID更大的（通常是更新的记录）
        if key in unique_rows:
            existing = unique_rows[key]
            existing_id = getattr(existing, "记录ID", None)
            current_id = getattr(r, "记录ID", None)
            # 如果ID相同，跳过（不应该发生，因为seen_ids已经检查过了）
            if current_id and existing_id and current_id == existing_id:
                continue
            # 如果ID不同，保留ID更大的
            if current_id and existing_id and current_id > existing_id:
                r.神殿名称 = normalized_campus
                unique_rows[key] = r
            # 如果当前记录ID更小或不存在，保留已存在的记录（不更新）
        else:
            # 保存时使用规范化后的神殿名称
            r.神殿名称 = normalized_campus
            unique_rows[key] = r

    rows = list(unique_rows.values())
    # --- 修改结束 ---

    def to_row(r: Any) -> Row:
        """将数据库记录转换为 Row 对象"""
        campus_name = str(getattr(r, "神殿名称", "") or campus)
        # 获取姓名字段，确保正确处理
        name_value = getattr(r, "姓名", None)
        name_str = str(name_value).strip() if name_value is not None else ""

        # 如果姓名不包含职位后缀，自动追加（兼容旧数据）
        if name_str and "教质经理" not in name_str and "教质副经理" not in name_str:
            if position == "deputy":
                name_str = f"{name_str}教质副经理"
            elif position == "manager":
                name_str = f"{name_str}教质经理"

        return Row(
            month=int(r.月份 or 0),
            campus=campus_name,
            name=name_str,
            values=int(getattr(r, "价值观", 0) or 0),
            responsibility=int(getattr(r, "责任感", 0) or 0),
            execution=int(getattr(r, "执行力", 0) or 0),
            planning=int(getattr(r, "计划", 0) or 0),
            organization=int(getattr(r, "组织", 0) or 0),
            leadership=int(getattr(r, "领导", 0) or 0),
            control=int(getattr(r, "控制", 0) or 0),
            studentEmployment=int(getattr(r, "学员就业", 0) or 0),
            reputationEnrollment=int(getattr(r, "口碑招生", 0) or 0),
            studentAttrition=int(getattr(r, "学员流失", 0) or 0),
            furtherEducation=int(getattr(r, "升学", 0) or 0),
            academicManagement=int(getattr(r, "教务管理能力", 0) or 0),
            dormitoryManagement=int(getattr(r, "宿舍管理能力", 0) or 0),
            remark=getattr(r, "备注", None),
        )

    # ---- 返回扁平 rows（兼容既有前端） ----
    # 同月多人：直接在 rows 中返回多条（不会互相覆盖）
    flat_rows: List[Dict[str, Any]] = []
    for r in rows:
        rr = _to_dict(to_row(r))
        # 过滤掉无效月份（避免出现 month=0 的脏数据）
        if not _is_valid_month(rr.get("month")):
            continue
        # 过滤掉空姓名占位行
        name_value = str(rr.get("name") or "").strip()
        if name_value == "":
            continue

        flat_rows.append(rr)

    # 不在后端补 name="" 的占位行：
    # 1) 前端已经按“每月两行（经理/副经理）”固定渲染
    # 2) 后端补占位行容易干扰同月多人数据的展示/处理

    flat_rows.sort(key=lambda x: (int(x.get("month") or 0), str(x.get("name") or "")))

    # DEBUG: 打印 month=1 实际返回条数与姓名，便于排查“只返回一条”的问题
    return {"campus": campus, "year": year, "rows": flat_rows}


@router.put(
    "/campus-manager-analysis/{year}/{month}",
    response_model=Row,
    summary="更新或新增指定月份、指定人员的记录",
)
def update_single(
    *,
    year: int = FPath(...),
    month: int = FPath(...),
    position: str = Query(
        "manager",
        alias="position",
        description="职位类型: manager(经理) 或 deputy(副经理)",
    ),
    payload: Row,
    db: Session = Depends(get_db),
):
    import logging
    import sys

    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    # 确保日志能输出到控制台
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    try:
        print("=" * 80)
        print("[update_single] ===== 开始保存数据 =====")
        print(
            f"[update_single] 请求参数: year={year}, month={month}, position={position}"
        )
        print(
            f"[update_single] payload: campus={payload.campus}, name={payload.name}, studentEmployment={payload.studentEmployment}"
        )
        logger.info(
            f"[update_single] 开始保存: year={year}, month={month}, position={position}, campus={payload.campus}"
        )

        init_tables()

        if not payload.campus:
            raise HTTPException(status_code=400, detail="缺少神殿")

        # 如果姓名为空，使用默认值（避免保存失败）
        if not payload.name or not payload.name.strip():
            # 根据position设置默认姓名
            default_name = "经理" if position == "manager" else "副经理"
            payload.name = default_name
            warn_msg = f"[update_single] 警告: 姓名为空，使用默认值: {default_name}"
            print(warn_msg)
            logger.warning(warn_msg)

        # 验证职位类型
        if position not in ["manager", "deputy"]:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的职位类型: {position}，必须是 'manager' 或 'deputy'",
            )

        # 检查数据库连接
        db_url = str(db.bind.url) if db.bind and hasattr(db.bind, "url") else "N/A"
        db_info = f"[update_single] 数据库连接: bind={db.bind}, url={db_url}"
        print(db_info)
        logger.info(db_info)

        row = upsert_row(
            db,
            神殿名称=payload.campus,
            年份=year,
            月份=month,
            姓名=payload.name,
            职位类型=position,
            价值观=payload.values,
            责任感=payload.responsibility,
            执行力=payload.execution,
            计划=payload.planning,
            组织=payload.organization,
            领导=payload.leadership,
            控制=payload.control,
            学员就业=payload.studentEmployment,
            口碑招生=payload.reputationEnrollment,
            学员流失=payload.studentAttrition,
            升学=payload.furtherEducation,
            教务管理能力=payload.academicManagement,
            宿舍管理能力=payload.dormitoryManagement,
            备注=payload.remark,
        )

        # 在提交前检查对象状态
        row_state_msg = f"[update_single] row 对象状态: 类型={type(row).__name__}, 表={getattr(row.__class__, '__tablename__', 'N/A')}"
        print(row_state_msg)
        logger.info(row_state_msg)

        if hasattr(row, "记录ID"):
            prep_msg = f"[update_single] 准备提交: 记录ID={row.记录ID}, 神殿={row.神殿名称}, 姓名={row.姓名}"
            print(prep_msg)
            logger.info(prep_msg)
        else:
            warn_msg = "[update_single] 警告: row 对象没有 记录ID 属性（可能是新记录，ID尚未生成）"
            print(warn_msg)
            logger.warning(warn_msg)

        # 强制刷新，确保数据写入并获取ID
        db.flush()
        flush_msg = f"[update_single] flush 完成，记录ID={row.记录ID if hasattr(row, '记录ID') else 'N/A'}"
        print(flush_msg)
        logger.info(flush_msg)

        # 提交事务（使用 try-except 捕获提交异常）
        try:
            db.commit()
            commit_msg = f"[update_single] ✓ commit 成功: 记录ID={row.记录ID if hasattr(row, '记录ID') else 'N/A'}"
            print(commit_msg)
            logger.info(commit_msg)
        except Exception as commit_error:
            commit_err_msg = f"[update_single] ✗ commit 失败: {commit_error}"
            print(commit_err_msg)
            logger.error(commit_err_msg)
            import traceback

            traceback.print_exc()
            raise

        # 提交后立即查询，验证数据是否真的保存了
        # 使用原始 SQL 查询，绕过可能的 schema 映射问题
        from sqlalchemy import text

        table_name = (
            "教质副经理功能分析月表" if position == "deputy" else "教质经理功能分析月表"
        )
        sql_query = text(
            f"""
            SELECT "记录ID", "神殿名称", "年份", "月份", "姓名", "学员就业" 
            FROM teaching_quality."{table_name}" 
            WHERE "年份" = :year AND "月份" = :month AND "姓名" = :name
        """
        )
        result = db.execute(
            sql_query, {"year": year, "month": month, "name": payload.name}
        )
        sql_rows = result.fetchall()
        print(f"[update_single] SQL 直接查询结果: 找到 {len(sql_rows)} 条记录")
        for sql_row in sql_rows:
            print(
                f"  - SQL记录: ID={sql_row[0]}, 神殿={sql_row[1]}, 年份={sql_row[2]}, 月份={sql_row[3]}, 姓名={sql_row[4]}, 学员就业={sql_row[5]}"
            )

        # 验证：查询刚保存的记录（使用已加载的 dbm 模块）
        TableClass = (
            dbm.教质副经理功能分析月表
            if position == "deputy"
            else dbm.教质经理功能分析月表
        )

        # 规范化神殿名称（与 upsert_row 中的逻辑完全一致）
        normalized_campus = payload.campus
        try:
            from ._utils import normalize_campus

            campus_base = normalize_campus(payload.campus)
            normalized_campus = f"{campus_base}神殿" if campus_base else payload.campus
        except ImportError:
            campus_trimmed = (payload.campus or "").strip()
            if campus_trimmed and not campus_trimmed.endswith("神殿"):
                normalized_campus = f"{campus_trimmed}神殿"
            else:
                normalized_campus = campus_trimmed

        print(
            f"[update_single] 验证查询: 表={TableClass.__tablename__}, 神殿={normalized_campus}, 年份={year}, 月份={month}, 姓名={payload.name}"
        )

        # 先查询所有匹配的记录（用于调试）
        all_matches = (
            db.query(TableClass)
            .filter(
                TableClass.年份 == year,
                TableClass.月份 == month,
            )
            .all()
        )
        print(f"[update_single] 该月份所有记录数: {len(all_matches)}")
        for matched in all_matches:
            matched_row = _as_manager_analysis_row(matched)
            print(f"  - 记录ID={matched_row.记录ID}, 神殿={matched_row.神殿名称}, 姓名={matched_row.姓名}")

        verify_row = (
            db.query(TableClass)
            .filter(
                TableClass.神殿名称 == normalized_campus,
                TableClass.年份 == year,
                TableClass.月份 == month,
                TableClass.姓名 == payload.name,
            )
            .first()
        )

        if verify_row:
            verified = _as_manager_analysis_row(verify_row)
            print(
                f"[update_single] ✓ 验证成功: 数据库中找到记录 ID={verified.记录ID}, 神殿={verified.神殿名称}, 姓名={verified.姓名}"
            )
        else:
            print("[update_single] ✗ 警告: 提交后未在数据库中找到记录！")
            print(
                f"  查询条件: 神殿={normalized_campus}, 年份={year}, 月份={month}, 姓名={payload.name}"
            )
            # 尝试模糊匹配
            fuzzy_match = (
                db.query(TableClass)
                .filter(
                    TableClass.年份 == year,
                    TableClass.月份 == month,
                )
                .all()
            )
            if fuzzy_match:
                print(f"  找到 {len(fuzzy_match)} 条同月记录，神殿名称可能是:")
                for fuzzy in fuzzy_match:
                    fuzzy_row = _as_manager_analysis_row(fuzzy)
                    print(f"    - {fuzzy_row.神殿名称} (姓名: {fuzzy_row.姓名})")

    except HTTPException:
        # HTTP异常直接抛出，不要rollback（可能还没有开始事务）
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"[update_single] ✗✗✗ 保存失败: {type(e).__name__}: {e}"
        print(error_msg)
        logger.error(error_msg, exc_info=True)
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}") from e

    return Row(
        month=row.月份,
        campus=row.神殿名称,
        name=row.姓名,
        values=row.价值观 or 0,
        responsibility=row.责任感 or 0,
        execution=row.执行力 or 0,
        planning=row.计划 or 0,
        organization=row.组织 or 0,
        leadership=row.领导 or 0,
        control=row.控制 or 0,
        studentEmployment=row.学员就业 or 0,
        reputationEnrollment=row.口碑招生 or 0,
        studentAttrition=row.学员流失 or 0,
        furtherEducation=row.升学 or 0,
        academicManagement=row.教务管理能力 or 0,
        dormitoryManagement=row.宿舍管理能力 or 0,
        remark=row.备注,
    )


@router.post(
    "/campus-manager-analysis",
    response_model=ListOutput,
    summary="批量替换当年所有月份记录",
)
def replace_all(
    payload: SavePayload,
    position: str = Query(
        "manager",
        alias="position",
        description="职位类型: manager(经理) 或 deputy(副经理)",
    ),
    db: Session = Depends(get_db),
):
    try:
        init_tables()

        # 验证职位类型（只允许 manager 或 deputy，不允许其他值）
        if position not in ["manager", "deputy"]:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的职位类型: {position}，必须是 'manager' 或 'deputy'",
            )

        # 明确记录使用的职位类型和对应的表
        # 修复：position == "manager" 应该使用经理表，position == "deputy" 应该使用副经理表
        table_name = (
            "教质经理功能分析月表"
            if position == "manager"
            else "教质副经理功能分析月表"
        )
        print(
            f"[replace_all] 保存数据到表: {table_name}, 职位类型: {position}, 神殿: {payload.神殿名称}, 年份: {payload.年份}"
        )

        rows_to_save: List[Dict[str, Any]] = []
        for r in payload.行列表:
            d = r.model_dump() if hasattr(r, "model_dump") else dict(r)
            rows_to_save.append(d)

        # 批量保存数据（使用 verbose=False 减少日志输出，提高性能）
        # position 参数来自前端，根据当前标签页决定（manager 或 deputy）
        replace_rows(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            职位类型=position,
            行列表=rows_to_save,
            verbose=False,
        )

        # 提交事务
        db.commit()
        print(f"[replace_all] 数据已成功保存到表: {table_name}")

        # 直接返回成功响应，不重新查询数据（避免超时）
        # 前端会在保存成功后自己调用 loadData 刷新数据
        return {
            "campus": payload.神殿名称,
            "year": payload.年份,
            "rows": [],  # 返回空列表，前端会自己刷新
        }
    except Exception as e:
        db.rollback()
        import traceback

        error_detail = f"批量保存失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[replace_all] ✗ 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=f"批量保存失败: {str(e)}") from e
