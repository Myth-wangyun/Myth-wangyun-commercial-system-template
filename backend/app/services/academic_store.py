from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import List, Optional, TypedDict, cast

from ..schemas.academic_dashboard import (
    CampusCoreSummary,
    CampusEmploymentAggregate,
    CampusEmploymentGoalsResult,
    ClassEmploymentSummaryRecord,
)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "academic_store.json"


JsonObject = dict[str, object]


class EmploymentGoalsBucket(TypedDict):
    records: list[JsonObject]
    updatedAt: str


class AcademicStorePayload(TypedDict):
    coreSummaries: list[JsonObject]
    employmentGoals: dict[str, EmploymentGoalsBucket]
    classEmploymentSummary: list[JsonObject]


def _coerce_object(value: object) -> JsonObject | None:
    if isinstance(value, dict):
        return cast(JsonObject, value)
    return None


def _coerce_object_list(value: object) -> list[JsonObject]:
    if not isinstance(value, list):
        return []
    items: list[JsonObject] = []
    for item in value:
        normalized = _coerce_object(item)
        if normalized is not None:
            items.append(normalized)
    return items


def _coerce_employment_goals(value: object) -> dict[str, EmploymentGoalsBucket]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, EmploymentGoalsBucket] = {}
    for key, bucket in value.items():
        if not isinstance(key, str):
            continue
        bucket_dict = _coerce_object(bucket)
        if bucket_dict is None:
            continue
        updated_at = bucket_dict.get("updatedAt")
        normalized[key] = {
            "records": _coerce_object_list(bucket_dict.get("records")),
            "updatedAt": updated_at if isinstance(updated_at, str) else "",
        }
    return normalized


def _default_payload() -> AcademicStorePayload:
    return {
        "coreSummaries": [],
        "employmentGoals": {},
        "classEmploymentSummary": [],
    }


