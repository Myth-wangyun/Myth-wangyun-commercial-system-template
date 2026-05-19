"""
神殿感知的就业数据API（使用 academic schema）
根据用户选择的神殿操作对应的就业明细表
"""

import base64
import re
from datetime import date, datetime
from decimal import Decimal
from io import BytesIO
from typing import Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from openpyxl import load_workbook
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import employment as employment_crud
from ....models.config_master import CampusProfile

router = APIRouter()

class 就业明细创建(BaseModel):
    """创建就业明细模型"""
    序号: int = Field(..., description="序号")
    姓名: str = Field(..., description="姓名")
    性别: str = Field(..., description="性别")
    年龄: int = Field(..., description="年龄")
    所报专业: str = Field(..., description="所报专业")
    学历: str = Field(..., description="学历")
    专业: Optional[str] = Field(None, description="专业")
    毕业学校: Optional[str] = Field(None, description="毕业学校")
    目前所获最高学历证书及性质: Optional[str] = Field(None, description="目前所获最高学历证书及性质")
    联系电话: str = Field(..., description="联系电话")
    通信地址: Optional[str] = Field(None, description="通信地址")
    入职时间: date = Field(..., description="入职时间")
    就业地区: str = Field(..., description="就业地区")
    就业单位: str = Field(..., description="就业单位")
    就业岗位: str = Field(..., description="就业岗位")
    试用期薪资: Optional[Decimal] = Field(None, description="试用期薪资(元)")
    转正薪资: Optional[str] = Field(None, description="转正薪资详情")
    转正金额: Optional[Decimal] = Field(None, description="转正金额(元)")
    回访情况: Optional[str] = Field(None, description="回访情况")
    回访入职公司: Optional[str] = Field(None, description="回访入职公司")
    回访转正金额: Optional[Decimal] = Field(None, description="回访转正金额(元)")
    班级名称: Optional[str] = Field(None, description="班级名称")

class 就业明细更新(BaseModel):
    """更新就业明细模型"""
    序号: Optional[int] = Field(None, description="序号")
    姓名: Optional[str] = Field(None, description="姓名")
    性别: Optional[str] = Field(None, description="性别")
    年龄: Optional[int] = Field(None, description="年龄")
    所报专业: Optional[str] = Field(None, description="所报专业")
    学历: Optional[str] = Field(None, description="学历")
    专业: Optional[str] = Field(None, description="专业")
    毕业学校: Optional[str] = Field(None, description="毕业学校")
    目前所获最高学历证书及性质: Optional[str] = Field(None, description="目前所获最高学历证书及性质")
    联系电话: Optional[str] = Field(None, description="联系电话")
    通信地址: Optional[str] = Field(None, description="通信地址")
    入职时间: Optional[date] = Field(None, description="入职时间")
    就业地区: Optional[str] = Field(None, description="就业地区")
    就业单位: Optional[str] = Field(None, description="就业单位")
    就业岗位: Optional[str] = Field(None, description="就业岗位")
    试用期薪资: Optional[Decimal] = Field(None, description="试用期薪资(元)")
    转正薪资: Optional[str] = Field(None, description="转正薪资详情")
    转正金额: Optional[Decimal] = Field(None, description="转正金额(元)")
    回访情况: Optional[str] = Field(None, description="回访情况")
    回访入职公司: Optional[str] = Field(None, description="回访入职公司")
    回访转正金额: Optional[Decimal] = Field(None, description="回访转正金额(元)")
    班级名称: Optional[str] = Field(None, description="班级名称")

