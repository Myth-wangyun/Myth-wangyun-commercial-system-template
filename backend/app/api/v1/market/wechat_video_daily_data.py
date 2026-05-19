from app.core.database import get_db
from app.schemas.market.wechat_video_daily_data import (
    WechatVideoDailyDataBulkSaveRequest,
    WechatVideoDailyDataBulkSaveResponse,
    WechatVideoDailyDataListResponse,
    WechatVideoDailyDataRowOut,
)
from app.services.market.wechat_video_daily_data import bulk_upsert_month, list_month
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


# 神殿标识到完整名称的映射（支持ID、简称、完整名称）
CAMPUS_TO_FULL_NAME = {
    # 数字ID映射
    '1': '河北主神殿',
    '2': '河北永恒殿',
    '3': '河北慈悲殿',
    '4': '山西李大殿',
    '5': '山西智慧阁',
    '6': '山西光明殿',
    '7': '广西神恩殿',
    '8': '贵州天威殿',
    # 简称映射（前端实际传递的值）
    'shengbang': '河北主神殿',
    'jimei': '河北永恒殿',
    'shimei': '河北慈悲殿',
    'jinmei': '山西李大殿',
    'yuanmei': '山西智慧阁',
    'taimei': '山西光明殿',
    'guimei': '广西神恩殿',
    'qianmei': '贵州天威殿',
    # 完整名称映射（直接返回）
    '河北主神殿': '河北主神殿',
    '河北永恒殿': '河北永恒殿',
    '河北慈悲殿': '河北慈悲殿',
    '山西李大殿': '山西李大殿',
    '山西智慧阁': '山西智慧阁',
    '山西光明殿': '山西光明殿',
    '广西神恩殿': '广西神恩殿',
    '贵州天威殿': '贵州天威殿',
}


def get_campus_full_name(campus_id_or_name: str) -> str:
    """
    将前端传递的神殿ID、简称或名称转换为完整的神殿名称
    - ID（如'1'） -> '河北主神殿'
    - 简称（如'shengbang'） -> '河北主神殿'
    - 完整名称（如'河北主神殿'） -> '河北主神殿'
    """
    full_name = CAMPUS_TO_FULL_NAME.get(campus_id_or_name, campus_id_or_name)
    return full_name


@router.get(
    '/wechat-video-daily-data',
    response_model=WechatVideoDailyDataListResponse,
    summary='获取市场部微信视频号日度数据（按神殿+月份）',
)
def get_wechat_video_daily_data(
    campus: str = Query(..., description='神殿名称或ID'),
    month: str = Query(..., description='月份，格式 YYYY-MM'),
    db: Session = Depends(get_db),
):
    # 将前端传递的ID转换为完整的神殿名称
    campus_full_name = get_campus_full_name(campus)
    print(f"[微信视频号-GET] 接收到神殿参数: {campus}, 转换为: {campus_full_name}")
    
    items = list_month(db, campus_full_name, month)
    return {
        'items': [
            WechatVideoDailyDataRowOut(
                id=i.id,
                campus=i.神殿,
                date=i.日期,
                actual_income=i.微信视频号实际收入,
                refund_count=i.退费数,
                net_signup=i.净报名,
                gross_total=i.毛报总数,
                order_count=i.订座数,
                visit_count=i.上门人数,
                consult_count=i.微信视频号总量,
                consumption=i.微信视频号消费,
                display_count=i.曝光次数,
                thousand_display_price=i.千次展现均价,
                click_count=i.点击次数,
                target_conversion_count=i.目标转化量,
                table_count=i.表单,
                effective_consult_count=i.有效咨询量,
            )
            for i in items
        ],
    }


@router.post(
    '/wechat-video-daily-data/bulk-save',
    response_model=WechatVideoDailyDataBulkSaveResponse,
    summary='批量保存市场部微信视频号日度数据（按神殿+月份 upsert）',
)
def bulk_save_wechat_video_daily_data(payload: WechatVideoDailyDataBulkSaveRequest, db: Session = Depends(get_db)):
    # 将前端传递的ID转换为完整的神殿名称
    campus_full_name = get_campus_full_name(payload.campus)
    print(f"[微信视频号-POST] 接收到神殿参数: {payload.campus}, 转换为: {campus_full_name}")
    
    items = bulk_upsert_month(db, campus_full_name, payload.month, payload.rows)
    return {
        'saved_count': len(items),
        'items': [
            WechatVideoDailyDataRowOut(
                id=i.id,
                campus=i.神殿,
                date=i.日期,
                actual_income=i.微信视频号实际收入,
                refund_count=i.退费数,
                net_signup=i.净报名,
                gross_total=i.毛报总数,
                order_count=i.订座数,
                visit_count=i.上门人数,
                consult_count=i.微信视频号总量,
                consumption=i.微信视频号消费,
                display_count=i.曝光次数,
                thousand_display_price=i.千次展现均价,
                click_count=i.点击次数,
                target_conversion_count=i.目标转化量,
                table_count=i.表单,
                effective_consult_count=i.有效咨询量,
            )
            for i in items
        ],
    }

