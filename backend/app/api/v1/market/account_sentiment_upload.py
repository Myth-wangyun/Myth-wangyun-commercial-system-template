"""
市场部 - 新媒体账号舆情登记表 - 图片上传 API
包含安全的图片上传功能
"""
from __future__ import annotations

import io
import logging
import os
import uuid
from pathlib import Path
from typing import List, Optional

from app.core.config import settings
from app.core.paths import get_upload_root
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
from pydantic import BaseModel, Field
from pypinyin import Style, lazy_pinyin

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_ROOT_DIR = get_upload_root()
UPLOAD_BASE_DIR = UPLOAD_ROOT_DIR / "market-account-sentiment"

# 允许的图片MIME类型
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
}

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# 最大文件大小（使用配置文件中的设置，默认10MB）
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE

# 图片最大尺寸（像素）
MAX_IMAGE_DIMENSION = 4096


def _close_image(img: Image.Image | None) -> None:
    if img is None:
        return
    try:
        img.close()
    except Exception:
        pass


def validate_image_file(file: UploadFile) -> tuple[bool, str]:
    """
    验证上传的文件是否为有效的图片
    返回: (是否有效, 错误信息)
    """
    # 1. 检查文件扩展名
    filename = file.filename or ""
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"不允许的文件类型: {file_ext}。只允许: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # 2. 检查MIME类型
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        return False, f"不允许的MIME类型: {content_type}。只允许图片类型"
    
    return True, ""


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，防止路径遍历攻击
    只保留字母、数字、下划线、连字符和点号
    """
    # 移除路径分隔符和危险字符
    safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-"
    sanitized = "".join(c if c in safe_chars else "_" for c in filename)
    # 限制长度
    if len(sanitized) > 255:
        name, ext = os.path.splitext(sanitized)
        sanitized = name[:250] + ext
    return sanitized


def generate_unique_filename(original_filename: str, campus_name: Optional[str] = None, account_id: Optional[str] = None) -> str:
    """
    生成唯一的文件名，防止文件名冲突
    如果提供了神殿名和账号ID，使用它们生成文件名
    否则使用UUID
    """
    # 获取扩展名
    ext = Path(original_filename).suffix.lower()
    
    if campus_name and account_id:
        # 将中文神殿名转换为拼音
        pinyin_list = lazy_pinyin(campus_name, style=Style.NORMAL)
        pinyin_campus = ''.join(pinyin_list)
        
        # 清理账号ID，只保留字母和数字
        safe_account_id = ''.join(c for c in account_id if c.isalnum())
        
        # 添加时间戳避免重复
        import time
        timestamp = int(time.time())
        
        # 组合：拼音神殿名 + 账号ID + 时间戳 + 扩展名
        filename = f"{pinyin_campus}_{safe_account_id}_{timestamp}{ext}"
        
        return filename
    else:
        # 使用UUID生成唯一文件名
        safe_name = sanitize_filename(original_filename)
        unique_id = str(uuid.uuid4())
        name_without_ext = Path(safe_name).stem
        return f"{unique_id}_{name_without_ext}{ext}"


def validate_image_content(file_content: bytes) -> tuple[bool, str, Optional[tuple[int, int]]]:
    """
    验证图片内容，确保是有效的图片文件
    返回: (是否有效, 错误信息, 图片尺寸)
    """
    img = None
    try:
        # 使用PIL验证图片（设置大小限制，避免DecompressionBomb攻击）
        Image.MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION
        
        # 使用PIL验证图片
        img = Image.open(io.BytesIO(file_content))
        # 验证格式
        if img.format not in ("JPEG", "PNG", "GIF", "WEBP"):
            img.close()
            return False, f"不支持的图片格式: {img.format}", None
        
        # 获取尺寸
        width, height = img.size
        
        # 检查尺寸是否过大
        if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
            img.close()
            return False, f"图片尺寸过大: {width}x{height}。最大允许: {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}", None
        
        # 验证图片数据完整性
        img.verify()
        img.close()
        
        return True, "", (width, height)
    except Image.DecompressionBombError:
        _close_image(img)
        return False, "图片文件过大，可能包含恶意数据", None
    except Exception as e:
        _close_image(img)
        logger.warning(f"[图片验证] 验证失败: {str(e)}")
        return False, f"无效的图片文件: {str(e)}", None


class UploadResponse(BaseModel):
    """上传响应"""
    success: bool
    message: str
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    image_dimensions: Optional[dict] = None


class FileListResponse(BaseModel):
    """文件列表响应"""
    files: List[dict] = Field(default_factory=list)


@router.post("/account-sentiment/upload", response_model=UploadResponse, summary="上传新媒体头像图片")
async def upload_avatar(
    file: UploadFile = File(...),
    campus_name: Optional[str] = Form(None, description="神殿名称"),
    account_id: Optional[str] = Form(None, description="账号ID"),
):
    """
    安全地上传新媒体头像图片
    
    安全措施：
    1. 验证文件类型（扩展名和MIME类型）
    2. 验证文件大小（最大允许大小由配置文件 MAX_UPLOAD_SIZE 设置，默认10MB）
    3. 验证图片内容（使用PIL验证）
    4. 防止路径遍历（清理文件名）
    5. 使用唯一文件名
    6. 限制存储路径（固定目录）
    """
    file_content = None
    file_path = None
    try:
        logger.info(f"[上传] 开始处理上传请求 - 文件名: {file.filename}, 类型: {file.content_type}, 神殿: {campus_name}")
        
        # 1. 验证文件类型
        is_valid, error_msg = validate_image_file(file)
        if not is_valid:
            logger.warning(f"[上传] 文件类型验证失败: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 2. 读取文件内容
        logger.info("[上传] 开始读取文件内容...")
        file_content = await file.read()
        file_size = len(file_content)
        file_size_mb = file_size / (1024 * 1024)
        logger.info(f"[上传] 文件读取完成 - 大小: {file_size} 字节 ({file_size_mb:.2f}MB)")
        
        # 3. 验证文件大小
        if file_size > MAX_FILE_SIZE:
            max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
            logger.warning(f"[上传] 文件大小超过限制: {file_size_mb:.2f}MB > {max_size_mb:.2f}MB")
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制: {file_size_mb:.2f}MB。最大允许: {max_size_mb:.2f}MB"
            )
        
        # 4. 验证图片内容
        logger.info("[上传] 开始验证图片内容...")
        is_valid_content, error_msg, dimensions = validate_image_content(file_content)
        if not is_valid_content:
            logger.warning(f"[上传] 图片内容验证失败: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        if dimensions:
            logger.info(f"[上传] 图片尺寸: {dimensions[0]}x{dimensions[1]}")
        
        # 5. 生成安全的文件名
        unique_filename = generate_unique_filename(
            file.filename or "image",
            campus_name=campus_name,
            account_id=account_id
        )
        logger.info(f"[上传] 生成的文件名: {unique_filename}")
        
        # 6. 确定存储路径（按神殿分组）
        if campus_name:
            # 将中文神殿名转换为拼音
            try:
                pinyin_campus_list = lazy_pinyin(campus_name, style=Style.NORMAL)
                pinyin_campus = ''.join(pinyin_campus_list)
                if not pinyin_campus:
                    safe_campus = sanitize_filename(campus_name)
                else:
                    safe_campus = sanitize_filename(pinyin_campus)
            except Exception as e:
                logger.warning(f"[上传] 神殿名称转拼音失败: {str(e)}")
                safe_campus = sanitize_filename(campus_name)
            save_dir = UPLOAD_BASE_DIR / safe_campus
        else:
            save_dir = UPLOAD_BASE_DIR / "default"
        
        # 确保目录存在
        save_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"[上传] 保存目录: {save_dir}")
        
        # 7. 保存文件
        file_path = save_dir / unique_filename
        try:
            logger.info("[上传] 开始保存文件...")
            with open(file_path, "wb") as f:
                f.write(file_content)
            logger.info(f"[上传] 文件保存成功: {file_path}")
        except IOError as e:
            logger.error(f"[上传] 文件保存失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"保存文件失败: {str(e)}") from e
        except Exception as e:
            logger.error(f"[上传] 文件保存时发生未知错误: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"保存文件时出错: {str(e)}") from e
        
        # 8. 生成访问URL
        uploads_base = UPLOAD_BASE_DIR.parent  # 项目根目录/uploads
        relative_path = file_path.relative_to(uploads_base)
        file_url = f"/api/v1/market/account-sentiment/file/{relative_path.as_posix()}"
        
        logger.info(f"[上传] 上传成功 - URL: {file_url}")
        
        return UploadResponse(
            success=True,
            message="文件上传成功",
            file_path=str(relative_path),
            file_url=file_url,
            file_size=len(file_content),
            image_dimensions={"width": dimensions[0], "height": dimensions[1]} if dimensions else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[上传] 上传失败 - 文件名: {file.filename if file else 'unknown'}, 错误: {str(e)}", exc_info=True)
        
        # 清理失败的文件
        if file_path and file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"[上传] 已清理失败的文件: {file_path}")
            except Exception as cleanup_error:
                logger.warning(f"[上传] 清理失败的文件时出错: {str(cleanup_error)}")
        
        error_detail = f"上传文件时出错: {str(e)}"
        if "memory" in str(e).lower() or "MemoryError" in str(type(e).__name__):
            error_detail = "文件太大，处理时内存不足。请尝试上传较小的文件。"
        elif "timeout" in str(e).lower():
            error_detail = "上传超时，请稍后重试。"
        
        raise HTTPException(status_code=500, detail=error_detail) from e
    finally:
        if file_content is not None:
            del file_content


@router.get("/account-sentiment/file/{file_path:path}", summary="获取上传的头像文件")
async def get_file(file_path: str):
    """
    安全地获取上传的文件
    
    安全措施：
    1. 验证路径，防止路径遍历
    2. 只允许访问上传目录下的文件
    """
    try:
        # 清理路径，防止路径遍历
        safe_path = Path(file_path)
        
        # 检查是否包含路径遍历
        if ".." in str(safe_path) or safe_path.is_absolute():
            raise HTTPException(status_code=403, detail="不允许的路径")
        
        # 构建完整路径
        full_path = UPLOAD_ROOT_DIR / safe_path
        
        # 验证文件是否在上传目录内
        try:
            full_path.resolve().relative_to(UPLOAD_ROOT_DIR.resolve())
        except ValueError as e:
            raise HTTPException(status_code=403, detail="不允许访问该路径") from e
        
        # 检查文件是否存在
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 根据文件扩展名确定MIME类型
        ext = full_path.suffix.lower()
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        media_type = mime_types.get(ext, "image/jpeg")
        
        # 返回文件
        filename = full_path.name
        return FileResponse(
            path=str(full_path),
            media_type=media_type,
            filename=filename,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件时出错: {str(e)}") from e


@router.get("/account-sentiment/files", response_model=FileListResponse, summary="获取头像文件列表")
async def list_files(
    campus_name: Optional[str] = Query(None, description="神殿名称"),
):
    """
    获取上传的头像文件列表
    """
    try:
        files = []
        
        # 确定要扫描的目录
        if campus_name:
            pinyin_campus_list = lazy_pinyin(campus_name, style=Style.NORMAL)
            pinyin_campus = ''.join(pinyin_campus_list)
            if not pinyin_campus:
                safe_campus = sanitize_filename(campus_name)
            else:
                safe_campus = sanitize_filename(pinyin_campus)
            scan_dir = UPLOAD_BASE_DIR / safe_campus
        else:
            scan_dir = UPLOAD_BASE_DIR
        
        # 扫描目录
        if scan_dir.exists() and scan_dir.is_dir():
            uploads_base = UPLOAD_BASE_DIR.parent
            for file_path in scan_dir.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                    stat = file_path.stat()
                    relative_path = file_path.relative_to(uploads_base)
                    file_url = f"/api/v1/market/account-sentiment/file/{relative_path.as_posix()}"
                    
                    files.append({
                        "filename": file_path.name,
                        "size": stat.st_size,
                        "upload_time": stat.st_mtime,
                        "url": file_url,
                        "path": str(relative_path)
                    })
        
        return FileListResponse(files=files)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表时出错: {str(e)}") from e


class DeleteResponse(BaseModel):
    """删除响应"""
    success: bool
    message: str


@router.delete("/account-sentiment/delete-file", response_model=DeleteResponse, summary="删除头像图片文件")
async def delete_avatar_file(
    file_url: str = Query(..., description="文件URL路径"),
):
    """
    安全地删除上传的头像图片文件
    
    安全措施：
    1. 验证路径，防止路径遍历
    2. 只允许删除上传目录下的文件
    3. 验证文件是否存在
    """
    try:
        logger.info(f"[删除] 开始处理删除请求 - URL: {file_url}")
        
        # 从URL中提取文件路径
        # file_url 格式: /api/v1/market/account-sentiment/file/market-account-sentiment/xxx/xxx.jpg
        if "/account-sentiment/file/" in file_url:
            file_path_str = file_url.split("/account-sentiment/file/")[1]
        else:
            # 如果传入的是相对路径
            file_path_str = file_url
        
        # 清理路径，防止路径遍历
        safe_path = Path(file_path_str)
        
        # 检查是否包含路径遍历
        if ".." in str(safe_path) or safe_path.is_absolute():
            logger.warning(f"[删除] 检测到路径遍历攻击: {file_path_str}")
            raise HTTPException(status_code=403, detail="不允许的路径")
        
        # 构建完整路径
        full_path = UPLOAD_ROOT_DIR / safe_path
        
        # 验证文件是否在上传目录内
        try:
            full_path.resolve().relative_to(UPLOAD_ROOT_DIR.resolve())
        except ValueError as e:
            logger.warning(f"[删除] 文件不在允许的目录内: {full_path}")
            raise HTTPException(status_code=403, detail="不允许访问该路径") from e
        
        # 检查文件是否存在
        if not full_path.exists():
            logger.warning(f"[删除] 文件不存在: {full_path}")
            raise HTTPException(status_code=404, detail="文件不存在")
        
        if not full_path.is_file():
            logger.warning(f"[删除] 路径不是文件: {full_path}")
            raise HTTPException(status_code=400, detail="路径不是文件")
        
        # 验证文件扩展名（只允许删除图片文件）
        if full_path.suffix.lower() not in ALLOWED_EXTENSIONS:
            logger.warning(f"[删除] 不允许删除的文件类型: {full_path.suffix}")
            raise HTTPException(status_code=403, detail="不允许删除该类型的文件")
        
        # 删除文件
        try:
            full_path.unlink()
            logger.info(f"[删除] 文件删除成功: {full_path}")
            return DeleteResponse(
                success=True,
                message="文件删除成功"
            )
        except OSError as e:
            logger.error(f"[删除] 删除文件失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"删除文件失败: {str(e)}") from e
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[删除] 删除文件时出错: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"删除文件时出错: {str(e)}") from e
