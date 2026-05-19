"""
市场部免费推广日度数据API
"""
from datetime import date, datetime
from typing import Any, cast

from app.core.database import get_db
from app.models.market.free_promotion_daily import (
    市场部免费推广分类信息日度数据表,
    市场部免费推广地图日度数据表,
    市场部免费推广微信平台日度数据表,
    市场部免费推广社交新媒体日度数据表,
    市场部免费推广视频日度数据表,
    市场部免费推广问答日度数据表,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

router = APIRouter()


def safe_divide(numerator, denominator, percentage=False):
    """安全除法，避免除零错误"""
    if not denominator or denominator == 0:
        return None
    result = numerator / denominator
    if percentage:
        return round(result * 100, 2)
    return round(result, 2)


def legacy_rows(rows: object) -> list[Any]:
    """收窄旧式 SQLAlchemy 查询结果的动态边界。"""
    return cast(list[Any], rows)


# ==================== 社交新媒体相关API ====================

@router.get('/social-media/list')
async def get_social_media_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取社交新媒体日度数据列表"""
    try:
        # 解析月份
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        # 计算该月的最后一天
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        # 查询数据
        items = legacy_rows(
            db.query(市场部免费推广社交新媒体日度数据表)
            .filter(
                and_(
                    市场部免费推广社交新媒体日度数据表.神殿 == campus,
                    市场部免费推广社交新媒体日度数据表.日期 >= start_date,
                    市场部免费推广社交新媒体日度数据表.日期 < end_date,
                )
            )
            .order_by(市场部免费推广社交新媒体日度数据表.日期)
            .all()
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'campus': item.神殿,
                        'date': str(item.日期),
                        'actualIncome': float(item.社交新媒体实际收入) if item.社交新媒体实际收入 else 0,
                        'signupConversionRate': float(item.社交新媒体报名转化率) if item.社交新媒体报名转化率 else None,
                        'refundCount': item.退费数,
                        'netSignup': item.净报名,
                        'grossTotal': item.毛报总数,
                        'orderCount': item.订座数,
                        'visitCount': item.上门人数,
                        'consultCount': item.社交新媒体咨询量,
                        'consultCost': float(item.咨询量成本) if item.咨询量成本 else None,
                        'consumption': float(item.社交新媒体消耗) if item.社交新媒体消耗 else 0,
                        # 抖音数据
                        'douyinValidCount': item.抖音有效条数,
                        'douyinPlayCount': item.抖音播放量,
                        'douyinLikeCount': item.抖音点赞量,
                        'douyinCommentCount': item.抖音评论量,
                        'douyinShareCount': item.抖音分享量,
                        'douyinCollectCount': item.抖音收藏量,
                        'douyinConsultCount': item.抖音咨询量,
                        'douyinCompletionRate': float(item.抖音完播率) if item.抖音完播率 else None,
                        'douyin2sExitRate': float(item.抖音2s跳出率) if item.抖音2s跳出率 else None,
                        'douyinAvgViewTime': float(item.抖音平均访问时长) if item.抖音平均访问时长 else None,
                        'douyin5sCompletionRate': float(item.抖音5s完播率) if item.抖音5s完播率 else None,
                        'douyinAvgPlayRate': float(item.抖音平均播放占比) if item.抖音平均播放占比 else None,
                        'douyinLikeRate': float(item.抖音点赞率) if item.抖音点赞率 else None,
                        'douyinCommentRate': float(item.抖音评论率) if item.抖音评论率 else None,
                        'douyinShareRate': float(item.抖音分享率) if item.抖音分享率 else None,
                        'douyinCollectRate': float(item.抖音收藏率) if item.抖音收藏率 else None,
                        'douyinNotInterestedRate': float(item.抖音不感兴趣率) if item.抖音不感兴趣率 else None,
                        # 快手数据
                        'kuaishouValidCount': item.快手有效条数,
                        'kuaishouLoveScore': float(item.快手喜爱分) if item.快手喜爱分 else None,
                        'kuaishouQuality': float(item.快手画质清晰度) if item.快手画质清晰度 else None,
                        'kuaishouTitleQuality': float(item.快手标题质量) if item.快手标题质量 else None,
                        'kuaishouConsultCount': item.快手咨询量,
                        'kuaishouPlayCount': item.快手播放量,
                        'kuaishouAvgPlayTime': float(item.快手平均播放时长) if item.快手平均播放时长 else None,
                        'kuaishouCoverClickRate': float(item.快手封面点击率) if item.快手封面点击率 else None,
                        'kuaishou2sExitRate': float(item.快手2s跳出率) if item.快手2s跳出率 else None,
                        'kuaishou5sCompletionRate': float(item.快手5s完播率) if item.快手5s完播率 else None,
                        'kuaishouCompletionRate': float(item.快手完播率) if item.快手完播率 else None,
                        'kuaishouLikeCount': item.快手点赞量,
                        'kuaishouCommentCount': item.快手评论量,
                        'kuaishouShareCount': item.快手分享量,
                        'kuaishouCollectCount': item.快手收藏量,
                        'kuaishouFansGrowth': item.快手涨粉量,
                        'remark': item.备注,
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/social-media/save')
async def save_social_media_data(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存或更新社交新媒体日度数据"""
    try:
        campus = data.get('campus')
        date_str = data.get('date')
        
        if not campus or not date_str:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        # 查找现有记录
        existing = db.query(市场部免费推广社交新媒体日度数据表).filter(
            and_(
                市场部免费推广社交新媒体日度数据表.神殿 == campus,
                市场部免费推广社交新媒体日度数据表.日期 == datetime.strptime(date_str, '%Y-%m-%d').date()
            )
        ).first()
        
        # 准备数据
        record_data = {
            '神殿': campus,
            '日期': datetime.strptime(date_str, '%Y-%m-%d').date(),
            '社交新媒体实际收入': data.get('actualIncome', 0),
            '退费数': data.get('refundCount', 0),
            '净报名': data.get('netSignup', 0),
            '毛报总数': data.get('grossTotal', 0),
            '订座数': data.get('orderCount', 0),
            '上门人数': data.get('visitCount', 0),
            '社交新媒体咨询量': data.get('consultCount', 0),
            '社交新媒体消耗': data.get('consumption', 0),
            # 抖音数据
            '抖音有效条数': data.get('douyinValidCount', 0),
            '抖音播放量': data.get('douyinPlayCount', 0),
            '抖音点赞量': data.get('douyinLikeCount', 0),
            '抖音评论量': data.get('douyinCommentCount', 0),
            '抖音分享量': data.get('douyinShareCount', 0),
            '抖音收藏量': data.get('douyinCollectCount', 0),
            '抖音咨询量': data.get('douyinConsultCount', 0),
            '抖音完播率': data.get('douyinCompletionRate'),
            '抖音2s跳出率': data.get('douyin2sExitRate'),
            '抖音平均访问时长': data.get('douyinAvgViewTime'),
            '抖音5s完播率': data.get('douyin5sCompletionRate'),
            '抖音平均播放占比': data.get('douyinAvgPlayRate'),
            '抖音点赞率': data.get('douyinLikeRate'),
            '抖音评论率': data.get('douyinCommentRate'),
            '抖音分享率': data.get('douyinShareRate'),
            '抖音收藏率': data.get('douyinCollectRate'),
            '抖音不感兴趣率': data.get('douyinNotInterestedRate'),
            # 快手数据
            '快手有效条数': data.get('kuaishouValidCount', 0),
            '快手喜爱分': data.get('kuaishouLoveScore'),
            '快手画质清晰度': data.get('kuaishouQuality'),
            '快手标题质量': data.get('kuaishouTitleQuality'),
            '快手咨询量': data.get('kuaishouConsultCount', 0),
            '快手播放量': data.get('kuaishouPlayCount', 0),
            '快手平均播放时长': data.get('kuaishouAvgPlayTime'),
            '快手封面点击率': data.get('kuaishouCoverClickRate'),
            '快手2s跳出率': data.get('kuaishou2sExitRate'),
            '快手5s完播率': data.get('kuaishou5sCompletionRate'),
            '快手完播率': data.get('kuaishouCompletionRate'),
            '快手点赞量': data.get('kuaishouLikeCount', 0),
            '快手评论量': data.get('kuaishouCommentCount', 0),
            '快手分享量': data.get('kuaishouShareCount', 0),
            '快手收藏量': data.get('kuaishouCollectCount', 0),
            '快手涨粉量': data.get('kuaishouFansGrowth', 0),
            '备注': data.get('remark'),
        }
        
        # 计算转化率和成本
        consult_count = record_data['社交新媒体咨询量']
        net_signup = record_data['净报名']
        consumption = record_data['社交新媒体消耗']
        
        record_data['社交新媒体报名转化率'] = safe_divide(net_signup, consult_count, percentage=True)
        record_data['咨询量成本'] = safe_divide(consumption, consult_count)
        
        if existing:
            # 更新现有记录
            for key, value in record_data.items():
                setattr(existing, key, value)
        else:
            # 创建新记录
            new_record = 市场部免费推广社交新媒体日度数据表(**record_data)
            db.add(new_record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 问答相关API ====================

@router.get('/qa/list')
async def get_qa_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取问答日度数据列表"""
    try:
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        items = legacy_rows(
            db.query(市场部免费推广问答日度数据表)
            .filter(
                and_(
                    市场部免费推广问答日度数据表.神殿 == campus,
                    市场部免费推广问答日度数据表.日期 >= start_date,
                    市场部免费推广问答日度数据表.日期 < end_date,
                )
            )
            .order_by(市场部免费推广问答日度数据表.日期)
            .all()
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'campus': item.神殿,
                        'date': str(item.日期),
                        'actualIncome': float(item.问答实际收入) if item.问答实际收入 else 0,
                        'signupConversionRate': float(item.问答报名转化率) if item.问答报名转化率 else None,
                        'refundCount': item.退费数,
                        'netSignup': item.净报名,
                        'grossTotal': item.毛报总数,
                        'orderCount': item.订座数,
                        'visitCount': item.上门人数,
                        'consultCount': item.问答咨询量,
                        'consultCost': float(item.咨询量成本) if item.咨询量成本 else None,
                        'consumption': float(item.问答花费) if item.问答花费 else 0,
                        # 百度知道
                        'baiduValidCount': item.百度知道有效条数,
                        'baiduViewCount': item.百度知道浏览量,
                        'baiduLikeCount': item.百度知道点赞数,
                        'baiduValidNumber': item.百度知道有效数,
                        'baiduValidRate': float(item.百度知道有效率) if item.百度知道有效率 else None,
                        'baiduConsultCount': item.百度知道咨询量,
                        # 知乎
                        'zhihuValidCount': item.知乎有效条数,
                        'zhihuViewCount': item.知乎浏览量,
                        'zhihuLikeCount': item.知乎点赞数,
                        'zhihuValidNumber': item.知乎有效数,
                        'zhihuValidRate': float(item.知乎有效率) if item.知乎有效率 else None,
                        'zhihuConsultCount': item.知乎咨询量,
                        'remark': item.备注,
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/qa/save')
async def save_qa_data(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存或更新问答日度数据"""
    try:
        campus = data.get('campus')
        date_str = data.get('date')
        
        if not campus or not date_str:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        existing = db.query(市场部免费推广问答日度数据表).filter(
            and_(
                市场部免费推广问答日度数据表.神殿 == campus,
                市场部免费推广问答日度数据表.日期 == datetime.strptime(date_str, '%Y-%m-%d').date()
            )
        ).first()
        
        record_data = {
            '神殿': campus,
            '日期': datetime.strptime(date_str, '%Y-%m-%d').date(),
            '问答实际收入': data.get('actualIncome', 0),
            '退费数': data.get('refundCount', 0),
            '净报名': data.get('netSignup', 0),
            '毛报总数': data.get('grossTotal', 0),
            '订座数': data.get('orderCount', 0),
            '上门人数': data.get('visitCount', 0),
            '问答咨询量': data.get('consultCount', 0),
            '问答花费': data.get('consumption', 0),
            # 百度知道
            '百度知道有效条数': data.get('baiduValidCount', 0),
            '百度知道浏览量': data.get('baiduViewCount', 0),
            '百度知道点赞数': data.get('baiduLikeCount', 0),
            '百度知道有效数': data.get('baiduValidNumber', 0),
            '百度知道咨询量': data.get('baiduConsultCount', 0),
            # 知乎
            '知乎有效条数': data.get('zhihuValidCount', 0),
            '知乎浏览量': data.get('zhihuViewCount', 0),
            '知乎点赞数': data.get('zhihuLikeCount', 0),
            '知乎有效数': data.get('zhihuValidNumber', 0),
            '知乎咨询量': data.get('zhihuConsultCount', 0),
            '备注': data.get('remark'),
        }
        
        # 计算转化率和成本
        consult_count = record_data['问答咨询量']
        net_signup = record_data['净报名']
        consumption = record_data['问答花费']
        
        record_data['问答报名转化率'] = safe_divide(net_signup, consult_count, percentage=True)
        record_data['咨询量成本'] = safe_divide(consumption, consult_count)
        
        # 计算有效率
        record_data['百度知道有效率'] = safe_divide(
            record_data['百度知道有效数'],
            record_data['百度知道有效条数'],
            percentage=True
        )
        record_data['知乎有效率'] = safe_divide(
            record_data['知乎有效数'],
            record_data['知乎有效条数'],
            percentage=True
        )
        
        if existing:
            for key, value in record_data.items():
                setattr(existing, key, value)
        else:
            new_record = 市场部免费推广问答日度数据表(**record_data)
            db.add(new_record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 其他类别的API（分类信息、地图、微信平台、视频）====================
# 由于篇幅限制，这里仅展示核心逻辑，其他类别的API结构类似

@router.get('/classified/list')
async def get_classified_list(
    campus: str = Query(...),
    month: str = Query(...),
    db: Session = Depends(get_db)
):
    """获取分类信息日度数据列表"""
    try:
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        items = legacy_rows(
            db.query(市场部免费推广分类信息日度数据表)
            .filter(
                and_(
                    市场部免费推广分类信息日度数据表.神殿 == campus,
                    市场部免费推广分类信息日度数据表.日期 >= start_date,
                    市场部免费推广分类信息日度数据表.日期 < end_date,
                )
            )
            .order_by(市场部免费推广分类信息日度数据表.日期)
            .all()
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'campus': item.神殿,
                        'date': str(item.日期),
                        'actualIncome': float(item.分类信息实际收入) if item.分类信息实际收入 else 0,
                        'conversionRate': f"{float(item.分类信息报名转化率):.2f}%" if item.分类信息报名转化率 else '0%',
                        'refundCount': item.退费数,
                        'netEnrollment': item.净报名,
                        'grossEnrollment': item.毛报总数,
                        'reservationCount': item.订座数,
                        'visitCount': item.上门人数,
                        'consultationCount': item.分类信息咨询量,
                        'consultationCost': f"¥{float(item.咨询量成本):.2f}" if item.咨询量成本 else '¥0.00',
                        'expense': float(item.分类信息花费) if item.分类信息花费 else 0,
                        'validClassifiedCount': item.有效分类信息量 or 0,
                        'validCount': item.有效量 or 0,
                        'validityRate': f"{float(item.有效率):.2f}%" if item.有效率 else '0%',
                        'viewCount': item.浏览量 or 0,
                        'likeCount': item.点赞量 or 0,
                        'shareCount': item.分享量 or 0,
                        'inquiryCount': item.咨询量 or 0,
                        'remark': item.备注,
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/classified/save')
async def save_classified_data(data: dict, db: Session = Depends(get_db)):
    """保存分类信息日度数据（支持单条和批量）"""
    try:
        # 处理单条数据的函数
        def process_item(item_data: dict, campus: str):
            date_str = item_data.get('date')
            if not date_str:
                return False
            
            item_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找是否已存在
            existing = db.query(市场部免费推广分类信息日度数据表).filter(
                and_(
                    市场部免费推广分类信息日度数据表.神殿 == campus,
                    市场部免费推广分类信息日度数据表.日期 == item_date
                )
            ).first()
            
            # 计算咨询量（前端的consultationCount）
            consultation_count = item_data.get('consultationCount') or 0
            
            # 计算咨询量成本和转化率
            expense = item_data.get('expense') or 0
            consult_cost = safe_divide(expense, consultation_count)
            
            net_enrollment = item_data.get('netEnrollment') or 0
            conversion_rate = safe_divide(net_enrollment, consultation_count, percentage=True)
            
            # 计算有效率
            valid_classified_count = item_data.get('validClassifiedCount') or 0
            valid_count = item_data.get('validCount') or 0
            validity_rate = safe_divide(valid_count, valid_classified_count, percentage=True) if valid_classified_count > 0 else None
            
            # 准备数据
            record_data = {
                '神殿': campus,
                '日期': item_date,
                '分类信息实际收入': item_data.get('actualIncome') or 0,
                '分类信息报名转化率': conversion_rate,
                '退费数': item_data.get('refundCount') or 0,
                '净报名': net_enrollment,
                '毛报总数': item_data.get('grossEnrollment') or 0,
                '订座数': item_data.get('reservationCount') or 0,
                '上门人数': item_data.get('visitCount') or 0,
                '分类信息咨询量': consultation_count,
                '咨询量成本': consult_cost,
                '分类信息花费': expense,
                # 分类信息基础数据
                '有效分类信息量': valid_classified_count,
                '有效量': valid_count,
                '有效率': validity_rate,
                '浏览量': item_data.get('viewCount') or 0,
                '点赞量': item_data.get('likeCount') or 0,
                '分享量': item_data.get('shareCount') or 0,
                '咨询量': item_data.get('inquiryCount') or 0,
                '备注': item_data.get('remark'),
            }
            
            if existing:
                for key, value in record_data.items():
                    setattr(existing, key, value)
            else:
                new_record = 市场部免费推广分类信息日度数据表(**record_data)
                db.add(new_record)
            
            return True
        
        # 判断是单条保存还是批量保存
        campus = data.get('campus')
        if not campus:
            raise HTTPException(status_code=400, detail='缺少神殿参数')
        
        # 批量保存模式
        if 'items' in data:
            items = data.get('items', [])
            for item_data in items:
                process_item(item_data, campus)
        # 单条保存模式
        elif 'date' in data:
            process_item(data, campus)
        else:
            raise HTTPException(status_code=400, detail='缺少必要参数：需要 items 数组或 date 字段')
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"保存分类信息数据失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get('/map/list')
async def get_map_list(
    campus: str = Query(...),
    month: str = Query(...),
    db: Session = Depends(get_db)
):
    """获取地图日度数据列表"""
    try:
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        items = legacy_rows(
            db.query(市场部免费推广地图日度数据表)
            .filter(
                and_(
                    市场部免费推广地图日度数据表.神殿 == campus,
                    市场部免费推广地图日度数据表.日期 >= start_date,
                    市场部免费推广地图日度数据表.日期 < end_date,
                )
            )
            .order_by(市场部免费推广地图日度数据表.日期)
            .all()
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'campus': item.神殿,
                        'date': str(item.日期),
                        'actualIncome': float(item.地图实际收入) if item.地图实际收入 else 0,
                        'conversionRate': float(item.地图报名转化率) if item.地图报名转化率 else None,
                        'refundCount': item.退费数,
                        'netEnrollment': item.净报名,
                        'grossEnrollment': item.毛报总数,
                        'reservationCount': item.订座数,
                        'visitCount': item.上门人数,
                        'mapTotal': item.地图总量,
                        'consultationCost': float(item.咨询量成本) if item.咨询量成本 else None,
                        'mapExpense': float(item.地图消费) if item.地图消费 else 0,
                        # 百度地图
                        'baiduComment': item.百度地图评论数,
                        'baiduLike': item.百度地图点赞数,
                        'baiduImage': item.百度地图图片数,
                        'baiduCase': item.百度地图精选案例数,
                        'baiduProduct': item.百度地图产品服务数,
                        'baiduScore': float(item.百度地图评论分) if item.百度地图评论分 else 0,
                        'baiduConsult': item.百度地图咨询量,
                        # 高德地图
                        'gaodeComment': item.高德地图评论数,
                        'gaodeLike': item.高德地图点赞数,
                        'gaodeImage': item.高德地图图片数,
                        'gaodeProduct': item.高德地图产品服务数,
                        'gaodeScore': float(item.高德地图评论分) if item.高德地图评论分 else 0,
                        'gaodeConsult': item.高德地图咨询量,
                        # 腾讯地图
                        'tencentComment': item.腾讯地图评论数,
                        'tencentLike': item.腾讯地图点赞数,
                        'tencentImage': item.腾讯地图图片数,
                        'tencentProduct': item.腾讯地图产品服务数,
                        'tencentScore': float(item.腾讯地图评论分) if item.腾讯地图评论分 else 0,
                        'tencentConsult': item.腾讯地图咨询量,
                        # 其他地图
                        'otherComment': item.其他地图评论数,
                        'otherLike': item.其他地图点赞数,
                        'otherImage': item.其他地图图片数,
                        'otherProduct': item.其他地图产品服务数,
                        'otherScore': float(item.其他地图评论分) if item.其他地图评论分 else 0,
                        'otherConsult': item.其他地图咨询量,
                        'remark': item.备注,
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/map/save')
async def save_map_data(data: dict, db: Session = Depends(get_db)):
    """保存地图日度数据（支持单条和批量）"""
    try:
        # 安全转换评论分（处理空值和字符串）
        def safe_float(value):
            if value is None or value == '':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        # 处理单条数据的函数
        def process_item(item_data: dict, campus: str):
            date_str = item_data.get('date')
            if not date_str:
                return False
            
            item_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找是否已存在
            existing = db.query(市场部免费推广地图日度数据表).filter(
                and_(
                    市场部免费推广地图日度数据表.神殿 == campus,
                    市场部免费推广地图日度数据表.日期 == item_date
                )
            ).first()
            
            # 计算地图总量（自动计算）
            map_total = (
                (item_data.get('baiduConsult') or 0) +
                (item_data.get('gaodeConsult') or 0) +
                (item_data.get('tencentConsult') or 0) +
                (item_data.get('otherConsult') or 0)
            )
            
            # 计算咨询量成本和转化率
            map_expense = item_data.get('mapExpense') or 0
            consult_cost = safe_divide(map_expense, map_total)
            
            gross_total = item_data.get('grossEnrollment') or 0
            conversion_rate = safe_divide(gross_total, map_total, percentage=True)
            
            # 准备数据
            record_data = {
                '神殿': campus,
                '日期': item_date,
                '地图实际收入': item_data.get('actualIncome') or 0,
                '地图报名转化率': conversion_rate,
                '退费数': item_data.get('refundCount') or 0,
                '净报名': item_data.get('netEnrollment') or 0,
                '毛报总数': gross_total,
                '订座数': item_data.get('reservationCount') or 0,
                '上门人数': item_data.get('visitCount') or 0,
                '地图总量': map_total,
                '咨询量成本': consult_cost,
                '地图消费': map_expense,
                # 百度地图
                '百度地图评论数': item_data.get('baiduComment') or 0,
                '百度地图点赞数': item_data.get('baiduLike') or 0,
                '百度地图图片数': item_data.get('baiduImage') or 0,
                '百度地图精选案例数': item_data.get('baiduCase') or 0,
                '百度地图产品服务数': item_data.get('baiduProduct') or 0,
                '百度地图评论分': safe_float(item_data.get('baiduScore')),
                '百度地图咨询量': item_data.get('baiduConsult') or 0,
                # 高德地图
                '高德地图评论数': item_data.get('gaodeComment') or 0,
                '高德地图点赞数': item_data.get('gaodeLike') or 0,
                '高德地图图片数': item_data.get('gaodeImage') or 0,
                '高德地图产品服务数': item_data.get('gaodeProduct') or 0,
                '高德地图评论分': safe_float(item_data.get('gaodeScore')),
                '高德地图咨询量': item_data.get('gaodeConsult') or 0,
                # 腾讯地图
                '腾讯地图评论数': item_data.get('tencentComment') or 0,
                '腾讯地图点赞数': item_data.get('tencentLike') or 0,
                '腾讯地图图片数': item_data.get('tencentImage') or 0,
                '腾讯地图产品服务数': item_data.get('tencentProduct') or 0,
                '腾讯地图评论分': safe_float(item_data.get('tencentScore')),
                '腾讯地图咨询量': item_data.get('tencentConsult') or 0,
                # 其他地图
                '其他地图评论数': item_data.get('otherComment') or 0,
                '其他地图点赞数': item_data.get('otherLike') or 0,
                '其他地图图片数': item_data.get('otherImage') or 0,
                '其他地图产品服务数': item_data.get('otherProduct') or 0,
                '其他地图评论分': safe_float(item_data.get('otherScore')),
                '其他地图咨询量': item_data.get('otherConsult') or 0,
                '备注': item_data.get('remark'),
            }
            
            if existing:
                # 更新现有记录
                for key, value in record_data.items():
                    setattr(existing, key, value)
            else:
                # 创建新记录
                new_record = 市场部免费推广地图日度数据表(**record_data)
                db.add(new_record)
            
            return True
        
        # 判断是单条保存还是批量保存
        campus = data.get('campus')
        if not campus:
            raise HTTPException(status_code=400, detail='缺少神殿参数')
        
        # 批量保存模式（包含 items 数组）
        if 'items' in data:
            items = data.get('items', [])
            for item_data in items:
                process_item(item_data, campus)
        # 单条保存模式（包含 date 字段）
        elif 'date' in data:
            process_item(data, campus)
        else:
            raise HTTPException(status_code=400, detail='缺少必要参数：需要 items 数组或 date 字段')
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"保存地图数据失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get('/wechat/list')
async def get_wechat_list(
    campus: str = Query(...),
    month: str = Query(...),
    db: Session = Depends(get_db)
):
    """获取微信平台日度数据列表"""
    try:
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        items = legacy_rows(
            db.query(市场部免费推广微信平台日度数据表)
            .filter(
                and_(
                    市场部免费推广微信平台日度数据表.神殿 == campus,
                    市场部免费推广微信平台日度数据表.日期 >= start_date,
                    市场部免费推广微信平台日度数据表.日期 < end_date,
                )
            )
            .order_by(市场部免费推广微信平台日度数据表.日期)
            .all()
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'campus': item.神殿,
                        'date': str(item.日期),
                        'actualIncome': float(item.微信平台实际收入) if item.微信平台实际收入 else 0,
                        'conversionRate': f"{float(item.微信平台报名转化率):.2f}%" if item.微信平台报名转化率 else '0%',
                        'refundCount': item.退费数,
                        'netEnrollment': item.净报名,
                        'grossEnrollment': item.毛报总数,
                        'reservationCount': item.订座数,
                        'visitCount': item.上门人数,
                        'videoTotal': item.微信平台咨询量,
                        'consultationCost': f"¥{float(item.咨询量成本):.2f}" if item.咨询量成本 else '¥0.00',
                        'expense': float(item.微信平台花费) if item.微信平台花费 else 0,
                        # 微信视频号数据
                        'videoValidCount': item.视频号有效条数,
                        'videoDiagnosticAvg': str(float(item.视频号数据诊断结果均值)) if item.视频号数据诊断结果均值 else '0',
                        'videoPlayCount': item.视频号播放量,
                        'videoCompletionRate': f"{float(item.视频号完播率):.2f}%" if item.视频号完播率 else '0%',
                        'videoAvgPlayDuration': str(float(item.视频号平均播放时长)) if item.视频号平均播放时长 else '0',
                        'video3sPlayRate': f"{float(item.视频号3s以上播放率):.2f}%" if item.视频号3s以上播放率 else '0%',
                        'videoLike': item.视频号喜欢数,
                        'videoThumbsUp': item.视频号点赞数,
                        'videoComment': item.视频号评论数,
                        'videoNewFollow': item.视频号新增关注,
                        'videoShare': item.视频号转发量,
                        'videoConsult': item.视频号咨询量,
                        # 微信公众号数据
                        'articleValidCount': item.公众号文章数,
                        'articleReadCount': item.公众号阅读量,
                        'articleLike': item.公众号点赞数,
                        'articleShareCount': item.公众号分享数,
                        'articleRecommendCount': item.公众号推荐数 or 0,
                        'articleCommentCount': item.公众号留言数 or 0,
                        'articleConsult': item.公众号咨询量,
                        'remark': item.备注,
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/wechat/save')
async def save_wechat_data(data: dict, db: Session = Depends(get_db)):
    """保存微信平台日度数据（支持单条和批量）"""
    
    def _parse_numeric(value):
        """解析数值，去掉百分号、s等后缀"""
        if value is None or value == '':
            return None
        try:
            # 转换为字符串并去掉常见后缀
            str_val = str(value).replace('%', '').replace('s', '').replace('¥', '').strip()
            if str_val == '':
                return None
            # 即使是0也要保存
            return float(str_val)
        except (ValueError, TypeError):
            return None
    
    try:
        # 处理单条数据的函数
        def process_item(item_data: dict, campus: str):
            date_str = item_data.get('date')
            if not date_str:
                return False
            
            item_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找是否已存在
            existing = db.query(市场部免费推广微信平台日度数据表).filter(
                and_(
                    市场部免费推广微信平台日度数据表.神殿 == campus,
                    市场部免费推广微信平台日度数据表.日期 == item_date
                )
            ).first()
            
            # 计算微信平台咨询量（视频号咨询量 + 公众号咨询量）
            video_consult = item_data.get('videoConsult') or 0
            article_consult = item_data.get('articleConsult') or 0
            wechat_consult = video_consult + article_consult
            
            # 计算咨询量成本和转化率
            expense = item_data.get('expense') or 0
            consult_cost = safe_divide(expense, wechat_consult)
            
            net_enrollment = item_data.get('netEnrollment') or 0
            conversion_rate = safe_divide(net_enrollment, wechat_consult, percentage=True)
            
            # 准备数据
            # 调试日志
            print(f"保存数据 - 日期: {date_str}")
            print(f"  videoDiagnosticAvg 原始值: {item_data.get('videoDiagnosticAvg')}, 类型: {type(item_data.get('videoDiagnosticAvg'))}")
            print(f"  videoAvgPlayDuration 原始值: {item_data.get('videoAvgPlayDuration')}, 类型: {type(item_data.get('videoAvgPlayDuration'))}")
            
            parsed_diagnostic = _parse_numeric(item_data.get('videoDiagnosticAvg'))
            parsed_duration = _parse_numeric(item_data.get('videoAvgPlayDuration'))
            
            print(f"  videoDiagnosticAvg 解析后: {parsed_diagnostic}")
            print(f"  videoAvgPlayDuration 解析后: {parsed_duration}")
            
            record_data = {
                '神殿': campus,
                '日期': item_date,
                '微信平台实际收入': item_data.get('actualIncome') or 0,
                '微信平台报名转化率': conversion_rate,
                '退费数': item_data.get('refundCount') or 0,
                '净报名': net_enrollment,
                '毛报总数': item_data.get('grossEnrollment') or 0,
                '订座数': item_data.get('reservationCount') or 0,
                '上门人数': item_data.get('visitCount') or 0,
                '微信平台咨询量': wechat_consult,
                '咨询量成本': consult_cost,
                '微信平台花费': expense,
                # 微信视频号数据
                '视频号有效条数': item_data.get('videoValidCount') or 0,
                '视频号数据诊断结果均值': parsed_diagnostic,
                '视频号播放量': item_data.get('videoPlayCount') or 0,
                '视频号完播率': _parse_numeric(item_data.get('videoCompletionRate')),
                '视频号平均播放时长': parsed_duration,
                '视频号3s以上播放率': _parse_numeric(item_data.get('video3sPlayRate')),
                '视频号喜欢数': item_data.get('videoLike') or 0,
                '视频号点赞数': item_data.get('videoThumbsUp') or 0,
                '视频号评论数': item_data.get('videoComment') or 0,
                '视频号新增关注': item_data.get('videoNewFollow') or 0,
                '视频号转发量': item_data.get('videoShare') or 0,
                '视频号咨询量': video_consult,
                # 公众号数据
                '公众号文章数': item_data.get('articleValidCount') or 0,
                '公众号阅读量': item_data.get('articleReadCount') or 0,
                '公众号点赞数': item_data.get('articleLike') or 0,
                '公众号分享数': item_data.get('articleShareCount') or 0,
                '公众号推荐数': item_data.get('articleRecommendCount') or 0,
                '公众号留言数': item_data.get('articleCommentCount') or 0,
                '公众号咨询量': article_consult,
                # 朋友圈数据（暂时设为0，前端没有单独的朋友圈字段）
                '朋友圈发布数': 0,
                '朋友圈互动量': 0,
                '朋友圈咨询量': 0,
                '备注': item_data.get('remark'),
            }
            
            if existing:
                for key, value in record_data.items():
                    setattr(existing, key, value)
            else:
                new_record = 市场部免费推广微信平台日度数据表(**record_data)
                db.add(new_record)
            
            return True
        
        # 判断是单条保存还是批量保存
        campus = data.get('campus')
        if not campus:
            raise HTTPException(status_code=400, detail='缺少神殿参数')
        
        # 批量保存模式
        if 'items' in data:
            items = data.get('items', [])
            for item_data in items:
                process_item(item_data, campus)
        # 单条保存模式
        elif 'date' in data:
            process_item(data, campus)
        else:
            raise HTTPException(status_code=400, detail='缺少必要参数：需要 items 数组或 date 字段')
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"保存微信平台数据失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get('/video/list')
async def get_video_list(
    campus: str = Query(...),
    month: str = Query(...),
    db: Session = Depends(get_db)
):
    """获取视频日度数据列表"""
    try:
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        items = legacy_rows(
            db.query(市场部免费推广视频日度数据表)
            .filter(
                and_(
                    市场部免费推广视频日度数据表.神殿 == campus,
                    市场部免费推广视频日度数据表.日期 >= start_date,
                    市场部免费推广视频日度数据表.日期 < end_date,
                )
            )
            .order_by(市场部免费推广视频日度数据表.日期)
            .all()
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'campus': item.神殿,
                        'date': str(item.日期),
                        'actualIncome': float(item.视频实际收入) if item.视频实际收入 else 0,
                        'conversionRate': f"{float(item.视频报名转化率):.2f}%" if item.视频报名转化率 else '0%',
                        'refundCount': item.退费数,
                        'netEnrollment': item.净报名,
                        'grossEnrollment': item.毛报总数,
                        'reservationCount': item.订座数,
                        'visitCount': item.上门人数,
                        'videoTotal': item.视频咨询量,
                        'consultationCost': f"¥{float(item.咨询量成本):.2f}" if item.咨询量成本 else '¥0.00',
                        'expense': float(item.视频花费) if item.视频花费 else 0,
                        # 爱奇艺数据
                        'iqiyiValidCount': item.爱奇艺视频数,
                        'iqiyiDisplayTotal': item.爱奇艺展现量,
                        'iqiyiPlayTotal': item.爱奇艺播放量,
                        'iqiyiPlayDurationTotal': str(float(item.爱奇艺总播放时长)) if item.爱奇艺总播放时长 else '0',
                        'iqiyiCompletionRateTotal': f"{float(item.爱奇艺总播放完成率):.2f}%" if item.爱奇艺总播放完成率 else '0%',
                        'iqiyiCommentTotal': item.爱奇艺评论量,
                        'iqiyiLikeTotal': item.爱奇艺点赞量,
                        'iqiyiConsult': item.爱奇艺咨询量,
                        # 优酷数据
                        'youkuValidCount': item.优酷视频数,
                        'youkuPlayCount': item.优酷播放量,
                        'youkuLikeCount': item.优酷点赞量,
                        'youkuCommentCount': item.优酷评论量,
                        'youkuShareCount': item.优酷分享量 if hasattr(item, '优酷分享量') else 0,
                        'youkuFansCount': item.优酷粉丝数 if hasattr(item, '优酷粉丝数') else 0,
                        'youkuConsult': item.优酷咨询量,
                        'remark': item.备注,
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/video/save')
async def save_video_data(data: dict, db: Session = Depends(get_db)):
    """保存视频日度数据（支持单条和批量）"""
    
    def _parse_numeric(value):
        """解析数值，去掉百分号等后缀"""
        if value is None or value == '':
            return None
        try:
            str_val = str(value).replace('%', '').strip()
            if str_val == '':
                return None
            return float(str_val)
        except (ValueError, TypeError):
            return None
    
    try:
        # 处理单条数据的函数
        def process_item(item_data: dict, campus: str):
            date_str = item_data.get('date')
            if not date_str:
                return False
            
            item_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # 查找是否已存在
            existing = db.query(市场部免费推广视频日度数据表).filter(
                and_(
                    市场部免费推广视频日度数据表.神殿 == campus,
                    市场部免费推广视频日度数据表.日期 == item_date
                )
            ).first()
            
            # 计算视频咨询量（爱奇艺咨询量 + 优酷咨询量）
            iqiyi_consult = item_data.get('iqiyiConsult') or 0
            youku_consult = item_data.get('youkuConsult') or 0
            video_consult = iqiyi_consult + youku_consult
            
            # 计算咨询量成本和转化率
            expense = item_data.get('expense') or 0
            consult_cost = safe_divide(expense, video_consult)
            
            net_enrollment = item_data.get('netEnrollment') or 0
            conversion_rate = safe_divide(net_enrollment, video_consult, percentage=True)
            
            # 准备数据
            record_data = {
                '神殿': campus,
                '日期': item_date,
                '视频实际收入': item_data.get('actualIncome') or 0,
                '视频报名转化率': conversion_rate,
                '退费数': item_data.get('refundCount') or 0,
                '净报名': net_enrollment,
                '毛报总数': item_data.get('grossEnrollment') or 0,
                '订座数': item_data.get('reservationCount') or 0,
                '上门人数': item_data.get('visitCount') or 0,
                '视频咨询量': video_consult,
                '咨询量成本': consult_cost,
                '视频花费': expense,
                # 爱奇艺视频
                '爱奇艺视频数': item_data.get('iqiyiValidCount') or 0,
                '爱奇艺展现量': item_data.get('iqiyiDisplayTotal') or 0,
                '爱奇艺播放量': item_data.get('iqiyiPlayTotal') or 0,
                '爱奇艺总播放时长': _parse_numeric(item_data.get('iqiyiPlayDurationTotal')),
                '爱奇艺总播放完成率': _parse_numeric(item_data.get('iqiyiCompletionRateTotal')),
                '爱奇艺评论量': item_data.get('iqiyiCommentTotal') or 0,
                '爱奇艺点赞量': item_data.get('iqiyiLikeTotal') or 0,
                '爱奇艺咨询量': iqiyi_consult,
                # 腾讯视频（暂时设为0，前端使用爱奇艺数据）
                '腾讯视频数': 0,
                '腾讯播放量': 0,
                '腾讯点赞量': 0,
                '腾讯评论量': 0,
                '腾讯咨询量': 0,
                # 优酷视频
                '优酷视频数': item_data.get('youkuValidCount') or 0,
                '优酷播放量': item_data.get('youkuPlayCount') or 0,
                '优酷点赞量': item_data.get('youkuLikeCount') or 0,
                '优酷评论量': item_data.get('youkuCommentCount') or 0,
                '优酷分享量': item_data.get('youkuShareCount') or 0,
                '优酷粉丝数': item_data.get('youkuFansCount') or 0,
                '优酷咨询量': youku_consult,
                '备注': item_data.get('remark'),
            }
            
            if existing:
                for key, value in record_data.items():
                    setattr(existing, key, value)
            else:
                new_record = 市场部免费推广视频日度数据表(**record_data)
                db.add(new_record)
            
            return True
        
        # 判断是单条保存还是批量保存
        campus = data.get('campus')
        if not campus:
            raise HTTPException(status_code=400, detail='缺少神殿参数')
        
        # 批量保存模式
        if 'items' in data:
            items = data.get('items', [])
            for item_data in items:
                process_item(item_data, campus)
        # 单条保存模式
        elif 'date' in data:
            process_item(data, campus)
        else:
            raise HTTPException(status_code=400, detail='缺少必要参数：需要 items 数组或 date 字段')
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"保存视频数据失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 汇总数据API ====================

@router.get('/summary')
async def get_summary_data(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取所有类别的汇总数据"""
    try:
        year, month_num = map(int, month.split('-'))
        start_date = date(year, month_num, 1)
        
        if month_num == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_num + 1, 1)
        
        # 获取该月的所有日期
        from datetime import timedelta
        current_date = start_date
        all_dates = []
        while current_date < end_date:
            all_dates.append(current_date)
            current_date += timedelta(days=1)
        
        # 查询各类别数据
        social_items = legacy_rows(
            db.query(市场部免费推广社交新媒体日度数据表)
            .filter(
                and_(
                    市场部免费推广社交新媒体日度数据表.神殿 == campus,
                    市场部免费推广社交新媒体日度数据表.日期 >= start_date,
                    市场部免费推广社交新媒体日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        qa_items = legacy_rows(
            db.query(市场部免费推广问答日度数据表)
            .filter(
                and_(
                    市场部免费推广问答日度数据表.神殿 == campus,
                    市场部免费推广问答日度数据表.日期 >= start_date,
                    市场部免费推广问答日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        # 构建汇总数据
        summary_data = []
        for dt in all_dates:
            social = next((item for item in social_items if item.日期 == dt), None)
            qa = next((item for item in qa_items if item.日期 == dt), None)
            
            # 汇总各项数据
            total_income = 0.0
            total_refund = 0
            total_net_signup = 0
            total_gross = 0
            total_order = 0
            total_visit = 0
            total_consult = 0
            total_consumption = 0.0
            
            if social:
                total_income += float(social.社交新媒体实际收入 or 0)
                total_refund += social.退费数 or 0
                total_net_signup += social.净报名 or 0
                total_gross += social.毛报总数 or 0
                total_order += social.订座数 or 0
                total_visit += social.上门人数 or 0
                total_consult += social.社交新媒体咨询量 or 0
                total_consumption += float(social.社交新媒体消耗 or 0)
            
            if qa:
                total_income += float(qa.问答实际收入 or 0)
                total_refund += qa.退费数 or 0
                total_net_signup += qa.净报名 or 0
                total_gross += qa.毛报总数 or 0
                total_order += qa.订座数 or 0
                total_visit += qa.上门人数 or 0
                total_consult += qa.问答咨询量 or 0
                total_consumption += float(qa.问答花费 or 0)
            
            summary_data.append({
                'date': str(dt),
                'actualIncome': total_income,
                'signupConversionRate': safe_divide(total_net_signup, total_consult, percentage=True),
                'refundCount': total_refund,
                'netSignup': total_net_signup,
                'grossTotal': total_gross,
                'orderCount': total_order,
                'visitCount': total_visit,
                'consultCount': total_consult,
                'consultCost': safe_divide(total_consumption, total_consult),
                'consumption': total_consumption,
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': summary_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get('/yearly-summary')
async def get_yearly_summary_data(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份，格式：YYYY'),
    db: Session = Depends(get_db)
):
    """
    获取整年所有类别的月度汇总数据（优化版）
    一次请求返回12个月的汇总数据，避免72次API调用
    """
    try:
        year_num = int(year)
        
        # 定义年度日期范围
        start_date = date(year_num, 1, 1)
        end_date = date(year_num + 1, 1, 1)
        
        # 一次性查询所有6个表的年度数据
        social_items = legacy_rows(
            db.query(市场部免费推广社交新媒体日度数据表)
            .filter(
                and_(
                    市场部免费推广社交新媒体日度数据表.神殿 == campus,
                    市场部免费推广社交新媒体日度数据表.日期 >= start_date,
                    市场部免费推广社交新媒体日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        qa_items = legacy_rows(
            db.query(市场部免费推广问答日度数据表)
            .filter(
                and_(
                    市场部免费推广问答日度数据表.神殿 == campus,
                    市场部免费推广问答日度数据表.日期 >= start_date,
                    市场部免费推广问答日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        classified_items = legacy_rows(
            db.query(市场部免费推广分类信息日度数据表)
            .filter(
                and_(
                    市场部免费推广分类信息日度数据表.神殿 == campus,
                    市场部免费推广分类信息日度数据表.日期 >= start_date,
                    市场部免费推广分类信息日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        map_items = legacy_rows(
            db.query(市场部免费推广地图日度数据表)
            .filter(
                and_(
                    市场部免费推广地图日度数据表.神殿 == campus,
                    市场部免费推广地图日度数据表.日期 >= start_date,
                    市场部免费推广地图日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        wechat_items = legacy_rows(
            db.query(市场部免费推广微信平台日度数据表)
            .filter(
                and_(
                    市场部免费推广微信平台日度数据表.神殿 == campus,
                    市场部免费推广微信平台日度数据表.日期 >= start_date,
                    市场部免费推广微信平台日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        video_items = legacy_rows(
            db.query(市场部免费推广视频日度数据表)
            .filter(
                and_(
                    市场部免费推广视频日度数据表.神殿 == campus,
                    市场部免费推广视频日度数据表.日期 >= start_date,
                    市场部免费推广视频日度数据表.日期 < end_date,
                )
            )
            .all()
        )
        
        # 按月份汇总数据
        monthly_data = {}
        for month in range(1, 13):
            monthly_data[month] = {
                'actualIncome': 0.0,
                'refundCount': 0,
                'grossEnrollment': 0,
                'netEnrollment': 0,
                'orderCount': 0,
                'visitCount': 0,
                'actualConsultVolume': 0,
                'actualCost': 0.0,
            }
        
        # 汇总社交新媒体数据
        for item in social_items:
            month = item.日期.month
            monthly_data[month]['actualIncome'] += float(item.社交新媒体实际收入 or 0)
            monthly_data[month]['refundCount'] += item.退费数 or 0
            monthly_data[month]['grossEnrollment'] += item.毛报总数 or 0
            monthly_data[month]['netEnrollment'] += item.净报名 or 0
            monthly_data[month]['orderCount'] += item.订座数 or 0
            monthly_data[month]['visitCount'] += item.上门人数 or 0
            monthly_data[month]['actualConsultVolume'] += item.社交新媒体咨询量 or 0
            monthly_data[month]['actualCost'] += float(item.社交新媒体消耗 or 0)
        
        # 汇总问答数据
        for item in qa_items:
            month = item.日期.month
            monthly_data[month]['actualIncome'] += float(item.问答实际收入 or 0)
            monthly_data[month]['refundCount'] += item.退费数 or 0
            monthly_data[month]['grossEnrollment'] += item.毛报总数 or 0
            monthly_data[month]['netEnrollment'] += item.净报名 or 0
            monthly_data[month]['orderCount'] += item.订座数 or 0
            monthly_data[month]['visitCount'] += item.上门人数 or 0
            monthly_data[month]['actualConsultVolume'] += item.问答咨询量 or 0
            monthly_data[month]['actualCost'] += float(item.问答花费 or 0)
        
        # 汇总分类信息数据
        for item in classified_items:
            month = item.日期.month
            monthly_data[month]['actualIncome'] += float(item.分类信息实际收入 or 0)
            monthly_data[month]['refundCount'] += item.退费数 or 0
            monthly_data[month]['grossEnrollment'] += item.毛报总数 or 0
            monthly_data[month]['netEnrollment'] += item.净报名 or 0
            monthly_data[month]['orderCount'] += item.订座数 or 0
            monthly_data[month]['visitCount'] += item.上门人数 or 0
            monthly_data[month]['actualConsultVolume'] += item.分类信息咨询量 or 0
            monthly_data[month]['actualCost'] += float(item.分类信息花费 or 0)
        
        # 汇总地图数据
        for item in map_items:
            month = item.日期.month
            monthly_data[month]['actualIncome'] += float(item.地图实际收入 or 0)
            monthly_data[month]['refundCount'] += item.退费数 or 0
            monthly_data[month]['grossEnrollment'] += item.毛报总数 or 0
            monthly_data[month]['netEnrollment'] += item.净报名 or 0
            monthly_data[month]['orderCount'] += item.订座数 or 0
            monthly_data[month]['visitCount'] += item.上门人数 or 0
            monthly_data[month]['actualConsultVolume'] += item.地图咨询量 or 0
            monthly_data[month]['actualCost'] += float(item.地图花费 or 0)
        
        # 汇总微信数据
        for item in wechat_items:
            month = item.日期.month
            monthly_data[month]['actualIncome'] += float(item.微信实际收入 or 0)
            monthly_data[month]['refundCount'] += item.退费数 or 0
            monthly_data[month]['grossEnrollment'] += item.毛报总数 or 0
            monthly_data[month]['netEnrollment'] += item.净报名 or 0
            monthly_data[month]['orderCount'] += item.订座数 or 0
            monthly_data[month]['visitCount'] += item.上门人数 or 0
            monthly_data[month]['actualConsultVolume'] += item.微信咨询量 or 0
            monthly_data[month]['actualCost'] += float(item.微信花费 or 0)
        
        # 汇总视频数据
        for item in video_items:
            month = item.日期.month
            monthly_data[month]['actualIncome'] += float(item.视频实际收入 or 0)
            monthly_data[month]['refundCount'] += item.退费数 or 0
            monthly_data[month]['grossEnrollment'] += item.毛报总数 or 0
            monthly_data[month]['netEnrollment'] += item.净报名 or 0
            monthly_data[month]['orderCount'] += item.订座数 or 0
            monthly_data[month]['visitCount'] += item.上门人数 or 0
            monthly_data[month]['actualConsultVolume'] += item.视频咨询量 or 0
            monthly_data[month]['actualCost'] += float(item.视频花费 or 0)
        
        return {
            'code': 0,
            'message': 'success',
            'data': monthly_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
