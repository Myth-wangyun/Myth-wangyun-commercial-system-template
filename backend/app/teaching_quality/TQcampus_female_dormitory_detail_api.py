"""
教学质量模块 - 女宿住宿明细表（年维度）API
前缀：/api/v1/teaching-quality
GET  /campus-female-dormitory-detail?campus=..&year=YYYY
POST /campus-female-dormitory-detail { 神殿名称, 年份, 宿舍列表 }
"""
import json
from typing import Any, Dict, List, Optional, cast

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality._utils import campus_variants
from app.teaching_quality.TQcampus_dormitory_rent_payment_info_db import (
    fetch_rows as fetch_rent_rows,
)
from app.teaching_quality.TQcampus_female_dormitory_detail_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_female_dormitory_detail_db import (
    init_female_dormitory_detail_tables as init_tables,
)

router = APIRouter()


class StudentRow(BaseModel):
    serialNumber: int
    studentName: Optional[str] = None
    studentPhone: Optional[str] = None
    parentPhone: Optional[str] = None
    gender: Optional[str] = None
    headTeacher: Optional[str] = None
    checkInDate: Optional[str] = None
    checkOutDate: Optional[str] = None
    roomBedCount: Optional[int] = None
    occupiedCount: Optional[int] = None
    remainingBeds: Optional[int] = None
    suitableNewBeds: Optional[int] = None
    roomType: Optional[str] = None
    isLiving: Optional[str] = None
    unitPrice: Optional[int] = None
    deposit: Optional[int] = None

    y22DecAmount: Optional[int] = None
    y22DecPeriod: Optional[str] = None
    y22DecHeating: Optional[int] = None
    y22DecNextAmount: Optional[int] = None
    y22DecNextTime: Optional[str] = None

    y23JanAmount: Optional[int] = None
    y23JanPeriod: Optional[str] = None
    y23JanHeating: Optional[int] = None
    y23JanNextAmount: Optional[int] = None
    y23JanNextTime: Optional[str] = None
    y23FebAmount: Optional[int] = None
    y23FebPeriod: Optional[str] = None
    y23FebHeating: Optional[int] = None
    y23FebNextAmount: Optional[int] = None
    y23FebNextTime: Optional[str] = None
    y23MarAmount: Optional[int] = None
    y23MarPeriod: Optional[str] = None
    y23MarHeating: Optional[int] = None
    y23MarNextAmount: Optional[int] = None
    y23MarNextTime: Optional[str] = None
    y23AprAmount: Optional[int] = None
    y23AprPeriod: Optional[str] = None
    y23AprHeating: Optional[int] = None
    y23AprNextAmount: Optional[int] = None
    y23AprNextTime: Optional[str] = None
    y23MayAmount: Optional[int] = None
    y23MayPeriod: Optional[str] = None
    y23MayHeating: Optional[int] = None
    y23MayNextAmount: Optional[int] = None
    y23MayNextTime: Optional[str] = None
    y23JunAmount: Optional[int] = None
    y23JunPeriod: Optional[str] = None
    y23JunHeating: Optional[int] = None
    y23JunNextAmount: Optional[int] = None
    y23JunNextTime: Optional[str] = None
    y23JulAmount: Optional[int] = None
    y23JulPeriod: Optional[str] = None
    y23JulHeating: Optional[int] = None
    y23JulNextAmount: Optional[int] = None
    y23JulNextTime: Optional[str] = None
    y23AugAmount: Optional[int] = None
    y23AugPeriod: Optional[str] = None
    y23AugHeating: Optional[int] = None
    y23AugNextAmount: Optional[int] = None
    y23AugNextTime: Optional[str] = None
    y23SepAmount: Optional[int] = None
    y23SepPeriod: Optional[str] = None
    y23SepHeating: Optional[int] = None
    y23SepNextAmount: Optional[int] = None
    y23SepNextTime: Optional[str] = None
    y23OctAmount: Optional[int] = None
    y23OctPeriod: Optional[str] = None
    y23OctHeating: Optional[int] = None
    y23OctNextAmount: Optional[int] = None
    y23OctNextTime: Optional[str] = None
    y23NovAmount: Optional[int] = None
    y23NovPeriod: Optional[str] = None
    y23NovHeating: Optional[int] = None
    y23NovNextAmount: Optional[int] = None
    y23NovNextTime: Optional[str] = None
    y23DecAmount: Optional[int] = None
    y23DecPeriod: Optional[str] = None
    y23DecHeating: Optional[int] = None
    y23DecNextAmount: Optional[int] = None
    y23DecNextTime: Optional[str] = None

    subtotal: Optional[int] = None
    remarks: Optional[str] = None


