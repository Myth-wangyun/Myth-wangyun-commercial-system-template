"""
祈福司入职离职明细表 API
"""

from app.core.database import get_db
from app.crud import consult_entry_exit_detail as crud
from app.models.consult.entry_exit_detail import 祈福司入职离职明细表
from app.schemas.consult_entry_exit_detail import (
    入职离职明细列表响应,
    入职离职明细创建,
    入职离职明细响应,
)
from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/{year}",
    response_model=入职离职明细列表响应,
    summary="获取指定年份的入职离职明细",
)
async def get_entry_exit_detail(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """获取指定年份的入职离职明细列表"""
    records = crud.获取年度明细列表(db, year)
    
    # 转换日期格式
    响应列表 = []
    for record in records:
        响应列表.append(
            入职离职明细响应(
                记录ID=record.记录ID,
                年份=record.年份,
                板块=record.板块,
                岗位=record.岗位,
                类别=record.类别,
                姓名=record.姓名,
                入职时间=record.入职时间.strftime('%Y-%m-%d') if record.入职时间 else '',
                离职时间=record.离职时间.strftime('%Y-%m-%d') if record.离职时间 else '',
                备注=record.备注,
                创建时间=record.创建时间,
                更新时间=record.更新时间,
            )
        )
    
    return 入职离职明细列表响应(年份=year, data=响应列表)


@router.post(
    "/batch-save",
    response_model=入职离职明细列表响应,
    summary="批量保存入职离职明细",
)
async def batch_save_entry_exit_detail(
    数据: 入职离职明细创建 = Body(..., description="明细数据"),
    db: Session = Depends(get_db),
):
    """批量保存入职离职明细（覆盖该年份的所有数据）"""
    try:
        records = crud.批量保存明细(db, 数据.年份, 数据.明细列表)
        
        # 转换日期格式
        响应列表 = []
        for record in records:
            响应列表.append(
                入职离职明细响应(
                    记录ID=record.记录ID,
                    年份=record.年份,
                    板块=record.板块,
                    岗位=record.岗位,
                    类别=record.类别,
                    姓名=record.姓名,
                    入职时间=record.入职时间.strftime('%Y-%m-%d') if record.入职时间 else '',
                    离职时间=record.离职时间.strftime('%Y-%m-%d') if record.离职时间 else '',
                    备注=record.备注,
                    创建时间=record.创建时间,
                    更新时间=record.更新时间,
                )
            )
        
        return 入职离职明细列表响应(年份=数据.年份, data=响应列表)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}") from e


