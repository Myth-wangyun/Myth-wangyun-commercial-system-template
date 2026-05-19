"""
市场部免费推广明细登记API
"""
from datetime import datetime

from app.core.database import get_db
from app.models.market.free_promotion_detail import (
    市场部免费推广分类信息明细登记表,
    市场部免费推广微信平台明细登记表,
    市场部免费推广社交新媒体明细登记表,
    市场部免费推广视频明细登记表,
    市场部免费推广问答明细登记表,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== 社交新媒体明细登记API ====================

@router.get('/social-media-detail/list')
async def get_social_media_detail_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取社交新媒体明细登记列表"""
    try:
        items = db.query(市场部免费推广社交新媒体明细登记表).filter(
            and_(
                市场部免费推广社交新媒体明细登记表.神殿 == campus,
                市场部免费推广社交新媒体明细登记表.月份 == month
            )
        ).order_by(市场部免费推广社交新媒体明细登记表.序号).all()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'key': str(item.id),
                        '序号': item.序号,
                        '日期': str(item.日期) if item.日期 else '',
                        '发布平台': item.发布平台 or '',
                        '重点人群': item.重点人群 or '',
                        '主题题目': item.主题题目 or '',
                        '剪辑短视频名称': item.剪辑短视频名称 or '',
                        '秒': item.秒 or 0,
                        '备注链接': item.备注链接 or '',
                        '有效数': item.有效数 or 0,
                        '备注': item.备注 or '',
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/social-media-detail/save')
async def save_social_media_detail(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存社交新媒体明细登记数据（批量）"""
    try:
        campus = data.get('campus')
        month = data.get('month')
        items = data.get('items', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        # 删除该神殿该月份的所有记录
        db.query(市场部免费推广社交新媒体明细登记表).filter(
            and_(
                市场部免费推广社交新媒体明细登记表.神殿 == campus,
                市场部免费推广社交新媒体明细登记表.月份 == month
            )
        ).delete()
        
        # 批量插入新记录
        for item in items:
            date_str = item.get('日期', '')
            record = 市场部免费推广社交新媒体明细登记表(
                神殿=campus,
                月份=month,
                序号=item.get('序号', 0),
                日期=datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None,
                发布平台=item.get('发布平台', ''),
                重点人群=item.get('重点人群', ''),
                主题题目=item.get('主题题目', ''),
                剪辑短视频名称=item.get('剪辑短视频名称', ''),
                秒=item.get('秒', 0),
                备注链接=item.get('备注链接', ''),
                有效数=item.get('有效数', 0),
                备注=item.get('备注', ''),
            )
            db.add(record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete('/social-media-detail/{record_id}')
async def delete_social_media_detail(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除社交新媒体明细登记记录"""
    try:
        record = db.query(市场部免费推广社交新媒体明细登记表).filter(
            市场部免费推广社交新媒体明细登记表.id == record_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail='记录不存在')
        
        db.delete(record)
        db.commit()
        
        return {'code': 0, 'message': '删除成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 问答明细登记API ====================

@router.get('/qa-detail/list')
async def get_qa_detail_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取问答明细登记列表"""
    try:
        items = db.query(市场部免费推广问答明细登记表).filter(
            and_(
                市场部免费推广问答明细登记表.神殿 == campus,
                市场部免费推广问答明细登记表.月份 == month
            )
        ).order_by(市场部免费推广问答明细登记表.序号).all()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'key': str(item.id),
                        '序号': item.序号,
                        '日期': str(item.日期) if item.日期 else '',
                        '发布平台': item.发布平台 or '',
                        '重点人群': item.重点人群 or '',
                        '主题提问语': item.主题提问语 or '',
                        '问答链接': item.问答链接 or '',
                        '有效数': item.有效数 or 0,
                        '备注': item.备注 or '',
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/qa-detail/save')
async def save_qa_detail(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存问答明细登记数据（批量）"""
    try:
        campus = data.get('campus')
        month = data.get('month')
        items = data.get('items', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        # 删除该神殿该月份的所有记录
        db.query(市场部免费推广问答明细登记表).filter(
            and_(
                市场部免费推广问答明细登记表.神殿 == campus,
                市场部免费推广问答明细登记表.月份 == month
            )
        ).delete()
        
        # 批量插入新记录
        for item in items:
            date_str = item.get('日期', '')
            record = 市场部免费推广问答明细登记表(
                神殿=campus,
                月份=month,
                序号=item.get('序号', 0),
                日期=datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None,
                发布平台=item.get('发布平台', ''),
                重点人群=item.get('重点人群', ''),
                主题提问语=item.get('主题提问语', ''),
                问答链接=item.get('问答链接', ''),
                有效数=item.get('有效数', 0),
                备注=item.get('备注', ''),
            )
            db.add(record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete('/qa-detail/{record_id}')
async def delete_qa_detail(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除问答明细登记记录"""
    try:
        record = db.query(市场部免费推广问答明细登记表).filter(
            市场部免费推广问答明细登记表.id == record_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail='记录不存在')
        
        db.delete(record)
        db.commit()
        
        return {'code': 0, 'message': '删除成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 分类信息明细登记API ====================

@router.get('/classified-detail/list')
async def get_classified_detail_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取分类信息明细登记列表"""
    try:
        items = db.query(市场部免费推广分类信息明细登记表).filter(
            and_(
                市场部免费推广分类信息明细登记表.神殿 == campus,
                市场部免费推广分类信息明细登记表.月份 == month
            )
        ).order_by(市场部免费推广分类信息明细登记表.序号).all()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'key': str(item.id),
                        '序号': item.序号,
                        '日期': str(item.日期) if item.日期 else '',
                        '发布平台': item.发布平台 or '',
                        '重点人群': item.重点人群 or '',
                        '主题标题': item.主题标题 or '',
                        '分类信息链接': item.分类信息链接 or '',
                        '有效数': item.有效数 or 0,
                        '备注': item.备注 or '',
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/classified-detail/save')
async def save_classified_detail(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存分类信息明细登记数据（批量）"""
    try:
        campus = data.get('campus')
        month = data.get('month')
        items = data.get('items', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        # 删除该神殿该月份的所有记录
        db.query(市场部免费推广分类信息明细登记表).filter(
            and_(
                市场部免费推广分类信息明细登记表.神殿 == campus,
                市场部免费推广分类信息明细登记表.月份 == month
            )
        ).delete()
        
        # 批量插入新记录
        for item in items:
            date_str = item.get('日期', '')
            record = 市场部免费推广分类信息明细登记表(
                神殿=campus,
                月份=month,
                序号=item.get('序号', 0),
                日期=datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None,
                发布平台=item.get('发布平台', ''),
                重点人群=item.get('重点人群', ''),
                主题标题=item.get('主题标题', ''),
                分类信息链接=item.get('分类信息链接', ''),
                有效数=item.get('有效数', 0),
                备注=item.get('备注', ''),
            )
            db.add(record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete('/classified-detail/{record_id}')
async def delete_classified_detail(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除分类信息明细登记记录"""
    try:
        record = db.query(市场部免费推广分类信息明细登记表).filter(
            市场部免费推广分类信息明细登记表.id == record_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail='记录不存在')
        
        db.delete(record)
        db.commit()
        
        return {'code': 0, 'message': '删除成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 微信平台明细登记API ====================

@router.get('/wechat-detail/list')
async def get_wechat_detail_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取微信平台明细登记列表"""
    try:
        items = db.query(市场部免费推广微信平台明细登记表).filter(
            and_(
                市场部免费推广微信平台明细登记表.神殿 == campus,
                市场部免费推广微信平台明细登记表.月份 == month
            )
        ).order_by(市场部免费推广微信平台明细登记表.序号).all()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'key': str(item.id),
                        '序号': item.序号,
                        '日期': str(item.日期) if item.日期 else '',
                        '发布平台': item.发布平台 or '',
                        '重点人群': item.重点人群 or '',
                        '主题题目': item.主题题目 or '',
                        '剪辑短视频小程序名称': item.剪辑短视频小程序名称 or '',
                        '秒': item.秒 or 0,
                        '发布链接': item.发布链接 or '',
                        '有效数': item.有效数 or 0,
                        '备注': item.备注 or '',
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/wechat-detail/save')
async def save_wechat_detail(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存微信平台明细登记数据（批量）"""
    try:
        campus = data.get('campus')
        month = data.get('month')
        items = data.get('items', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        # 删除该神殿该月份的所有记录
        db.query(市场部免费推广微信平台明细登记表).filter(
            and_(
                市场部免费推广微信平台明细登记表.神殿 == campus,
                市场部免费推广微信平台明细登记表.月份 == month
            )
        ).delete()
        
        # 批量插入新记录
        for item in items:
            date_str = item.get('日期', '')
            record = 市场部免费推广微信平台明细登记表(
                神殿=campus,
                月份=month,
                序号=item.get('序号', 0),
                日期=datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None,
                发布平台=item.get('发布平台', ''),
                重点人群=item.get('重点人群', ''),
                主题题目=item.get('主题题目', ''),
                剪辑短视频小程序名称=item.get('剪辑短视频小程序名称', ''),
                秒=item.get('秒', 0),
                发布链接=item.get('发布链接', ''),
                有效数=item.get('有效数', 0),
                备注=item.get('备注', ''),
            )
            db.add(record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete('/wechat-detail/{record_id}')
async def delete_wechat_detail(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除微信平台明细登记记录"""
    try:
        record = db.query(市场部免费推广微信平台明细登记表).filter(
            市场部免费推广微信平台明细登记表.id == record_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail='记录不存在')
        
        db.delete(record)
        db.commit()
        
        return {'code': 0, 'message': '删除成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 视频明细登记API ====================

@router.get('/video-detail/list')
async def get_video_detail_list(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式：YYYY-MM'),
    db: Session = Depends(get_db)
):
    """获取视频明细登记列表"""
    try:
        items = db.query(市场部免费推广视频明细登记表).filter(
            and_(
                市场部免费推广视频明细登记表.神殿 == campus,
                市场部免费推广视频明细登记表.月份 == month
            )
        ).order_by(市场部免费推广视频明细登记表.序号).all()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.id,
                        'key': str(item.id),
                        '序号': item.序号,
                        '日期': str(item.日期) if item.日期 else '',
                        '发布平台': item.发布平台 or '',
                        '重点人群': item.重点人群 or '',
                        '视频主题标题': item.视频主题标题 or '',
                        '剪辑短长视频名称': item.剪辑短长视频名称 or '',
                        '秒': item.秒 or 0,
                        '备注链接': item.备注链接 or '',
                        '有效数': item.有效数 or 0,
                        '备注': item.备注 or '',
                    }
                    for item in items
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/video-detail/save')
async def save_video_detail(
    data: dict,
    db: Session = Depends(get_db)
):
    """保存视频明细登记数据（批量）"""
    try:
        campus = data.get('campus')
        month = data.get('month')
        items = data.get('items', [])
        
        if not campus or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数')
        
        # 删除该神殿该月份的所有记录
        db.query(市场部免费推广视频明细登记表).filter(
            and_(
                市场部免费推广视频明细登记表.神殿 == campus,
                市场部免费推广视频明细登记表.月份 == month
            )
        ).delete()
        
        # 批量插入新记录
        for item in items:
            date_str = item.get('日期', '')
            record = 市场部免费推广视频明细登记表(
                神殿=campus,
                月份=month,
                序号=item.get('序号', 0),
                日期=datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None,
                发布平台=item.get('发布平台', ''),
                重点人群=item.get('重点人群', ''),
                视频主题标题=item.get('视频主题标题', ''),
                剪辑短长视频名称=item.get('剪辑短长视频名称', ''),
                秒=item.get('秒', 0),
                备注链接=item.get('备注链接', ''),
                有效数=item.get('有效数', 0),
                备注=item.get('备注', ''),
            )
            db.add(record)
        
        db.commit()
        
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete('/video-detail/{record_id}')
async def delete_video_detail(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除视频明细登记记录"""
    try:
        record = db.query(市场部免费推广视频明细登记表).filter(
            市场部免费推广视频明细登记表.id == record_id
        ).first()
        
        if not record:
            raise HTTPException(status_code=404, detail='记录不存在')
        
        db.delete(record)
        db.commit()
        
        return {'code': 0, 'message': '删除成功'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
