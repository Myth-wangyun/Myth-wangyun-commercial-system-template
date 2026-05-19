"""
教学质量模块 - 企业签约目标与结果汇总表 API
支持三个维度：班主任明细、个人汇总、神殿汇总
"""

# 动态加载与本文件同目录下的 DB 模块，避免相对导入在动态加载场景下失败
import importlib.util as _importlib_util
import sys as _sys
from pathlib import Path as _Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db

_tq_dir = _Path(__file__).resolve().parent

# 班主任签约明细 DB
_db_file = _tq_dir / "TQhomeroom_enterprise_contract_db.py"
_mod_name = "app.teaching_quality.tq_homeroom_enterprise_contract_db_dynamic"
if _mod_name in _sys.modules:
    db_model = _sys.modules[_mod_name]
else:
    _spec = _importlib_util.spec_from_file_location(_mod_name, str(_db_file))
    db_model = _importlib_util.module_from_spec(_spec)  # type: ignore
    assert _spec and _spec.loader
    _spec.loader.exec_module(db_model)  # type: ignore[attr-defined]
    _sys.modules[_mod_name] = db_model

# 神殿企业签约目标手填 DB
_goal_db_file = _tq_dir / "TQcampus_enterprise_contract_goal_db.py"
_goal_mod_name = "app.teaching_quality.campus_enterprise_contract_goal_db_dynamic"
if _goal_mod_name in _sys.modules:
    goal_db = _sys.modules[_goal_mod_name]
else:
    _goal_spec = _importlib_util.spec_from_file_location(
        _goal_mod_name, str(_goal_db_file)
    )
    goal_db = _importlib_util.module_from_spec(_goal_spec)  # type: ignore
    assert _goal_spec and _goal_spec.loader
    _goal_spec.loader.exec_module(goal_db)  # type: ignore[attr-defined]
    _sys.modules[_goal_mod_name] = goal_db

# 个人企业签约目标与结果汇总（持久化表）
_personal_db_file = (
    _tq_dir / "TQcampus_personal_enterprise_contract_goals_results_db.py"
)
_personal_mod_name = (
    "app.teaching_quality.campus_personal_enterprise_contract_goals_results_db_dynamic"
)
if _personal_mod_name in _sys.modules:
    personal_db = _sys.modules[_personal_mod_name]
else:
    _personal_spec = _importlib_util.spec_from_file_location(
        _personal_mod_name, str(_personal_db_file)
    )
    personal_db = _importlib_util.module_from_spec(_personal_spec)  # type: ignore
    assert _personal_spec and _personal_spec.loader
    _personal_spec.loader.exec_module(personal_db)  # type: ignore[attr-defined]
    _sys.modules[_personal_mod_name] = personal_db

router = APIRouter()

# ============================================================
# 同步：将班主任明细聚合为“神殿个人汇总表”（个人维度持久化）
# ============================================================