@router.delete(
    "/{year}",
    summary="删除指定年份的入职离职明细",
)
async def delete_entry_exit_detail(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """删除指定年份的所有入职离职明细"""
    try:
        count = crud.删除年度明细(db, year)
        return {"message": f"成功删除 {count} 条记录"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e


@router.get(
    "/statistics/{year}",
    summary="从明细表统计入职离职数据",
)
async def get_entry_exit_statistics(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """
    从明细表统计各岗位每月的入职和离职人数
    用于自动填充01汇总表和02分解表
    """
    try:
        # 查询该年份的所有明细记录
        records = db.query(祈福司入职离职明细表).filter(
            祈福司入职离职明细表.年份 == year
        ).all()
        
        # 岗位映射（用于汇总表Tab1）
        # 01汇总表的岗位：咨询干部、咨询、咨询助理、渠道
        汇总表岗位 = ['咨询干部', '咨询', '咨询助理', '渠道']
        
        # 02分解表的岗位（带板块）：咨询干部、咨询(咨询)、助理(咨询)、渠道
        分解表岗位 = ['咨询干部', '咨询', '助理', '渠道']
        
        # 初始化统计结构
        def create_empty_stats():
            return {
                '入职': {m: 0 for m in range(1, 13)},
                '离职': {m: 0 for m in range(1, 13)}
            }
        
        # 汇总表统计（按岗位）
        汇总统计 = {岗位: create_empty_stats() for 岗位 in 汇总表岗位}
        
        # 分解表统计（按岗位，分解表中咨询和助理属于"咨询"板块）
        分解统计 = {岗位: create_empty_stats() for 岗位 in 分解表岗位}
        
        # 遍历明细记录进行统计
        for record in records:
            岗位 = record.岗位 or ''
            
            # 处理入职时间
            if record.入职时间:
                月份 = record.入职时间.month
                
                # 汇总表统计
                if 岗位 in 汇总表岗位:
                    汇总统计[岗位]['入职'][月份] += 1
                elif '助理' in 岗位:
                    汇总统计['咨询助理']['入职'][月份] += 1
                elif '干部' in 岗位 or '经理' in 岗位 or '主管' in 岗位:
                    汇总统计['咨询干部']['入职'][月份] += 1
                elif '渠道' in 岗位:
                    汇总统计['渠道']['入职'][月份] += 1
                else:
                    # 默认归入咨询
                    汇总统计['咨询']['入职'][月份] += 1
                
                # 分解表统计
                if 岗位 == '咨询干部' or '干部' in 岗位 or '经理' in 岗位 or '主管' in 岗位:
                    分解统计['咨询干部']['入职'][月份] += 1
                elif 岗位 == '咨询' or (岗位 and '咨询' in 岗位 and '助理' not in 岗位 and '干部' not in 岗位):
                    分解统计['咨询']['入职'][月份] += 1
                elif '助理' in 岗位:
                    分解统计['助理']['入职'][月份] += 1
                elif '渠道' in 岗位:
                    分解统计['渠道']['入职'][月份] += 1
                else:
                    分解统计['咨询']['入职'][月份] += 1
            
            # 处理离职时间
            if record.离职时间:
                月份 = record.离职时间.month
                
                # 汇总表统计
                if 岗位 in 汇总表岗位:
                    汇总统计[岗位]['离职'][月份] += 1
                elif '助理' in 岗位:
                    汇总统计['咨询助理']['离职'][月份] += 1
                elif '干部' in 岗位 or '经理' in 岗位 or '主管' in 岗位:
                    汇总统计['咨询干部']['离职'][月份] += 1
                elif '渠道' in 岗位:
                    汇总统计['渠道']['离职'][月份] += 1
                else:
                    汇总统计['咨询']['离职'][月份] += 1
                
                # 分解表统计
                if 岗位 == '咨询干部' or '干部' in 岗位 or '经理' in 岗位 or '主管' in 岗位:
                    分解统计['咨询干部']['离职'][月份] += 1
                elif 岗位 == '咨询' or (岗位 and '咨询' in 岗位 and '助理' not in 岗位 and '干部' not in 岗位):
                    分解统计['咨询']['离职'][月份] += 1
                elif '助理' in 岗位:
                    分解统计['助理']['离职'][月份] += 1
                elif '渠道' in 岗位:
                    分解统计['渠道']['离职'][月份] += 1
                else:
                    分解统计['咨询']['离职'][月份] += 1
        
        # 转换为前端需要的格式
        def format_stats(stats, 岗位列表):
            result = []
            for idx, 岗位 in enumerate(岗位列表):
                if 岗位 in stats:
                    # 入职行
                    入职数据 = {
                        '序号': idx + 1,
                        '岗位': 岗位,
                        '类型': '实际招聘人数',
                        '1月': stats[岗位]['入职'].get(1, 0),
                        '2月': stats[岗位]['入职'].get(2, 0),
                        '3月': stats[岗位]['入职'].get(3, 0),
                        '4月': stats[岗位]['入职'].get(4, 0),
                        '5月': stats[岗位]['入职'].get(5, 0),
                        '6月': stats[岗位]['入职'].get(6, 0),
                        '7月': stats[岗位]['入职'].get(7, 0),
                        '8月': stats[岗位]['入职'].get(8, 0),
                        '9月': stats[岗位]['入职'].get(9, 0),
                        '10月': stats[岗位]['入职'].get(10, 0),
                        '11月': stats[岗位]['入职'].get(11, 0),
                        '12月': stats[岗位]['入职'].get(12, 0),
                    }
                    入职数据['合计'] = sum(
                        int(stats[岗位]['入职'].get(m, 0)) for m in range(1, 13)
                    )
                    result.append(入职数据)
                    
                    # 离职行
                    离职数据 = {
                        '序号': idx + 1,
                        '岗位': 岗位,
                        '类型': '离职人数',
                        '1月': stats[岗位]['离职'].get(1, 0),
                        '2月': stats[岗位]['离职'].get(2, 0),
                        '3月': stats[岗位]['离职'].get(3, 0),
                        '4月': stats[岗位]['离职'].get(4, 0),
                        '5月': stats[岗位]['离职'].get(5, 0),
                        '6月': stats[岗位]['离职'].get(6, 0),
                        '7月': stats[岗位]['离职'].get(7, 0),
                        '8月': stats[岗位]['离职'].get(8, 0),
                        '9月': stats[岗位]['离职'].get(9, 0),
                        '10月': stats[岗位]['离职'].get(10, 0),
                        '11月': stats[岗位]['离职'].get(11, 0),
                        '12月': stats[岗位]['离职'].get(12, 0),
                    }
                    离职数据['合计'] = sum(
                        int(stats[岗位]['离职'].get(m, 0)) for m in range(1, 13)
                    )
                    result.append(离职数据)
            return result
        
        return {
            'code': 0,
            'message': '统计成功',
            'data': {
                '年份': year,
                '汇总表数据': format_stats(汇总统计, 汇总表岗位),
                '分解表数据': format_stats(分解统计, 分解表岗位),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"统计失败: {str(e)}") from e
