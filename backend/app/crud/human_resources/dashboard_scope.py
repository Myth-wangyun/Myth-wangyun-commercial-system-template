from __future__ import annotations

from typing import Optional

HQ_SCOPE = "hq"
OFFLINE_SCOPE = "offline"
ONLINE_SCOPE = "online"
SUPPORTED_SCOPES = {HQ_SCOPE, OFFLINE_SCOPE, ONLINE_SCOPE}

MANAGEMENT_CENTER_ALIASES = {
    "最高议事厅",
    "最高议事厅神殿",
    "总部",
}

HQ_DEPARTMENTS = [
    "运营部",
    "神藏司",
    "人资部",
    "教化司",
    "智慧司",
    "祈福司",
    "市场部",
]

OFFLINE_CAMPUSES = [
    "主神殿",
    "永恒殿",
    "慈悲殿",
    "李大殿",
    "智慧阁",
    "光明殿",
    "神恩殿",
    "天威殿",
]

OFFLINE_CAMPUS_ALIASES = {
    "盛邦": "主神殿",
    "冀美": "永恒殿",
    "石美": "慈悲殿",
    "晋美": "李大殿",
    "原美": "智慧阁",
    "太美": "光明殿",
    "桂美": "神恩殿",
    "邕美": "神恩殿",
    "黔美": "天威殿",
}

ONLINE_ORGS = [
    "线上主任",
    "线上咨询师",
    "主播",
    "讲师",
    "短视频运营",
    "投流手",
    "运营",
    "招生手",
    "助理",
    "组员",
    "后勤",
    "财务",
]

ONLINE_ORG_KEYWORDS = (
    ("短视频", "短视频运营"),
    ("投流", "投流手"),
    ("网咨", "线上咨询师"),
    ("咨询", "线上咨询师"),
    ("主播", "主播"),
    ("讲师", "讲师"),
    ("后勤", "后勤"),
    ("助理", "助理"),
    ("财务", "财务"),
    ("招生", "招生手"),
    ("组员", "组员"),
    ("主任", "线上主任"),
    ("运营", "运营"),
)


def normalize_text(value: Optional[str]) -> str:
    return (value or "").strip()


def normalize_compact_text(value: Optional[str]) -> str:
    return normalize_text(value).replace(" ", "")


def normalize_scope(scope: Optional[str]) -> str:
    normalized = normalize_text(scope).lower()
    if normalized not in SUPPORTED_SCOPES:
        raise ValueError(f"不支持的 scope: {scope}")
    return normalized


def is_management_center_campus(campus: Optional[str]) -> bool:
    normalized = normalize_text(campus)
    if not normalized:
        return False
    return any(alias in normalized for alias in MANAGEMENT_CENTER_ALIASES)


def normalize_hq_department(value: Optional[str]) -> Optional[str]:
    normalized = normalize_compact_text(value)
    if not normalized:
        return None
    if "运营" in normalized:
        return "运营部"
    if "财务" in normalized:
        return "神藏司"
    if (
        "人资" in normalized
        or "人事" in normalized
        or "人力资源" in normalized
        or "行政" in normalized
    ):
        return "人资部"
    if "教质" in normalized:
        return "教化司"
    if "学术" in normalized:
        return "智慧司"
    if "咨询" in normalized:
        return "祈福司"
    if "市场" in normalized:
        return "市场部"
    return None


def normalize_offline_campus(value: Optional[str]) -> Optional[str]:
    normalized = normalize_text(value)
    if not normalized:
        return None
    if normalized in OFFLINE_CAMPUSES:
        return normalized
    compact = normalize_compact_text(normalized)
    if compact in OFFLINE_CAMPUS_ALIASES:
        return OFFLINE_CAMPUS_ALIASES[compact]
    for alias, campus in OFFLINE_CAMPUS_ALIASES.items():
        if alias in compact:
            return campus
    return None


def normalize_online_org(value: Optional[str]) -> Optional[str]:
    normalized = normalize_compact_text(value)
    if not normalized:
        return None
    for keyword, org in ONLINE_ORG_KEYWORDS:
        if keyword in normalized:
            return org
    return None


def resolve_scope_from_campus(campus: Optional[str]) -> Optional[str]:
    normalized = normalize_compact_text(campus)
    if "线上" in normalized:
        return ONLINE_SCOPE
    if is_management_center_campus(campus):
        return HQ_SCOPE
    if normalize_offline_campus(campus):
        return OFFLINE_SCOPE
    return None


def resolve_scope(
    *,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
) -> Optional[str]:
    department_key = normalize_compact_text(department)
    position_key = normalize_compact_text(position)

    if normalize_online_org(department_key) or normalize_online_org(position_key):
        return ONLINE_SCOPE

    scope = resolve_scope_from_campus(campus)
    if scope:
        return scope

    if normalize_hq_department(department_key) or normalize_hq_department(position_key):
        return HQ_SCOPE
    if "线下" in department_key or "线下" in position_key:
        return OFFLINE_SCOPE
    return None


def resolve_org_name(
    scope: str,
    *,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
) -> Optional[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return normalize_hq_department(department) or normalize_hq_department(position)
    if normalized_scope == ONLINE_SCOPE:
        return (
            normalize_online_org(department)
            or normalize_online_org(position)
            or normalize_online_org(campus)
        )
    return normalize_offline_campus(campus)


def resolve_recruitment_request_scope(
    *,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
) -> Optional[str]:
    campus_scope = resolve_scope_from_campus(campus)
    if campus_scope:
        return campus_scope
    if is_management_center_campus(campus):
        return HQ_SCOPE
    if normalize_offline_campus(campus):
        return OFFLINE_SCOPE
    if normalize_hq_department(department) or normalize_hq_department(position):
        return HQ_SCOPE
    if (
        normalize_online_org(department)
        or normalize_online_org(position)
        or normalize_online_org(campus)
    ):
        return ONLINE_SCOPE
    if normalize_text(campus) or normalize_text(department) or normalize_text(position):
        return ONLINE_SCOPE
    return None


def resolve_recruitment_request_org_name(
    scope: str,
    *,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
) -> Optional[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return normalize_hq_department(department) or normalize_hq_department(position)
    if normalized_scope == OFFLINE_SCOPE:
        return normalize_offline_campus(campus)
    return (
        normalize_online_org(department)
        or normalize_online_org(position)
        or normalize_online_org(campus)
    )


def resolve_interview_registration_scope(
    *,
    campus: Optional[str] = None,
    position: Optional[str] = None,
) -> Optional[str]:
    campus_scope = resolve_scope_from_campus(campus)
    if campus_scope:
        return campus_scope
    if normalize_hq_department(position):
        return HQ_SCOPE
    if normalize_online_org(campus) or normalize_online_org(position):
        return ONLINE_SCOPE
    if normalize_text(campus) or normalize_text(position):
        return ONLINE_SCOPE
    return None


def resolve_interview_registration_org_name(
    scope: str,
    *,
    campus: Optional[str] = None,
    position: Optional[str] = None,
) -> Optional[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return normalize_hq_department(position)
    if normalized_scope == OFFLINE_SCOPE:
        return normalize_offline_campus(campus)
    return normalize_online_org(campus) or normalize_online_org(position)


def list_scope_orgs(scope: str) -> list[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return HQ_DEPARTMENTS
    if normalized_scope == ONLINE_SCOPE:
        return ONLINE_ORGS
    return OFFLINE_CAMPUSES