def _sync_personal_from_homeroom(
    db: Session, campus: str, year: int, month: int
) -> None:
    """把 teaching_quality.神殿教化司班主任企业签约目标与结果汇总表
    聚合为 teaching_quality.神殿教化司个人企业签约目标与结果汇总表（按姓名）。
    每次调用会先清空该神殿当月数据，再写入最新聚合结果。"""
    try:
        print(f"[DEBUG] 开始同步 {campus} {year}年{month}月 的班主任签约数据...")

        # 读取班主任明细
        records = db_model.get_records(db, campus, year, month)
        print(f"[DEBUG] 从班主任表读取到 {len(records)} 条记录")

        # 聚合
        summary_map = {}
        for i, r in enumerate(records, 1):
            try:
                name = getattr(r, "班主任姓名", None)
                if not name:
                    print(f"[WARN] 第 {i} 条记录缺少班主任姓名，已跳过")
                    continue

                if name not in summary_map:
                    summary_map[name] = {
                        "目标签约数": 0,
                        "实际签约数": 0,
                        "目标签约收入": 0.0,
                        "实际签约收入": 0.0,
                    }

                # 安全获取值，处理可能的 None 值
                summary_map[name]["目标签约数"] += getattr(r, "目标签约数", 0) or 0
                summary_map[name]["实际签约数"] += getattr(r, "实际签约数", 0) or 0
                summary_map[name]["目标签约收入"] += float(
                    getattr(r, "目标签约收入", 0) or 0
                )
                summary_map[name]["实际签约收入"] += float(
                    getattr(r, "实际签约收入", 0) or 0
                )

                if i % 50 == 0 or i == len(records):
                    print(f"[DEBUG] 已处理 {i}/{len(records)} 条记录")

            except Exception as e:
                print(f"[ERROR] 处理第 {i} 条记录时出错: {str(e)}")
                continue

        print(f"[DEBUG] 聚合完成，共 {len(summary_map)} 位班主任的数据")

        # 清空并写入持久化表
        try:
            print("[DEBUG] 清空现有个人汇总数据...")
            try:
                personal_db.clear_month(db, campus, year, month)
            except Exception as e:
                print(f"[WARN] 清空个人汇总表失败，尝试初始化表: {str(e)}")
                personal_db.init_db_table()
                personal_db.clear_month(db, campus, year, month)

            print("[DEBUG] 开始写入个人汇总数据...")
            success_count = 0
            for i, (name, data) in enumerate(summary_map.items(), 1):
                try:
                    personal_db.upsert_row(
                        db,
                        {
                            "神殿名称": campus,
                            "年份": year,
                            "月份": month,
                            "姓名": name,
                            "目标签约数": data["目标签约数"],
                            "实际签约数": data["实际签约数"],
                            "目标签约收入": data["目标签约收入"],
                            "实际签约收入": data["实际签约收入"],
                        },
                    )
                    success_count += 1

                    if i % 20 == 0 or i == len(summary_map):
                        print(
                            f"[DEBUG] 已写入 {success_count}/{len(summary_map)} 条个人汇总数据"
                        )

                except Exception as e:
                    print(f"[ERROR] 写入个人汇总数据失败（班主任：{name}）: {str(e)}")
                    continue

            print(
                f"[DEBUG] 同步完成，成功写入 {success_count}/{len(summary_map)} 条个人汇总数据"
            )

        except Exception as e:
            print(f"[ERROR] 清空或写入个人汇总表时发生错误: {str(e)}")
            db.rollback()
            raise

    except Exception as e:
        print(f"[CRITICAL] 同步个人汇总数据时发生未处理异常: {str(e)}")
        db.rollback()
        raise


# ============================================================
# Pydantic Models
# ============================================================


class ContractRecordBase(BaseModel):
    """班主任企业签约记录基础模型"""

    神殿名称: str
    年份: int
    月份: int
    班主任姓名: str
    目标签约数: Optional[int] = 0
    实际签约数: Optional[int] = 0
    目标签约收入: Optional[float] = 0.0
    实际签约收入: Optional[float] = 0.0
    签约企业名称: Optional[str] = None
    签约专业方向: Optional[str] = None
    合作周期: Optional[str] = None
    企业联系人姓名: Optional[str] = None
    企业联系电话: Optional[str] = None
    备注: Optional[str] = None


class ContractRecordCreate(ContractRecordBase):
    """创建班主任企业签约记录"""

    pass


class ContractRecordUpdate(BaseModel):
    """更新班主任企业签约记录"""

    目标签约数: Optional[int] = None
    实际签约数: Optional[int] = None
    目标签约收入: Optional[float] = None
    实际签约收入: Optional[float] = None
    签约企业名称: Optional[str] = None
    签约专业方向: Optional[str] = None
    合作周期: Optional[str] = None
    企业联系人姓名: Optional[str] = None
    企业联系电话: Optional[str] = None
    备注: Optional[str] = None


class ContractRecord(ContractRecordBase):
    """班主任企业签约记录响应模型"""

    id: int
    签约完成率: float
    收入完成率: float

    model_config = ConfigDict(
        from_attributes=True,
    )


class PersonalContractSummary(BaseModel):
    """个人（班主任）企业签约汇总"""

    班主任姓名: str
    目标签约数: int
    实际签约数: int
    签约完成率: float
    目标签约收入: float
    实际签约收入: float
    收入完成率: float