def get_campus_from_header(
    x_campus: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> str:
    """从请求头获取神殿信息，支持明文或 base64，并与 config.campuses 表校验"""
    if not x_campus:
        raise HTTPException(status_code=400, detail="缺少神殿信息，请在请求头中提供 X-Campus")

    # 尝试解码 base64
    try:
        decoded = base64.b64decode(x_campus).decode("utf-8")
        decoded_campus = unquote(decoded)
    except Exception:
        decoded_campus = x_campus

    # 与 config.campuses 动态校验，支持新建神殿
    campuses = db.query(CampusProfile.name).all()
    campus_names = {row[0] for row in campuses}
    if decoded_campus not in campus_names:
        raise HTTPException(status_code=400, detail=f"无效的神殿: {decoded_campus}")

    return decoded_campus

@router.post("/", summary="创建就业明细")
async def create_employment_detail(
    就业明细: 就业明细创建,
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    创建就业明细记录（academic schema）
    
    根据用户选择的神殿插入到对应的就业明细表中
    """
    try:
        result = employment_crud.创建就业明细(
            db=db,
            序号=就业明细.序号,
            姓名=就业明细.姓名,
            性别=就业明细.性别,
            年龄=就业明细.年龄,
            所报专业=就业明细.所报专业,
            学历=就业明细.学历,
            联系电话=就业明细.联系电话,
            入职时间=就业明细.入职时间,
            神殿=campus,  # 使用从请求头获取的神殿
            就业地区=就业明细.就业地区,
            就业单位=就业明细.就业单位,
            就业岗位=就业明细.就业岗位,
            转正薪资=就业明细.转正薪资,
            转正金额=float(就业明细.转正金额) if 就业明细.转正金额 else None,
            回访情况=就业明细.回访情况,
            回访入职公司=就业明细.回访入职公司,
            回访转正金额=float(就业明细.回访转正金额) if 就业明细.回访转正金额 else None,
            专业=就业明细.专业,
            毕业学校=就业明细.毕业学校,
            目前所获最高学历证书及性质=就业明细.目前所获最高学历证书及性质,
            通信地址=就业明细.通信地址,
            试用期薪资=float(就业明细.试用期薪资) if 就业明细.试用期薪资 else None,
            班级名称=就业明细.班级名称
        )
        
        if result:
            return result.to_dict()
        else:
            raise HTTPException(status_code=500, detail="创建就业明细失败")
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"创建就业明细失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e

@router.get("/", summary="获取就业明细列表")
async def get_employment_details(
    跳过: int = Query(0, description="跳过的记录数"),
    限制: int = Query(100, description="限制返回的记录数"),
    姓名: Optional[str] = Query(None, description="按姓名筛选"),
    所报专业: Optional[str] = Query(None, description="按所报专业筛选"),
    就业地区: Optional[str] = Query(None, description="按就业地区筛选"),
    就业单位: Optional[str] = Query(None, description="按就业单位筛选"),
    班级名称: Optional[str] = Query(None, description="按班级名称筛选"),
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    获取就业明细列表（academic schema）
    
    根据用户选择的神殿从对应的就业明细表中获取数据
    """
    try:
        results = employment_crud.获取就业明细列表(
            db=db,
            跳过=跳过,
            限制=限制,
            姓名=姓名,
            所报专业=所报专业,
            神殿=campus,
            就业地区=就业地区,
            就业单位=就业单位,
            班级名称=班级名称
        )
        
        return [r.to_dict() for r in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业明细列表失败: {str(e)}") from e

@router.get("/{id}", summary="获取就业明细详情")
async def get_employment_detail(
    id: int,
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    根据ID获取就业明细详情（academic schema）
    
    - **id**: 就业明细ID
    """
    try:
        result = employment_crud.获取就业明细(db=db, 明细ID=id)
        
        if not result:
            raise HTTPException(status_code=404, detail="就业明细不存在")
        
        # 验证神殿是否匹配
        if result.神殿 != campus:
            raise HTTPException(status_code=403, detail="该就业明细不属于当前神殿")
        
        return result.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业明细详情失败: {str(e)}") from e

@router.put("/{id}", summary="更新就业明细")
async def update_employment_detail(
    id: int,
    就业明细: 就业明细更新,
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    更新就业明细记录（academic schema）
    
    - **id**: 就业明细ID
    """
    try:
        # 先验证记录是否存在且属于当前神殿
        existing = employment_crud.获取就业明细(db=db, 明细ID=id)
        if not existing:
            raise HTTPException(status_code=404, detail="就业明细不存在")
        
        if existing.神殿 != campus:
            raise HTTPException(status_code=403, detail="该就业明细不属于当前神殿")
        
        # 过滤掉None值，并转换Decimal类型
        update_data = {}
        for k, v in 就业明细.model_dump().items():
            if v is not None:
                # 转换Decimal类型为float
                if isinstance(v, Decimal):
                    update_data[k] = float(v)
                else:
                    update_data[k] = v
        
        if not update_data:
            raise HTTPException(status_code=400, detail="没有提供要更新的数据")
        
        result = employment_crud.更新就业明细(
            db=db,
            明细ID=id,
            更新数据=update_data
        )
        
        if result:
            return result.to_dict()
        else:
            raise HTTPException(status_code=404, detail="就业明细不存在或更新失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新就业明细失败: {str(e)}") from e

@router.delete("/{id}", summary="删除就业明细")
async def delete_employment_detail(
    id: int,
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    删除就业明细记录（academic schema）
    
    - **id**: 就业明细ID
    """
    try:
        # 先验证记录是否存在且属于当前神殿
        existing = employment_crud.获取就业明细(db=db, 明细ID=id)
        if not existing:
            raise HTTPException(status_code=404, detail="就业明细不存在")
        
        if existing.神殿 != campus:
            raise HTTPException(status_code=403, detail="该就业明细不属于当前神殿")
        
        success = employment_crud.删除就业明细(db=db, 明细ID=id)
        
        if success:
            return {"message": "删除成功"}
        else:
            raise HTTPException(status_code=404, detail="就业明细不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除就业明细失败: {str(e)}") from e

@router.get("/statistics/overview", summary="获取就业统计概览")
async def get_employment_statistics(
    日期_开始: Optional[date] = Query(None, description="开始日期"),
    日期_结束: Optional[date] = Query(None, description="结束日期"),
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    获取就业统计概览（academic schema）
    
    根据用户选择的神殿统计对应的就业明细数据
    """
    try:
        stats = employment_crud.获取就业统计信息(
            db=db,
            开始日期=日期_开始,
            结束日期=日期_结束,
            神殿=campus
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业统计失败: {str(e)}") from e


@router.get("/class-summary/auto-calculate", summary="自动计算班级就业总结")
async def auto_calculate_class_summary(
    神殿: str = Query(..., description="神殿名称"),
    班级名称: str = Query(..., description="班级名称"),
    campus: str = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    根据班级就业明细表自动计算就业总结数据
    就业薪资使用回访转正金额，如果没有则使用转正金额
    """
    try:
        # 使用header中的神殿，如果没有则使用query参数
        target_campus = campus if campus else 神殿
        
        result = employment_crud.自动计算班级就业总结(
            db=db,
            神殿=target_campus,
            班级名称=班级名称
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动计算就业总结失败: {str(e)}") from e


def extract_campus_and_class(text: str) -> tuple[Optional[str], Optional[str]]:
    """
    从文本中提取神殿和班级信息
    例如："清美教育（慈悲殿）Y22108班就业信息表" -> ("石美", "Y22108")
    """
    campus = None
    class_name = None
    
    # 尝试从括号中提取神殿：清美教育（慈悲殿）
    campus_match = re.search(r'[（(]([^）)]*神殿)[）)]', text)
    if campus_match:
        campus_text = campus_match.group(1)
        # 去掉"神殿"后缀
        campus = campus_text.replace('神殿', '').strip()
    
    # 尝试提取班级：Y22108班、Y22108 班、168班、168 班 等
    class_match = re.search(r'([A-Z]?\d+)\s*班', text)
    if class_match:
        class_name = class_match.group(1)
    
    return campus, class_name


def parse_age(age_str: str) -> Optional[int]:
    """解析年龄，支持"19岁"或"19"格式"""
    if not age_str or not str(age_str).strip():
        return None
    try:
        age_text = str(age_str).strip().replace('岁', '').strip()
        return int(age_text)
    except (TypeError, ValueError):
        return None


def parse_salary(salary_str: str) -> Optional[float]:
    """解析薪资，提取数字"""
    if not salary_str or not str(salary_str).strip():
        return None
    try:
        # 提取数字（包括小数）
        match = re.search(r'(\d+(?:\.\d+)?)', str(salary_str))
        if match:
            return float(match.group(1))
        return None
    except (TypeError, ValueError):
        return None


def parse_date(date_str: str) -> Optional[date]:
    """解析日期，支持"2024.6.20"或"2024-06-20"格式"""
    if not date_str or not str(date_str).strip():
        return None
    try:
        date_text = str(date_str).strip()
        # 支持 2024.6.20 格式
        if '.' in date_text:
            parts = date_text.split('.')
            if len(parts) == 3:
                year = int(parts[0])
                month = int(parts[1])
                day = int(parts[2])
                return date(year, month, day)
        # 支持标准格式
        return datetime.strptime(date_text, '%Y-%m-%d').date()
    except ValueError:
        return None


@router.post("/upload", summary="上传Excel文件自动导入就业信息")
async def upload_employment_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    x_campus: Optional[str] = Header(None)
):
    """
    上传Excel文件，自动识别班级和神殿，并导入就业信息
    
    支持从文件名或Excel表格标题中提取班级和神殿信息
    例如：文件名或标题包含"清美教育（慈悲殿）Y22108班就业信息表"
    会自动识别神殿为"石美"，班级为"Y22108"
    """
    try:
        # 读取文件内容
        contents = await file.read()
        workbook = load_workbook(filename=BytesIO(contents), data_only=True)
        
        # 获取第一个工作表（或包含"就业信息表"的工作表）
        sheet = None
        # 先尝试查找包含"就业信息表"的工作表
        for sheet_name in workbook.sheetnames:
            if '就业信息表' in sheet_name or '就业信息' in sheet_name:
                sheet = workbook[sheet_name]
                break
        
        # 如果没有找到，使用活动工作表或第一个工作表
        if not sheet:
            sheet = workbook.active if workbook.active else workbook[workbook.sheetnames[0]]
        
        if not sheet:
            raise HTTPException(status_code=400, detail="Excel文件为空")
        
        # 从文件名提取神殿和班级
        filename_campus, filename_class = extract_campus_and_class(file.filename or "")
        
        # 从工作表标题提取神殿和班级（检查前几行，通常在A1单元格或附近）
        title_campus, title_class = None, None
        for row_idx in range(1, min(10, sheet.max_row + 1)):
            cell_value = sheet[f'A{row_idx}'].value
            if cell_value:
                cell_str = str(cell_value).strip()
                if '神殿' in cell_str or '班' in cell_str or '就业信息表' in cell_str:
                    title_campus, title_class = extract_campus_and_class(cell_str)
                    if title_campus or title_class:
                        break
        
        # 尝试从header获取神殿
        header_campus = None
        if x_campus:
            try:
                decoded = base64.b64decode(x_campus).decode("utf-8")
                header_campus = unquote(decoded)
            except Exception:
                header_campus = x_campus
        
        # 优先使用header中的神殿，其次使用标题，最后使用文件名
        detected_campus = header_campus or title_campus or filename_campus
        detected_class = title_class or filename_class
        
        if not detected_campus:
            raise HTTPException(status_code=400, detail="无法识别神殿，请确保请求头X-Campus、文件名或Excel标题包含神殿信息，例如：清美教育（慈悲殿）")
        
        if not detected_class:
            raise HTTPException(status_code=400, detail="无法识别班级，请确保文件名或Excel标题包含班级信息，例如：Y22108班")
        
        final_campus = detected_campus
        
        # 找到表头行（包含"序号"、"姓名"等关键字段）
        # 扩大查找范围，跳过标题行和空行
        header_row = None
        max_search_rows = min(100, sheet.max_row)  # 最多查找100行
        
        # 第一步：查找包含"序号"和"姓名"的典型表头行
        for idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=max_search_rows, values_only=True), start=1):
            if not row or all(not col for col in row):  # 跳过空行
                continue
            # 检查是否包含表头关键词
            row_text = ' '.join([str(col).strip() if col else '' for col in row[:30]])  # 只检查前30列
            # 如果同时包含"序号"和"姓名"，认为这是表头行
            if '序号' in row_text and '姓名' in row_text:
                # 进一步确认：至少还需要包含"性别"或"年龄"或"所报专业"中的一个
                if '性别' in row_text or '年龄' in row_text or '所报专业' in row_text or '就业单位' in row_text:
                    header_row = idx
                    break
        
        # 第二步：如果没找到，尝试查找包含"姓名"且包含多个就业相关字段的行
        if not header_row:
            for idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=max_search_rows, values_only=True), start=1):
                if not row or all(not col for col in row):
                    continue
                row_text = ' '.join([str(col).strip() if col else '' for col in row[:30]])
                if '姓名' in row_text:
                    # 检查是否包含多个就业相关字段
                    employment_keywords = ['性别', '年龄', '所报专业', '就业地区', '就业单位', '就业岗位', '入职时间']
                    keyword_count = sum(1 for keyword in employment_keywords if keyword in row_text)
                    if keyword_count >= 3:  # 至少包含3个就业相关字段
                        header_row = idx
                        break
        
        # 第三步：如果还是没找到，尝试只查找包含"姓名"且包含"性别"的行
        if not header_row:
            for idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=max_search_rows, values_only=True), start=1):
                if not row or all(not col for col in row):
                    continue
                row_text = ' '.join([str(col).strip() if col else '' for col in row[:30]])
                if '姓名' in row_text and '性别' in row_text:
                    header_row = idx
                    break
        
        if not header_row:
            # 提供详细的错误信息，显示前20行内容
            sample_headers = []
            for idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=min(20, sheet.max_row), values_only=True), start=1):
                if row and any(col for col in row):  # 只显示非空行
                    row_text = ' '.join([str(col).strip() if col else '' for col in row[:15]])  # 只取前15列
                    if row_text.strip():  # 只显示非空内容
                        sample_headers.append(f"第{idx}行: {row_text[:150]}...")  # 限制长度
            
            error_msg = "无法找到表头行，请确保Excel包含包含'序号'和'姓名'的就业信息明细表。\n"
            error_msg += f"已搜索前{max_search_rows}行。\n"
            if sample_headers:
                error_msg += "前20行内容预览：\n" + "\n".join(sample_headers[:10])  # 最多显示10行
            else:
                error_msg += "工作表看起来是空的。"
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 读取表头
        headers = []
        for cell in sheet[header_row]:
            headers.append(cell.value if cell.value else '')
        
        # 建立列索引映射
        col_map = {}
        for idx, header in enumerate(headers):
            if not header:
                continue
            header_str = str(header).strip()
            if '序号' in header_str:
                col_map['serialNumber'] = idx
            elif '姓名' in header_str:
                col_map['name'] = idx
            elif '性别' in header_str:
                col_map['gender'] = idx
            elif '年龄' in header_str:
                col_map['age'] = idx
            elif '所报专业' in header_str:
                col_map['reportedMajor'] = idx
            elif '学历' in header_str:
                col_map['education'] = idx
            elif '专业' in header_str and '所报专业' not in header_str:
                col_map['major'] = idx
            elif '毕业学校' in header_str:
                col_map['graduateSchool'] = idx
            elif '目前所获最高学历证书及性质' in header_str or '最高学历' in header_str:
                col_map['highestDegreeCert'] = idx
            elif '联系电话' in header_str:
                col_map['phone'] = idx
            elif '通信地址' in header_str:
                col_map['address'] = idx
            elif '入职时间' in header_str:
                col_map['entryDate'] = idx
            elif '就业地区' in header_str:
                col_map['employmentRegion'] = idx
            elif '就业单位' in header_str:
                col_map['employmentCompany'] = idx
            elif '就业岗位' in header_str:
                col_map['employmentPosition'] = idx
            elif '试用期薪资' in header_str:
                col_map['probationarySalary'] = idx
            elif '转正薪资' in header_str and '转正金额' not in header_str:
                col_map['regularSalaryText'] = idx
            elif '转正金额' in header_str:
                col_map['regularSalary'] = idx
            elif '回访情况' in header_str or '回访情况入职公司' in header_str:
                col_map['followUpStatus'] = idx
            elif '回访转正金额' in header_str or '回访转正' in header_str:
                col_map['followUpAssessmentSalary'] = idx
            elif '回访入职公司' in header_str and 'followUpCompany' not in col_map:
                # 如果还没有设置回访入职公司，可以在这里设置
                pass
        
        # 检查必需字段
        if 'name' not in col_map:
            raise HTTPException(status_code=400, detail="无法找到'姓名'列")
        
        # 读取数据行
        imported_count = 0
        skipped_count = 0
        errors = []
        
        for row_idx, row in enumerate(sheet.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
            # 跳过空行
            if not row or all(not cell for cell in row):
                continue
            
            # 获取姓名（必需字段）
            name_idx = col_map.get('name')
            if name_idx is None or row[name_idx] is None:
                continue
            
            name = str(row[name_idx]).strip()
            if not name or name == '':
                continue
            
            try:
                # 解析各字段
                serial_number = row[col_map.get('serialNumber', 0)] if col_map.get('serialNumber') is not None else None
                if serial_number:
                    try:
                        serial_number = int(float(str(serial_number)))
                    except (TypeError, ValueError):
                        serial_number = imported_count + 1
                else:
                    serial_number = imported_count + 1
                
                gender = str(row[col_map.get('gender', 0)]).strip() if col_map.get('gender') is not None and row[col_map.get('gender', 0)] else ''
                age = parse_age(str(row[col_map.get('age', 0)])) if col_map.get('age') is not None and row[col_map.get('age', 0)] else None
                reported_major = str(row[col_map.get('reportedMajor', 0)]).strip() if col_map.get('reportedMajor') is not None and row[col_map.get('reportedMajor', 0)] else ''
                education = str(row[col_map.get('education', 0)]).strip() if col_map.get('education') is not None and row[col_map.get('education', 0)] else ''
                major = str(row[col_map.get('major', 0)]).strip() if col_map.get('major') is not None and row[col_map.get('major', 0)] else None
                graduate_school = str(row[col_map.get('graduateSchool', 0)]).strip() if col_map.get('graduateSchool') is not None and row[col_map.get('graduateSchool', 0)] else None
                highest_degree_cert = str(row[col_map.get('highestDegreeCert', 0)]).strip() if col_map.get('highestDegreeCert') is not None and row[col_map.get('highestDegreeCert', 0)] else None
                phone = str(row[col_map.get('phone', 0)]).strip() if col_map.get('phone') is not None and row[col_map.get('phone', 0)] else ''
                address = str(row[col_map.get('address', 0)]).strip() if col_map.get('address') is not None and row[col_map.get('address', 0)] else None
                entry_date = parse_date(str(row[col_map.get('entryDate', 0)])) if col_map.get('entryDate') is not None and row[col_map.get('entryDate', 0)] else None
                employment_region = str(row[col_map.get('employmentRegion', 0)]).strip() if col_map.get('employmentRegion') is not None and row[col_map.get('employmentRegion', 0)] else ''
                employment_company = str(row[col_map.get('employmentCompany', 0)]).strip() if col_map.get('employmentCompany') is not None and row[col_map.get('employmentCompany', 0)] else ''
                employment_position = str(row[col_map.get('employmentPosition', 0)]).strip() if col_map.get('employmentPosition') is not None and row[col_map.get('employmentPosition', 0)] else ''
                probationary_salary = parse_salary(str(row[col_map.get('probationarySalary', 0)])) if col_map.get('probationarySalary') is not None and row[col_map.get('probationarySalary', 0)] else None
                regular_salary_text = str(row[col_map.get('regularSalaryText', 0)]).strip() if col_map.get('regularSalaryText') is not None and row[col_map.get('regularSalaryText', 0)] else None
                regular_salary = parse_salary(str(row[col_map.get('regularSalary', 0)])) if col_map.get('regularSalary') is not None and row[col_map.get('regularSalary', 0)] else None
                follow_up_status = str(row[col_map.get('followUpStatus', 0)]).strip() if col_map.get('followUpStatus') is not None and row[col_map.get('followUpStatus', 0)] else None
                # 修复回访转正金额解析：确保正确获取列索引（T列，索引19）
                follow_up_assessment_salary = None
                if col_map.get('followUpAssessmentSalary') is not None:
                    follow_up_assessment_salary_idx = col_map.get('followUpAssessmentSalary')
                    if follow_up_assessment_salary_idx is not None and follow_up_assessment_salary_idx < len(row):
                        cell_value = row[follow_up_assessment_salary_idx]
                        if cell_value is not None and str(cell_value).strip():
                            # 尝试解析薪资值
                            parsed_value = parse_salary(str(cell_value))
                            if parsed_value is not None:
                                follow_up_assessment_salary = parsed_value
                            else:
                                # 如果parse_salary返回None，尝试直接转换为数字
                                try:
                                    # 移除可能的货币符号和空格
                                    clean_value = str(cell_value).replace('¥', '').replace('$', '').replace(',', '').strip()
                                    if clean_value:
                                        follow_up_assessment_salary = float(clean_value)
                                except (ValueError, TypeError):
                                    pass
                else:
                    # 如果列名识别失败，尝试直接从T列（索引19）读取（作为备用方案）
                    if len(row) > 19:
                        cell_value = row[19]  # T列是第20列，索引为19
                        if cell_value is not None and str(cell_value).strip():
                            try:
                                parsed_value = parse_salary(str(cell_value))
                                if parsed_value is not None:
                                    follow_up_assessment_salary = parsed_value
                                else:
                                    clean_value = str(cell_value).replace('¥', '').replace('$', '').replace(',', '').strip()
                                    if clean_value:
                                        follow_up_assessment_salary = float(clean_value)
                            except (ValueError, TypeError):
                                pass
                
                # 如果没有转正金额，尝试从转正薪资文本中提取
                if not regular_salary and regular_salary_text:
                    regular_salary = parse_salary(regular_salary_text)
                
                # 验证必需字段
                if (
                    not name
                    or age is None
                    or not gender
                    or not reported_major
                    or not education
                    or not phone
                    or not employment_region
                    or not employment_company
                    or not employment_position
                ):
                    skipped_count += 1
                    errors.append(f"第{row_idx}行：缺少必需字段")
                    continue
                
                if not entry_date:
                    skipped_count += 1
                    errors.append(f"第{row_idx}行：入职时间格式错误")
                    continue
                
                # 检查班级档案表中该学生的"审批无需就业"状态
                try:
                    from sqlalchemy import text
                    
                    # 标准化神殿名称（去掉"神殿"后缀）
                    campus_for_query = final_campus.rstrip('神殿').strip() if final_campus.endswith('神殿') else final_campus
                    
                    query = text("""
                        SELECT "审批无需就业" 
                        FROM teaching_quality."班级档案表"
                        WHERE "姓名" = :name 
                          AND "班级名称" = :class_name
                          AND ("神殿名称" = :campus OR "神殿名称" = :campus_normalized OR "神殿名称" = :campus_with_suffix)
                        LIMIT 1
                    """)
                    
                    result = db.execute(query, {
                        "name": name,
                        "class_name": detected_class,
                        "campus": final_campus,
                        "campus_normalized": campus_for_query,
                        "campus_with_suffix": f"{campus_for_query}神殿"
                    })
                    approval_row = result.fetchone()
                    
                    # 如果该学生的审批无需就业为"无需就业"，则跳过导入
                    if approval_row and approval_row[0] and str(approval_row[0]).strip() == '无需就业':
                        skipped_count += 1
                        errors.append(f"第{row_idx}行（{name}）：审批无需就业，已跳过")
                        continue
                except Exception as e:
                    # 如果查询失败，记录日志但不阻止导入（可能班级档案表中没有该学生）
                    print(f"[上传Excel] 查询班级档案表失败（学生：{name}）：{str(e)}")
                    pass
                
                # 创建就业明细
                employment_crud.创建就业明细(
                    db=db,
                    序号=serial_number,
                    姓名=name,
                    性别=gender,
                    年龄=age,
                    所报专业=reported_major,
                    学历=education,
                    联系电话=phone,
                    入职时间=entry_date,
                    神殿=final_campus,
                    就业地区=employment_region,
                    就业单位=employment_company,
                    就业岗位=employment_position,
                    转正薪资=regular_salary_text,
                    转正金额=regular_salary,
                    回访情况=follow_up_status,
                    回访入职公司=follow_up_status,  # 使用回访情况作为回访入职公司
                    回访转正金额=follow_up_assessment_salary,
                    专业=major,
                    毕业学校=graduate_school,
                    目前所获最高学历证书及性质=highest_degree_cert,
                    通信地址=address,
                    试用期薪资=probationary_salary,
                    班级名称=detected_class
                )
                
                imported_count += 1
                
            except Exception as e:
                skipped_count += 1
                errors.append(f"第{row_idx}行：{str(e)}")
                continue
        
        db.commit()
        
        return {
            "success": True,
            "message": f"导入完成：成功导入 {imported_count} 条记录，跳过 {skipped_count} 条记录",
            "detected_campus": detected_campus,
            "detected_class": detected_class,
            "final_campus": final_campus,
            "imported_count": imported_count,
            "skipped_count": skipped_count,
            "errors": errors[:10] if errors else []  # 最多返回10个错误
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"上传Excel文件失败: {str(e)}\n{traceback.format_exc()}") from e
