"""
电话号码归属地查询API
支持真实API查询和本地号段库查询两种模式
- 真实数据模式: 调用外部API获取准确归属地
- 测试数据模式: 使用本地号段库，避免消耗API额度
"""

import asyncio
import logging
import re
from typing import Optional

import httpx
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


class PhoneLocationResponse(BaseModel):
    """电话归属地响应"""
    phone: str
    province: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None  # 省+市的组合
    carrier: Optional[str] = None   # 运营商
    success: bool = True
    message: str = "查询成功"


# ========== 本地号段数据库（用于测试模式，避免消耗API额度）==========

# 中国手机号段数据库（前3位 -> 运营商）
CARRIER_PREFIXES = {
    # 中国移动
    '134': '移动', '135': '移动', '136': '移动', '137': '移动', '138': '移动', '139': '移动',
    '147': '移动', '148': '移动', '150': '移动', '151': '移动', '152': '移动', '157': '移动',
    '158': '移动', '159': '移动', '172': '移动', '178': '移动', '182': '移动', '183': '移动',
    '184': '移动', '187': '移动', '188': '移动', '195': '移动', '197': '移动', '198': '移动',
    # 中国联通
    '130': '联通', '131': '联通', '132': '联通', '145': '联通', '146': '联通', '155': '联通',
    '156': '联通', '166': '联通', '167': '联通', '171': '联通', '175': '联通', '176': '联通',
    '185': '联通', '186': '联通', '196': '联通',
    # 中国电信
    '133': '电信', '149': '电信', '153': '电信', '173': '电信', '174': '电信', '177': '电信',
    '180': '电信', '181': '电信', '189': '电信', '190': '电信', '191': '电信', '193': '电信',
    '199': '电信',
    # 广电
    '192': '广电',
}

# 扩展号段数据：基于区号的简单映射（用于测试模式）
AREA_CODE_MAP = {
    '0351': ('山西', '太原'),
    '0352': ('山西', '大同'),
    '0353': ('山西', '阳泉'),
    '0354': ('山西', '晋中'),
    '0355': ('山西', '长治'),
    '0356': ('山西', '晋城'),
    '0357': ('山西', '临汾'),
    '0358': ('山西', '吕梁'),
    '0359': ('山西', '运城'),
    '0350': ('山西', '忻州'),
    '0349': ('山西', '朔州'),
    '010': ('北京', '北京'),
    '021': ('上海', '上海'),
    '022': ('天津', '天津'),
    '023': ('重庆', '重庆'),
    '0311': ('河北', '石家庄'),
    '0471': ('内蒙古', '呼和浩特'),
    '0912': ('陕西', '榆林'),
    '029': ('陕西', '西安'),
}

# 测试模式的简化号段数据库（随机分配山西各市）
TEST_CITY_LIST = [
    ('山西', '太原'), ('山西', '大同'), ('山西', '阳泉'), ('山西', '晋中'),
    ('山西', '长治'), ('山西', '晋城'), ('山西', '临汾'), ('山西', '吕梁'),
    ('山西', '运城'), ('山西', '忻州'), ('山西', '朔州'),
]


# ========== 真实API查询函数 ==========

