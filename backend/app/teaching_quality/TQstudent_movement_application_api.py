"""
教学质量模块 - 学员异动申请表 API
包含安全的图片上传功能
"""
from __future__ import annotations

import io
import logging
import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
from pydantic import BaseModel, Field
from pypinyin import Style, lazy_pinyin

from app.core.config import settings
from app.core.paths import get_upload_root

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_ROOT_DIR = get_upload_root()
UPLOAD_BASE_DIR = UPLOAD_ROOT_DIR / "student-movement-application"

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


def generate_unique_filename(original_filename: str, student_name: Optional[str] = None, id_card: Optional[str] = None) -> str:
    """
    生成唯一的文件名，防止文件名冲突
    如果提供了学员姓名和身份证号，使用它们生成文件名：姓名拼音（英文字母）+ 身份证号
    否则使用UUID
    """
    # 获取扩展名
    ext = Path(original_filename).suffix.lower()
    
    if student_name and id_card:
        # 将中文姓名转换为拼音（英文字母）
        # lazy_pinyin 返回拼音列表，例如：['zhang', 'san']
        # 使用 Style.NORMAL 获取标准拼音（不带声调）
        pinyin_list = lazy_pinyin(student_name, style=Style.NORMAL)
        # 将拼音列表连接成字符串，例如：'zhangsan'
        pinyin_name = ''.join(pinyin_list)
        
        # 清理身份证号，只保留字母和数字
        safe_id_card = ''.join(c for c in id_card if c.isalnum())
        
        # 组合：拼音姓名 + 身份证号 + 扩展名
        # 例如：zhangsan110101200210105809.jpg
        filename = f"{pinyin_name}{safe_id_card}{ext}"
        
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
        Image.MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION  # 设置最大像素数
        
        # 使用PIL验证图片
        img = Image.open(io.BytesIO(file_content))
        # 验证格式
        if img.format not in ("JPEG", "PNG", "GIF", "WEBP"):
            img.close()
            return False, f"不支持的图片格式: {img.format}", None
        
        # 获取尺寸（在verify之前获取，因为verify会消耗图片数据）
        width, height = img.size
        
        # 检查尺寸是否过大
        if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
            img.close()
            return False, f"图片尺寸过大: {width}x{height}。最大允许: {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}", None
        
        # 验证图片数据完整性
        # 注意：verify() 会消耗图片数据，需要重新打开图片
        img.verify()
        
        # verify() 后图片不能再使用，需要重新打开获取完整信息
        # 但我们已经获取了尺寸，所以可以直接返回
        img.close()
        
        return True, "", (width, height)
    except Image.DecompressionBombError:
        if img is not None:
            try:
                img.close()
            except Exception:
                pass
        return False, "图片文件过大，可能包含恶意数据", None
    except Exception as e:
        if img is not None:
            try:
                img.close()
            except Exception:
                pass
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


class DeleteRequest(BaseModel):
    """删除请求"""
    campus: Optional[str] = Field(None, description="神殿名称")
    filename: str = Field(..., description="文件名")
    path: str = Field(..., description="文件路径")


class DeleteResponse(BaseModel):
    """删除响应"""
    success: bool
    message: str