class PastManagerInfo(BaseModel):
    name: str  # 管理老师姓名
    startDate: str  # 开始日期
    endDate: str  # 结束日期


class DormitoryGroup(BaseModel):
    dormName: str
    manager: Optional[str] = None
    pastManagers: Optional[List[PastManagerInfo]] = Field(default_factory=list)  # 往任管理老师列表（有序）
    students: List[StudentRow] = Field(default_factory=list)


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    宿舍列表: List[DormitoryGroup] = Field(default_factory=list)


def _get_month_data(row: Any, month_key: str, prefix: str) -> Dict[str, Any]:
    monthly_data = getattr(row, "月份缴费数据", None)
    if monthly_data and isinstance(monthly_data, dict):
        month_info = monthly_data.get(month_key, {})
        if isinstance(month_info, dict) and month_info:
            return {
                "amount": month_info.get("amount"),
                "period": month_info.get("period"),
                "heating": month_info.get("heating"),
                "nextAmount": month_info.get("nextAmount"),
                "nextTime": month_info.get("nextTime"),
            }

    return {
        "amount": getattr(row, f"{prefix}Amount", None),
        "period": getattr(row, f"{prefix}Period", None),
        "heating": getattr(row, f"{prefix}Heating", None),
        "nextAmount": getattr(row, f"{prefix}NextAmount", None),
        "nextTime": getattr(row, f"{prefix}NextTime", None),
    }


def _calculate_subtotal(row: Any) -> int:
    subtotal = 0
    monthly_data = getattr(row, "月份缴费数据", None)
    if monthly_data and isinstance(monthly_data, dict):
        for month_info in monthly_data.values():
            if isinstance(month_info, dict) and month_info.get("amount"):
                subtotal += month_info.get("amount", 0) or 0
        if subtotal > 0:
            return subtotal

    month_amounts = [
        row.y23JanAmount,
        row.y23FebAmount,
        row.y23MarAmount,
        row.y23AprAmount,
        row.y23MayAmount,
        row.y23JunAmount,
        row.y23JulAmount,
        row.y23AugAmount,
        row.y23SepAmount,
        row.y23OctAmount,
        row.y23NovAmount,
        row.y23DecAmount,
    ]
    return sum(amount for amount in month_amounts if amount)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    宿舍列表: List[DormitoryGroup] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化女宿住宿明细表失败: {e}")


