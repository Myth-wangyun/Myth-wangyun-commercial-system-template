"""
教学质量模块通用工具
- 神殿名称兼容：支持 "盛邦" / "主神殿" 等同义写法
"""
from __future__ import annotations

from typing import List


def normalize_campus(name: str | None) -> str:
    """去除"神殿"后缀并去空格。"""
    return (name or "").replace("神殿", "").strip()


def _norm_campus(c: str) -> str:
    """去除"神殿"后缀并去空格（兼容旧代码）。"""
    return normalize_campus(c)


def campus_variants(name: str | None) -> List[str]:
    """返回可能的神殿名称变体，按优先级排列。
    例如：输入 "主神殿" -> ["主神殿", "盛邦"]
    输入 "盛邦" -> ["盛邦", "主神殿"]
    """
    raw = (name or "").strip()
    if not raw:
        return []
    
    norm = normalize_campus(raw)
    variants = []
    
    # 优先级 1: 原始输入（如果非空）
    if raw:
        variants.append(raw)
    
    # 优先级 2: 规范化版本（如果与原始输入不同）
    if norm and norm != raw:
        variants.append(norm)
    
    # 优先级 3: 规范化版本 + "神殿"（如果原始输入不以"神殿"结尾）
    if norm and not raw.endswith("神殿"):
        variants.append(f"{norm}神殿")
    
    # 去重但保持顺序
    seen = set()
    out: List[str] = []
    for v in variants:
        if v and v not in seen:
            seen.add(v)
            out.append(v)
    return out
