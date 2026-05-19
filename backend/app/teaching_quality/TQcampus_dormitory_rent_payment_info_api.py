"""
教学质量模块 - 宿舍租赁及缴费信息（年维度）API
前缀：/api/v1/teaching-quality
GET  /campus-dormitory-rent-payment-info?campus=..&year=YYYY
POST /campus-dormitory-rent-payment-info { 神殿名称, 年份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality._utils import campus_variants
from app.teaching_quality.TQcampus_dormitory_rent_payment_info_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_dormitory_rent_payment_info_db import (
    init_dormitory_rent_payment_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: int
    dormShortName: Optional[str] = None
    address: Optional[str] = None
    landlordName: Optional[str] = None
    landlordPhone: Optional[str] = None
    area: Optional[str] = None
    leaseTerm: Optional[str] = None
    paymentMethod: Optional[str] = None
    rentAmount: Optional[int] = None
    deposit: Optional[int] = None
    payeeInfo: Optional[str] = None
    electricMeterNo: Optional[str] = None
    heatingCardNo: Optional[str] = None
    waterCard: Optional[str] = None
    heatingPayMethod: Optional[str] = None
    heatingPayAmount: Optional[int] = None
    # 首租
    firstRentAmount: Optional[int] = None
    firstRentPeriod: Optional[str] = None
    # 1-12月
    janRentAmount: Optional[int] = None
    janRentPeriod: Optional[str] = None
    febRentAmount: Optional[int] = None
    febRentPeriod: Optional[str] = None
    marRentAmount: Optional[int] = None
    marRentPeriod: Optional[str] = None
    aprRentAmount: Optional[int] = None
    aprRentPeriod: Optional[str] = None
    mayRentAmount: Optional[int] = None
    mayRentPeriod: Optional[str] = None
    junRentAmount: Optional[int] = None
    junRentPeriod: Optional[str] = None
    julRentAmount: Optional[int] = None
    julRentPeriod: Optional[str] = None
    augRentAmount: Optional[int] = None
    augRentPeriod: Optional[str] = None
    sepRentAmount: Optional[int] = None
    sepRentPeriod: Optional[str] = None
    octRentAmount: Optional[int] = None
    octRentPeriod: Optional[str] = None
    novRentAmount: Optional[int] = None
    novRentPeriod: Optional[str] = None
    decRentAmount: Optional[int] = None
    decRentPeriod: Optional[str] = None
    otherMonths: Optional[str] = None
    originalStatus: Optional[str] = None
    signer: Optional[str] = None
    dormManager: Optional[str] = None
    remarks: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化宿舍租赁及缴费信息表失败: {e}")



@router.get("/campus-dormitory-rent-payment-info", response_model=ListOutput, summary="获取宿舍租赁及缴费信息")
def get_dorm_rent_payment_info(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = []
    for v in campus_variants(campus):
        rows = fetch_rows(db, 神殿名称=v, 年份=year)
        if rows:
            break
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                dormShortName=r.宿舍简称,
                address=r.地址房号,
                landlordName=r.房东姓名,
                landlordPhone=r.联系方式,
                area=r.平米,
                leaseTerm=r.租期,
                paymentMethod=r.付款方式,
                rentAmount=r.租金,
                deposit=r.押金,
                payeeInfo=r.收款信息,
                electricMeterNo=r.电表号,
                heatingCardNo=r.取暖卡号,
                waterCard=r.水卡,
                heatingPayMethod=r.暖气费缴费方式,
                heatingPayAmount=r.暖气费缴费金额,
                firstRentAmount=r.首租租金,
                firstRentPeriod=r.首租租期,
                janRentAmount=r.一月租金,
                janRentPeriod=r.一月租期,
                febRentAmount=r.二月租金,
                febRentPeriod=r.二月租期,
                marRentAmount=r.三月租金,
                marRentPeriod=r.三月租期,
                aprRentAmount=r.四月租金,
                aprRentPeriod=r.四月租期,
                mayRentAmount=r.五月租金,
                mayRentPeriod=r.五月租期,
                junRentAmount=r.六月租金,
                junRentPeriod=r.六月租期,
                julRentAmount=r.七月租金,
                julRentPeriod=r.七月租期,
                augRentAmount=r.八月租金,
                augRentPeriod=r.八月租期,
                sepRentAmount=r.九月租金,
                sepRentPeriod=r.九月租期,
                octRentAmount=r.十月租金,
                octRentPeriod=r.十月租期,
                novRentAmount=r.十一月租金,
                novRentPeriod=r.十一月租期,
                decRentAmount=r.十二月租金,
                decRentPeriod=r.十二月租期,
                otherMonths=r.其他月份,
                originalStatus=r.宿舍原始状态,
                signer=r.签约人,
                dormManager=r.宿舍管理老师,
                remarks=r.备注,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post("/campus-dormitory-rent-payment-info", response_model=ListOutput, summary="保存宿舍租赁及缴费信息（覆盖写入）")
def save_dorm_rent_payment_info(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                dormShortName=r.宿舍简称,
                address=r.地址房号,
                landlordName=r.房东姓名,
                landlordPhone=r.联系方式,
                area=r.平米,
                leaseTerm=r.租期,
                paymentMethod=r.付款方式,
                rentAmount=r.租金,
                deposit=r.押金,
                payeeInfo=r.收款信息,
                electricMeterNo=r.电表号,
                heatingCardNo=r.取暖卡号,
                waterCard=r.水卡,
                heatingPayMethod=r.暖气费缴费方式,
                heatingPayAmount=r.暖气费缴费金额,
                firstRentAmount=r.首租租金,
                firstRentPeriod=r.首租租期,
                janRentAmount=r.一月租金,
                janRentPeriod=r.一月租期,
                febRentAmount=r.二月租金,
                febRentPeriod=r.二月租期,
                marRentAmount=r.三月租金,
                marRentPeriod=r.三月租期,
                aprRentAmount=r.四月租金,
                aprRentPeriod=r.四月租期,
                mayRentAmount=r.五月租金,
                mayRentPeriod=r.五月租期,
                junRentAmount=r.六月租金,
                junRentPeriod=r.六月租期,
                julRentAmount=r.七月租金,
                julRentPeriod=r.七月租期,
                augRentAmount=r.八月租金,
                augRentPeriod=r.八月租期,
                sepRentAmount=r.九月租金,
                sepRentPeriod=r.九月租期,
                octRentAmount=r.十月租金,
                octRentPeriod=r.十月租期,
                novRentAmount=r.十一月租金,
                novRentPeriod=r.十一月租期,
                decRentAmount=r.十二月租金,
                decRentPeriod=r.十二月租期,
                otherMonths=r.其他月份,
                originalStatus=r.宿舍原始状态,
                signer=r.签约人,
                dormManager=r.宿舍管理老师,
                remarks=r.备注,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)

