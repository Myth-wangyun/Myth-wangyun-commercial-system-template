"""市场部剪辑年度汇报表 - API路由

提供剪辑年度汇报的查询API（从月度表汇总）
"""

from app.core.database import get_db
from app.services.market.annual_edit_report import (
    get_annual_edit_report_list,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix='/annual-edit-report', tags=['市场部剪辑年度汇报'])


# ============================================================
# 剪辑年度汇报 API
# ============================================================

@router.get(
    '',
    summary='获取剪辑年度汇报列表（从月度表汇总）',
)
def get_list(
    year: int = Query(..., description='年份'),
    force_regenerate: bool = Query(False, description='是否强制从周度表重新生成'),
    db: Session = Depends(get_db)
):
    """获取剪辑年度汇报数据
    
    该接口从剪辑月度表中按日期查询数据并汇总生成年度报表
    如果 force_regenerate=true，则直接从周度表重新生成，跳过月度表
    """
    data = get_annual_edit_report_list(db, year, force_regenerate)
    # 使用 by_alias=True 确保返回 camelCase 字段名
    data_list = [item.model_dump(by_alias=True) for item in data]
    return {'code': 200, 'message': 'success', 'data': data_list}
