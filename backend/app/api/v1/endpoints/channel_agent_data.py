"""
渠道代理数据API
"""
import base64
from typing import Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ....core.auth import get_current_active_user
from ....core.database import get_db
from ....crud.consult import channel_agent_data as crud
from ....models.user import User
from ....schemas.consult.channel_agent_data import ChannelAgentDataSave

router = APIRouter()


def get_campus_from_header(x_campus: Optional[str] = Header(None, alias="X-Campus")) -> str:
    """从请求头获取神殿信息，支持 base64(urlencode(神殿名)) 格式"""
    if not x_campus:
        raise HTTPException(status_code=400, detail="缺少神殿信息，请在请求头中提供 X-Campus")
    
    # 尝试 base64 解码 + URL 解码
    try:
        decoded = base64.b64decode(x_campus).decode("utf-8")
        decoded_campus = unquote(decoded)
    except Exception:
        # 如果解码失败，尝试直接使用
        decoded_campus = x_campus
    
    # 提取神殿名称（支持"河北主神殿"、"主神殿"、"盛邦"等格式）
    valid_campuses = ["盛邦", "冀美", "石美", "晋美", "原美", "太美", "桂美", "黔美"]
    
    # 移除常见前缀和后缀
    campus_name = decoded_campus.replace("河北", "").replace("清美教育", "").replace("神殿", "").strip()
    
    # 匹配有效神殿名
    for valid_campus in valid_campuses:
        if valid_campus in campus_name:
            return valid_campus
    
    raise HTTPException(status_code=400, detail=f"无效的神殿: {decoded_campus}")


@router.get("/list")
def get_channel_agent_data(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    campus: str = Depends(get_campus_from_header)
):
    """
    获取渠道代理数据列表
    """
    try:
        data = crud.get_channel_agent_data_by_year_campus(db, year, campus)
        
        result = [
            {
                "月份": item.月份,
                "渠道代理": item.渠道代理,
                "区域数": item.区域数 or "0",
                "咨询量": item.咨询量,
                "上门量": item.上门量,
                "订座": item.订座,
                "实际招生": item.实际招生,
                "退费人数": item.退费人数,
                "渠道总职数": item.渠道总职数,
                "县办": item.县办,
                "乡办": item.乡办,
                "信息员": item.信息员
            }
            for item in data
        ]
        
        return {"success": True, "data": result, "message": "获取成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/save")
def save_channel_agent_data(
    request: ChannelAgentDataSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    campus: str = Depends(get_campus_from_header)
):
    """
    保存渠道代理数据
    """
    try:
        crud.save_channel_agent_data(db, request.year, campus, request.data)
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}") from e
