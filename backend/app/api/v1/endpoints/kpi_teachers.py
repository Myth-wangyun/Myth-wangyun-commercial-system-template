"""
KPI 教师名单接口：读取/追加 frontend/data/kpi-teachers.json
"""

import json
import threading
from pathlib import Path
from typing import List

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[3]
TEACHER_FILE = BASE_DIR / "frontend" / "data" / "kpi-teachers.json"
_lock = threading.Lock()


class 教师项(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    role: str = Field("教员", max_length=50)


class 教师列表响应(BaseModel):
    teachers: List[教师项]


def _load_teachers() -> List[dict]:
    if not TEACHER_FILE.exists():
        return []
    with TEACHER_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_teachers(data: List[dict]) -> None:
    TEACHER_FILE.parent.mkdir(parents=True, exist_ok=True)
    with TEACHER_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@router.get("/", response_model=教师列表响应, summary="获取KPI教师列表")
async def list_kpi_teachers():
    data = _load_teachers()
    return 教师列表响应(teachers=[教师项(**item) for item in data])


@router.post("/", response_model=教师列表响应, summary="新增KPI教师")
async def add_kpi_teacher(item: 教师项 = Body(..., description="教师信息")):
    with _lock:
        data = _load_teachers()
        if any(t.get("name") == item.name for t in data):
            raise HTTPException(status_code=400, detail="该教师已存在")
        data.append(item.model_dump())
        _save_teachers(data)
    return 教师列表响应(teachers=[教师项(**t) for t in data])