class CampusContractSummary(BaseModel):
    """神殿企业签约总汇总"""

    目标签约数: int
    实际签约数: int
    签约完成率: float
    目标签约收入: float
    实际签约收入: float
    收入完成率: float


# ============================================================
# 初始化事件
# ============================================================


def _startup_init():
    try:
        db_model.init_db_table()
    except Exception as e:
        print(f"[警告] 初始化 tq_enterprise_contract 数据库表失败: {e}")
        return

    try:
        goal_db.init_db_table()
    except Exception as e:
        print(f"[警告] 初始化 神殿企业签约目标手填表 失败: {e}")

    try:
        personal_db.init_db_table()
    except Exception as e:
        print(f"[警告] 初始化 神殿教化司个人企业签约目标与结果汇总表 失败: {e}")


# ============================================================
# 班主任明细数据 API
# ============================================================


@router.post(
    "/homeroom-contracts",
    response_model=ContractRecord,
    summary="新增班主任企业签约记录",
)
def create_homeroom_contract(
    record: ContractRecordCreate, db: Session = Depends(get_db)
):
    """
    新增一条班主任的企业签约目标与结果记录。

    - **神殿名称**: 神殿名称
    - **年份**: 年份
    - **月份**: 月份（1-12）
    - **班主任姓名**: 班主任姓名
    - **目标签约数**: 目标签约数量
    - **实际签约数**: 实际签约数量
    - **目标签约收入**: 目标签约收入
    - **实际签约收入**: 实际签约收入
    """
    return db_model.upsert_record(db, record.model_dump())


@router.get(
    "/homeroom-contracts",
    response_model=List[ContractRecord],
    summary="获取班主任企业签约记录列表",
)
def get_homeroom_contracts(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., description="月份"),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、年、月的班主任企业签约记录明细。

    - **campus**: 神殿名称
    - **year**: 年份
    - **month**: 月份（1-12）
    """
    return db_model.get_records(db, campus, year, month)


@router.get(
    "/homeroom-contracts/{record_id}",
    response_model=ContractRecord,
    summary="获取单条班主任记录",
)
def get_homeroom_contract(record_id: int, db: Session = Depends(get_db)):
    """获取指定ID的班主任企业签约记录"""
    record = db_model.get_record_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put(
    "/homeroom-contracts/{record_id}",
    response_model=ContractRecord,
    summary="更新班主任企业签约记录",
)
def update_homeroom_contract(
    record_id: int, update_data: ContractRecordUpdate, db: Session = Depends(get_db)
):
    """更新指定ID的班主任企业签约记录"""
    record = db_model.get_record_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    # 更新非空字段
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None and hasattr(record, key):
            setattr(record, key, value)

    # 重新计算完成率
    if record.目标签约数 > 0:
        record.签约完成率 = (record.实际签约数 / record.目标签约数) * 100
    else:
        record.签约完成率 = 0

    if record.目标签约收入 > 0:
        record.收入完成率 = (record.实际签约收入 / record.目标签约收入) * 100
    else:
        record.收入完成率 = 0

    db.commit()
    db.refresh(record)
    return record


@router.delete("/homeroom-contracts/{record_id}", summary="删除班主任企业签约记录")
def delete_homeroom_contract(record_id: int, db: Session = Depends(get_db)):
    """删除指定ID的班主任企业签约记录"""
    success = db_model.delete_record(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"message": "删除成功"}


# ============================================================
# 批量保存 API（解决前端保存产生大量请求的问题）
# ============================================================


class BatchContractRecord(BaseModel):
    """批量保存：按神殿+年份一次性提交全部记录"""

    神殿名称: str
    年份: int
    records: List[ContractRecordBase]


@router.post("/homeroom-contracts/batch-save", summary="批量保存班主任企业签约记录")
def batch_save_homeroom_contracts(
    payload: BatchContractRecord, db: Session = Depends(get_db)
):
    """批量保存指定神殿+年份的所有记录。

    说明：
    - 为了最大幅度降低网络请求数，采用“整年覆盖写入”策略：
      后端会先删除该神殿该年份的所有记录，再插入 payload.records。
    - 前端一次请求即可完成保存（避免上百次 PUT/POST）。
    """
    try:
        db_model.batch_upsert_records(
            db,
            [r.model_dump() for r in payload.records],
            campus=payload.神殿名称,
            year=payload.年份,
        )
        return {"message": "批量保存成功", "count": len(payload.records)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量保存失败: {str(e)}")


# ============================================================
# 个人（班主任）汇总 API
# ============================================================


@router.get(
    "/personal-contracts-summary",
    response_model=List[PersonalContractSummary],
    summary="获取个人企业签约汇总",
)
def get_personal_summary(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., description="月份"),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、年、月的个人（班主任）维度的企业签约汇总。
    数据由班主任明细数据自动汇总生成。

    - **campus**: 神殿名称
    - **year**: 年份
    - **month**: 月份（1-12）
    """
    # 先同步（将班主任明细聚合入“个人汇总持久化表”）
    _sync_personal_from_homeroom(db, campus, year, month)

    # 从“个人汇总表”读取数据
    rows = personal_db.get_rows(db, campus, year, month)

    result: List[PersonalContractSummary] = []
    for r in rows:
        target_cnt = r.目标签约数 or 0
        actual_cnt = r.实际签约数 or 0
        target_income = r.目标签约收入 or 0.0
        actual_income = r.实际签约收入 or 0.0
        count_rate = (actual_cnt / target_cnt * 100) if target_cnt > 0 else 0
        income_rate = (actual_income / target_income * 100) if target_income > 0 else 0
        result.append(
            PersonalContractSummary(
                班主任姓名=r.姓名,
                目标签约数=target_cnt,
                实际签约数=actual_cnt,
                签约完成率=round(count_rate, 2),
                目标签约收入=target_income,
                实际签约收入=actual_income,
                收入完成率=round(income_rate, 2),
            )
        )

    # 姓名排序
    result.sort(key=lambda x: x.班主任姓名)
    return result