class AcademicStore:
    """简易 JSON 数据存储，替代浏览器 localStorage。"""

    def __init__(self) -> None:
        self._path = DATA_FILE
        self._lock = RLock()
        if not self._path.exists():
            self._save(_default_payload())

    # ------------- 基础IO -------------
    def _load(self) -> AcademicStorePayload:
        with self._lock:
            try:
                raw = json.loads(self._path.read_text(encoding="utf-8"))
                if not isinstance(raw, dict):
                    raise ValueError("unexpected payload")
                return {
                    "coreSummaries": _coerce_object_list(raw.get("coreSummaries")),
                    "employmentGoals": _coerce_employment_goals(raw.get("employmentGoals")),
                    "classEmploymentSummary": _coerce_object_list(
                        raw.get("classEmploymentSummary")
                    ),
                }
            except Exception:
                payload = _default_payload()
                self._save(payload)
                return payload

    def _save(self, data: AcademicStorePayload) -> None:
        with self._lock:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------- 核心数据 -------------
    def list_core_summaries(self) -> List[CampusCoreSummary]:
        payload = self._load()
        return [
            CampusCoreSummary.model_validate(item)
            for item in payload.get("coreSummaries", [])
        ]

    def replace_core_summaries(self, records: List[CampusCoreSummary]) -> List[CampusCoreSummary]:
        data = self._load()
        data["coreSummaries"] = [record.model_dump() for record in records]
        self._save(data)
        return self.list_core_summaries()

    def upsert_core_summary(self, record: CampusCoreSummary) -> CampusCoreSummary:
        normalized = record.campus
        stamped = record.model_copy(
            update={"updatedAt": record.updatedAt or datetime.now(timezone.utc)}
        )
        others = [item for item in self.list_core_summaries() if item.campus != normalized]
        others.append(stamped)
        self.replace_core_summaries(others)
        return stamped

    # ------------- 就业目标与结果 -------------
    def list_employment_goals(self, campus: str) -> List[CampusEmploymentGoalsResult]:
        payload = self._load()
        campus_key = campus.replace("神殿", "").strip()
        campus_payload: EmploymentGoalsBucket = payload["employmentGoals"].get(
            campus_key,
            {"records": [], "updatedAt": ""},
        )
        records = campus_payload.get("records", [])
        return [
            CampusEmploymentGoalsResult.model_validate({**item, "campus": campus_key})
            for item in records
        ]

    def replace_employment_goals(
        self, campus: str, records: List[CampusEmploymentGoalsResult]
    ) -> List[CampusEmploymentGoalsResult]:
        data = self._load()
        campus_key = campus.replace("神殿", "").strip()
        employment_goals = data.setdefault("employmentGoals", {})
        employment_goals[campus_key] = {
            "records": [record.model_dump() for record in records],
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        self._save(data)
        return self.list_employment_goals(campus_key)

    def clear_employment_goals(self, campus: str) -> None:
        data = self._load()
        campus_key = campus.replace("神殿", "").strip()
        employment_goals = data.setdefault("employmentGoals", {})
        employment_goals.pop(campus_key, None)
        self._save(data)

    def aggregate_employment_goals(self) -> List[CampusEmploymentAggregate]:
        payload = self._load()
        employment_goals = payload.get("employmentGoals", {})
        aggregates: List[CampusEmploymentAggregate] = []

        for campus, content in employment_goals.items():
            records = [
                CampusEmploymentGoalsResult.model_validate({**item, "campus": campus})
                for item in content.get("records", [])
            ]
            if not records:
                continue

            class_count = 0
            archive_count = 0
            target_emp = 0
            actual_emp = 0
            salary_over_10k = 0
            target_salary_sum = actual_salary_sum = attainment_sum = employment_rate_sum = 0.0
            target_salary_cnt = actual_salary_cnt = attainment_cnt = employment_rate_cnt = 0

            for record in records:
                if record.className:
                    class_count += 1
                archive_count += record.employmentRate.fileCount
                target_emp += record.employmentRate.targetEmploymentCount
                actual_emp += record.employmentRate.actualEmploymentCount
                salary_over_10k += record.salaryOverTenThousand

                if record.salaryAttainment.targetAverageSalary > 0:
                    target_salary_sum += record.salaryAttainment.targetAverageSalary
                    target_salary_cnt += 1
                if record.salaryAttainment.actualAverageSalary > 0:
                    actual_salary_sum += record.salaryAttainment.actualAverageSalary
                    actual_salary_cnt += 1
                if record.salaryAttainment.attainmentRate > 0:
                    attainment_sum += record.salaryAttainment.attainmentRate
                    attainment_cnt += 1
                if record.employmentRate.employmentRate > 0:
                    employment_rate_sum += record.employmentRate.employmentRate
                    employment_rate_cnt += 1

            aggregates.append(
                CampusEmploymentAggregate(
                    campus=campus,
                    classCount=class_count,
                    archiveCount=archive_count,
                    targetEmploymentCount=target_emp,
                    actualEmploymentCount=actual_emp,
                    targetAvgSalary=(
                        (target_salary_sum / target_salary_cnt)
                        if target_salary_cnt
                        else None
                    ),
                    actualAvgSalary=(
                        (actual_salary_sum / actual_salary_cnt)
                        if actual_salary_cnt
                        else None
                    ),
                    attainmentRate=(attainment_sum / attainment_cnt) if attainment_cnt else None,
                    employmentRate=(
                        (employment_rate_sum / employment_rate_cnt)
                        if employment_rate_cnt
                        else None
                    ),
                    salaryOver10kCount=salary_over_10k,
                )
            )

        return aggregates

    # ------------- 班级就业总结 -------------
    def list_class_employment_summary(
        self, campus: Optional[str] = None, class_code: Optional[str] = None
    ) -> List[ClassEmploymentSummaryRecord]:
        payload = self._load()
        records = [
            ClassEmploymentSummaryRecord.model_validate(item)
            for item in payload.get("classEmploymentSummary", [])
        ]
        if campus:
            normalized = campus.replace("神殿", "").strip()
            records = [item for item in records if item.campus == normalized]
        if class_code:
            records = [item for item in records if item.classCode == class_code]
        return records

    def upsert_class_employment_summary(
        self, record: ClassEmploymentSummaryRecord
    ) -> ClassEmploymentSummaryRecord:
        payload = self._load()
        items = payload.get("classEmploymentSummary", [])
        key = (record.campus, record.classCode, record.year, record.month)
        updated = False
        for idx, item in enumerate(items):
            current = ClassEmploymentSummaryRecord.model_validate(item)
            current_key = (current.campus, current.classCode, current.year, current.month)
            if current_key == key:
                items[idx] = record.model_dump()
                updated = True
                break
        if not updated:
            items.append(record.model_dump())
        payload["classEmploymentSummary"] = items
        self._save(payload)
        return record

    def delete_class_employment_summary(
        self, campus: Optional[str] = None, class_code: Optional[str] = None
    ) -> int:
        payload = self._load()
        items = payload.get("classEmploymentSummary", [])
        before = len(items)
        normalized_campus = campus.replace("神殿", "").strip() if campus else None

        def should_delete(item: JsonObject) -> bool:
            if normalized_campus and item.get("campus") != normalized_campus:
                return False
            if class_code and item.get("classCode") != class_code:
                return False
            return True

        filtered = [item for item in items if not should_delete(item)]
        payload["classEmploymentSummary"] = filtered
        self._save(payload)
        return before - len(filtered)


academic_store = AcademicStore()