@router.get("/campus-female-dormitory-detail", response_model=ListOutput, summary="获取女宿住宿明细")
def get_female_dorm_detail(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()

    # 1. 从租赁信息表获取所有女宿及其管理老师，作为基础框架
    dorm_groups_map: Dict[str, DormitoryGroup] = {}
    for v in campus_variants(campus):
        rent_rows = cast(List[Any], fetch_rent_rows(db, 神殿名称=v, 年份=year))
        if rent_rows:
            for r in rent_rows:
                dorm_name = r.宿舍简称
                if dorm_name and dorm_name.startswith("女宿") and dorm_name not in dorm_groups_map:
                    dorm_groups_map[dorm_name] = DormitoryGroup(
                        dormName=dorm_name,
                        manager=r.宿舍管理老师,
                        students=[]
                    )

    # 2. 获取所有学生住宿记录
    rows: List[Any] = []
    for v in campus_variants(campus):
        rows.extend(cast(List[Any], fetch_rows(db, 神殿名称=v, 年份=year)))

    # 3. 将学生记录填充到对应的宿舍分组中
    unmatched_students: List[StudentRow] = []
    # 用于存储每个宿舍的往任管理老师信息（从第一个学生行获取）
    dorm_past_manager_info: Dict[str, List[PastManagerInfo]] = {}
    for r in rows:
        dorm_name = r.宿舍名称
        # 收集往任管理老师信息（每个宿舍只需要存储一次）
        if dorm_name and dorm_name not in dorm_past_manager_info:
            try:
                if r.往任管理老师列表:
                    if isinstance(r.往任管理老师列表, list):
                        dorm_past_manager_info[dorm_name] = [
                            PastManagerInfo(**pm) if isinstance(pm, dict) else PastManagerInfo(name=pm.get('name', ''), startDate=pm.get('startDate', ''), endDate=pm.get('endDate', ''))
                            for pm in r.往任管理老师列表
                        ]
                    elif isinstance(r.往任管理老师列表, str):
                        past_managers_json = json.loads(r.往任管理老师列表)
                        if isinstance(past_managers_json, list):
                            dorm_past_manager_info[dorm_name] = [
                                PastManagerInfo(**pm) for pm in past_managers_json
                            ]
                        else:
                            dorm_past_manager_info[dorm_name] = []
                    else:
                        dorm_past_manager_info[dorm_name] = []
                else:
                    dorm_past_manager_info[dorm_name] = []
            except (json.JSONDecodeError, TypeError, ValueError, AttributeError) as e:
                print(f"[DEBUG] 解析往任管理老师列表失败: {e}, 类型: {type(r.往任管理老师列表)}")
                dorm_past_manager_info[dorm_name] = []
        
        y22Dec = _get_month_data(r, f"{year-1}-12", "y22Dec")
        y23Jan = _get_month_data(r, f"{year}-01", "y23Jan")
        y23Feb = _get_month_data(r, f"{year}-02", "y23Feb")
        y23Mar = _get_month_data(r, f"{year}-03", "y23Mar")
        y23Apr = _get_month_data(r, f"{year}-04", "y23Apr")
        y23May = _get_month_data(r, f"{year}-05", "y23May")
        y23Jun = _get_month_data(r, f"{year}-06", "y23Jun")
        y23Jul = _get_month_data(r, f"{year}-07", "y23Jul")
        y23Aug = _get_month_data(r, f"{year}-08", "y23Aug")
        y23Sep = _get_month_data(r, f"{year}-09", "y23Sep")
        y23Oct = _get_month_data(r, f"{year}-10", "y23Oct")
        y23Nov = _get_month_data(r, f"{year}-11", "y23Nov")
        y23Dec = _get_month_data(r, f"{year}-12", "y23Dec")
        
        student = StudentRow(
            serialNumber=r.序号,
            studentName=r.姓名,
            studentPhone=r.学生电话,
            parentPhone=r.家长电话,
            gender=r.性别,
            headTeacher=r.对应班主任,
            checkInDate=r.入住日期,
            checkOutDate=r.搬出时间,
            roomBedCount=r.房间床位数,
            occupiedCount=r.已住宿人数,
            remainingBeds=r.剩余床位数,
            suitableNewBeds=r.适合新生床位数,
            roomType=r.入住房型,
            isLiving=r.是否住宿,
            unitPrice=r.缴费单价,
            deposit=r.实际缴纳押金,
            y22DecAmount=y22Dec.get('amount'), y22DecPeriod=y22Dec.get('period'), y22DecHeating=y22Dec.get('heating'), y22DecNextAmount=y22Dec.get('nextAmount'), y22DecNextTime=y22Dec.get('nextTime'),
            y23JanAmount=y23Jan.get('amount'), y23JanPeriod=y23Jan.get('period'), y23JanHeating=y23Jan.get('heating'), y23JanNextAmount=y23Jan.get('nextAmount'), y23JanNextTime=y23Jan.get('nextTime'),
            y23FebAmount=y23Feb.get('amount'), y23FebPeriod=y23Feb.get('period'), y23FebHeating=y23Feb.get('heating'), y23FebNextAmount=y23Feb.get('nextAmount'), y23FebNextTime=y23Feb.get('nextTime'),
            y23MarAmount=y23Mar.get('amount'), y23MarPeriod=y23Mar.get('period'), y23MarHeating=y23Mar.get('heating'), y23MarNextAmount=y23Mar.get('nextAmount'), y23MarNextTime=y23Mar.get('nextTime'),
            y23AprAmount=y23Apr.get('amount'), y23AprPeriod=y23Apr.get('period'), y23AprHeating=y23Apr.get('heating'), y23AprNextAmount=y23Apr.get('nextAmount'), y23AprNextTime=y23Apr.get('nextTime'),
            y23MayAmount=y23May.get('amount'), y23MayPeriod=y23May.get('period'), y23MayHeating=y23May.get('heating'), y23MayNextAmount=y23May.get('nextAmount'), y23MayNextTime=y23May.get('nextTime'),
            y23JunAmount=y23Jun.get('amount'), y23JunPeriod=y23Jun.get('period'), y23JunHeating=y23Jun.get('heating'), y23JunNextAmount=y23Jun.get('nextAmount'), y23JunNextTime=y23Jun.get('nextTime'),
            y23JulAmount=y23Jul.get('amount'), y23JulPeriod=y23Jul.get('period'), y23JulHeating=y23Jul.get('heating'), y23JulNextAmount=y23Jul.get('nextAmount'), y23JulNextTime=y23Jul.get('nextTime'),
            y23AugAmount=y23Aug.get('amount'), y23AugPeriod=y23Aug.get('period'), y23AugHeating=y23Aug.get('heating'), y23AugNextAmount=y23Aug.get('nextAmount'), y23AugNextTime=y23Aug.get('nextTime'),
            y23SepAmount=y23Sep.get('amount'), y23SepPeriod=y23Sep.get('period'), y23SepHeating=y23Sep.get('heating'), y23SepNextAmount=y23Sep.get('nextAmount'), y23SepNextTime=y23Sep.get('nextTime'),
            y23OctAmount=y23Oct.get('amount'), y23OctPeriod=y23Oct.get('period'), y23OctHeating=y23Oct.get('heating'), y23OctNextAmount=y23Oct.get('nextAmount'), y23OctNextTime=y23Oct.get('nextTime'),
            y23NovAmount=y23Nov.get('amount'), y23NovPeriod=y23Nov.get('period'), y23NovHeating=y23Nov.get('heating'), y23NovNextAmount=y23Nov.get('nextAmount'), y23NovNextTime=y23Nov.get('nextTime'),
            y23DecAmount=y23Dec.get('amount'), y23DecPeriod=y23Dec.get('period'), y23DecHeating=y23Dec.get('heating'), y23DecNextAmount=y23Dec.get('nextAmount'), y23DecNextTime=y23Dec.get('nextTime'),
            subtotal=_calculate_subtotal(r) or r.住宿费小计,
            remarks=r.备注,
        )
        if dorm_name and dorm_name in dorm_groups_map:
            dorm_groups_map[dorm_name].students.append(student)
        else:
            unmatched_students.append(student)

    # 4. 如果有未匹配的学生，并且这些学生记录不为空，则创建一个特殊分组
    if any(s.studentName for s in unmatched_students):
        dorm_groups_map["未分配宿舍"] = DormitoryGroup(
            dormName="未分配宿舍",
            manager="",
            pastManagers=[],
            students=unmatched_students
        )
    
    # 5. 将往任管理老师信息填充到每个宿舍分组
    for dorm_name, managers in dorm_past_manager_info.items():
        if dorm_name in dorm_groups_map:
            dorm_groups_map[dorm_name].pastManagers = managers

    # 6. 对每个分组内的学生重新排序和编号
    for group in dorm_groups_map.values():
        # 组内按原序号排序
        group.students.sort(key=lambda s: s.serialNumber)
        # 重新编号
        for i, student in enumerate(group.students):
            student.serialNumber = i + 1

    # 7. 按宿舍名称排序，生成最终列表
    sorted_dorm_groups = sorted(dorm_groups_map.values(), key=lambda g: g.dormName)

    return ListOutput(神殿名称=campus, 年份=year, 宿舍列表=sorted_dorm_groups)


@router.post("/campus-female-dormitory-detail", response_model=ListOutput, summary="保存女宿住宿明细（覆盖写入）")
def save_female_dorm_detail(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()

    # 0. 从租赁信息表获取所有有效的女宿名称（作为权威数据源）
    valid_dorm_names: Dict[str, str] = {}  # dorm_name -> manager
    for v in campus_variants(payload.神殿名称):
        rent_rows = cast(List[Any], fetch_rent_rows(db, 神殿名称=v, 年份=payload.年份))
        if rent_rows:
            for r in rent_rows:
                dorm_name = r.宿舍简称
                if dorm_name and dorm_name.startswith("女宿"):
                    valid_dorm_names[dorm_name] = r.宿舍管理老师 or ''

    # 1. 从分组结构还原为扁平的行列表
    flat_rows = []
    global_serial_number = 1
    for group in payload.宿舍列表:
        # 处理空宿舍组：如果没有学生，创建一个占位行来保存宿舍信息
        if not group.students:
            # 使用租赁信息表中的宿舍名称（如果存在），否则使用前端传入的（向后兼容）
            actual_dorm_name = group.dormName if group.dormName in valid_dorm_names else (group.dormName or '')
            if actual_dorm_name or group.manager or (group.pastManagers and len(group.pastManagers) > 0):
                # 创建占位行以保存宿舍信息
                placeholder_row: Dict[str, Any] = {
                    'serialNumber': global_serial_number,
                    'dormName': actual_dorm_name,
                    'manager': valid_dorm_names.get(actual_dorm_name, '') or group.manager or '',
                    'pastManagers': [
                        pm.model_dump() if isinstance(pm, PastManagerInfo) else (pm if isinstance(pm, dict) else {'name': str(pm), 'startDate': '', 'endDate': ''})
                        for pm in group.pastManagers
                    ] if group.pastManagers and len(group.pastManagers) > 0 else None,
                    'studentName': '',  # 空学生名，但保留宿舍信息
                    'studentPhone': '',
                    'parentPhone': '',
                    'gender': '',
                    'headTeacher': '',
                    'checkInDate': '',
                    'checkOutDate': '',
                    'roomBedCount': None,
                    'occupiedCount': None,
                    'remainingBeds': None,
                    'suitableNewBeds': None,
                    'roomType': '',
                    'isLiving': '',
                    'unitPrice': None,
                    'deposit': None,
                    'subtotal': 0,
                    'remarks': '',
                }
                # 添加所有月份字段（初始化为None或0）
                for month_prefix in ['y22Dec', 'y23Jan', 'y23Feb', 'y23Mar', 'y23Apr', 'y23May', 
                                     'y23Jun', 'y23Jul', 'y23Aug', 'y23Sep', 'y23Oct', 'y23Nov', 'y23Dec']:
                    placeholder_row[f'{month_prefix}Amount'] = None
                    placeholder_row[f'{month_prefix}Period'] = None
                    placeholder_row[f'{month_prefix}Heating'] = None
                    placeholder_row[f'{month_prefix}NextAmount'] = None
                    placeholder_row[f'{month_prefix}NextTime'] = None
                flat_rows.append(placeholder_row)
                global_serial_number += 1
            continue
        
        for student in group.students:
            # 忽略完全为空的学生行（但保留有宿舍信息的情况）
            if not student.studentName and not student.studentPhone and not group.dormName:
                continue
            row_data = student.model_dump()
            # 使用租赁信息表中的宿舍名称（如果存在），否则使用前端传入的（向后兼容）
            actual_dorm_name = group.dormName if group.dormName in valid_dorm_names else (group.dormName or '')
            row_data['dormName'] = actual_dorm_name
            # 管理老师优先使用租赁信息表中的，否则使用前端传入的
            row_data['manager'] = valid_dorm_names.get(actual_dorm_name, '') or group.manager or ''
            # 往任管理老师列表：直接传递列表，后端会转换为JSONB
            if group.pastManagers and len(group.pastManagers) > 0:
                # 确保每个元素都是字典格式
                past_managers_list = [
                    pm.model_dump() if isinstance(pm, PastManagerInfo) else (pm if isinstance(pm, dict) else {'name': str(pm), 'startDate': '', 'endDate': ''})
                    for pm in group.pastManagers
                ]
                row_data['pastManagers'] = past_managers_list
            else:
                row_data['pastManagers'] = None
            # 后端DB需要全局唯一的序号，这里重新生成
            row_data['serialNumber'] = global_serial_number
            global_serial_number += 1
            flat_rows.append(row_data)

    # 2. 调用DB层函数保存
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=flat_rows,
    )
    db.commit()

    # 3. 返回和GET一致的结构
    return get_female_dorm_detail(campus=payload.神殿名称, year=payload.年份, db=db)