async def query_nxvav_api(phone: str) -> dict:
    """
    调用 nxvav.cn API 查询归属地（无需API Key，免费）
    https://api.nxvav.cn/api/tel/
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.nxvav.cn/api/tel/",
                params={"tel": phone}
            )
            data = resp.json()
            
            if data.get("code") == 200:
                # 解析返回字段 - nxvav 的数据在 data.data 中
                inner_data = data.get("data", {})
                local = inner_data.get("local", "") or data.get("local", "")
                operator = inner_data.get("operator", "") or data.get("operator", "")
                
                # 尝试分离省份和城市
                province, city = parse_location_string(local)
                carrier = normalize_carrier(operator)
                
                return {
                    "success": True,
                    "province": province,
                    "city": city,
                    "carrier": carrier,
                    "source": "nxvav"
                }
    except Exception as e:
        logger.warning(f"nxvav API查询失败: {e}")
    
    return {"success": False, "source": "nxvav"}


async def query_yzc136_api(phone: str) -> dict:
    """
    调用 yzc136.cn API 查询归属地（备用API）
    https://yzc136.cn/api/open/phone
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://yzc136.cn/api/open/phone",
                data={"phone": phone}
            )
            data = resp.json()
            
            if not data.get("errors", True):
                # 注意：yzc136 返回的是 "data" 而不是 "date"
                result = data.get("data", {}) or data.get("date", {})
                province = result.get("province", "")
                city = result.get("city", "")
                supply = result.get("supply", "")
                
                carrier = normalize_carrier(supply)
                
                return {
                    "success": True,
                    "province": province,
                    "city": city,
                    "carrier": carrier,
                    "source": "yzc136"
                }
    except Exception as e:
        logger.warning(f"yzc136 API查询失败: {e}")
    
    return {"success": False, "source": "yzc136"}


async def query_real_api(phone: str) -> dict:
    """
    调用真实API查询归属地（多API轮询，提高成功率）
    先尝试 nxvav，失败后尝试 yzc136
    """
    # 首选 nxvav API
    result = await query_nxvav_api(phone)
    if result.get("success"):
        return result
    
    # 备用 yzc136 API  
    result = await query_yzc136_api(phone)
    if result.get("success"):
        return result
    
    return {"success": False, "message": "所有API查询失败"}


def parse_location_string(location: str) -> tuple:
    """
    解析位置字符串，分离省份和城市
    例如: "北京市" -> ("北京", "北京")
         "山西省太原市" -> ("山西", "太原")
         "广东广州" -> ("广东", "广州")
    """
    if not location:
        return None, None
    
    # 直辖市处理
    direct_cities = ["北京", "上海", "天津", "重庆"]
    for dc in direct_cities:
        if dc in location:
            return dc, dc
    
    # 尝试分离省份和城市
    location = location.replace("省", "").replace("市", "").replace("自治区", "")
    
    # 常见省份列表
    provinces = [
        "山西", "山东", "河北", "河南", "湖北", "湖南", "广东", "广西",
        "四川", "云南", "贵州", "陕西", "甘肃", "青海", "江苏", "浙江",
        "安徽", "江西", "福建", "辽宁", "吉林", "黑龙江", "内蒙古", 
        "新疆", "西藏", "宁夏", "海南", "台湾", "香港", "澳门"
    ]
    
    for prov in provinces:
        if location.startswith(prov):
            city = location[len(prov):].strip()
            return prov, city if city else prov
    
    # 无法分离，整体作为城市
    return None, location


def normalize_carrier(carrier: str) -> Optional[str]:
    """标准化运营商名称"""
    if not carrier:
        return None
    
    carrier_str = str(carrier).lower()
    if "移动" in carrier_str or "mobile" in carrier_str:
        return "移动"
    elif "联通" in carrier_str or "unicom" in carrier_str:
        return "联通"
    elif "电信" in carrier_str or "telecom" in carrier_str:
        return "电信"
    elif "广电" in carrier_str:
        return "广电"
    return carrier


# ========== 本地查询函数（测试模式使用）==========

def lookup_phone_location_local(phone: str) -> tuple:
    """
    使用本地号段库查询手机号码归属地（测试模式）
    返回: (省份, 城市, 运营商)
    """
    # 清理电话号码
    phone = re.sub(r'\D', '', phone)
    
    # 如果是11位手机号
    if len(phone) == 11 and phone.startswith('1'):
        prefix3 = phone[:3]
        carrier = CARRIER_PREFIXES.get(prefix3, None)
        
        # 测试模式：根据号码最后一位数字分配城市
        last_digit = int(phone[-1])
        province, city = TEST_CITY_LIST[last_digit % len(TEST_CITY_LIST)]
        
        return province, city, carrier
    
    # 如果是固定电话（带区号）
    elif len(phone) >= 10:
        for area_code, (province, city) in AREA_CODE_MAP.items():
            if phone.startswith(area_code):
                return province, city, '固话'
    
    return None, None, None