# ============================================================
# 神殿汇总 API
# ============================================================


@router.get(
    "/campus-contracts-summary",
    response_model=CampusContractSummary,
    summary="获取神殿企业签约总汇总",
)
def get_campus_summary(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., description="月份"),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿、年、月的神殿维度的企业签约总汇总。
    数据由班主任明细数据自动汇总生成。

    - **campus**: 神殿名称
    - **year**: 年份
    - **month**: 月份（1-12）
    """
    # 先同步（将班主任明细聚合入“个人汇总持久化表”）
    _sync_personal_from_homeroom(db, campus, year, month)

    # 从“个人汇总表”读取并进行神殿维度汇总
    rows = personal_db.get_rows(db, campus, year, month)

    # 实际值来自个人汇总（其来源为班主任明细聚合）；实际收入可被神殿手填覆盖
    total_actual_count = sum((r.实际签约数 or 0) for r in rows)
    aggregated_actual_income = sum((r.实际签约收入 or 0.0) for r in rows)

    # 目标值：优先使用神殿手填目标；若不存在，则回退为个人汇总的合计目标
    manual_goal = goal_db.get_goal(db, campus, year, month)
    if manual_goal:
        total_target_count = manual_goal.目标签约数 or 0
        total_target_income = manual_goal.目标签约收入 or 0.0
        # 实际收入：如手填存在且不为 None 则覆盖，否则使用个人汇总聚合
        total_actual_income = (
            manual_goal.实际签约收入
            if getattr(manual_goal, "实际签约收入", None) is not None
            else aggregated_actual_income
        )
    else:
        total_target_count = sum((r.目标签约数 or 0) for r in rows)
        total_target_income = sum((r.目标签约收入 or 0.0) for r in rows)
        total_actual_income = aggregated_actual_income

    count_completion_rate = (
        (total_actual_count / total_target_count * 100) if total_target_count > 0 else 0
    )
    income_completion_rate = (
        (total_actual_income / total_target_income * 100)
        if total_target_income > 0
        else 0
    )

    return CampusContractSummary(
        目标签约数=total_target_count,
        实际签约数=total_actual_count,
        签约完成率=round(count_completion_rate, 2),
        目标签约收入=total_target_income,
        实际签约收入=total_actual_income,
        收入完成率=round(income_completion_rate, 2),
    )
