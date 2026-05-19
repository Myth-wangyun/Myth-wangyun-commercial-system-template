from __future__ import annotations

import json
from typing import Iterable, Mapping, Optional


def normalize_selected_approver_map(
    value: Optional[Mapping[str, object]],
    allowed_stages: Iterable[str],
) -> dict[str, list[int]]:
    allowed_stage_set = set(allowed_stages)
    if not value:
        return {}

    result: dict[str, list[int]] = {}
    for stage, raw_user_ids in value.items():
        if stage not in allowed_stage_set:
            continue

        if isinstance(raw_user_ids, list):
            values = raw_user_ids
        elif raw_user_ids is None:
            values = []
        else:
            values = [raw_user_ids]

        stage_user_ids: list[int] = []
        seen_user_ids: set[int] = set()
        for item in values:
            try:
                user_id = int(item)
            except (TypeError, ValueError):
                continue
            if user_id <= 0 or user_id in seen_user_ids:
                continue
            seen_user_ids.add(user_id)
            stage_user_ids.append(user_id)

        if stage_user_ids:
            result[stage] = stage_user_ids

    return result


def parse_selected_approver_map(
    raw_value: Optional[str],
    allowed_stages: Iterable[str],
) -> dict[str, list[int]]:
    if not raw_value:
        return {}
    try:
        loaded = json.loads(raw_value)
    except (TypeError, ValueError, json.JSONDecodeError):
        return {}
    if not isinstance(loaded, dict):
        return {}
    return normalize_selected_approver_map(loaded, allowed_stages)


def dump_selected_approver_map(
    value: Optional[Mapping[str, object]],
    allowed_stages: Iterable[str],
) -> Optional[str]:
    normalized = normalize_selected_approver_map(value, allowed_stages)
    if not normalized:
        return None
    return json.dumps(normalized, ensure_ascii=False, sort_keys=True)