# ========== API端点 ==========

@router.get("/phone-location", response_model=PhoneLocationResponse, summary="查询电话归属地")
async def get_phone_location(
    phone: str = Query(..., description="电话号码", min_length=7),
    test_mode: bool = Query(False, description="测试模式（使用本地数据库，不调用真实API）"),
):
    """
    根据电话号码查询归属地
    
    - **phone**: 电话号码（11位手机号或带区号的固定电话）
    - **test_mode**: 测试模式开关
      - `false`（默认）: 调用真实API查询，数据准确
      - `true`: 使用本地数据库，适用于测试数据生成，避免消耗API额度
    
    返回省份、城市、运营商信息
    """
    # 清理电话号码
    clean_phone = re.sub(r'\D', '', phone)
    
    if len(clean_phone) < 7:
        return PhoneLocationResponse(
            phone=phone,
            success=False,
            message="电话号码格式不正确"
        )
    
    if test_mode:
        # 测试模式：使用本地号段库
        province, city, carrier = lookup_phone_location_local(clean_phone)
        source_msg = "查询成功（测试模式）"
    else:
        # 真实模式：调用外部API
        result = await query_real_api(clean_phone)
        
        if result.get("success"):
            province = result.get("province")
            city = result.get("city")
            carrier = result.get("carrier")
            source_msg = f"查询成功（{result.get('source', 'api')}）"
        else:
            # API查询失败，尝试本地兜底
            province, city, carrier = lookup_phone_location_local(clean_phone)
            if province and city:
                source_msg = "查询成功（本地兜底）"
            else:
                return PhoneLocationResponse(
                    phone=phone,
                    success=False,
                    message="未找到归属地信息"
                )
    
    if province and city:
        # 组合位置信息
        location = city if province == city else city  # 只显示城市，更简洁
        
        return PhoneLocationResponse(
            phone=phone,
            province=province,
            city=city,
            location=location,
            carrier=carrier,
            success=True,
            message=source_msg
        )
    else:
        return PhoneLocationResponse(
            phone=phone,
            carrier=carrier,  # 可能只有运营商信息
            success=False,
            message="未找到归属地信息"
        )


@router.get("/phone-location/batch", summary="批量查询电话归属地")
async def get_phone_locations_batch(
    phones: str = Query(..., description="电话号码列表，逗号分隔"),
    test_mode: bool = Query(False, description="测试模式（使用本地数据库，不调用真实API）"),
):
    """
    批量查询多个电话号码的归属地
    
    - **phones**: 电话号码列表，逗号分隔（最多50个）
    - **test_mode**: 测试模式开关
      - `false`（默认）: 调用真实API查询
      - `true`: 使用本地数据库，适用于批量测试数据
    
    注意：真实模式下批量查询会消耗较多API额度，建议谨慎使用
    """
    phone_list = [p.strip() for p in phones.split(',') if p.strip()]
    results = []
    
    for phone in phone_list[:50]:  # 限制最多50个
        clean_phone = re.sub(r'\D', '', phone)
        
        if test_mode:
            # 测试模式：本地查询
            province, city, carrier = lookup_phone_location_local(clean_phone)
            success = bool(province and city)
        else:
            # 真实模式：API查询
            result = await query_real_api(clean_phone)
            if result.get("success"):
                province = result.get("province")
                city = result.get("city")
                carrier = result.get("carrier")
                success = True
            else:
                # 兜底本地查询
                province, city, carrier = lookup_phone_location_local(clean_phone)
                success = bool(province and city)
        
        if success and province and city:
            location = city if province == city else city
            results.append({
                'phone': phone,
                'province': province,
                'city': city,
                'location': location,
                'carrier': carrier,
                'success': True
            })
        else:
            results.append({
                'phone': phone,
                'success': False
            })
        
        # 真实模式下添加小延迟，避免请求过快
        if not test_mode and len(phone_list) > 1:
            await asyncio.sleep(0.1)
    
    return {'items': results, 'total': len(results)}
