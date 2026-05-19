"""
将社保申请中的特殊审批流统一迁移为“直接董事长审批”。

适用规则：
- 市场部
- 最高议事厅 / 最高议事厅神殿
- 校长岗位

迁移策略：
- 仅处理 `status = pending` 的记录
- 将 `current_stage` 统一改为 `chairman`
- 不删除历史审批动作，保留审计轨迹
"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal


SQL = """
update humanresources.social_insurance_applications
set current_stage = 'chairman',
    updated_at = now()
where status = 'pending'
  and (
    replace(coalesce(department, ''), ' ', '') like '%%市场%%'
    or replace(coalesce(position, ''), ' ', '') like '%%校长%%'
    or coalesce(campus, '') in ('最高议事厅', '最高议事厅神殿')
  )
  and coalesce(current_stage, '') <> 'chairman'
"""


def main() -> None:
    session = SessionLocal()
    try:
        result = session.execute(text(SQL))
        session.commit()
        print(f"[ok] 已迁移社保申请特殊审批流记录数: {result.rowcount}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