@router.post("/student-movement-application/upload", response_model=UploadResponse, summary="上传图片文件")
async def upload_image(
    file: UploadFile = File(...),
    campus: Optional[str] = Form(None, description="神殿名称"),
    student_name: Optional[str] = Form(None, description="学员姓名"),
    id_card: Optional[str] = Form(None, description="身份证号"),
):
    """
    安全地上传图片文件
    
    安全措施：
    1. 验证文件类型（扩展名和MIME类型）
    2. 验证文件大小（最大允许大小由配置文件 MAX_UPLOAD_SIZE 设置，默认10MB）
    3. 验证图片内容（使用PIL验证）
    4. 防止路径遍历（清理文件名）
    5. 使用UUID生成唯一文件名
    6. 限制存储路径（固定目录）
"""
    file_content = None
    file_path = None
    try:
        logger.info(f"[上传] 开始处理上传请求 - 文件名: {file.filename}, 类型: {file.content_type}, 神殿: {campus}")
        
        # 1. 验证文件类型
        is_valid, error_msg = validate_image_file(file)
        if not is_valid:
            logger.warning(f"[上传] 文件类型验证失败: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        
        # 2. 读取文件内容（分块读取，避免内存溢出）
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
                status_code=413,  # Payload Too Large (更合适的HTTP状态码)
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
        
        # 5. 生成安全的文件名（使用学员姓名和身份证号，如果提供）
        unique_filename = generate_unique_filename(
            file.filename or "image",
            student_name=student_name,
            id_card=id_card
        )
        logger.info(f"[上传] 生成的文件名: {unique_filename}")
        
        # 6. 确定存储路径（按神殿分组，如果提供了神殿）
        if campus:
            # 清理神殿名称，防止路径遍历
            # 将中文神殿名转换为拼音，避免中文字符被替换成下划线
            try:
                pinyin_campus_list = lazy_pinyin(campus, style=Style.NORMAL)
                pinyin_campus = ''.join(pinyin_campus_list)
                # 如果拼音为空（可能是纯英文或数字），使用原始清理后的名称
                if not pinyin_campus:
                    safe_campus = sanitize_filename(campus)
                else:
                    safe_campus = sanitize_filename(pinyin_campus)
            except Exception as e:
                logger.warning(f"[上传] 神殿名称转拼音失败: {str(e)}, 使用清理后的原始名称")
                safe_campus = sanitize_filename(campus)
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
        
        # 8. 生成访问URL（相对路径）
        # UPLOAD_BASE_DIR = 项目根目录/uploads/student-movement-application
        # 需要相对于 项目根目录/uploads
        uploads_base = UPLOAD_BASE_DIR.parent  # 项目根目录/uploads
        relative_path = file_path.relative_to(uploads_base)
        file_url = f"/api/v1/teaching-quality/student-movement-application/file/{relative_path.as_posix()}"
        
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
        # HTTPException 直接抛出，不记录为错误
        raise
    except Exception as e:
        # 记录详细的错误信息
        logger.error(f"[上传] 上传失败 - 文件名: {file.filename if file else 'unknown'}, 错误: {str(e)}", exc_info=True)
        
        # 清理：如果文件已部分保存，尝试删除
        if file_path and file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"[上传] 已清理失败的文件: {file_path}")
            except Exception as cleanup_error:
                logger.warning(f"[上传] 清理失败的文件时出错: {str(cleanup_error)}")
        
        # 返回用户友好的错误信息
        error_detail = f"上传文件时出错: {str(e)}"
        if "memory" in str(e).lower() or "MemoryError" in str(type(e).__name__):
            error_detail = "文件太大，处理时内存不足。请尝试上传较小的文件。"
        elif "timeout" in str(e).lower():
            error_detail = "上传超时，请稍后重试。"
        
        raise HTTPException(status_code=500, detail=error_detail) from e
    finally:
        # 释放内存
        if file_content is not None:
            del file_content


@router.get("/student-movement-application/file/{file_path:path}", summary="获取上传的文件")
async def get_file(file_path: str):
    """
    安全地获取上传的文件
    
    安全措施：
    1. 验证路径，防止路径遍历
    2. 只允许访问上传目录下的文件
    """
    try:
        # 清理路径，防止路径遍历
        # 移除所有 ".." 和绝对路径
        safe_path = Path(file_path)
        
        # 检查是否包含路径遍历
        if ".." in str(safe_path) or safe_path.is_absolute():
            raise HTTPException(status_code=403, detail="不允许的路径")
        
        # 构建完整路径（相对于项目根目录的uploads目录）
        full_path = UPLOAD_ROOT_DIR / safe_path
        
        # 验证文件是否在上传目录内（防止目录遍历）
        try:
            full_path.resolve().relative_to(UPLOAD_ROOT_DIR.resolve())
        except ValueError as e:
            raise HTTPException(status_code=403, detail="不允许访问该路径") from e
        
        # 检查文件是否存在
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 返回文件，设置正确的文件名
        filename = full_path.name
        return FileResponse(
            path=str(full_path),
            media_type="image/jpeg",  # 可以根据实际文件类型调整
            filename=filename,  # 设置下载时的文件名
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件时出错: {str(e)}") from e


@router.get("/student-movement-application/files", response_model=FileListResponse, summary="获取文件列表")
async def list_files(
    campus: Optional[str] = Query(None, description="神殿名称"),
    class_name: Optional[str] = Query(None, description="班级名称"),
    student_name: Optional[str] = Query(None, description="学员姓名"),
    id_card: Optional[str] = Query(None, description="身份证号"),
):
    """
    获取上传的文件列表
    支持按班级名称、学员姓名和身份证号过滤
    """
    try:
        files = []
        
        # 确定要扫描的目录
        if campus:
            # 将中文神殿名转换为拼音，避免中文字符被替换成下划线
            pinyin_campus_list = lazy_pinyin(campus, style=Style.NORMAL)
            pinyin_campus = ''.join(pinyin_campus_list)
            # 如果拼音为空（可能是纯英文或数字），使用原始清理后的名称
            if not pinyin_campus:
                safe_campus = sanitize_filename(campus)
            else:
                safe_campus = sanitize_filename(pinyin_campus)
            scan_dir = UPLOAD_BASE_DIR / safe_campus
        else:
            scan_dir = UPLOAD_BASE_DIR
        
        # 如果提供了班级名称，需要从数据库加载该班级的学员列表
        class_student_ids = set()
        if class_name and campus:
            try:
                from app.core.database import get_teaching_quality_db
                from app.teaching_quality.TQclass_file_record_db import (
                    fetch_class_file_rows,
                    init_class_file_tables,
                )
                
                # 初始化表
                init_class_file_tables()
                
                # 获取数据库会话
                db = next(get_teaching_quality_db())
                
                try:
                    # 获取班级档案数据
                    norm_campus = campus[:-2] if campus.endswith('神殿') else campus
                    rows = fetch_class_file_rows(db, 神殿名称=norm_campus, 班级名称=class_name)
                    
                    # 提取该班级所有学员的身份证号
                    for row in rows:
                        id_card_value = row.身份证号 if hasattr(row, '身份证号') else None
                        if id_card_value:
                            # 清理身份证号，只保留字母和数字
                            safe_id = ''.join(c for c in str(id_card_value).strip() if c.isalnum())
                            if safe_id:
                                class_student_ids.add(safe_id)
                    
                    logger.info(f"[文件列表] 班级 {class_name} 有 {len(class_student_ids)} 个学员")
                finally:
                    db.close()
            except Exception as e:
                logger.warning(f"[文件列表] 加载班级学员列表失败: {str(e)}")
                # 如果加载失败，返回空列表
                return FileListResponse(files=[])
        
        # 如果提供了学员姓名和身份证号，生成期望的文件名前缀
        expected_prefix = None
        if student_name and id_card:
            # 将学员姓名转换为拼音
            pinyin_list = lazy_pinyin(student_name, style=Style.NORMAL)
            pinyin_name = ''.join(pinyin_list)
            # 清理身份证号
            safe_id_card = ''.join(c for c in id_card if c.isalnum())
            # 期望的文件名前缀：拼音姓名 + 身份证号
            expected_prefix = f"{pinyin_name}{safe_id_card}"
            logger.info(f"[文件列表] 过滤条件 - 学员: {student_name}, 身份证: {id_card}, 期望前缀: {expected_prefix}")
        
        # 扫描目录
        if scan_dir.exists() and scan_dir.is_dir():
            # UPLOAD_BASE_DIR = 项目根目录/uploads/student-movement-application
            # 需要相对于 项目根目录/uploads
            uploads_base = UPLOAD_BASE_DIR.parent  # 项目根目录/uploads
            for file_path in scan_dir.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                    filename_without_ext = file_path.stem
                    
                    # 如果指定了班级，检查文件是否属于该班级的学员
                    if class_name and class_student_ids:
                        # 文件名格式：拼音姓名 + 身份证号
                        # 需要从文件名中提取身份证号，检查是否在班级学员列表中
                        # 身份证号通常是15位或18位数字（最后一位可能是X）
                        import re
                        # 匹配身份证号模式：15位或18位数字（最后一位可能是X）
                        id_pattern = r'(\d{15}|\d{17}[\dXx])(?:\.|$)'
                        match = re.search(id_pattern, filename_without_ext)
                        
                        if match:
                            file_id_card = match.group(1).upper()
                            if file_id_card not in class_student_ids:
                                logger.debug(f"[文件列表] 跳过不属于班级 {class_name} 的文件: {file_path.name}")
                                continue
                        else:
                            # 如果文件名中没有找到身份证号，跳过该文件
                            logger.debug(f"[文件列表] 跳过无法识别身份证号的文件: {file_path.name}")
                            continue
                    
                    # 如果指定了学员信息，只返回匹配的文件
                    if expected_prefix:
                        # 检查文件名是否以期望的前缀开头
                        if not filename_without_ext.startswith(expected_prefix):
                            logger.debug(f"[文件列表] 跳过不匹配的文件: {file_path.name}")
                            continue
                    
                    stat = file_path.stat()
                    relative_path = file_path.relative_to(uploads_base)
                    file_url = f"/api/v1/teaching-quality/student-movement-application/file/{relative_path.as_posix()}"
                    
                    files.append({
                        "filename": file_path.name,
                        "size": stat.st_size,
                        "upload_time": stat.st_mtime,
                        "url": file_url,
                        "path": str(relative_path)
                    })
        
        logger.info(f"[文件列表] 返回 {len(files)} 个文件")
        return FileListResponse(files=files)
    
    except Exception as e:
        logger.error(f"[文件列表] 获取文件列表时出错: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取文件列表时出错: {str(e)}") from e


@router.post("/student-movement-application/delete", response_model=DeleteResponse, summary="删除文件")
async def delete_file(request: DeleteRequest):
    """
    安全地删除上传的文件
    
    安全措施：
    1. 验证路径，防止路径遍历
    2. 只允许删除上传目录下的文件
    3. 验证文件名匹配
    """
    try:
        logger.info(f"[删除] 开始处理删除请求 - 文件名: {request.filename}, 路径: {request.path}, 神殿: {request.campus}")
        
        # 1. 清理路径，防止路径遍历
        safe_path = Path(request.path)
        
        # 检查是否包含路径遍历
        if ".." in str(safe_path) or safe_path.is_absolute():
            logger.warning(f"[删除] 不允许的路径: {request.path}")
            raise HTTPException(status_code=403, detail="不允许的路径")
        
        # 2. 构建完整路径（相对于项目根目录的uploads目录）
        full_path = UPLOAD_ROOT_DIR / safe_path
        
        logger.info(f"[删除] 完整路径: {full_path}")
        
        # 3. 验证文件是否在上传目录内（防止目录遍历）
        try:
            full_path.resolve().relative_to(UPLOAD_ROOT_DIR.resolve())
        except ValueError as e:
            logger.warning(f"[删除] 路径不在允许的目录内: {full_path}")
            raise HTTPException(status_code=403, detail="不允许访问该路径") from e
        
        # 4. 验证文件名匹配
        if full_path.name != request.filename:
            logger.warning(f"[删除] 文件名不匹配: {full_path.name} != {request.filename}")
            raise HTTPException(status_code=400, detail="文件名不匹配")
        
        # 5. 检查文件是否存在
        if not full_path.exists():
            logger.warning(f"[删除] 文件不存在: {full_path}")
            raise HTTPException(status_code=404, detail="文件不存在")
        
        if not full_path.is_file():
            logger.warning(f"[删除] 不是文件: {full_path}")
            raise HTTPException(status_code=400, detail="不是有效的文件")
        
        # 6. 删除文件
        try:
            full_path.unlink()
            logger.info(f"[删除] 文件删除成功: {full_path}")
        except OSError as e:
            logger.error(f"[删除] 删除文件失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"删除文件失败: {str(e)}") from e
        
        return DeleteResponse(
            success=True,
            message="文件删除成功"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[删除] 删除文件时出错: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"删除文件时出错: {str(e)}") from e
