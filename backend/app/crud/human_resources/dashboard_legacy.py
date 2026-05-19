from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import Date, Table, and_, cast, false, func, or_, tuple_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources import training_satisfaction as training_satisfaction_crud
from app.crud.human_resources.dashboard_scope import (
    HQ_DEPARTMENTS,
    HQ_SCOPE,
    OFFLINE_SCOPE,
    ONLINE_SCOPE,
    is_management_center_campus,
    list_scope_orgs,
    normalize_compact_text,
    normalize_hq_department,
    normalize_offline_campus,
    normalize_online_org,
    normalize_scope,
    normalize_text,
    resolve_interview_registration_org_name,
    resolve_interview_registration_scope,
    resolve_recruitment_request_org_name,
    resolve_recruitment_request_scope,
    resolve_org_name,
    resolve_scope,
    resolve_scope_from_campus,
)
from app.models.human_resources import (
    DashboardDailyAggregate,
    DashboardManualRecruitmentDaily,
    DashboardMonthlyAggregate,
    DashboardYearlyAggregate,
    EmployeeProfile,
    EmployeeArchiveSnapshot,
    InterviewRegistration,
    PerformanceFact,
    RecruitmentRequest,
    RegularizationApplication,
    ResignationApproval,
    SalaryWelfareFact,
    SocialInsuranceApplication,
    SocialInsuranceCostSummary,
    TrainingApplication,
    TrainingResult,
    TrainingSatisfactionSurvey,
    TransferApplication,
    UnpaidLeaveApplication,
)
from app.models.user import User
from app.schemas.human_resources.dashboard import (
    DashboardManualRecruitmentDailyUpsert,
    PerformanceFactCreate,
    PerformanceFactUpdate,
    SalaryWelfareFactCreate,
    SalaryWelfareFactUpdate,
)


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _training_satisfaction_total_score(record: TrainingSatisfactionSurvey) -> float:
    return float(training_satisfaction_crud.get_record_totals(record)[3])


def _serialize_names(names: list[str]) -> str:
    return json.dumps(_unique_names(names), ensure_ascii=False)


def _deserialize_names(raw: Optional[str]) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(value, list):
        return []
    return _unique_names([item for item in value if isinstance(item, str)])


def _list_training_results_in_range(
    db: Session, start_date: date, end_date: date
) -> list[TrainingResult]:
    return (
        db.query(TrainingResult)
        .filter(
            TrainingResult.training_date.is_not(None),
            TrainingResult.training_date >= start_date,
            TrainingResult.training_date <= end_date,
        )
        .all()
    )


def _list_training_satisfaction_in_range(
    db: Session, start_date: date, end_date: date
) -> list[TrainingSatisfactionSurvey]:
    return (
        db.query(TrainingSatisfactionSurvey)
        .filter(
            TrainingSatisfactionSurvey.training_date.is_not(None),
            TrainingSatisfactionSurvey.training_date >= start_date,
            TrainingSatisfactionSurvey.training_date <= end_date,
        )
        .all()
    )


def _list_training_applications_in_range(
    db: Session, start_date: date, end_date: date
) -> list[TrainingApplication]:
    return (
        db.query(TrainingApplication)
        .filter(
            TrainingApplication.start_date.is_not(None),
            TrainingApplication.start_date >= start_date,
            TrainingApplication.start_date <= end_date,
        )
        .all()
    )


def _unique_names(names: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for raw in names:
        normalized = normalize_text(raw)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def _month_start(month: str) -> date:
    return datetime.strptime(f"{month}-01", "%Y-%m-%d").date()


def _month_end(month: str) -> date:
    start = _month_start(month)
    if start.month == 12:
        next_month = date(start.year + 1, 1, 1)
    else:
        next_month = date(start.year, start.month + 1, 1)
    return next_month - timedelta(days=1)


def _year_months(year: str) -> list[str]:
    return [f"{year}-{month:02d}" for month in range(1, 13)]


def _month_key(value: date) -> str:
    return value.strftime("%Y-%m")


def _normalize_period_to_month_key(value: Optional[str]) -> Optional[str]:
    normalized = normalize_text(value)
    if not normalized:
        return None
    normalized = normalized.replace("-", ".")
    try:
        parsed = datetime.strptime(f"{normalized}.1", "%Y.%m.%d").date()
    except ValueError:
        return None
    return parsed.strftime("%Y-%m")


def _safe_percent(numerator: float, denominator: float, digits: int = 1) -> str:
    if denominator <= 0:
        return "-"
    return f"{(numerator / denominator * 100):.{digits}f}%"


def _round(value: float, digits: int = 2) -> float:
    return round(value, digits)


def _normalize_scope_org_name(scope: str, value: Optional[str]) -> Optional[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return normalize_hq_department(value)
    if normalized_scope == "online":
        return normalize_online_org(value)
    return normalize_offline_campus(value)


INSURANCE_HQ_BUCKET = "集团总部"
INSURANCE_ONLINE_BUCKET = "线上事业部"
INSURANCE_PENSION_COMPANY_RATE = 0.16
INSURANCE_PENSION_PERSONAL_RATE = 0.08
INSURANCE_UNEMPLOYMENT_COMPANY_RATE = 0.007
INSURANCE_UNEMPLOYMENT_PERSONAL_RATE = 0.003
INSURANCE_MEDICAL_COMPANY_RATE = 0.075
INSURANCE_MEDICAL_PERSONAL_RATE = 0.02


def _insurance_orgs_for_scope(scope: str) -> list[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return [INSURANCE_HQ_BUCKET]
    if normalized_scope == ONLINE_SCOPE:
        return [INSURANCE_ONLINE_BUCKET]
    return [org for org in list_scope_orgs(normalized_scope) if org is not None]


def _resolve_insurance_org_name(
    scope: str,
    *,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    unit_name: Optional[str] = None,
) -> Optional[str]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        return INSURANCE_HQ_BUCKET
    if normalized_scope == ONLINE_SCOPE:
        return INSURANCE_ONLINE_BUCKET
    return (
        normalize_offline_campus(campus)
        or normalize_offline_campus(unit_name)
        or normalize_offline_campus(department)
    )


def _bucket_snapshot_counts_for_insurance(
    scope: str,
    counts: dict[str, dict[str, Any]],
) -> dict[str, dict[str, int]]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == OFFLINE_SCOPE:
        result: dict[str, dict[str, int]] = {}
        for org in _insurance_orgs_for_scope(normalized_scope):
            source = counts.get(org, {})
            result[org] = {
                "headcount": int(source.get("headcount", 0)),
                "insured_count": int(source.get("insured_count", 0)),
                "should_insure_count": int(source.get("should_insure_count", 0)),
            }
        return result

    target_org = _resolve_insurance_org_name(normalized_scope)
    if not target_org:
        return {}
    return {
        target_org: {
            "headcount": sum(int(item.get("headcount", 0)) for item in counts.values()),
            "insured_count": sum(
                int(item.get("insured_count", 0)) for item in counts.values()
            ),
            "should_insure_count": sum(
                int(item.get("should_insure_count", 0)) for item in counts.values()
            ),
        }
    }


def _parse_social_insurance_summary_employees(raw: Optional[str]) -> list[dict[str, Any]]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(value, list):
        return []
    employees: list[dict[str, Any]] = []
    for item in value:
        if isinstance(item, dict):
            employees.append(item)
    return employees


def _employee_social_insurance_payment_base(employee: dict[str, Any]) -> float:
    return max(
        _to_float(employee.get("injury_base")),
        _to_float(employee.get("pension_base")),
        _to_float(employee.get("unemployment_base")),
        _to_float(employee.get("medical_base")),
    )


def _build_insurance_employee_master_index(
    db: Session,
    summaries: list[SocialInsuranceCostSummary],
) -> dict[str, list[dict[str, Optional[str]]]]:
    names = _unique_names(
        [
            normalize_text(employee.get("name"))
            for summary in summaries
            for employee in _parse_social_insurance_summary_employees(summary.employees_json)
            if normalize_text(employee.get("name"))
        ]
    )
    if not names:
        return {}

    result: dict[str, list[dict[str, Optional[str]]]] = defaultdict(list)
    seen: dict[str, set[tuple[str, str, str]]] = defaultdict(set)

    profile_rows = (
        db.query(EmployeeProfile, User)
        .outerjoin(User, EmployeeProfile.user_id == User.user_id)
        .filter(EmployeeProfile.name.in_(names))
        .all()
    )
    for profile, user in profile_rows:
        name = normalize_text(profile.name)
        department = normalize_text(
            profile.department if profile.department else user.department if user else None
        )
        position = normalize_text(
            profile.position if profile.position else user.position if user else None
        )
        campus = normalize_text(
            profile.campus_name if profile.campus_name else user.campus if user else None
        )
        dedupe_key = (department, position, campus)
        if dedupe_key in seen[name]:
            continue
        seen[name].add(dedupe_key)
        result[name].append(
            {
                "department": department or None,
                "position": position or None,
                "campus": campus or None,
            }
        )

    user_rows = db.query(User).filter(User.real_name.in_(names)).all()
    for user in user_rows:
        name = normalize_text(user.real_name)
        department = normalize_text(user.department)
        position = normalize_text(user.position)
        campus = normalize_text(user.campus)
        dedupe_key = (department, position, campus)
        if dedupe_key in seen[name]:
            continue
        seen[name].add(dedupe_key)
        result[name].append(
            {
                "department": department or None,
                "position": position or None,
                "campus": campus or None,
            }
        )
    return result


def _pick_insurance_employee_master_candidate(
    employee_name: Optional[str],
    preferred_campus: Optional[str],
    employee_index: dict[str, list[dict[str, Optional[str]]]],
) -> Optional[dict[str, Optional[str]]]:
    normalized_name = normalize_text(employee_name)
    candidates = employee_index.get(normalized_name, [])
    if not candidates:
        return None

    preferred_campus_key = normalize_compact_text(preferred_campus)
    preferred_scope = resolve_scope_from_campus(preferred_campus)

    def candidate_rank(candidate: dict[str, Optional[str]]) -> tuple[int, int, int]:
        candidate_campus = normalize_compact_text(candidate.get("campus"))
        candidate_scope = resolve_scope(
            campus=candidate.get("campus"),
            department=candidate.get("department"),
            position=candidate.get("position"),
        )
        return (
            1 if preferred_campus_key and candidate_campus == preferred_campus_key else 0,
            1 if preferred_scope and candidate_scope == preferred_scope else 0,
            1 if candidate.get("department") or candidate.get("position") else 0,
        )

    return max(candidates, key=candidate_rank)


def _resolve_summary_employee_scope_and_org(
    *,
    scope: str,
    summary: SocialInsuranceCostSummary,
    employee: dict[str, Any],
    employee_index: dict[str, list[dict[str, Optional[str]]]],
) -> tuple[Optional[str], Optional[str]]:
    candidate = _pick_insurance_employee_master_candidate(
        employee.get("name"),
        summary.campus,
        employee_index,
    )
    candidate_campus = candidate.get("campus") if candidate else None
    candidate_department = candidate.get("department") if candidate else None
    candidate_position = candidate.get("position") if candidate else None

    resolved_scope = (
        resolve_scope(
            campus=candidate_campus or summary.campus,
            department=candidate_department,
            position=candidate_position,
        )
        or resolve_scope(campus=summary.campus)
        or ONLINE_SCOPE
    )
    if normalize_scope(resolved_scope) != normalize_scope(scope):
        return None, None

    resolved_org = _resolve_insurance_org_name(
        scope,
        campus=candidate_campus or summary.campus,
        department=candidate_department,
        unit_name=summary.unit_name,
    )
    return resolved_scope, resolved_org


def _build_social_insurance_cost_summary_employee_metrics(
    employee: dict[str, Any],
    injury_enterprise_rate: float,
) -> dict[str, float]:
    injury_rate_decimal = _to_float(injury_enterprise_rate) / 100
    payment_base = _employee_social_insurance_payment_base(employee)
    injury_company = _round(
        _to_float(employee.get("injury_base")) * injury_rate_decimal,
        2,
    )
    pension_company = _round(
        _to_float(employee.get("pension_base")) * INSURANCE_PENSION_COMPANY_RATE,
        2,
    )
    pension_personal = _round(
        _to_float(employee.get("pension_base")) * INSURANCE_PENSION_PERSONAL_RATE,
        2,
    )
    unemployment_company = _round(
        _to_float(employee.get("unemployment_base"))
        * INSURANCE_UNEMPLOYMENT_COMPANY_RATE,
        2,
    )
    unemployment_personal = _round(
        _to_float(employee.get("unemployment_base"))
        * INSURANCE_UNEMPLOYMENT_PERSONAL_RATE,
        2,
    )
    medical_company = _round(
        _to_float(employee.get("medical_base")) * INSURANCE_MEDICAL_COMPANY_RATE,
        2,
    )
    medical_personal = _round(
        _to_float(employee.get("medical_base")) * INSURANCE_MEDICAL_PERSONAL_RATE,
        2,
    )
    company_total_payment = (
        injury_company + pension_company + unemployment_company + medical_company
    )
    personal_total_payment = (
        pension_personal + unemployment_personal + medical_personal
    )
    total_payment = company_total_payment + personal_total_payment
    return {
        "summaryActualInsureCount": 1.0,
        "summaryTotalPayment": _round(total_payment, 2),
        "summaryCompanyTotalPayment": _round(company_total_payment, 2),
        "summaryPersonalTotalPayment": _round(personal_total_payment, 2),
        "summaryServiceFeeTotal": _round(_to_float(employee.get("service_fee")), 2),
        "summaryPaymentBase": _round(payment_base, 2),
        "summaryInjuryCompanyRate": _round(injury_company, 2),
        "summaryPensionCompanyRate": _round(pension_company, 2),
        "summaryPensionPersonalRate": _round(pension_personal, 2),
        "summaryUnemploymentCompanyRate": _round(unemployment_company, 2),
        "summaryUnemploymentPersonalRate": _round(unemployment_personal, 2),
        "summaryMedicalCompanyRate": _round(medical_company, 2),
        "summaryMedicalPersonalRate": _round(medical_personal, 2),
    }


def _insurance_metric_payload(
    *,
    should_count: float = 0.0,
    actual_count: float = 0.0,
    total_payment: float = 0.0,
    company_payment: float = 0.0,
    personal_payment: float = 0.0,
    service_fee: float = 0.0,
    payment_base: float = 0.0,
    injury_company: float = 0.0,
    pension_company: float = 0.0,
    pension_personal: float = 0.0,
    unemployment_company: float = 0.0,
    unemployment_personal: float = 0.0,
    medical_company: float = 0.0,
    medical_personal: float = 0.0,
) -> dict[str, Any]:
    payload = _social_metric_payload(
        should_count=should_count,
        actual_count=actual_count,
        payment_base=payment_base,
    )
    if total_payment:
        payload["totalPayment"] = _round(total_payment, 2)
    if company_payment:
        payload["companyTotalPayment"] = _round(company_payment, 2)
    if personal_payment:
        payload["personalTotalPayment"] = _round(personal_payment, 2)
    if service_fee:
        payload["serviceFeeTotal"] = _round(service_fee, 2)
    if injury_company:
        payload["injuryCompanyRate"] = _round(injury_company, 2)
    if pension_company:
        payload["pensionCompanyRate"] = _round(pension_company, 2)
    if pension_personal:
        payload["pensionPersonalRate"] = _round(pension_personal, 2)
    if unemployment_company:
        payload["unemploymentCompanyRate"] = _round(unemployment_company, 2)
    if unemployment_personal:
        payload["unemploymentPersonalRate"] = _round(unemployment_personal, 2)
    if medical_company:
        payload["medicalCompanyRate"] = _round(medical_company, 2)
    if medical_personal:
        payload["medicalPersonalRate"] = _round(medical_personal, 2)

    payload["companyPayment"] = payload.get("companyTotalPayment", 0.0)
    payload["personalPayment"] = payload.get("personalTotalPayment", 0.0)
    payload["serviceFee"] = payload.get("serviceFeeTotal", 0.0)
    payload["insurancePayTotal"] = payload.get("totalPayment", 0.0)
    return payload


def _insurance_metric_payload_from_items(
    items: list[dict[str, Any]],
) -> dict[str, Any]:
    return _insurance_metric_payload(
        should_count=sum(_to_float(item.get("shouldInsureCount")) for item in items),
        actual_count=sum(_to_float(item.get("actualInsureCount")) for item in items),
        total_payment=sum(
            _to_float(
                item.get("totalPayment")
                if item.get("totalPayment") is not None
                else item.get("insurancePayTotal")
            )
            for item in items
        ),
        company_payment=sum(
            _to_float(
                item.get("companyTotalPayment")
                if item.get("companyTotalPayment") is not None
                else item.get("companyPayment")
            )
            for item in items
        ),
        personal_payment=sum(
            _to_float(
                item.get("personalTotalPayment")
                if item.get("personalTotalPayment") is not None
                else item.get("personalPayment")
            )
            for item in items
        ),
        service_fee=sum(
            _to_float(
                item.get("serviceFeeTotal")
                if item.get("serviceFeeTotal") is not None
                else item.get("serviceFee")
            )
            for item in items
        ),
        payment_base=sum(_to_float(item.get("paymentBase")) for item in items),
        injury_company=sum(_to_float(item.get("injuryCompanyRate")) for item in items),
        pension_company=sum(_to_float(item.get("pensionCompanyRate")) for item in items),
        pension_personal=sum(_to_float(item.get("pensionPersonalRate")) for item in items),
        unemployment_company=sum(
            _to_float(item.get("unemploymentCompanyRate")) for item in items
        ),
        unemployment_personal=sum(
            _to_float(item.get("unemploymentPersonalRate")) for item in items
        ),
        medical_company=sum(_to_float(item.get("medicalCompanyRate")) for item in items),
        medical_personal=sum(_to_float(item.get("medicalPersonalRate")) for item in items),
    )


def _build_monthly_insurance_item_payload(item: dict[str, Any]) -> dict[str, Any]:
    summary_present = bool(item.get("summaryRecordCount"))
    if summary_present:
        return _insurance_metric_payload(
            should_count=_to_float(item.get("shouldInsureCount")),
            actual_count=_to_float(item.get("summaryActualInsureCount")),
            total_payment=_to_float(item.get("summaryTotalPayment")),
            company_payment=_to_float(item.get("summaryCompanyTotalPayment")),
            personal_payment=_to_float(item.get("summaryPersonalTotalPayment")),
            service_fee=_to_float(item.get("summaryServiceFeeTotal")),
            payment_base=_to_float(item.get("summaryPaymentBase")),
            injury_company=_to_float(item.get("summaryInjuryCompanyRate")),
            pension_company=_to_float(item.get("summaryPensionCompanyRate")),
            pension_personal=_to_float(item.get("summaryPensionPersonalRate")),
            unemployment_company=_to_float(item.get("summaryUnemploymentCompanyRate")),
            unemployment_personal=_to_float(item.get("summaryUnemploymentPersonalRate")),
            medical_company=_to_float(item.get("summaryMedicalCompanyRate")),
            medical_personal=_to_float(item.get("summaryMedicalPersonalRate")),
        )

    return _insurance_metric_payload(
        should_count=_to_float(item.get("shouldInsureCount")),
        actual_count=_to_float(item.get("actualInsureCount")),
        payment_base=_to_float(item.get("applicationPaymentBase")),
    )


def _social_metric_payload(
    *,
    should_count: float = 0,
    actual_count: float = 0,
    payment_base: float = 0.0,
    person_name: str = "",
) -> dict[str, Any]:
    base = _round(payment_base, 2)
    injury_company = _round(base * 0.005, 2)
    pension_company = _round(base * 0.16, 2)
    pension_personal = _round(base * 0.08, 2)
    unemployment_company = _round(base * 0.007, 2)
    unemployment_personal = _round(base * 0.003, 2)
    medical_company = _round(base * 0.075, 2)
    medical_personal = _round(base * 0.02, 2)
    company_total = _round(
        injury_company + pension_company + unemployment_company + medical_company,
        2,
    )
    personal_total = _round(
        pension_personal + unemployment_personal + medical_personal,
        2,
    )
    return {
        "shouldInsureCount": int(should_count),
        "actualInsureCount": int(actual_count),
        "insureRate": _safe_percent(actual_count, should_count),
        "personName": person_name,
        "totalPayment": _round(company_total + personal_total, 2),
        "companyTotalPayment": company_total,
        "personalTotalPayment": personal_total,
        "serviceFeeTotal": 0.0,
        "paymentBase": base,
        "injuryCompanyRate": injury_company,
        "pensionCompanyRate": pension_company,
        "pensionPersonalRate": pension_personal,
        "unemploymentCompanyRate": unemployment_company,
        "unemploymentPersonalRate": unemployment_personal,
        "medicalCompanyRate": medical_company,
        "medicalPersonalRate": medical_personal,
    }


def _store_aggregate_rows(
    db: Session,
    *,
    model: (
        type[DashboardDailyAggregate]
        | type[DashboardMonthlyAggregate]
        | type[DashboardYearlyAggregate]
    ),
    scope: str,
    domain: str,
    period: str,
    rows: list[dict[str, Any]],
) -> None:
    recalculated_at = datetime.now(UTC)
    payloads_by_identity: dict[tuple[str, str], dict[str, Any]] = {}
    for index, row in enumerate(rows):
        org_kind = str(row.get("rowType") or "row")
        org_key = str(row.get("key") or f"{domain}-{period}-{index:04d}")
        payloads_by_identity[(org_kind, org_key)] = {
            "scope": scope,
            "domain": domain,
            "period": period,
            "org_kind": org_kind,
            "org_key": org_key,
            "org_name": row.get("department")
            or row.get("division")
            or row.get("campus"),
            "metrics_json": {"payload": row},
            "lists_json": {},
            "recalculated_at": recalculated_at,
        }

    row_identities = list(payloads_by_identity.keys())
    stale_rows_query = db.query(model).filter(
        model.scope == scope,
        model.domain == domain,
        model.period == period,
    )
    if row_identities:
        stale_rows_query = stale_rows_query.filter(
            ~tuple_(model.org_kind, model.org_key).in_(row_identities)
        )
    stale_rows_query.delete(synchronize_session=False)

    if payloads_by_identity:
        table = model.__table__
        if not isinstance(table, Table):
            raise TypeError(f"Unsupported aggregate table type: {type(table)!r}")
        stmt = pg_insert(table).values(list(payloads_by_identity.values()))
        excluded = stmt.excluded
        stmt = stmt.on_conflict_do_update(
            index_elements=[
                table.c.scope,
                table.c.domain,
                table.c.period,
                table.c.org_kind,
                table.c.org_key,
            ],
            set_={
                "org_name": excluded.org_name,
                "metrics_json": excluded.metrics_json,
                "lists_json": excluded.lists_json,
                "recalculated_at": excluded.recalculated_at,
            },
        )
        db.execute(stmt)
    db.commit()


def _load_aggregate_rows(
    db: Session,
    *,
    model: (
        type[DashboardDailyAggregate]
        | type[DashboardMonthlyAggregate]
        | type[DashboardYearlyAggregate]
    ),
    scope: str,
    domain: str,
    period: str,
) -> list[dict[str, Any]]:
    records = (
        db.query(model)
        .filter(model.scope == scope, model.domain == domain, model.period == period)
        .order_by(model.org_key.asc(), model.id.asc())
        .all()
    )
    result: list[dict[str, Any]] = []
    for record in records:
        payload = (
            (record.metrics_json or {}).get("payload")
            if isinstance(record.metrics_json, dict)
            else None
        )
        if isinstance(payload, dict):
            result.append(payload)
    return result


def list_manual_recruitment_entries(
    db: Session,
    *,
    scope: str,
    start_date: date,
    end_date: date,
) -> list[DashboardManualRecruitmentDaily]:
    normalized_scope = normalize_scope(scope)
    return (
        db.query(DashboardManualRecruitmentDaily)
        .filter(DashboardManualRecruitmentDaily.scope == normalized_scope)
        .filter(DashboardManualRecruitmentDaily.stat_date >= start_date)
        .filter(DashboardManualRecruitmentDaily.stat_date <= end_date)
        .order_by(
            DashboardManualRecruitmentDaily.stat_date.asc(),
            DashboardManualRecruitmentDaily.org_name.asc(),
        )
        .all()
    )


def serialize_manual_recruitment_entry(
    record: DashboardManualRecruitmentDaily,
) -> dict[str, Any]:
    return {
        "id": record.id,
        "scope": record.scope,
        "stat_date": record.stat_date,
        "org_name": record.org_name,
        "authorized_posts": record.authorized_posts,
        "current_posts": record.current_posts,
        "boss_invite_count": record.boss_invite_count,
        "zhilian_invite_count": record.zhilian_invite_count,
        "other_platform_invite_count": record.other_platform_invite_count,
        "planned_optimize_count": record.planned_optimize_count,
        "actual_optimize_count": record.actual_optimize_count,
        "transfer_names": _deserialize_names(record.transfer_names_json),
        "optimize_names": _deserialize_names(record.optimize_names_json),
        "resign_names": _deserialize_names(record.resign_names_json),
        "updated_by_user_id": record.updated_by_user_id,
        "updated_by_name": record.updated_by_name,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def upsert_manual_recruitment_entry(
    db: Session,
    *,
    payload: DashboardManualRecruitmentDailyUpsert,
    current_user: User,
) -> DashboardManualRecruitmentDaily:
    normalized_scope = normalize_scope(payload.scope)
    record = (
        db.query(DashboardManualRecruitmentDaily)
        .filter(
            DashboardManualRecruitmentDaily.scope == normalized_scope,
            DashboardManualRecruitmentDaily.stat_date == payload.stat_date,
            DashboardManualRecruitmentDaily.org_name == payload.org_name,
        )
        .first()
    )
    if not record:
        record = DashboardManualRecruitmentDaily(
            scope=normalized_scope,
            stat_date=payload.stat_date,
            org_name=payload.org_name,
        )
        db.add(record)

    record.authorized_posts = payload.authorized_posts
    record.current_posts = payload.current_posts
    record.boss_invite_count = payload.boss_invite_count
    record.zhilian_invite_count = payload.zhilian_invite_count
    record.other_platform_invite_count = payload.other_platform_invite_count
    record.planned_optimize_count = payload.planned_optimize_count
    record.actual_optimize_count = payload.actual_optimize_count
    record.transfer_names_json = _serialize_names(payload.transfer_names)
    record.optimize_names_json = _serialize_names(payload.optimize_names)
    record.resign_names_json = _serialize_names(payload.resign_names)
    record.updated_by_user_id = current_user.user_id
    record.updated_by_name = current_user.real_name
    db.commit()
    db.refresh(record)
    return record


def list_salary_welfare_facts(
    db: Session,
    *,
    scope: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    org_name: Optional[str] = None,
) -> list[SalaryWelfareFact]:
    normalized_scope = normalize_scope(scope)
    query = db.query(SalaryWelfareFact).filter(
        SalaryWelfareFact.scope == normalized_scope
    )
    if start_date:
        query = query.filter(SalaryWelfareFact.stat_date >= start_date)
    if end_date:
        query = query.filter(SalaryWelfareFact.stat_date <= end_date)
    if org_name:
        query = query.filter(SalaryWelfareFact.org_name == normalize_text(org_name))
    # Keep fact consumption stable even when the same organization is entered with aliases
    # like "盛邦" and "主神殿"; aggregate display order should follow insertion order.
    return query.order_by(
        SalaryWelfareFact.stat_date.asc(), SalaryWelfareFact.id.asc()
    ).all()


def serialize_salary_welfare_fact(record: SalaryWelfareFact) -> dict[str, Any]:
    return {
        "id": record.id,
        "scope": record.scope,
        "org_kind": record.org_kind,
        "org_name": record.org_name,
        "stat_date": record.stat_date,
        "user_id": record.user_id,
        "person_name": record.person_name,
        "position": record.position,
        "position_category": record.position_category,
        "headcount": record.headcount,
        "salary": _to_float(record.salary),
        "annual_welfare_total": _to_float(record.annual_welfare_total),
        "monthly_incentive_total": _to_float(record.monthly_incentive_total),
        "temporary_reward_total": _to_float(record.temporary_reward_total),
        "deduction": _to_float(record.deduction),
        "cadre_salary_total": _to_float(record.cadre_salary_total),
        "staff_salary_total": _to_float(record.staff_salary_total),
        "remark": record.remark,
        "updated_by_user_id": record.updated_by_user_id,
        "updated_by_name": record.updated_by_name,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def create_salary_welfare_fact(
    db: Session,
    *,
    payload: SalaryWelfareFactCreate,
    current_user: User,
) -> SalaryWelfareFact:
    record = SalaryWelfareFact(
        scope=normalize_scope(payload.scope),
        org_kind=payload.org_kind,
        org_name=payload.org_name,
        stat_date=payload.stat_date,
        user_id=payload.user_id,
        person_name=payload.person_name,
        position=payload.position,
        position_category=payload.position_category,
        headcount=payload.headcount,
        salary=payload.salary,
        annual_welfare_total=payload.annual_welfare_total,
        monthly_incentive_total=payload.monthly_incentive_total,
        temporary_reward_total=payload.temporary_reward_total,
        deduction=payload.deduction,
        cadre_salary_total=payload.cadre_salary_total,
        staff_salary_total=payload.staff_salary_total,
        remark=payload.remark,
        updated_by_user_id=current_user.user_id,
        updated_by_name=current_user.real_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_salary_welfare_fact(
    db: Session,
    *,
    record: SalaryWelfareFact,
    payload: SalaryWelfareFactUpdate,
    current_user: User,
) -> SalaryWelfareFact:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field == "org_name" and value is not None:
            value = normalize_text(value)
        setattr(record, field, value)
    record.updated_by_user_id = current_user.user_id
    record.updated_by_name = current_user.real_name
    db.commit()
    db.refresh(record)
    return record


def get_salary_welfare_fact(db: Session, record_id: int) -> Optional[SalaryWelfareFact]:
    return db.query(SalaryWelfareFact).filter(SalaryWelfareFact.id == record_id).first()


def list_performance_facts(
    db: Session,
    *,
    scope: str,
    start_month: Optional[date] = None,
    end_month: Optional[date] = None,
    org_name: Optional[str] = None,
) -> list[PerformanceFact]:
    normalized_scope = normalize_scope(scope)
    query = db.query(PerformanceFact).filter(PerformanceFact.scope == normalized_scope)
    if start_month:
        query = query.filter(PerformanceFact.stat_month >= start_month)
    if end_month:
        query = query.filter(PerformanceFact.stat_month <= end_month)
    if org_name:
        query = query.filter(PerformanceFact.org_name == normalize_text(org_name))
    return query.order_by(
        PerformanceFact.stat_month.asc(),
        PerformanceFact.org_name.asc(),
        PerformanceFact.id.asc(),
    ).all()


def serialize_performance_fact(record: PerformanceFact) -> dict[str, Any]:
    return {
        "id": record.id,
        "scope": record.scope,
        "org_kind": record.org_kind,
        "org_name": record.org_name,
        "stat_month": record.stat_month,
        "user_id": record.user_id,
        "person_name": record.person_name,
        "position_category": record.position_category,
        "average_score": _to_float(record.average_score),
        "leader_average_score": _to_float(record.leader_average_score),
        "staff_average_score": _to_float(record.staff_average_score),
        "remark": record.remark,
        "updated_by_user_id": record.updated_by_user_id,
        "updated_by_name": record.updated_by_name,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def create_performance_fact(
    db: Session,
    *,
    payload: PerformanceFactCreate,
    current_user: User,
) -> PerformanceFact:
    normalized_scope = normalize_scope(payload.scope)
    normalized_org_name = normalize_text(payload.org_name)
    normalized_person_name = normalize_text(payload.person_name)
    existing = (
        db.query(PerformanceFact)
        .filter(
            PerformanceFact.scope == normalized_scope,
            PerformanceFact.stat_month == payload.stat_month,
            PerformanceFact.org_name == normalized_org_name,
            PerformanceFact.person_name == normalized_person_name,
        )
        .first()
    )

    record = existing or PerformanceFact(
        scope=normalized_scope,
        stat_month=payload.stat_month,
        org_name=normalized_org_name,
        person_name=normalized_person_name,
    )
    record.org_kind = payload.org_kind
    record.user_id = payload.user_id
    record.position_category = payload.position_category
    record.average_score = payload.average_score
    record.leader_average_score = payload.leader_average_score
    record.staff_average_score = payload.staff_average_score
    record.remark = payload.remark
    record.updated_by_user_id = current_user.user_id
    record.updated_by_name = current_user.real_name
    if existing is None:
        db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_performance_fact(
    db: Session,
    *,
    record: PerformanceFact,
    payload: PerformanceFactUpdate,
    current_user: User,
) -> PerformanceFact:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field == "org_name" and value is not None:
            value = normalize_text(value)
        setattr(record, field, value)
    record.updated_by_user_id = current_user.user_id
    record.updated_by_name = current_user.real_name
    db.commit()
    db.refresh(record)
    return record


def get_performance_fact(db: Session, record_id: int) -> Optional[PerformanceFact]:
    return db.query(PerformanceFact).filter(PerformanceFact.id == record_id).first()


def list_employee_archives(
    db: Session,
    *,
    scope: str,
    keyword: Optional[str] = None,
    include_inactive: bool = True,
    current_user: Optional[User] = None,
) -> list[dict[str, Any]]:
    rows = employee_archive_crud.list_employee_archives(
        db,
        scope=normalize_scope(scope),
        keyword=keyword,
        include_inactive=include_inactive,
    )
    return [
        employee_archive_crud.serialize_employee_archive_for_scope(
            db,
            user,
            profile,
            current_user,
            scope=scope,
        )
        for user, profile in rows
    ]


def get_employee_archive_options(db: Session, *, scope: str) -> dict[str, Any]:
    return employee_archive_crud.get_archive_options(db, scope=normalize_scope(scope))


def list_employee_archive_change_logs(
    db: Session,
    *,
    scope: str,
    user_id: int,
    current_user: User,
) -> list[dict[str, Any]]:
    return employee_archive_crud.list_employee_archive_change_logs(
        db,
        user_id=user_id,
        current_user=current_user,
        scope=normalize_scope(scope),
    )


def update_employee_archive(
    db: Session,
    *,
    scope: str,
    user_id: int,
    payload,
    current_user: User,
) -> dict[str, Any]:
    user, profile = employee_archive_crud.upsert_employee_archive(
        db,
        user_id,
        payload,
        current_user,
        scope=normalize_scope(scope),
    )
    return employee_archive_crud.serialize_employee_archive_for_scope(
        db,
        user,
        profile,
        current_user,
        scope=scope,
    )


def _latest_social_insurance_date(
    db: Session, *, user: User, target_date: date
) -> Optional[date]:
    approval_date = func.coalesce(
        cast(SocialInsuranceApplication.completed_at, Date),
        cast(SocialInsuranceApplication.updated_at, Date),
        cast(SocialInsuranceApplication.created_at, Date),
    )
    if user.campus and any(alias in user.campus for alias in ("最高议事厅", "总部")):
        campus_predicate = SocialInsuranceApplication.campus.in_(
            [user.campus, "最高议事厅", "最高议事厅神殿", "总部"]
        )
    else:
        campus_predicate = SocialInsuranceApplication.campus == user.campus
    record = (
        db.query(SocialInsuranceApplication)
        .filter(
            SocialInsuranceApplication.status == "approved",
            SocialInsuranceApplication.name == user.real_name,
            campus_predicate,
            approval_date.isnot(None),
            approval_date <= target_date,
        )
        .order_by(
            approval_date.desc(),
            SocialInsuranceApplication.created_at.desc(),
        )
        .first()
    )
    if not record:
        return None
    if record.completed_at:
        return record.completed_at.date()
    if record.updated_at:
        return record.updated_at.date()
    if record.created_at:
        return record.created_at.date()
    return None


def _latest_transfer(
    db: Session, *, user: User, target_date: date
) -> Optional[TransferApplication]:
    _ = target_date
    if user.user_id is not None:
        user_predicate = TransferApplication.created_by_user_id == user.user_id
    else:
        user_predicate = false()
    if is_management_center_campus(user.campus):
        campus_predicate = TransferApplication.campus.in_(
            [user.campus, "最高议事厅", "最高议事厅神殿", "总部"]
        )
    else:
        campus_predicate = TransferApplication.campus == user.campus
    return (
        db.query(TransferApplication)
        .filter(
            TransferApplication.status == "approved",
            or_(
                user_predicate,
                and_(
                    TransferApplication.name == user.real_name,
                    campus_predicate,
                ),
            ),
            (TransferApplication.completed_at.isnot(None)),
        )
        .order_by(
            TransferApplication.completed_at.desc(),
            TransferApplication.created_at.desc(),
        )
        .first()
    )


def _resolve_snapshot_transfer(
    db: Session, *, user: User, target_date: date
) -> Optional[TransferApplication]:
    if user.user_id is not None:
        user_predicate = TransferApplication.created_by_user_id == user.user_id
    else:
        user_predicate = false()
    if is_management_center_campus(user.campus):
        campus_predicate = TransferApplication.campus.in_(
            [user.campus, "最高议事厅", "最高议事厅神殿", "总部"]
        )
    else:
        campus_predicate = TransferApplication.campus == user.campus
    records = (
        db.query(TransferApplication)
        .filter(
            TransferApplication.status == "approved",
            or_(
                user_predicate,
                and_(
                    TransferApplication.name == user.real_name,
                    campus_predicate,
                ),
            ),
        )
        .order_by(
            TransferApplication.completed_at.desc().nullslast(),
            TransferApplication.apply_date.desc(),
        )
        .all()
    )
    for record in records:
        effective_date = (
            record.completed_at.date() if record.completed_at else record.apply_date
        )
        if effective_date and effective_date <= target_date:
            return record
    return None


def _latest_leave(
    db: Session, *, user: User, target_date: date
) -> Optional[ResignationApproval]:
    if user.user_id is not None:
        user_predicate = ResignationApproval.created_by_user_id == user.user_id
    else:
        user_predicate = false()
    if is_management_center_campus(user.campus):
        campus_predicate = ResignationApproval.campus.in_(
            [user.campus, "最高议事厅", "最高议事厅神殿", "总部"]
        )
    else:
        campus_predicate = ResignationApproval.campus == user.campus
    return (
        db.query(ResignationApproval)
        .filter(
            ResignationApproval.status == "approved",
            or_(
                user_predicate,
                and_(
                    ResignationApproval.name == user.real_name,
                    campus_predicate,
                ),
            ),
            ResignationApproval.leave_date <= target_date,
        )
        .order_by(
            ResignationApproval.leave_date.desc(), ResignationApproval.created_at.desc()
        )
        .first()
    )


def _latest_unpaid(
    db: Session, *, user: User, target_date: date
) -> Optional[UnpaidLeaveApplication]:
    if user.user_id is not None:
        user_predicate = UnpaidLeaveApplication.created_by_user_id == user.user_id
    else:
        user_predicate = false()
    if is_management_center_campus(user.campus):
        campus_predicate = UnpaidLeaveApplication.campus.in_(
            [user.campus, "最高议事厅", "最高议事厅神殿", "总部"]
        )
    else:
        campus_predicate = UnpaidLeaveApplication.campus == user.campus
    records = (
        db.query(UnpaidLeaveApplication)
        .filter(
            UnpaidLeaveApplication.status == "approved",
            or_(
                user_predicate,
                and_(
                    UnpaidLeaveApplication.name == user.real_name,
                    campus_predicate,
                ),
            ),
        )
        .order_by(
            UnpaidLeaveApplication.completed_at.desc().nullslast(),
            UnpaidLeaveApplication.fill_date.desc(),
        )
        .all()
    )
    for record in records:
        effective_date = (
            record.completed_at.date() if record.completed_at else record.fill_date
        )
        if effective_date and effective_date <= target_date:
            return record
    return None


def _latest_regularization(
    db: Session, *, user: User, target_date: date
) -> Optional[RegularizationApplication]:
    if user.user_id is not None:
        user_predicate = RegularizationApplication.created_by_user_id == user.user_id
    else:
        user_predicate = false()
    if is_management_center_campus(user.campus):
        campus_predicate = RegularizationApplication.campus.in_(
            [user.campus, "最高议事厅", "最高议事厅神殿", "总部"]
        )
    else:
        campus_predicate = RegularizationApplication.campus == user.campus
    records = (
        db.query(RegularizationApplication)
        .filter(
            RegularizationApplication.status == "approved",
            or_(
                user_predicate,
                and_(
                    RegularizationApplication.name == user.real_name,
                    campus_predicate,
                ),
            ),
        )
        .order_by(
            RegularizationApplication.completed_at.desc().nullslast(),
            RegularizationApplication.fill_date.desc(),
        )
        .all()
    )
    for record in records:
        effective_date = (
            record.completed_at.date() if record.completed_at else record.fill_date
        )
        if effective_date and effective_date <= target_date:
            return record
    return None


def refresh_employee_archive_snapshot(
    db: Session, *, scope: str, snapshot_date: date
) -> None:
    normalized_scope = normalize_scope(scope)
    rows = employee_archive_crud.list_employee_archives(
        db,
        scope=normalized_scope,
        include_inactive=True,
    )
    existing_snapshots = {
        record.user_id: record
        for record in db.query(EmployeeArchiveSnapshot)
        .filter(
            EmployeeArchiveSnapshot.scope == normalized_scope,
            EmployeeArchiveSnapshot.snapshot_date == snapshot_date,
        )
        .all()
    }
    retained_user_ids: set[int] = set()

    for user, profile in rows:
        if user.user_id in retained_user_ids:
            continue

        entry_date = user.entry_date.date() if user.entry_date else None
        if entry_date and entry_date > snapshot_date:
            continue

        department = (
            profile.department if profile and profile.department else user.department
        )
        position = profile.position if profile and profile.position else user.position
        transfer = _resolve_snapshot_transfer(db, user=user, target_date=snapshot_date)
        if transfer:
            department = transfer.target_department or department
            position = transfer.target_position or position

        org_name = resolve_org_name(
            normalized_scope,
            campus=(
                profile.campus_name if profile and profile.campus_name else user.campus
            ),
            department=department,
            position=position,
        )
        if not org_name:
            continue
        retained_user_ids.add(user.user_id)

        leave_record = _latest_leave(db, user=user, target_date=snapshot_date)
        unpaid_record = _latest_unpaid(db, user=user, target_date=snapshot_date)
        regular_record = _latest_regularization(
            db, user=user, target_date=snapshot_date
        )
        insurance_start_date = _latest_social_insurance_date(
            db, user=user, target_date=snapshot_date
        )

        if leave_record:
            position_nature = "离职"
            leave_date = leave_record.leave_date
            is_active = 0
        elif unpaid_record:
            position_nature = "停薪留职"
            leave_date = None
            is_active = 1
        elif regular_record:
            position_nature = "正式"
            leave_date = None
            is_active = 1
        else:
            position_nature = "试用期"
            leave_date = None
            is_active = 1

        snapshot = existing_snapshots.get(user.user_id)
        if snapshot is None:
            snapshot = EmployeeArchiveSnapshot(
                scope=normalized_scope,
                snapshot_date=snapshot_date,
                user_id=user.user_id,
            )
            db.add(snapshot)

        snapshot.username = user.username
        snapshot.campus_name = (
            profile.campus_name if profile and profile.campus_name else user.campus
        )
        snapshot.org_name = org_name
        snapshot.name = profile.name if profile and profile.name else user.real_name
        snapshot.department = department
        snapshot.position = position
        snapshot.position_category = profile.position_category if profile else None
        snapshot.position_nature = position_nature
        snapshot.insurance_start_date = insurance_start_date
        snapshot.leave_date = leave_date
        snapshot.base_salary = profile.base_salary if profile else None
        snapshot.performance_salary = profile.performance_salary if profile else None
        snapshot.reward_welfare = profile.reward_welfare if profile else None
        snapshot.user_status = user.status.value
        snapshot.is_active = is_active

    for user_id, snapshot in existing_snapshots.items():
        if user_id not in retained_user_ids:
            db.delete(snapshot)
    db.commit()


def _snapshot_counts_by_org(
    db: Session, *, scope: str, snapshot_date: date
) -> dict[str, dict[str, float]]:
    refresh_employee_archive_snapshot(db, scope=scope, snapshot_date=snapshot_date)
    rows = (
        db.query(EmployeeArchiveSnapshot)
        .filter(
            EmployeeArchiveSnapshot.scope == normalize_scope(scope),
            EmployeeArchiveSnapshot.snapshot_date == snapshot_date,
        )
        .all()
    )
    result: dict[str, dict[str, float]] = {}
    for org in list_scope_orgs(scope):
        result[org] = {
            "headcount": 0,
            "cadre_count": 0,
            "staff_count": 0,
            "insured_count": 0,
            "should_insure_count": 0,
            "active_post_count": 0,
            "regularized_count": 0,
        }
    for row in rows:
        if row.org_name not in result:
            continue
        if row.position_nature == "离职":
            continue
        result[row.org_name]["headcount"] += 1
        if row.position_nature != "停薪留职":
            result[row.org_name]["active_post_count"] += 1
        if row.position_nature != "停薪留职":
            result[row.org_name]["should_insure_count"] += 1
        if row.position_nature == "正式":
            result[row.org_name]["regularized_count"] += 1
        if (row.position_category or "").strip() == "干部":
            result[row.org_name]["cadre_count"] += 1
        else:
            result[row.org_name]["staff_count"] += 1
        if row.insurance_start_date and row.insurance_start_date <= snapshot_date:
            result[row.org_name]["insured_count"] += 1
    return result


def _apply_recruitment_snapshot_metrics(
    target: dict[str, Any],
    counts: dict[str, dict[str, float]],
    org: str,
) -> None:
    target["currentPosts"] = counts.get(org, {}).get("active_post_count", 0)
    target["regularizedCount"] = counts.get(org, {}).get("regularized_count", 0)


def _sum_recruitment_snapshot_metrics(
    counts: dict[str, dict[str, float]],
    orgs: list[str],
) -> dict[str, float]:
    return {
        "currentPosts": sum(
            counts.get(org, {}).get("active_post_count", 0) for org in orgs
        ),
        "regularizedCount": sum(
            counts.get(org, {}).get("regularized_count", 0) for org in orgs
        ),
    }


def _build_hq_request_position_map(
    records: list[RecruitmentRequest],
) -> dict[str, list[tuple[str, str]]]:
    result: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for record in records:
        department = normalize_hq_department(record.department)
        position_key = normalize_text(record.position).replace(" ", "").lower()
        apply_date = record.apply_date.isoformat() if record.apply_date else ""
        if not department or not position_key:
            continue
        result[position_key].append((department, apply_date))
    for items in result.values():
        items.sort(key=lambda item: item[1], reverse=True)
    return result


def _infer_hq_interview_department(
    record: InterviewRegistration,
    request_map: dict[str, list[tuple[str, str]]],
    creator_profile_map: dict[int, tuple[Optional[str], Optional[str]]],
) -> Optional[str]:
    position_key = normalize_text(record.position).replace(" ", "").lower()
    reference_date = (
        record.invite_date.isoformat()
        if record.invite_date
        else record.onboard_date.isoformat() if record.onboard_date else ""
    )
    if position_key:
        matches = request_map.get(position_key) or []
        if matches:
            for department, apply_date in matches:
                if not reference_date or apply_date <= reference_date:
                    return department
            return matches[0][0]

    department = normalize_hq_department(record.position)
    if department:
        return department

    if record.created_by_user_id:
        creator_department, creator_position = creator_profile_map.get(
            record.created_by_user_id,
            (None, None),
        )
        return normalize_hq_department(creator_department) or normalize_hq_department(
            creator_position
        )

    return None


def _build_hq_daily_recruitment(
    db: Session, *, month: str
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs = HQ_DEPARTMENTS
    day_map: dict[tuple[str, str], dict[str, Any]] = {}
    snapshot_counts_by_day = {
        date(month_start.year, month_start.month, day).isoformat(): _snapshot_counts_by_org(
            db,
            scope=HQ_SCOPE,
            snapshot_date=date(month_start.year, month_start.month, day),
        )
        for day in range(1, month_end.day + 1)
    }
    month_end_snapshot_counts = snapshot_counts_by_day[month_end.isoformat()]

    def get_day_metric(stat_date: date, org: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), org)
        if key not in day_map:
            day_map[key] = {
                "authorizedPosts": 0,
                "currentPosts": 0,
                "neededPosts": 0,
                "bossInviteCount": 0,
                "bossInterviewCount": 0,
                "zhilianInviteCount": 0,
                "zhilianInterviewCount": 0,
                "otherPlatformInviteCount": 0,
                "otherPlatformInterviewCount": 0,
                "onboardCount": 0,
                "newStaffRetentionCount": 0,
                "regularizedCount": 0,
                "plannedTransferCount": 0,
                "actualTransferCount": 0,
                "plannedOptimizeCount": 0,
                "actualOptimizeCount": 0,
                "resignCount": 0,
                "transferNames": [],
                "optimizeNames": [],
                "resignNames": [],
            }
        return day_map[key]

    requests = (
        db.query(RecruitmentRequest)
        .order_by(RecruitmentRequest.apply_date.desc())
        .all()
    )
    request_map = _build_hq_request_position_map(
        [item for item in requests if item.status != "rejected"]
    )
    creator_profile_map = {
        user.user_id: (user.department, user.position)
        for user in db.query(User).all()
    }

    departure_by_name: dict[str, str] = {}
    for record in (
        db.query(ResignationApproval)
        .filter(ResignationApproval.status == "approved")
        .all()
    ):
        department = normalize_hq_department(record.department)
        if not department:
            continue
        leave_date = record.leave_date
        if not leave_date:
            continue
        name_key = normalize_text(record.name).replace(" ", "")
        current = departure_by_name.get(name_key)
        if not current or leave_date.isoformat() < current:
            departure_by_name[name_key] = leave_date.isoformat()
        if month_start <= leave_date <= month_end:
            get_day_metric(leave_date, department)["resignCount"] += 1

    for record in (
        db.query(UnpaidLeaveApplication)
        .filter(UnpaidLeaveApplication.status == "approved")
        .all()
    ):
        department = normalize_hq_department(record.department)
        if not department:
            continue
        leave_date = (
            record.completed_at.date() if record.completed_at else record.fill_date
        )
        if not leave_date:
            continue
        name_key = normalize_text(record.name).replace(" ", "")
        current = departure_by_name.get(name_key)
        if not current or leave_date.isoformat() < current:
            departure_by_name[name_key] = leave_date.isoformat()
        if month_start <= leave_date <= month_end:
            get_day_metric(leave_date, department)["resignCount"] += 1

    for record in requests:
        resolved_scope = resolve_recruitment_request_scope(
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        department = resolve_recruitment_request_org_name(
            HQ_SCOPE,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        if resolved_scope != HQ_SCOPE or not department or not record.apply_date:
            continue
        if record.status == "approved" and month_start <= record.apply_date <= month_end:
            get_day_metric(record.apply_date, department)["neededPosts"] += (
                record.headcount or 0
            )

    unmatched_interviews = 0
    retention_cutoff = min(date.today(), month_end).isoformat()
    interviews = db.query(InterviewRegistration).all()
    for record in interviews:
        resolved_scope = resolve_interview_registration_scope(
            campus=record.campus_name,
            position=record.position,
        )
        if resolved_scope != HQ_SCOPE:
            continue
        department = _infer_hq_interview_department(
            record,
            request_map,
            creator_profile_map,
        )
        invite_date = record.invite_date
        onboard_date = record.onboard_date
        if not department:
            if (invite_date and month_start <= invite_date <= month_end) or (
                onboard_date and month_start <= onboard_date <= month_end
            ):
                unmatched_interviews += 1
            continue

        source = normalize_text(record.source).lower()
        source_key = "other"
        if "boss" in source:
            source_key = "boss"
        elif "智联" in source:
            source_key = "zhilian"

        attended = (
            record.attended_first == "是"
            or record.attended_second == "是"
            or record.first_hire_decision == "是"
            or record.final_hire_decision == "是"
            or record.reported == "是"
        )

        if invite_date and month_start <= invite_date <= month_end:
            target = get_day_metric(invite_date, department)
            if attended:
                target[
                    (
                        f"{source_key}InterviewCount"
                        if source_key != "other"
                        else "otherPlatformInterviewCount"
                    )
                ] += 1

        if (
            record.reported == "是"
            and onboard_date
            and month_start <= onboard_date <= month_end
        ):
            target = get_day_metric(onboard_date, department)
            target["onboardCount"] += 1
            departure_date = departure_by_name.get(
                normalize_text(record.name).replace(" ", "")
            )
            if (
                not departure_date
                or departure_date < onboard_date.isoformat()
                or departure_date > retention_cutoff
            ):
                target["newStaffRetentionCount"] += 1

    for record in db.query(TransferApplication).all():
        department = normalize_hq_department(record.department)
        if not department or "最高议事厅" not in normalize_text(record.campus):
            continue
        if (
            record.status in {"pending", "approved"}
            and record.apply_date
            and month_start <= record.apply_date <= month_end
        ):
            get_day_metric(record.apply_date, department)["plannedTransferCount"] += 1
        completed_date = (
            record.completed_at.date() if record.completed_at else record.apply_date
        )
        if (
            record.status == "approved"
            and completed_date
            and month_start <= completed_date <= month_end
        ):
            get_day_metric(completed_date, department)["actualTransferCount"] += 1

    for entry in list_manual_recruitment_entries(
        db, scope=HQ_SCOPE, start_date=month_start, end_date=month_end
    ):
        department = normalize_hq_department(entry.org_name)
        if not department:
            continue
        target = get_day_metric(entry.stat_date, department)
        target["authorizedPosts"] = entry.authorized_posts
        target["currentPosts"] = entry.current_posts
        target["bossInviteCount"] += entry.boss_invite_count
        target["zhilianInviteCount"] += entry.zhilian_invite_count
        target["otherPlatformInviteCount"] += entry.other_platform_invite_count
        target["plannedOptimizeCount"] += entry.planned_optimize_count
        target["actualOptimizeCount"] += entry.actual_optimize_count
        target["transferNames"] = _unique_names(
            target["transferNames"] + _deserialize_names(entry.transfer_names_json)
        )
        target["optimizeNames"] = _unique_names(
            target["optimizeNames"] + _deserialize_names(entry.optimize_names_json)
        )
        target["resignNames"] = _unique_names(
            target["resignNames"] + _deserialize_names(entry.resign_names_json)
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_snapshot_counts = snapshot_counts_by_day[stat_date.isoformat()]
        for department in orgs:
            _apply_recruitment_snapshot_metrics(
                get_day_metric(stat_date, department),
                day_snapshot_counts,
                department,
            )

    def sum_rows(items: list[dict[str, Any]], include_snapshot: bool) -> dict[str, Any]:
        result = get_day_metric(month_start, orgs[0]).copy()
        for key in list(result.keys()):
            if isinstance(result[key], list):
                result[key] = []
            else:
                result[key] = 0
        numeric_keys = [
            key for key, value in result.items() if not isinstance(value, list)
        ]
        if not include_snapshot:
            numeric_keys = [
                key
                for key in numeric_keys
                if key not in {"authorizedPosts", "currentPosts", "regularizedCount"}
            ]
        for item in items:
            for key in numeric_keys:
                result[key] += item.get(key, 0)
            result["transferNames"] = _unique_names(
                result["transferNames"] + item.get("transferNames", [])
            )
            result["optimizeNames"] = _unique_names(
                result["optimizeNames"] + item.get("optimizeNames", [])
            )
            result["resignNames"] = _unique_names(
                result["resignNames"] + item.get("resignNames", [])
            )
        return result

    def to_row(base: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
        total_invites = (
            data["bossInviteCount"]
            + data["zhilianInviteCount"]
            + data["otherPlatformInviteCount"]
        )
        total_interviews = (
            data["bossInterviewCount"]
            + data["zhilianInterviewCount"]
            + data["otherPlatformInterviewCount"]
        )
        return {
            **base,
            **data,
            "interviewArrivalRate": _safe_percent(total_interviews, total_invites),
            "onboardRate": _safe_percent(data["onboardCount"], total_interviews),
            "newStaffRetentionRate": _safe_percent(
                data["newStaffRetentionCount"], data["onboardCount"]
            ),
            "resignRate": _safe_percent(data["resignCount"], data["currentPosts"]),
        }

    department_subtotals: dict[str, dict[str, Any]] = {}
    for department in orgs:
        day_rows = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            day_rows.append(
                day_map.get(
                    (stat_date.isoformat(), department),
                    get_day_metric(stat_date, department),
                )
            )
        department_subtotals[department] = sum_rows(day_rows, include_snapshot=False)
        _apply_recruitment_snapshot_metrics(
            department_subtotals[department],
            month_end_snapshot_counts,
            department,
        )

    grand_total = sum_rows(list(department_subtotals.values()), include_snapshot=True)
    grand_total.update(
        _sum_recruitment_snapshot_metrics(month_end_snapshot_counts, list(orgs))
    )
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-recruit-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]
    for index, department in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-recruit-department-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": department,
                },
                department_subtotals[department],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            day_map.get(
                (stat_date.isoformat(), department),
                get_day_metric(stat_date, department),
            )
            for department in orgs
        ]
        day_total = sum_rows(day_items, include_snapshot=True)
        day_total.update(
            _sum_recruitment_snapshot_metrics(
                snapshot_counts_by_day[stat_date.isoformat()],
                list(orgs),
            )
        )
        rows.append(
            to_row(
                {
                    "key": f"100-recruit-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                day_total,
            )
        )
        for index, department in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-recruit-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": department,
                        "dayOfMonth": day,
                    },
                    day_map.get(
                        (stat_date.isoformat(), department),
                        get_day_metric(stat_date, department),
                    ),
                )
            )

    return rows, {"unmatchedInterviewCount": unmatched_interviews}


def _build_hq_daily_training(
    db: Session, *, month: str
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs = HQ_DEPARTMENTS
    metric_map: dict[tuple[str, str], dict[str, Any]] = {}
    fallback_map: dict[tuple[str, str], dict[str, Any]] = {}

    def get_metric(stat_date: date, department: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), department)
        if key not in metric_map:
            metric_map[key] = {
                "trainingSessions": 0,
                "trainingDuration": 0.0,
                "participants": 0,
                "scoreTotal": 0.0,
                "passCount": 0,
                "failCount": 0,
                "failNames": [],
                "satisfactionTotalScore": 0.0,
                "satisfactionResponseCount": 0,
                "totalCost": 0.0,
            }
        return metric_map[key]

    unmatched_results = 0
    unmatched_satisfaction = 0
    fallback_rows = 0

    for record in _list_training_results_in_range(db, month_start, month_end):
        if (
            record.campus
            and "最高议事厅" not in record.campus
            and "总部" not in record.campus
        ):
            continue
        department = normalize_hq_department(record.department)
        if not department:
            unmatched_results += 1
            continue
        target = get_metric(record.training_date, department)
        trainees = []
        try:
            trainees = json.loads(record.trainees_json or "[]")
        except json.JSONDecodeError:
            trainees = []
        fail_names = [
            item.get("name", "")
            for item in trainees
            if int(item.get("composite_score", 0)) < 60
        ]
        total_composite = (
            sum(int(item.get("composite_score", 0)) for item in trainees)
            if trainees
            else _to_float(record.average_score) * int(record.actual_count or 0)
        )
        target["trainingSessions"] += 1
        target["trainingDuration"] += _to_float(record.training_hours)
        target["participants"] += int(record.actual_count or 0)
        target["scoreTotal"] += total_composite
        target["passCount"] += int(record.pass_count or 0)
        target["failCount"] += int(record.fail_count or 0)
        target["failNames"] = _unique_names(
            target["failNames"] + [name for name in fail_names if name]
        )
        target["totalCost"] += _to_float(record.total_cost)

    for record in _list_training_satisfaction_in_range(db, month_start, month_end):
        department = normalize_hq_department(record.department)
        if not department:
            unmatched_satisfaction += 1
            continue
        target = get_metric(record.training_date, department)
        target["satisfactionTotalScore"] += _training_satisfaction_total_score(record)
        target["satisfactionResponseCount"] += 1

    for record in _list_training_applications_in_range(db, month_start, month_end):
        if (
            record.campus
            and "最高议事厅" not in record.campus
            and "总部" not in record.campus
        ):
            continue
        department = normalize_hq_department(record.department)
        if not department:
            continue
        key = (record.start_date.isoformat(), department)
        fallback = fallback_map.setdefault(
            key,
            {
                "trainingSessions": 0,
                "trainingDuration": 0.0,
                "totalCost": 0.0,
            },
        )
        fallback["trainingSessions"] += 1
        fallback["trainingDuration"] += _to_float(record.total_hours)
        fallback["totalCost"] += _to_float(record.cost_total) + _to_float(
            record.cost_other
        )

    def clone_metric(metric: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        base = {
            "trainingSessions": 0,
            "trainingDuration": 0.0,
            "participants": 0,
            "scoreTotal": 0.0,
            "passCount": 0,
            "failCount": 0,
            "failNames": [],
            "satisfactionTotalScore": 0.0,
            "satisfactionResponseCount": 0,
            "totalCost": 0.0,
        }
        if not metric:
            return base
        return {
            **base,
            **metric,
            "failNames": list(metric.get("failNames", [])),
        }

    resolved_map: dict[tuple[str, str], dict[str, Any]] = {}
    for key in set(metric_map) | set(fallback_map):
        resolved = clone_metric(metric_map.get(key))
        fallback_metric = fallback_map.get(key)
        if fallback_metric and resolved["trainingSessions"] == 0:
            resolved["trainingSessions"] = fallback_metric["trainingSessions"]
            resolved["trainingDuration"] = fallback_metric["trainingDuration"]
            resolved["totalCost"] = fallback_metric["totalCost"]
            fallback_rows += 1
        resolved_map[key] = resolved

    def sum_metrics(items: list[dict[str, Any]]) -> dict[str, Any]:
        result = clone_metric()
        for item in items:
            result["trainingSessions"] += item["trainingSessions"]
            result["trainingDuration"] += item["trainingDuration"]
            result["participants"] += item["participants"]
            result["scoreTotal"] += item["scoreTotal"]
            result["passCount"] += item["passCount"]
            result["failCount"] += item["failCount"]
            result["failNames"] = _unique_names(result["failNames"] + item["failNames"])
            result["satisfactionTotalScore"] += item["satisfactionTotalScore"]
            result["satisfactionResponseCount"] += item["satisfactionResponseCount"]
            result["totalCost"] += item["totalCost"]
        return result

    def to_row(base: dict[str, Any], metric: dict[str, Any]) -> dict[str, Any]:
        participants = metric["participants"]
        avg_score = metric["scoreTotal"] / participants if participants > 0 else 0
        per_capita_duration = (
            metric["trainingDuration"] / participants if participants > 0 else 0
        )
        satisfaction_score = (
            metric["satisfactionTotalScore"] / metric["satisfactionResponseCount"]
            if metric["satisfactionResponseCount"] > 0
            else 0
        )
        return {
            **base,
            "trainingSessions": metric["trainingSessions"],
            "trainingDuration": _round(metric["trainingDuration"], 1),
            "participants": participants,
            "perCapitaDuration": (
                _round(per_capita_duration, 2) if participants > 0 else "-"
            ),
            "averageScore": _round(avg_score, 2) if participants > 0 else "-",
            "passCount": metric["passCount"],
            "failCount": metric["failCount"],
            "failNames": metric["failNames"],
            "passRate": _safe_percent(metric["passCount"], participants),
            "satisfactionScore": (
                _round(satisfaction_score, 2)
                if metric["satisfactionResponseCount"] > 0
                else "-"
            ),
            "totalCost": _round(metric["totalCost"], 2),
            "perCapitaCost": (
                _round(metric["totalCost"] / participants, 2)
                if participants > 0
                else "-"
            ),
        }

    subtotals: dict[str, dict[str, Any]] = {}
    for org in orgs:
        daily_items = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            daily_items.append(
                resolved_map.get((stat_date.isoformat(), org), clone_metric())
            )
        subtotals[org] = sum_metrics(daily_items)

    grand_total = sum_metrics(list(subtotals.values()))
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-training-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]

    for index, org in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-training-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                subtotals[org],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            resolved_map.get((stat_date.isoformat(), org), clone_metric())
            for org in orgs
        ]
        rows.append(
            to_row(
                {
                    "key": f"100-training-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                sum_metrics(day_items),
            )
        )
        for index, org in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-training-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    resolved_map.get((stat_date.isoformat(), org), clone_metric()),
                )
            )

    return rows, {
        "unmatchedTrainingResultCount": unmatched_results,
        "unmatchedSatisfactionCount": unmatched_satisfaction,
        "applicationFallbackRowCount": fallback_rows,
    }


def _build_offline_daily_recruitment(
    db: Session, *, month: str
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs = list_scope_orgs(OFFLINE_SCOPE)
    day_map: dict[tuple[str, str], dict[str, Any]] = {}
    snapshot_counts_by_day = {
        date(month_start.year, month_start.month, day).isoformat(): _snapshot_counts_by_org(
            db,
            scope=OFFLINE_SCOPE,
            snapshot_date=date(month_start.year, month_start.month, day),
        )
        for day in range(1, month_end.day + 1)
    }
    month_end_snapshot_counts = snapshot_counts_by_day[month_end.isoformat()]

    def get_day_metric(stat_date: date, org: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), org)
        if key not in day_map:
            day_map[key] = {
                "authorizedPosts": 0,
                "currentPosts": 0,
                "neededPosts": 0,
                "bossInviteCount": 0,
                "bossInterviewCount": 0,
                "zhilianInviteCount": 0,
                "zhilianInterviewCount": 0,
                "otherPlatformInviteCount": 0,
                "otherPlatformInterviewCount": 0,
                "onboardCount": 0,
                "newStaffRetentionCount": 0,
                "regularizedCount": 0,
                "plannedTransferCount": 0,
                "actualTransferCount": 0,
                "plannedOptimizeCount": 0,
                "actualOptimizeCount": 0,
                "resignCount": 0,
                "transferNames": [],
                "optimizeNames": [],
                "resignNames": [],
            }
        return day_map[key]

    departure_by_person: dict[str, str] = {}
    for record in (
        db.query(ResignationApproval)
        .filter(ResignationApproval.status == "approved")
        .all()
    ):
        org = normalize_offline_campus(record.campus)
        if not org or not record.leave_date:
            continue
        name_key = f"{org}:{normalize_text(record.name).replace(' ', '')}"
        current = departure_by_person.get(name_key)
        if not current or record.leave_date.isoformat() < current:
            departure_by_person[name_key] = record.leave_date.isoformat()
        if month_start <= record.leave_date <= month_end:
            get_day_metric(record.leave_date, org)["resignCount"] += 1

    for record in (
        db.query(UnpaidLeaveApplication)
        .filter(UnpaidLeaveApplication.status == "approved")
        .all()
    ):
        org = normalize_offline_campus(record.campus)
        leave_date = (
            record.completed_at.date() if record.completed_at else record.fill_date
        )
        if not org or not leave_date:
            continue
        name_key = f"{org}:{normalize_text(record.name).replace(' ', '')}"
        current = departure_by_person.get(name_key)
        if not current or leave_date.isoformat() < current:
            departure_by_person[name_key] = leave_date.isoformat()
        if month_start <= leave_date <= month_end:
            get_day_metric(leave_date, org)["resignCount"] += 1

    requests = (
        db.query(RecruitmentRequest)
        .order_by(RecruitmentRequest.apply_date.desc())
        .all()
    )
    for record in requests:
        resolved_scope = resolve_recruitment_request_scope(
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        org = resolve_recruitment_request_org_name(
            OFFLINE_SCOPE,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        if resolved_scope != OFFLINE_SCOPE or not org or not record.apply_date:
            continue
        if record.status == "approved" and month_start <= record.apply_date <= month_end:
            get_day_metric(record.apply_date, org)["neededPosts"] += (
                record.headcount or 0
            )

    interviews = db.query(InterviewRegistration).all()
    unmatched_interviews = 0
    retention_cutoff = min(date.today(), month_end).isoformat()
    for record in interviews:
        resolved_scope = resolve_interview_registration_scope(
            campus=record.campus_name,
            position=record.position,
        )
        org = resolve_interview_registration_org_name(
            OFFLINE_SCOPE,
            campus=record.campus_name,
            position=record.position,
        )
        invite_date = record.invite_date
        onboard_date = record.onboard_date
        if resolved_scope != OFFLINE_SCOPE or not org:
            if (invite_date and month_start <= invite_date <= month_end) or (
                onboard_date and month_start <= onboard_date <= month_end
            ):
                unmatched_interviews += 1
            continue

        source = normalize_text(record.source).lower()
        source_key = "other"
        if "boss" in source:
            source_key = "boss"
        elif "智联" in source:
            source_key = "zhilian"

        attended = (
            record.attended_first == "是"
            or record.attended_second == "是"
            or record.first_hire_decision == "是"
            or record.final_hire_decision == "是"
            or record.reported == "是"
        )

        if invite_date and month_start <= invite_date <= month_end:
            target = get_day_metric(invite_date, org)
            if attended:
                target[
                    (
                        f"{source_key}InterviewCount"
                        if source_key != "other"
                        else "otherPlatformInterviewCount"
                    )
                ] += 1

        if (
            record.reported == "是"
            and onboard_date
            and month_start <= onboard_date <= month_end
        ):
            target = get_day_metric(onboard_date, org)
            target["onboardCount"] += 1
            name_key = f"{org}:{normalize_text(record.name).replace(' ', '')}"
            departure_date = departure_by_person.get(name_key)
            if (
                not departure_date
                or departure_date < onboard_date.isoformat()
                or departure_date > retention_cutoff
            ):
                target["newStaffRetentionCount"] += 1

    for record in db.query(TransferApplication).all():
        org = normalize_offline_campus(record.campus)
        if not org:
            continue
        if (
            record.status in {"pending", "approved"}
            and record.apply_date
            and month_start <= record.apply_date <= month_end
        ):
            get_day_metric(record.apply_date, org)["plannedTransferCount"] += 1
        completed_date = (
            record.completed_at.date() if record.completed_at else record.apply_date
        )
        if (
            record.status == "approved"
            and completed_date
            and month_start <= completed_date <= month_end
        ):
            get_day_metric(completed_date, org)["actualTransferCount"] += 1

    for entry in list_manual_recruitment_entries(
        db, scope=OFFLINE_SCOPE, start_date=month_start, end_date=month_end
    ):
        org = normalize_offline_campus(entry.org_name)
        if not org:
            continue
        target = get_day_metric(entry.stat_date, org)
        target["authorizedPosts"] = entry.authorized_posts
        target["currentPosts"] = entry.current_posts
        target["bossInviteCount"] += entry.boss_invite_count
        target["zhilianInviteCount"] += entry.zhilian_invite_count
        target["otherPlatformInviteCount"] += entry.other_platform_invite_count
        target["plannedOptimizeCount"] += entry.planned_optimize_count
        target["actualOptimizeCount"] += entry.actual_optimize_count
        target["transferNames"] = _unique_names(
            target["transferNames"] + _deserialize_names(entry.transfer_names_json)
        )
        target["optimizeNames"] = _unique_names(
            target["optimizeNames"] + _deserialize_names(entry.optimize_names_json)
        )
        target["resignNames"] = _unique_names(
            target["resignNames"] + _deserialize_names(entry.resign_names_json)
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_snapshot_counts = snapshot_counts_by_day[stat_date.isoformat()]
        for org in orgs:
            _apply_recruitment_snapshot_metrics(
                get_day_metric(stat_date, org),
                day_snapshot_counts,
                org,
            )

    def sum_rows(items: list[dict[str, Any]], include_snapshot: bool) -> dict[str, Any]:
        result = get_day_metric(month_start, orgs[0]).copy()
        for key in list(result.keys()):
            if isinstance(result[key], list):
                result[key] = []
            else:
                result[key] = 0
        numeric_keys = [
            key for key, value in result.items() if not isinstance(value, list)
        ]
        if not include_snapshot:
            numeric_keys = [
                key
                for key in numeric_keys
                if key not in {"authorizedPosts", "currentPosts", "regularizedCount"}
            ]
        for item in items:
            for key in numeric_keys:
                result[key] += item.get(key, 0)
            result["transferNames"] = _unique_names(
                result["transferNames"] + item.get("transferNames", [])
            )
            result["optimizeNames"] = _unique_names(
                result["optimizeNames"] + item.get("optimizeNames", [])
            )
            result["resignNames"] = _unique_names(
                result["resignNames"] + item.get("resignNames", [])
            )
        return result

    def to_row(base: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
        total_invites = (
            data["bossInviteCount"]
            + data["zhilianInviteCount"]
            + data["otherPlatformInviteCount"]
        )
        total_interviews = (
            data["bossInterviewCount"]
            + data["zhilianInterviewCount"]
            + data["otherPlatformInterviewCount"]
        )
        return {
            **base,
            **data,
            "interviewArrivalRate": _safe_percent(total_interviews, total_invites),
            "onboardRate": _safe_percent(data["onboardCount"], total_interviews),
            "newStaffRetentionRate": _safe_percent(
                data["newStaffRetentionCount"], data["onboardCount"]
            ),
            "resignRate": _safe_percent(data["resignCount"], data["currentPosts"]),
        }

    department_subtotals: dict[str, dict[str, Any]] = {}
    for org in orgs:
        day_rows = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            day_rows.append(
                day_map.get(
                    (stat_date.isoformat(), org), get_day_metric(stat_date, org)
                )
            )
        department_subtotals[org] = sum_rows(day_rows, include_snapshot=False)
        _apply_recruitment_snapshot_metrics(
            department_subtotals[org],
            month_end_snapshot_counts,
            org,
        )

    grand_total = sum_rows(list(department_subtotals.values()), include_snapshot=True)
    grand_total.update(
        _sum_recruitment_snapshot_metrics(month_end_snapshot_counts, list(orgs))
    )
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-recruit-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]
    for index, org in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-recruit-department-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                department_subtotals[org],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            day_map.get((stat_date.isoformat(), org), get_day_metric(stat_date, org))
            for org in orgs
        ]
        day_total = sum_rows(day_items, include_snapshot=True)
        day_total.update(
            _sum_recruitment_snapshot_metrics(
                snapshot_counts_by_day[stat_date.isoformat()],
                list(orgs),
            )
        )
        rows.append(
            to_row(
                {
                    "key": f"100-recruit-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                day_total,
            )
        )
        for index, org in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-recruit-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    day_map.get(
                        (stat_date.isoformat(), org), get_day_metric(stat_date, org)
                    ),
                )
            )

    return rows, {"unmatchedInterviewCount": unmatched_interviews}


def _build_offline_daily_training(
    db: Session, *, month: str
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs = list_scope_orgs(OFFLINE_SCOPE)
    metric_map: dict[tuple[str, str], dict[str, Any]] = {}
    fallback_map: dict[tuple[str, str], dict[str, Any]] = {}

    def get_metric(stat_date: date, org: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), org)
        if key not in metric_map:
            metric_map[key] = {
                "trainingSessions": 0,
                "trainingDuration": 0.0,
                "participants": 0,
                "scoreTotal": 0.0,
                "passCount": 0,
                "failCount": 0,
                "failNames": [],
                "satisfactionTotalScore": 0.0,
                "satisfactionResponseCount": 0,
                "totalCost": 0.0,
            }
        return metric_map[key]

    unmatched_results = 0
    unmatched_satisfaction = 0
    fallback_rows = 0

    for record in _list_training_results_in_range(db, month_start, month_end):
        org = normalize_offline_campus(record.campus)
        if not org:
            unmatched_results += 1
            continue
        target = get_metric(record.training_date, org)
        trainees = []
        try:
            trainees = json.loads(record.trainees_json or "[]")
        except json.JSONDecodeError:
            trainees = []
        fail_names = [
            item.get("name", "")
            for item in trainees
            if int(item.get("composite_score", 0)) < 60
        ]
        total_composite = (
            sum(int(item.get("composite_score", 0)) for item in trainees)
            if trainees
            else _to_float(record.average_score) * int(record.actual_count or 0)
        )
        target["trainingSessions"] += 1
        target["trainingDuration"] += _to_float(record.training_hours)
        target["participants"] += int(record.actual_count or 0)
        target["scoreTotal"] += total_composite
        target["passCount"] += int(record.pass_count or 0)
        target["failCount"] += int(record.fail_count or 0)
        target["failNames"] = _unique_names(
            target["failNames"] + [name for name in fail_names if name]
        )
        target["totalCost"] += _to_float(record.total_cost)

    for record in _list_training_satisfaction_in_range(db, month_start, month_end):
        org = normalize_offline_campus(record.department) or normalize_offline_campus(
            record.training_location
        )
        if not org:
            unmatched_satisfaction += 1
            continue
        target = get_metric(record.training_date, org)
        target["satisfactionTotalScore"] += _training_satisfaction_total_score(record)
        target["satisfactionResponseCount"] += 1

    for record in _list_training_applications_in_range(db, month_start, month_end):
        org = normalize_offline_campus(record.campus)
        if not org:
            continue
        key = (record.start_date.isoformat(), org)
        fallback = fallback_map.setdefault(
            key,
            {
                "trainingSessions": 0,
                "trainingDuration": 0.0,
                "totalCost": 0.0,
            },
        )
        fallback["trainingSessions"] += 1
        fallback["trainingDuration"] += _to_float(record.total_hours)
        fallback["totalCost"] += _to_float(record.cost_total) + _to_float(
            record.cost_other
        )

    def clone_metric(metric: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        base = {
            "trainingSessions": 0,
            "trainingDuration": 0.0,
            "participants": 0,
            "scoreTotal": 0.0,
            "passCount": 0,
            "failCount": 0,
            "failNames": [],
            "satisfactionTotalScore": 0.0,
            "satisfactionResponseCount": 0,
            "totalCost": 0.0,
        }
        if not metric:
            return base
        return {
            **base,
            **metric,
            "failNames": list(metric.get("failNames", [])),
        }

    resolved_map: dict[tuple[str, str], dict[str, Any]] = {}
    for key in set(metric_map) | set(fallback_map):
        resolved = clone_metric(metric_map.get(key))
        fallback_metric = fallback_map.get(key)
        if fallback_metric and resolved["trainingSessions"] == 0:
            resolved["trainingSessions"] = fallback_metric["trainingSessions"]
            resolved["trainingDuration"] = fallback_metric["trainingDuration"]
            resolved["totalCost"] = fallback_metric["totalCost"]
            fallback_rows += 1
        resolved_map[key] = resolved

    def sum_metrics(items: list[dict[str, Any]]) -> dict[str, Any]:
        result = clone_metric()
        for item in items:
            result["trainingSessions"] += item["trainingSessions"]
            result["trainingDuration"] += item["trainingDuration"]
            result["participants"] += item["participants"]
            result["scoreTotal"] += item["scoreTotal"]
            result["passCount"] += item["passCount"]
            result["failCount"] += item["failCount"]
            result["failNames"] = _unique_names(result["failNames"] + item["failNames"])
            result["satisfactionTotalScore"] += item["satisfactionTotalScore"]
            result["satisfactionResponseCount"] += item["satisfactionResponseCount"]
            result["totalCost"] += item["totalCost"]
        return result

    def to_row(base: dict[str, Any], metric: dict[str, Any]) -> dict[str, Any]:
        participants = metric["participants"]
        avg_score = metric["scoreTotal"] / participants if participants > 0 else 0
        per_capita_duration = (
            metric["trainingDuration"] / participants if participants > 0 else 0
        )
        satisfaction_score = (
            metric["satisfactionTotalScore"] / metric["satisfactionResponseCount"]
            if metric["satisfactionResponseCount"] > 0
            else 0
        )
        return {
            **base,
            "trainingSessions": metric["trainingSessions"],
            "trainingDuration": _round(metric["trainingDuration"], 1),
            "participants": participants,
            "perCapitaDuration": (
                _round(per_capita_duration, 2) if participants > 0 else "-"
            ),
            "averageScore": _round(avg_score, 2) if participants > 0 else "-",
            "passCount": metric["passCount"],
            "failCount": metric["failCount"],
            "failNames": metric["failNames"],
            "passRate": _safe_percent(metric["passCount"], participants),
            "satisfactionScore": (
                _round(satisfaction_score, 2)
                if metric["satisfactionResponseCount"] > 0
                else "-"
            ),
            "totalCost": _round(metric["totalCost"], 2),
            "perCapitaCost": (
                _round(metric["totalCost"] / participants, 2)
                if participants > 0
                else "-"
            ),
        }

    subtotals: dict[str, dict[str, Any]] = {}
    for org in orgs:
        daily_items = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            daily_items.append(
                resolved_map.get((stat_date.isoformat(), org), clone_metric())
            )
        subtotals[org] = sum_metrics(daily_items)

    grand_total = sum_metrics(list(subtotals.values()))
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-training-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]

    for index, org in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-training-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                subtotals[org],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            resolved_map.get((stat_date.isoformat(), org), clone_metric())
            for org in orgs
        ]
        rows.append(
            to_row(
                {
                    "key": f"100-training-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                sum_metrics(day_items),
            )
        )
        for index, org in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-training-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    resolved_map.get((stat_date.isoformat(), org), clone_metric()),
                )
            )

    return rows, {
        "unmatchedTrainingResultCount": unmatched_results,
        "unmatchedSatisfactionCount": unmatched_satisfaction,
        "applicationFallbackRowCount": fallback_rows,
    }


def _build_online_daily_recruitment(
    db: Session, *, month: str
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs = list_scope_orgs(ONLINE_SCOPE)
    day_map: dict[tuple[str, str], dict[str, Any]] = {}
    snapshot_counts_by_day = {
        date(month_start.year, month_start.month, day).isoformat(): _snapshot_counts_by_org(
            db,
            scope=ONLINE_SCOPE,
            snapshot_date=date(month_start.year, month_start.month, day),
        )
        for day in range(1, month_end.day + 1)
    }
    month_end_snapshot_counts = snapshot_counts_by_day[month_end.isoformat()]

    def get_day_metric(stat_date: date, org: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), org)
        if key not in day_map:
            day_map[key] = {
                "authorizedPosts": 0,
                "currentPosts": 0,
                "neededPosts": 0,
                "bossInviteCount": 0,
                "bossInterviewCount": 0,
                "zhilianInviteCount": 0,
                "zhilianInterviewCount": 0,
                "otherPlatformInviteCount": 0,
                "otherPlatformInterviewCount": 0,
                "onboardCount": 0,
                "newStaffRetentionCount": 0,
                "regularizedCount": 0,
                "plannedTransferCount": 0,
                "actualTransferCount": 0,
                "plannedOptimizeCount": 0,
                "actualOptimizeCount": 0,
                "resignCount": 0,
                "transferNames": [],
                "optimizeNames": [],
                "resignNames": [],
            }
        return day_map[key]

    departure_by_person: dict[str, str] = {}
    for record in (
        db.query(ResignationApproval)
        .filter(ResignationApproval.status == "approved")
        .all()
    ):
        org = normalize_online_org(record.campus)
        if not org or not record.leave_date:
            continue
        name_key = f"{org}:{normalize_text(record.name).replace(' ', '')}"
        current = departure_by_person.get(name_key)
        if not current or record.leave_date.isoformat() < current:
            departure_by_person[name_key] = record.leave_date.isoformat()
        if month_start <= record.leave_date <= month_end:
            get_day_metric(record.leave_date, org)["resignCount"] += 1

    for record in (
        db.query(UnpaidLeaveApplication)
        .filter(UnpaidLeaveApplication.status == "approved")
        .all()
    ):
        org = normalize_online_org(record.campus)
        leave_date = (
            record.completed_at.date() if record.completed_at else record.fill_date
        )
        if not org or not leave_date:
            continue
        name_key = f"{org}:{normalize_text(record.name).replace(' ', '')}"
        current = departure_by_person.get(name_key)
        if not current or leave_date.isoformat() < current:
            departure_by_person[name_key] = leave_date.isoformat()
        if month_start <= leave_date <= month_end:
            get_day_metric(leave_date, org)["resignCount"] += 1

    requests = (
        db.query(RecruitmentRequest)
        .order_by(RecruitmentRequest.apply_date.desc())
        .all()
    )
    for record in requests:
        resolved_scope = resolve_recruitment_request_scope(
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        org = resolve_recruitment_request_org_name(
            ONLINE_SCOPE,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        if resolved_scope != ONLINE_SCOPE or not org or not record.apply_date:
            continue
        if record.status == "approved" and month_start <= record.apply_date <= month_end:
            get_day_metric(record.apply_date, org)["neededPosts"] += (
                record.headcount or 0
            )

    interviews = db.query(InterviewRegistration).all()
    unmatched_interviews = 0
    retention_cutoff = min(date.today(), month_end).isoformat()
    for record in interviews:
        resolved_scope = resolve_interview_registration_scope(
            campus=record.campus_name,
            position=record.position,
        )
        org = resolve_interview_registration_org_name(
            ONLINE_SCOPE,
            campus=record.campus_name,
            position=record.position,
        )
        invite_date = record.invite_date
        onboard_date = record.onboard_date
        if resolved_scope != ONLINE_SCOPE or not org:
            if (invite_date and month_start <= invite_date <= month_end) or (
                onboard_date and month_start <= onboard_date <= month_end
            ):
                unmatched_interviews += 1
            continue

        source = normalize_text(record.source).lower()
        source_key = "other"
        if "boss" in source:
            source_key = "boss"
        elif "智联" in source:
            source_key = "zhilian"

        attended = (
            record.attended_first == "是"
            or record.attended_second == "是"
            or record.first_hire_decision == "是"
            or record.final_hire_decision == "是"
            or record.reported == "是"
        )

        if invite_date and month_start <= invite_date <= month_end:
            target = get_day_metric(invite_date, org)
            if attended:
                target[
                    (
                        f"{source_key}InterviewCount"
                        if source_key != "other"
                        else "otherPlatformInterviewCount"
                    )
                ] += 1

        if (
            record.reported == "是"
            and onboard_date
            and month_start <= onboard_date <= month_end
        ):
            target = get_day_metric(onboard_date, org)
            target["onboardCount"] += 1
            name_key = f"{org}:{normalize_text(record.name).replace(' ', '')}"
            departure_date = departure_by_person.get(name_key)
            if (
                not departure_date
                or departure_date < onboard_date.isoformat()
                or departure_date > retention_cutoff
            ):
                target["newStaffRetentionCount"] += 1

    for record in db.query(TransferApplication).all():
        org = normalize_online_org(record.campus)
        if not org:
            continue
        if (
            record.status in {"pending", "approved"}
            and record.apply_date
            and month_start <= record.apply_date <= month_end
        ):
            get_day_metric(record.apply_date, org)["plannedTransferCount"] += 1
        completed_date = (
            record.completed_at.date() if record.completed_at else record.apply_date
        )
        if (
            record.status == "approved"
            and completed_date
            and month_start <= completed_date <= month_end
        ):
            get_day_metric(completed_date, org)["actualTransferCount"] += 1

    for entry in list_manual_recruitment_entries(
        db, scope=ONLINE_SCOPE, start_date=month_start, end_date=month_end
    ):
        org = normalize_online_org(entry.org_name)
        if not org:
            continue
        target = get_day_metric(entry.stat_date, org)
        target["authorizedPosts"] = entry.authorized_posts
        target["currentPosts"] = entry.current_posts
        target["bossInviteCount"] += entry.boss_invite_count
        target["zhilianInviteCount"] += entry.zhilian_invite_count
        target["otherPlatformInviteCount"] += entry.other_platform_invite_count
        target["plannedOptimizeCount"] += entry.planned_optimize_count
        target["actualOptimizeCount"] += entry.actual_optimize_count
        target["transferNames"] = _unique_names(
            target["transferNames"] + _deserialize_names(entry.transfer_names_json)
        )
        target["optimizeNames"] = _unique_names(
            target["optimizeNames"] + _deserialize_names(entry.optimize_names_json)
        )
        target["resignNames"] = _unique_names(
            target["resignNames"] + _deserialize_names(entry.resign_names_json)
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_snapshot_counts = snapshot_counts_by_day[stat_date.isoformat()]
        for org in orgs:
            _apply_recruitment_snapshot_metrics(
                get_day_metric(stat_date, org),
                day_snapshot_counts,
                org,
            )

    def sum_rows(items: list[dict[str, Any]], include_snapshot: bool) -> dict[str, Any]:
        result = get_day_metric(month_start, orgs[0]).copy()
        for key in list(result.keys()):
            if isinstance(result[key], list):
                result[key] = []
            else:
                result[key] = 0
        numeric_keys = [
            key for key, value in result.items() if not isinstance(value, list)
        ]
        if not include_snapshot:
            numeric_keys = [
                key
                for key in numeric_keys
                if key not in {"authorizedPosts", "currentPosts", "regularizedCount"}
            ]
        for item in items:
            for key in numeric_keys:
                result[key] += item.get(key, 0)
            result["transferNames"] = _unique_names(
                result["transferNames"] + item.get("transferNames", [])
            )
            result["optimizeNames"] = _unique_names(
                result["optimizeNames"] + item.get("optimizeNames", [])
            )
            result["resignNames"] = _unique_names(
                result["resignNames"] + item.get("resignNames", [])
            )
        return result

    def to_row(base: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
        total_invites = (
            data["bossInviteCount"]
            + data["zhilianInviteCount"]
            + data["otherPlatformInviteCount"]
        )
        total_interviews = (
            data["bossInterviewCount"]
            + data["zhilianInterviewCount"]
            + data["otherPlatformInterviewCount"]
        )
        return {
            **base,
            **data,
            "interviewArrivalRate": _safe_percent(total_interviews, total_invites),
            "onboardRate": _safe_percent(data["onboardCount"], total_interviews),
            "newStaffRetentionRate": _safe_percent(
                data["newStaffRetentionCount"], data["onboardCount"]
            ),
            "resignRate": _safe_percent(data["resignCount"], data["currentPosts"]),
        }

    department_subtotals: dict[str, dict[str, Any]] = {}
    for org in orgs:
        day_rows = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            day_rows.append(
                day_map.get(
                    (stat_date.isoformat(), org), get_day_metric(stat_date, org)
                )
            )
        department_subtotals[org] = sum_rows(day_rows, include_snapshot=False)
        _apply_recruitment_snapshot_metrics(
            department_subtotals[org],
            month_end_snapshot_counts,
            org,
        )

    grand_total = sum_rows(list(department_subtotals.values()), include_snapshot=True)
    grand_total.update(
        _sum_recruitment_snapshot_metrics(month_end_snapshot_counts, list(orgs))
    )
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-recruit-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]
    for index, org in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-recruit-department-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                department_subtotals[org],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            day_map.get((stat_date.isoformat(), org), get_day_metric(stat_date, org))
            for org in orgs
        ]
        day_total = sum_rows(day_items, include_snapshot=True)
        day_total.update(
            _sum_recruitment_snapshot_metrics(
                snapshot_counts_by_day[stat_date.isoformat()],
                list(orgs),
            )
        )
        rows.append(
            to_row(
                {
                    "key": f"100-recruit-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                day_total,
            )
        )
        for index, org in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-recruit-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    day_map.get(
                        (stat_date.isoformat(), org), get_day_metric(stat_date, org)
                    ),
                )
            )

    return rows, {"unmatchedInterviewCount": unmatched_interviews}


def _build_online_daily_training(
    db: Session, *, month: str
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs = list_scope_orgs(ONLINE_SCOPE)
    metric_map: dict[tuple[str, str], dict[str, Any]] = {}
    fallback_map: dict[tuple[str, str], dict[str, Any]] = {}

    def get_metric(stat_date: date, org: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), org)
        if key not in metric_map:
            metric_map[key] = {
                "trainingSessions": 0,
                "trainingDuration": 0.0,
                "participants": 0,
                "scoreTotal": 0.0,
                "passCount": 0,
                "failCount": 0,
                "failNames": [],
                "satisfactionTotalScore": 0.0,
                "satisfactionResponseCount": 0,
                "totalCost": 0.0,
            }
        return metric_map[key]

    unmatched_results = 0
    unmatched_satisfaction = 0
    fallback_rows = 0

    for record in _list_training_results_in_range(db, month_start, month_end):
        org = normalize_online_org(record.campus)
        if not org:
            unmatched_results += 1
            continue
        target = get_metric(record.training_date, org)
        trainees = []
        try:
            trainees = json.loads(record.trainees_json or "[]")
        except json.JSONDecodeError:
            trainees = []
        fail_names = [
            item.get("name", "")
            for item in trainees
            if int(item.get("composite_score", 0)) < 60
        ]
        total_composite = (
            sum(int(item.get("composite_score", 0)) for item in trainees)
            if trainees
            else _to_float(record.average_score) * int(record.actual_count or 0)
        )
        target["trainingSessions"] += 1
        target["trainingDuration"] += _to_float(record.training_hours)
        target["participants"] += int(record.actual_count or 0)
        target["scoreTotal"] += total_composite
        target["passCount"] += int(record.pass_count or 0)
        target["failCount"] += int(record.fail_count or 0)
        target["failNames"] = _unique_names(
            target["failNames"] + [name for name in fail_names if name]
        )
        target["totalCost"] += _to_float(record.total_cost)

    for record in _list_training_satisfaction_in_range(db, month_start, month_end):
        org = normalize_online_org(record.department) or normalize_online_org(
            record.training_location
        )
        if not org:
            unmatched_satisfaction += 1
            continue
        target = get_metric(record.training_date, org)
        target["satisfactionTotalScore"] += _training_satisfaction_total_score(record)
        target["satisfactionResponseCount"] += 1

    for record in _list_training_applications_in_range(db, month_start, month_end):
        org = normalize_online_org(record.campus)
        if not org:
            continue
        key = (record.start_date.isoformat(), org)
        fallback = fallback_map.setdefault(
            key,
            {
                "trainingSessions": 0,
                "trainingDuration": 0.0,
                "totalCost": 0.0,
            },
        )
        fallback["trainingSessions"] += 1
        fallback["trainingDuration"] += _to_float(record.total_hours)
        fallback["totalCost"] += _to_float(record.cost_total) + _to_float(
            record.cost_other
        )

    def clone_metric(metric: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        base = {
            "trainingSessions": 0,
            "trainingDuration": 0.0,
            "participants": 0,
            "scoreTotal": 0.0,
            "passCount": 0,
            "failCount": 0,
            "failNames": [],
            "satisfactionTotalScore": 0.0,
            "satisfactionResponseCount": 0,
            "totalCost": 0.0,
        }
        if not metric:
            return base
        return {
            **base,
            **metric,
            "failNames": list(metric.get("failNames", [])),
        }

    resolved_map: dict[tuple[str, str], dict[str, Any]] = {}
    for key in set(metric_map) | set(fallback_map):
        resolved = clone_metric(metric_map.get(key))
        fallback_metric = fallback_map.get(key)
        if fallback_metric and resolved["trainingSessions"] == 0:
            resolved["trainingSessions"] = fallback_metric["trainingSessions"]
            resolved["trainingDuration"] = fallback_metric["trainingDuration"]
            resolved["totalCost"] = fallback_metric["totalCost"]
            fallback_rows += 1
        resolved_map[key] = resolved

    def sum_metrics(items: list[dict[str, Any]]) -> dict[str, Any]:
        result = clone_metric()
        for item in items:
            result["trainingSessions"] += item["trainingSessions"]
            result["trainingDuration"] += item["trainingDuration"]
            result["participants"] += item["participants"]
            result["scoreTotal"] += item["scoreTotal"]
            result["passCount"] += item["passCount"]
            result["failCount"] += item["failCount"]
            result["failNames"] = _unique_names(result["failNames"] + item["failNames"])
            result["satisfactionTotalScore"] += item["satisfactionTotalScore"]
            result["satisfactionResponseCount"] += item["satisfactionResponseCount"]
            result["totalCost"] += item["totalCost"]
        return result

    def to_row(base: dict[str, Any], metric: dict[str, Any]) -> dict[str, Any]:
        participants = metric["participants"]
        avg_score = metric["scoreTotal"] / participants if participants > 0 else 0
        per_capita_duration = (
            metric["trainingDuration"] / participants if participants > 0 else 0
        )
        satisfaction_score = (
            metric["satisfactionTotalScore"] / metric["satisfactionResponseCount"]
            if metric["satisfactionResponseCount"] > 0
            else 0
        )
        return {
            **base,
            "trainingSessions": metric["trainingSessions"],
            "trainingDuration": _round(metric["trainingDuration"], 1),
            "participants": participants,
            "perCapitaDuration": (
                _round(per_capita_duration, 2) if participants > 0 else "-"
            ),
            "averageScore": _round(avg_score, 2) if participants > 0 else "-",
            "passCount": metric["passCount"],
            "failCount": metric["failCount"],
            "failNames": metric["failNames"],
            "passRate": _safe_percent(metric["passCount"], participants),
            "satisfactionScore": (
                _round(satisfaction_score, 2)
                if metric["satisfactionResponseCount"] > 0
                else "-"
            ),
            "totalCost": _round(metric["totalCost"], 2),
            "perCapitaCost": (
                _round(metric["totalCost"] / participants, 2)
                if participants > 0
                else "-"
            ),
        }

    subtotals: dict[str, dict[str, Any]] = {}
    for org in orgs:
        daily_items = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            daily_items.append(
                resolved_map.get((stat_date.isoformat(), org), clone_metric())
            )
        subtotals[org] = sum_metrics(daily_items)

    grand_total = sum_metrics(list(subtotals.values()))
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-training-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]

    for index, org in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-training-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                subtotals[org],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            resolved_map.get((stat_date.isoformat(), org), clone_metric())
            for org in orgs
        ]
        rows.append(
            to_row(
                {
                    "key": f"100-training-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                sum_metrics(day_items),
            )
        )
        for index, org in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-training-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    resolved_map.get((stat_date.isoformat(), org), clone_metric()),
                )
            )

    return rows, {
        "unmatchedTrainingResultCount": unmatched_results,
        "unmatchedSatisfactionCount": unmatched_satisfaction,
        "applicationFallbackRowCount": fallback_rows,
    }


def _build_daily_salary_welfare(
    db: Session,
    *,
    scope: str,
    month: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    normalized_scope = normalize_scope(scope)
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs: list[str] = [
        org for org in list_scope_orgs(normalized_scope) if org is not None
    ]
    metric_map: dict[tuple[str, str], dict[str, Any]] = {}
    source_record_count = 0

    def get_metric(stat_date: date, org: str) -> dict[str, Any]:
        key = (stat_date.isoformat(), org)
        if key not in metric_map:
            metric_map[key] = {
                "salary": 0.0,
                "annualWelfareTotal": 0.0,
                "monthlyIncentiveTotal": 0.0,
                "temporaryRewardTotal": 0.0,
                "deduction": 0.0,
                "cadreSalaryTotal": 0.0,
                "staffSalaryTotal": 0.0,
                "salaryTotal": 0.0,
                "personNames": [],
                "positions": [],
                "positionCategories": [],
            }
        return metric_map[key]

    for fact in list_salary_welfare_facts(
        db,
        scope=normalized_scope,
        start_date=month_start,
        end_date=month_end,
    ):
        org = _normalize_scope_org_name(normalized_scope, fact.org_name)
        if not org:
            continue
        source_record_count += 1
        target = get_metric(fact.stat_date, org)
        target["salary"] += _to_float(fact.salary)
        target["annualWelfareTotal"] += _to_float(fact.annual_welfare_total)
        target["monthlyIncentiveTotal"] += _to_float(fact.monthly_incentive_total)
        target["temporaryRewardTotal"] += _to_float(fact.temporary_reward_total)
        target["deduction"] += _to_float(fact.deduction)
        target["cadreSalaryTotal"] += _to_float(fact.cadre_salary_total)
        target["staffSalaryTotal"] += _to_float(fact.staff_salary_total)
        target["salaryTotal"] += _to_float(fact.cadre_salary_total) + _to_float(
            fact.staff_salary_total
        )
        if fact.person_name:
            target["personNames"] = _unique_names(
                target["personNames"] + [fact.person_name]
            )
        if fact.position:
            target["positions"] = _unique_names(target["positions"] + [fact.position])
        if fact.position_category:
            target["positionCategories"] = _unique_names(
                target["positionCategories"] + [fact.position_category]
            )

    def clone_metric(metric: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        base = {
            "salary": 0.0,
            "annualWelfareTotal": 0.0,
            "monthlyIncentiveTotal": 0.0,
            "temporaryRewardTotal": 0.0,
            "deduction": 0.0,
            "cadreSalaryTotal": 0.0,
            "staffSalaryTotal": 0.0,
            "salaryTotal": 0.0,
            "personNames": [],
            "positions": [],
            "positionCategories": [],
        }
        if not metric:
            return base
        return {
            **base,
            **metric,
            "personNames": list(metric.get("personNames", [])),
            "positions": list(metric.get("positions", [])),
            "positionCategories": list(metric.get("positionCategories", [])),
        }

    def sum_metrics(items: list[dict[str, Any]]) -> dict[str, Any]:
        result = clone_metric()
        for item in items:
            result["salary"] += _to_float(item.get("salary"))
            result["annualWelfareTotal"] += _to_float(item.get("annualWelfareTotal"))
            result["monthlyIncentiveTotal"] += _to_float(
                item.get("monthlyIncentiveTotal")
            )
            result["temporaryRewardTotal"] += _to_float(
                item.get("temporaryRewardTotal")
            )
            result["deduction"] += _to_float(item.get("deduction"))
            result["cadreSalaryTotal"] += _to_float(item.get("cadreSalaryTotal"))
            result["staffSalaryTotal"] += _to_float(item.get("staffSalaryTotal"))
            result["salaryTotal"] += _to_float(item.get("salaryTotal"))
            result["personNames"] = _unique_names(
                result["personNames"] + item.get("personNames", [])
            )
            result["positions"] = _unique_names(
                result["positions"] + item.get("positions", [])
            )
            result["positionCategories"] = _unique_names(
                result["positionCategories"] + item.get("positionCategories", [])
            )
        return result

    def position_category_label(categories: list[str]) -> str:
        if not categories:
            return ""
        if len(categories) == 1:
            return categories[0]
        if set(categories) >= {"干部", "员工"}:
            return "干部/员工"
        return "、".join(categories)

    def to_row(base: dict[str, Any], metric: dict[str, Any]) -> dict[str, Any]:
        return {
            **base,
            "personName": "、".join(metric["personNames"]),
            "position": "、".join(metric["positions"]),
            "positionCategory": position_category_label(metric["positionCategories"]),
            "salary": _round(metric["salary"], 2),
            "annualWelfareTotal": _round(metric["annualWelfareTotal"], 2),
            "monthlyIncentiveTotal": _round(metric["monthlyIncentiveTotal"], 2),
            "temporaryRewardTotal": _round(metric["temporaryRewardTotal"], 2),
            "deduction": _round(metric["deduction"], 2),
            "cadreSalaryTotal": _round(metric["cadreSalaryTotal"], 2),
            "staffSalaryTotal": _round(metric["staffSalaryTotal"], 2),
            "salaryTotal": _round(metric["salaryTotal"], 2),
        }

    subtotals: dict[str, dict[str, Any]] = {}
    for org in orgs:
        items = []
        for day in range(1, month_end.day + 1):
            stat_date = date(month_start.year, month_start.month, day)
            items.append(metric_map.get((stat_date.isoformat(), org), clone_metric()))
        subtotals[org] = sum_metrics(items)

    grand_total = sum_metrics(list(subtotals.values()))
    rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-salary-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]

    for index, org in enumerate(orgs):
        rows.append(
            to_row(
                {
                    "key": f"010-salary-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                subtotals[org],
            )
        )

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        day_items = [
            metric_map.get((stat_date.isoformat(), org), clone_metric()) for org in orgs
        ]
        rows.append(
            to_row(
                {
                    "key": f"100-salary-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                sum_metrics(day_items),
            )
        )
        for index, org in enumerate(orgs):
            rows.append(
                to_row(
                    {
                        "key": f"110-salary-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    metric_map.get((stat_date.isoformat(), org), clone_metric()),
                )
            )

    return rows, {"sourceRecordCount": source_record_count}


def _build_daily_social_insurance(
    db: Session,
    *,
    scope: str,
    month: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    normalized_scope = normalize_scope(scope)
    month_start = _month_start(month)
    month_end = _month_end(month)
    orgs: list[str] = [
        org for org in list_scope_orgs(normalized_scope) if org is not None
    ]
    opening_payment_base: dict[str, float] = {org: 0.0 for org in orgs}
    opening_names: dict[str, list[str]] = {org: [] for org in orgs}
    daily_delta_payment_base: dict[tuple[str, str], float] = defaultdict(float)
    daily_delta_names: dict[tuple[str, str], list[str]] = defaultdict(list)
    approved_application_count = 0

    for app in (
        db.query(SocialInsuranceApplication)
        .filter(
            SocialInsuranceApplication.status == "approved",
            SocialInsuranceApplication.hr_start_date.isnot(None),
            SocialInsuranceApplication.hr_start_date <= month_end,
        )
        .all()
    ):
        org = (
            normalize_hq_department(app.department)
            if normalized_scope == HQ_SCOPE
            else _normalize_scope_org_name(normalized_scope, app.campus)
            or _normalize_scope_org_name(normalized_scope, app.department)
        )
        if not org or not app.hr_start_date:
            continue
        approved_application_count += 1
        base = _to_float(app.hr_payment_base)
        if app.hr_start_date < month_start:
            opening_payment_base[org] += base
            if app.name:
                opening_names[org] = _unique_names(opening_names[org] + [app.name])
            continue
        key = (app.hr_start_date.isoformat(), org)
        daily_delta_payment_base[key] += base
        if app.name:
            daily_delta_names[key] = _unique_names(daily_delta_names[key] + [app.name])

    running_payment_base = {org: opening_payment_base.get(org, 0.0) for org in orgs}
    running_names = {org: list(opening_names.get(org, [])) for org in orgs}
    final_metrics: dict[str, dict[str, Any]] = {}
    rows: list[dict[str, Any]] = []

    def sum_payloads(items: list[dict[str, Any]]) -> dict[str, Any]:
        should_count = sum(_to_float(item.get("shouldInsureCount")) for item in items)
        actual_count = sum(_to_float(item.get("actualInsureCount")) for item in items)
        payment_base = sum(_to_float(item.get("paymentBase")) for item in items)
        names: list[str] = []
        for item in items:
            value = normalize_text(item.get("personName"))
            if value:
                names = _unique_names(names + value.split("、"))
        return _social_metric_payload(
            should_count=should_count,
            actual_count=actual_count,
            payment_base=payment_base,
            person_name="、".join(names),
        )

    def to_row(base: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        return {**base, **payload}

    for day in range(1, month_end.day + 1):
        stat_date = date(month_start.year, month_start.month, day)
        stat_key = stat_date.isoformat()
        counts = _snapshot_counts_by_org(
            db, scope=normalized_scope, snapshot_date=stat_date
        )
        day_items: list[dict[str, Any]] = []
        rows_for_day: list[dict[str, Any]] = []
        for index, org in enumerate(orgs):
            running_payment_base[org] += daily_delta_payment_base.get(
                (stat_key, org), 0.0
            )
            running_names[org] = _unique_names(
                running_names[org] + daily_delta_names.get((stat_key, org), [])
            )
            payload = _social_metric_payload(
                should_count=counts.get(org, {}).get("should_insure_count", 0),
                actual_count=counts.get(org, {}).get("insured_count", 0),
                payment_base=running_payment_base[org],
                person_name="、".join(running_names[org]),
            )
            final_metrics[org] = payload
            day_items.append(payload)
            rows_for_day.append(
                to_row(
                    {
                        "key": f"110-insurance-day-{day:02d}-{index:02d}",
                        "rowType": "departmentDay",
                        "date": str(day),
                        "dateGroupFirstRow": False,
                        "dateGroupSize": len(orgs) + 1,
                        "department": org,
                        "dayOfMonth": day,
                    },
                    payload,
                )
            )
        rows.append(
            to_row(
                {
                    "key": f"100-insurance-day-total-{day:02d}",
                    "rowType": "dayTotal",
                    "date": str(day),
                    "dateGroupFirstRow": True,
                    "dateGroupSize": len(orgs) + 1,
                    "department": "合计",
                    "dayOfMonth": day,
                },
                sum_payloads(day_items),
            )
        )
        rows.extend(rows_for_day)

    subtotals = {org: final_metrics.get(org, _social_metric_payload()) for org in orgs}
    grand_total = sum_payloads(list(subtotals.values()))
    result_rows: list[dict[str, Any]] = [
        to_row(
            {
                "key": "000-insurance-grand-total",
                "rowType": "grandTotal",
                "date": "总合计",
                "dateGroupFirstRow": True,
                "dateGroupSize": 1,
                "department": "",
            },
            grand_total,
        )
    ]
    for index, org in enumerate(orgs):
        result_rows.append(
            to_row(
                {
                    "key": f"010-insurance-subtotal-{index:02d}",
                    "rowType": "departmentSubtotal",
                    "date": "月合计",
                    "dateGroupFirstRow": index == 0,
                    "dateGroupSize": len(orgs),
                    "department": org,
                },
                subtotals[org],
            )
        )
    result_rows.extend(rows)
    return result_rows, {"approvedApplicationCount": approved_application_count}


def build_daily_dashboard(db: Session, *, scope: str, month: str) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    sections: dict[str, Any] = {}
    if normalized_scope == HQ_SCOPE:
        recruitment_rows, recruitment_warnings = _build_hq_daily_recruitment(
            db, month=month
        )
        training_rows, training_warnings = _build_hq_daily_training(db, month=month)
    elif normalized_scope == OFFLINE_SCOPE:
        recruitment_rows, recruitment_warnings = _build_offline_daily_recruitment(
            db, month=month
        )
        training_rows, training_warnings = _build_offline_daily_training(
            db, month=month
        )
    else:
        recruitment_rows, recruitment_warnings = _build_online_daily_recruitment(
            db, month=month
        )
        training_rows, training_warnings = _build_online_daily_training(db, month=month)

    salary_rows, salary_warnings = _build_daily_salary_welfare(
        db,
        scope=normalized_scope,
        month=month,
    )
    insurance_rows, insurance_warnings = _build_daily_social_insurance(
        db,
        scope=normalized_scope,
        month=month,
    )
    _store_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=normalized_scope,
        domain="recruitment",
        period=month,
        rows=recruitment_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=normalized_scope,
        domain="training",
        period=month,
        rows=training_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=normalized_scope,
        domain="salary_welfare",
        period=month,
        rows=salary_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=normalized_scope,
        domain="social_insurance",
        period=month,
        rows=insurance_rows,
    )
    sections["recruitment"] = {
        "rows": _load_aggregate_rows(
            db,
            model=DashboardDailyAggregate,
            scope=normalized_scope,
            domain="recruitment",
            period=month,
        ),
        "warnings": recruitment_warnings,
    }
    sections["training"] = {
        "rows": _load_aggregate_rows(
            db,
            model=DashboardDailyAggregate,
            scope=normalized_scope,
            domain="training",
            period=month,
        ),
        "warnings": training_warnings,
    }
    sections["salary_welfare"] = {
        "rows": _load_aggregate_rows(
            db,
            model=DashboardDailyAggregate,
            scope=normalized_scope,
            domain="salary_welfare",
            period=month,
        ),
        "warnings": salary_warnings,
    }
    sections["social_insurance"] = {
        "rows": _load_aggregate_rows(
            db,
            model=DashboardDailyAggregate,
            scope=normalized_scope,
            domain="social_insurance",
            period=month,
        ),
        "warnings": insurance_warnings,
    }
    return {
        "scope": normalized_scope,
        "month": month,
        "sections": sections,
    }


_MONTHLY_DOMAINS = ("hr_allocation", "training", "salary_welfare", "social_insurance")

_YEARLY_DOMAINS = (
    "summary", "post_staff", "hr_allocation", "training",
    "salary_welfare", "social_insurance", "performance",
)


def build_monthly_dashboard(db: Session, *, scope: str, year: str) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    orgs: list[str] = [
        org for org in list_scope_orgs(normalized_scope) if org is not None
    ]
    insurance_orgs = _insurance_orgs_for_scope(normalized_scope)
    months = _year_months(year)
    hr_rows: list[dict[str, Any]] = []
    training_rows: list[dict[str, Any]] = []
    salary_rows: list[dict[str, Any]] = []
    insurance_rows: list[dict[str, Any]] = []

    monthly_recruitment: dict[tuple[str, str], dict[str, Any]] = {}
    monthly_training: dict[tuple[str, str], dict[str, Any]] = {}
    monthly_salary: dict[tuple[str, str], dict[str, Any]] = defaultdict(
        lambda: {
            "salary": 0.0,
            "annualWelfareTotal": 0.0,
            "monthlyIncentiveTotal": 0.0,
            "temporaryRewardTotal": 0.0,
            "deduction": 0.0,
            "cadreSalaryTotal": 0.0,
            "staffSalaryTotal": 0.0,
            "salaryTotal": 0.0,
        }
    )
    monthly_insurance: dict[tuple[str, str], dict[str, Any]] = defaultdict(
        lambda: {
            "shouldInsureCount": 0,
            "actualInsureCount": 0,
            "applicationPaymentBase": 0.0,
            "summaryRecordCount": 0,
            "summaryActualInsureCount": 0,
            "summaryTotalPayment": 0.0,
            "summaryCompanyTotalPayment": 0.0,
            "summaryPersonalTotalPayment": 0.0,
            "summaryServiceFeeTotal": 0.0,
            "summaryPaymentBase": 0.0,
            "summaryInjuryCompanyRate": 0.0,
            "summaryPensionCompanyRate": 0.0,
            "summaryPensionPersonalRate": 0.0,
            "summaryUnemploymentCompanyRate": 0.0,
            "summaryUnemploymentPersonalRate": 0.0,
            "summaryMedicalCompanyRate": 0.0,
            "summaryMedicalPersonalRate": 0.0,
        }
    )
    all_insurance_summaries = db.query(SocialInsuranceCostSummary).all()
    insurance_summaries_by_month: dict[str, list[SocialInsuranceCostSummary]] = defaultdict(list)
    for summary in all_insurance_summaries:
        month_key = _normalize_period_to_month_key(summary.period)
        if month_key:
            insurance_summaries_by_month[month_key].append(summary)
    insurance_employee_index = _build_insurance_employee_master_index(
        db,
        all_insurance_summaries,
    )

    from app.crud.human_resources import dashboard as dashboard_crud

    for month in months:
        daily_dashboard = dashboard_crud.read_daily_dashboard(
            db,
            scope=normalized_scope,
            month=month,
        ) or dashboard_crud.build_daily_dashboard(
            db,
            scope=normalized_scope,
            month=month,
        )
        recruitment_rows = (
            daily_dashboard["sections"].get("recruitment", {}).get("rows", [])
        )
        training_daily_rows = (
            daily_dashboard["sections"].get("training", {}).get("rows", [])
        )
        for row in recruitment_rows:
            if row.get("rowType") != "departmentSubtotal":
                continue
            key = (month, row["department"])
            monthly_recruitment[key] = {
                "authorizedPosts": row["authorizedPosts"],
                "currentPosts": row["currentPosts"],
                "neededPosts": row["neededPosts"],
                "inviteCount": row["bossInviteCount"]
                + row["zhilianInviteCount"]
                + row["otherPlatformInviteCount"],
                "interviewCount": row["bossInterviewCount"]
                + row["zhilianInterviewCount"]
                + row["otherPlatformInterviewCount"],
                "onboardCount": row["onboardCount"],
                "newRetentionCount": row["newStaffRetentionCount"],
                "transferCount": row["actualTransferCount"],
                "plannedOptimizeCount": row["plannedOptimizeCount"],
                "actualOptimizeCount": row["actualOptimizeCount"],
                "resignCount": row["resignCount"],
            }

        for row in training_daily_rows:
            if row.get("rowType") != "departmentSubtotal":
                continue
            key = (month, row["department"])
            monthly_training[key] = {
                "trainingSessions": row["trainingSessions"],
                "trainingParticipants": row["participants"],
                "avgTrainingDuration": (
                    row["perCapitaDuration"]
                    if isinstance(row["perCapitaDuration"], (int, float))
                    else 0
                ),
                "averageScore": (
                    row["averageScore"]
                    if isinstance(row["averageScore"], (int, float))
                    else 0
                ),
                "passParticipants": row["passCount"],
                "passList": "",
                "failParticipants": row["failCount"],
                "failList": "、".join(row["failNames"]) if row["failNames"] else "",
                "avgSatisfactionScore": (
                    row["satisfactionScore"]
                    if isinstance(row["satisfactionScore"], (int, float))
                    else 0
                ),
                "totalTrainingCost": row["totalCost"],
            }

        snapshot_date = _month_end(month)
        counts = _snapshot_counts_by_org(
            db, scope=normalized_scope, snapshot_date=snapshot_date
        )
        insurance_counts = _bucket_snapshot_counts_for_insurance(normalized_scope, counts)
        salary_facts = list_salary_welfare_facts(
            db,
            scope=normalized_scope,
            start_date=_month_start(month),
            end_date=snapshot_date,
        )
        for fact in salary_facts:
            org = (
                normalize_hq_department(fact.org_name)
                if normalized_scope == HQ_SCOPE
                else _normalize_scope_org_name(normalized_scope, fact.org_name)
            )
            if not org:
                continue
            target = monthly_salary[(month, org)]
            target["salary"] += _to_float(fact.salary)
            target["annualWelfareTotal"] += _to_float(fact.annual_welfare_total)
            target["monthlyIncentiveTotal"] += _to_float(fact.monthly_incentive_total)
            target["temporaryRewardTotal"] += _to_float(fact.temporary_reward_total)
            target["deduction"] += _to_float(fact.deduction)
            target["cadreSalaryTotal"] += _to_float(fact.cadre_salary_total)
            target["staffSalaryTotal"] += _to_float(fact.staff_salary_total)
            target["salaryTotal"] += _to_float(fact.cadre_salary_total) + _to_float(
                fact.staff_salary_total
            )

        insurance_apps = (
            db.query(SocialInsuranceApplication)
            .filter(
                SocialInsuranceApplication.status == "approved",
                SocialInsuranceApplication.hr_start_date.isnot(None),
                SocialInsuranceApplication.hr_start_date <= snapshot_date,
            )
            .all()
        )
        for department in insurance_orgs:
            target = monthly_insurance[(month, department)]
            target["shouldInsureCount"] = int(
                insurance_counts.get(department, {}).get("should_insure_count", 0)
            )
            target["actualInsureCount"] = int(
                insurance_counts.get(department, {}).get("insured_count", 0)
            )
        for app in insurance_apps:
            resolved_department = _resolve_insurance_org_name(
                normalized_scope,
                campus=app.campus,
                department=app.department,
            )
            if not resolved_department:
                continue
            target = monthly_insurance[(month, resolved_department)]
            target["applicationPaymentBase"] += _to_float(app.hr_payment_base)

        for summary in insurance_summaries_by_month.get(month, []):
            for employee in _parse_social_insurance_summary_employees(
                summary.employees_json
            ):
                _, resolved_department = _resolve_summary_employee_scope_and_org(
                    scope=normalized_scope,
                    summary=summary,
                    employee=employee,
                    employee_index=insurance_employee_index,
                )
                if not resolved_department:
                    continue
                metrics = _build_social_insurance_cost_summary_employee_metrics(
                    employee,
                    summary.injury_enterprise_rate,
                )
                target = monthly_insurance[(month, resolved_department)]
                target["summaryRecordCount"] += 1
                for key, value in metrics.items():
                    target[key] += value

    def sum_numeric(rows: list[dict[str, Any]], keys: list[str]) -> dict[str, Any]:
        result = {key: 0.0 for key in keys}
        for row in rows:
            for key in keys:
                result[key] += _to_float(row.get(key))
        return result

    # HR allocation
    all_hr_items = list(monthly_recruitment.values())
    grand_hr = sum_numeric(
        all_hr_items,
        [
            "authorizedPosts",
            "currentPosts",
            "neededPosts",
            "inviteCount",
            "interviewCount",
            "onboardCount",
            "newRetentionCount",
            "transferCount",
            "plannedOptimizeCount",
            "actualOptimizeCount",
            "resignCount",
        ],
    )
    grand_hr["currentHeadcount"] = sum(
        _snapshot_counts_by_org(
            db, scope=normalized_scope, snapshot_date=_month_end(month)
        )
        .get(org, {})
        .get("headcount", 0)
        for month in months
        for org in orgs
    )
    hr_rows.append(
        {
            "key": "000-hr-grand-total",
            "rowType": "grandTotal",
            "month": "总合计",
            "monthGroupFirstRow": True,
            "monthGroupSize": 1,
            "department": "",
            **grand_hr,
            "interviewArrivalRate": _safe_percent(
                grand_hr["interviewCount"], grand_hr["inviteCount"]
            ),
            "recruitCompletionRate": _safe_percent(
                grand_hr["onboardCount"], grand_hr["neededPosts"]
            ),
            "totalOnboardRate": _safe_percent(
                grand_hr["onboardCount"], grand_hr["interviewCount"]
            ),
            "newRetentionRate": _safe_percent(
                grand_hr["newRetentionCount"], grand_hr["onboardCount"]
            ),
            "resignRate": _safe_percent(
                grand_hr["resignCount"], grand_hr["currentHeadcount"]
            ),
        }
    )
    for index, org in enumerate(orgs):
        items = [monthly_recruitment.get((month, org), {}) for month in months]
        subtotal = sum_numeric(
            items,
            [
                "authorizedPosts",
                "currentPosts",
                "neededPosts",
                "inviteCount",
                "interviewCount",
                "onboardCount",
                "newRetentionCount",
                "transferCount",
                "plannedOptimizeCount",
                "actualOptimizeCount",
                "resignCount",
            ],
        )
        subtotal["currentHeadcount"] = sum(
            _snapshot_counts_by_org(
                db, scope=normalized_scope, snapshot_date=_month_end(month)
            )
            .get(org, {})
            .get("headcount", 0)
            for month in months
        )
        hr_rows.append(
            {
                "key": f"010-hr-subtotal-{index:02d}",
                "rowType": "monthSubtotal",
                "month": "月合计",
                "monthGroupFirstRow": index == 0,
                "monthGroupSize": len(orgs),
                "department": org,
                **subtotal,
                "interviewArrivalRate": _safe_percent(
                    subtotal["interviewCount"], subtotal["inviteCount"]
                ),
                "recruitCompletionRate": _safe_percent(
                    subtotal["onboardCount"], subtotal["neededPosts"]
                ),
                "totalOnboardRate": _safe_percent(
                    subtotal["onboardCount"], subtotal["interviewCount"]
                ),
                "newRetentionRate": _safe_percent(
                    subtotal["newRetentionCount"], subtotal["onboardCount"]
                ),
                "resignRate": _safe_percent(
                    subtotal["resignCount"], subtotal["currentHeadcount"]
                ),
            }
        )

    for month_index, month in enumerate(months, start=1):
        items = [monthly_recruitment.get((month, org), {}) for org in orgs]
        total = sum_numeric(
            items,
            [
                "authorizedPosts",
                "currentPosts",
                "neededPosts",
                "inviteCount",
                "interviewCount",
                "onboardCount",
                "newRetentionCount",
                "transferCount",
                "plannedOptimizeCount",
                "actualOptimizeCount",
                "resignCount",
            ],
        )
        total["currentHeadcount"] = sum(
            _snapshot_counts_by_org(
                db, scope=normalized_scope, snapshot_date=_month_end(month)
            )
            .get(org, {})
            .get("headcount", 0)
            for org in orgs
        )
        hr_rows.append(
            {
                "key": f"{100 + month_index:03d}-hr-month-0-total",
                "rowType": "month",
                "month": str(month_index),
                "monthGroupFirstRow": True,
                "monthGroupSize": len(orgs) + 1,
                "department": "合计",
                **total,
                "interviewArrivalRate": _safe_percent(
                    total["interviewCount"], total["inviteCount"]
                ),
                "recruitCompletionRate": _safe_percent(
                    total["onboardCount"], total["neededPosts"]
                ),
                "totalOnboardRate": _safe_percent(
                    total["onboardCount"], total["interviewCount"]
                ),
                "newRetentionRate": _safe_percent(
                    total["newRetentionCount"], total["onboardCount"]
                ),
                "resignRate": _safe_percent(
                    total["resignCount"], total["currentHeadcount"]
                ),
            }
        )
        for org_index, org in enumerate(orgs):
            item = monthly_recruitment.get((month, org), {})
            headcount = (
                _snapshot_counts_by_org(
                    db, scope=normalized_scope, snapshot_date=_month_end(month)
                )
                .get(org, {})
                .get("headcount", 0)
            )
            hr_rows.append(
                {
                    "key": f"{100 + month_index:03d}-hr-month-1-{org_index:02d}",
                    "rowType": "month",
                    "month": str(month_index),
                    "monthGroupFirstRow": False,
                    "monthGroupSize": len(orgs) + 1,
                    "department": org,
                    "authorizedPosts": item.get("authorizedPosts", ""),
                    "currentPosts": item.get("currentPosts", ""),
                    "neededPosts": item.get("neededPosts", ""),
                    "inviteCount": item.get("inviteCount", ""),
                    "interviewCount": item.get("interviewCount", ""),
                    "interviewArrivalRate": _safe_percent(
                        _to_float(item.get("interviewCount")),
                        _to_float(item.get("inviteCount")),
                    ),
                    "onboardCount": item.get("onboardCount", ""),
                    "recruitCompletionRate": _safe_percent(
                        _to_float(item.get("onboardCount")),
                        _to_float(item.get("neededPosts")),
                    ),
                    "totalOnboardRate": _safe_percent(
                        _to_float(item.get("onboardCount")),
                        _to_float(item.get("interviewCount")),
                    ),
                    "newRetentionCount": item.get("newRetentionCount", ""),
                    "newRetentionRate": _safe_percent(
                        _to_float(item.get("newRetentionCount")),
                        _to_float(item.get("onboardCount")),
                    ),
                    "currentHeadcount": headcount,
                    "transferCount": item.get("transferCount", ""),
                    "plannedOptimizeCount": item.get("plannedOptimizeCount", ""),
                    "actualOptimizeCount": item.get("actualOptimizeCount", ""),
                    "resignCount": item.get("resignCount", ""),
                    "resignRate": _safe_percent(
                        _to_float(item.get("resignCount")), headcount
                    ),
                }
            )

    # Training
    all_training_items = list(monthly_training.values())
    total_training_sessions = sum(
        _to_float(item.get("trainingSessions")) for item in all_training_items
    )
    total_training_participants = sum(
        _to_float(item.get("trainingParticipants")) for item in all_training_items
    )
    total_pass_participants = sum(
        _to_float(item.get("passParticipants")) for item in all_training_items
    )
    total_fail_participants = sum(
        _to_float(item.get("failParticipants")) for item in all_training_items
    )
    total_cost = sum(
        _to_float(item.get("totalTrainingCost")) for item in all_training_items
    )
    weighted_duration = sum(
        _to_float(item.get("avgTrainingDuration"))
        * _to_float(item.get("trainingParticipants"))
        for item in all_training_items
    )
    weighted_score = sum(
        _to_float(item.get("averageScore"))
        * _to_float(item.get("trainingParticipants"))
        for item in all_training_items
    )
    weighted_satisfaction = sum(
        _to_float(item.get("avgSatisfactionScore"))
        * _to_float(item.get("trainingParticipants"))
        for item in all_training_items
    )
    training_rows.append(
        {
            "key": "000-training-grand-total",
            "rowType": "grandTotal",
            "month": "总合计",
            "monthGroupFirstRow": True,
            "monthGroupSize": 1,
            "department": "",
            "trainingSessions": total_training_sessions,
            "trainingParticipants": total_training_participants,
            "avgTrainingDuration": (
                _round(weighted_duration / total_training_participants, 2)
                if total_training_participants
                else 0
            ),
            "averageScore": (
                _round(weighted_score / total_training_participants, 2)
                if total_training_participants
                else 0
            ),
            "passParticipants": total_pass_participants,
            "passList": "",
            "failParticipants": total_fail_participants,
            "failList": "",
            "passRate": _safe_percent(
                total_pass_participants, total_training_participants
            ),
            "avgSatisfactionScore": (
                _round(weighted_satisfaction / total_training_participants, 2)
                if total_training_participants
                else 0
            ),
            "totalTrainingCost": _round(total_cost, 2),
            "perCapitaCost": (
                _round(total_cost / total_training_participants, 2)
                if total_training_participants
                else "-"
            ),
        }
    )
    for index, org in enumerate(orgs):
        items = [monthly_training.get((month, org), {}) for month in months]
        participants = sum(
            _to_float(item.get("trainingParticipants")) for item in items
        )
        passes = sum(_to_float(item.get("passParticipants")) for item in items)
        fails = sum(_to_float(item.get("failParticipants")) for item in items)
        cost = sum(_to_float(item.get("totalTrainingCost")) for item in items)
        training_rows.append(
            {
                "key": f"010-training-subtotal-{index:02d}",
                "rowType": "monthSubtotal",
                "month": "月合计",
                "monthGroupFirstRow": index == 0,
                "monthGroupSize": len(orgs),
                "department": org,
                "trainingSessions": sum(
                    _to_float(item.get("trainingSessions")) for item in items
                ),
                "trainingParticipants": participants,
                "avgTrainingDuration": (
                    _round(
                        sum(
                            _to_float(item.get("avgTrainingDuration"))
                            * _to_float(item.get("trainingParticipants"))
                            for item in items
                        )
                        / participants,
                        2,
                    )
                    if participants
                    else 0
                ),
                "averageScore": (
                    _round(
                        sum(
                            _to_float(item.get("averageScore"))
                            * _to_float(item.get("trainingParticipants"))
                            for item in items
                        )
                        / participants,
                        2,
                    )
                    if participants
                    else 0
                ),
                "passParticipants": passes,
                "passList": "",
                "failParticipants": fails,
                "failList": "",
                "passRate": _safe_percent(passes, participants),
                "avgSatisfactionScore": (
                    _round(
                        sum(
                            _to_float(item.get("avgSatisfactionScore"))
                            * _to_float(item.get("trainingParticipants"))
                            for item in items
                        )
                        / participants,
                        2,
                    )
                    if participants
                    else 0
                ),
                "totalTrainingCost": _round(cost, 2),
                "perCapitaCost": (
                    _round(cost / participants, 2) if participants else "-"
                ),
            }
        )
    for month_index, month in enumerate(months, start=1):
        items = [monthly_training.get((month, org), {}) for org in orgs]
        participants = sum(
            _to_float(item.get("trainingParticipants")) for item in items
        )
        passes = sum(_to_float(item.get("passParticipants")) for item in items)
        fails = sum(_to_float(item.get("failParticipants")) for item in items)
        cost = sum(_to_float(item.get("totalTrainingCost")) for item in items)
        training_rows.append(
            {
                "key": f"{100 + month_index:03d}-training-month-0-total",
                "rowType": "month",
                "month": str(month_index),
                "monthGroupFirstRow": True,
                "monthGroupSize": len(orgs) + 1,
                "department": "合计",
                "trainingSessions": sum(
                    _to_float(item.get("trainingSessions")) for item in items
                ),
                "trainingParticipants": participants,
                "avgTrainingDuration": (
                    _round(
                        sum(
                            _to_float(item.get("avgTrainingDuration"))
                            * _to_float(item.get("trainingParticipants"))
                            for item in items
                        )
                        / participants,
                        2,
                    )
                    if participants
                    else 0
                ),
                "averageScore": (
                    _round(
                        sum(
                            _to_float(item.get("averageScore"))
                            * _to_float(item.get("trainingParticipants"))
                            for item in items
                        )
                        / participants,
                        2,
                    )
                    if participants
                    else 0
                ),
                "passParticipants": passes,
                "passList": "",
                "failParticipants": fails,
                "failList": "",
                "passRate": _safe_percent(passes, participants),
                "avgSatisfactionScore": (
                    _round(
                        sum(
                            _to_float(item.get("avgSatisfactionScore"))
                            * _to_float(item.get("trainingParticipants"))
                            for item in items
                        )
                        / participants,
                        2,
                    )
                    if participants
                    else 0
                ),
                "totalTrainingCost": _round(cost, 2),
                "perCapitaCost": (
                    _round(cost / participants, 2) if participants else "-"
                ),
            }
        )
        for org_index, org in enumerate(orgs):
            item = monthly_training.get((month, org), {})
            participants = _to_float(item.get("trainingParticipants"))
            cost = _to_float(item.get("totalTrainingCost"))
            training_rows.append(
                {
                    "key": f"{100 + month_index:03d}-training-month-1-{org_index:02d}",
                    "rowType": "month",
                    "month": str(month_index),
                    "monthGroupFirstRow": False,
                    "monthGroupSize": len(orgs) + 1,
                    "department": org,
                    "trainingSessions": item.get("trainingSessions", ""),
                    "trainingParticipants": item.get("trainingParticipants", ""),
                    "avgTrainingDuration": item.get("avgTrainingDuration", ""),
                    "averageScore": item.get("averageScore", ""),
                    "passParticipants": item.get("passParticipants", ""),
                    "passList": item.get("passList", ""),
                    "failParticipants": item.get("failParticipants", ""),
                    "failList": item.get("failList", ""),
                    "passRate": _safe_percent(
                        _to_float(item.get("passParticipants")), participants
                    ),
                    "avgSatisfactionScore": item.get("avgSatisfactionScore", ""),
                    "totalTrainingCost": item.get("totalTrainingCost", ""),
                    "perCapitaCost": (
                        _round(cost / participants, 2) if participants else "-"
                    ),
                }
            )

    # Salary & Insurance use facts/snapshots directly
    salary_fact_items = list(monthly_salary.items())
    salary_rows.append(
        {
            "key": "000-salary-grand-total",
            "rowType": "grandTotal",
            "month": "总合计",
            "monthGroupFirstRow": True,
            "monthGroupSize": 1,
            "department": "",
            "salary": _round(sum(item["salary"] for _, item in salary_fact_items), 2),
            "annualWelfareTotal": _round(
                sum(item["annualWelfareTotal"] for _, item in salary_fact_items), 2
            ),
            "monthlyIncentiveTotal": _round(
                sum(item["monthlyIncentiveTotal"] for _, item in salary_fact_items), 2
            ),
            "temporaryRewardTotal": _round(
                sum(item["temporaryRewardTotal"] for _, item in salary_fact_items), 2
            ),
            "deduction": _round(
                sum(item["deduction"] for _, item in salary_fact_items), 2
            ),
            "cadreSalaryTotal": _round(
                sum(item["cadreSalaryTotal"] for _, item in salary_fact_items), 2
            ),
            "staffSalaryTotal": _round(
                sum(item["staffSalaryTotal"] for _, item in salary_fact_items), 2
            ),
            "salaryTotal": _round(
                sum(item["salaryTotal"] for _, item in salary_fact_items), 2
            ),
        }
    )
    for index, org in enumerate(orgs):
        items = [monthly_salary[(month, org)] for month in months]
        salary_rows.append(
            {
                "key": f"010-salary-subtotal-{index:02d}",
                "rowType": "monthSubtotal",
                "month": "月合计",
                "monthGroupFirstRow": index == 0,
                "monthGroupSize": len(orgs),
                "department": org,
                "salary": _round(sum(item["salary"] for item in items), 2),
                "annualWelfareTotal": _round(
                    sum(item["annualWelfareTotal"] for item in items), 2
                ),
                "monthlyIncentiveTotal": _round(
                    sum(item["monthlyIncentiveTotal"] for item in items), 2
                ),
                "temporaryRewardTotal": _round(
                    sum(item["temporaryRewardTotal"] for item in items), 2
                ),
                "deduction": _round(sum(item["deduction"] for item in items), 2),
                "cadreSalaryTotal": _round(
                    sum(item["cadreSalaryTotal"] for item in items), 2
                ),
                "staffSalaryTotal": _round(
                    sum(item["staffSalaryTotal"] for item in items), 2
                ),
                "salaryTotal": _round(sum(item["salaryTotal"] for item in items), 2),
            }
        )
    for month_index, month in enumerate(months, start=1):
        items = [monthly_salary[(month, org)] for org in orgs]
        salary_rows.append(
            {
                "key": f"{100 + month_index:03d}-salary-month-0-total",
                "rowType": "month",
                "month": str(month_index),
                "monthGroupFirstRow": True,
                "monthGroupSize": len(orgs) + 1,
                "department": "合计",
                "salary": _round(sum(item["salary"] for item in items), 2),
                "annualWelfareTotal": _round(
                    sum(item["annualWelfareTotal"] for item in items), 2
                ),
                "monthlyIncentiveTotal": _round(
                    sum(item["monthlyIncentiveTotal"] for item in items), 2
                ),
                "temporaryRewardTotal": _round(
                    sum(item["temporaryRewardTotal"] for item in items), 2
                ),
                "deduction": _round(sum(item["deduction"] for item in items), 2),
                "cadreSalaryTotal": _round(
                    sum(item["cadreSalaryTotal"] for item in items), 2
                ),
                "staffSalaryTotal": _round(
                    sum(item["staffSalaryTotal"] for item in items), 2
                ),
                "salaryTotal": _round(sum(item["salaryTotal"] for item in items), 2),
            }
        )
        for org_index, org in enumerate(orgs):
            item = monthly_salary[(month, org)]
            salary_rows.append(
                {
                    "key": f"{100 + month_index:03d}-salary-month-1-{org_index:02d}",
                    "rowType": "month",
                    "month": str(month_index),
                    "monthGroupFirstRow": False,
                    "monthGroupSize": len(orgs) + 1,
                    "department": org,
                    **{
                        k: (_round(v, 2) if isinstance(v, (int, float)) else v)
                        for k, v in item.items()
                    },
                }
            )

    monthly_insurance_payloads = {
        key: _build_monthly_insurance_item_payload(item)
        for key, item in monthly_insurance.items()
    }
    insurance_items = list(monthly_insurance_payloads.items())
    insurance_rows.append(
        {
            "key": "000-insurance-grand-total",
            "rowType": "grandTotal",
            "month": "总合计",
            "monthGroupFirstRow": True,
            "monthGroupSize": 1,
            "department": "",
            **_insurance_metric_payload_from_items(
                [item for _, item in insurance_items]
            ),
        }
    )
    for index, org in enumerate(insurance_orgs):
        items = [monthly_insurance_payloads[(month, org)] for month in months]
        insurance_rows.append(
            {
                "key": f"010-insurance-subtotal-{index:02d}",
                "rowType": "monthSubtotal",
                "month": "月合计",
                "monthGroupFirstRow": index == 0,
                "monthGroupSize": len(insurance_orgs),
                "department": org,
                **_insurance_metric_payload_from_items(items),
            }
        )
    for month_index, month in enumerate(months, start=1):
        items = [monthly_insurance_payloads[(month, org)] for org in insurance_orgs]
        insurance_rows.append(
            {
                "key": f"{100 + month_index:03d}-insurance-month-0-total",
                "rowType": "month",
                "month": str(month_index),
                "monthGroupFirstRow": True,
                "monthGroupSize": len(insurance_orgs) + 1,
                "department": "合计",
                **_insurance_metric_payload_from_items(items),
            }
        )
        for org_index, org in enumerate(insurance_orgs):
            item = monthly_insurance_payloads[(month, org)]
            insurance_rows.append(
                {
                    "key": f"{100 + month_index:03d}-insurance-month-1-{org_index:02d}",
                    "rowType": "month",
                    "month": str(month_index),
                    "monthGroupFirstRow": False,
                    "monthGroupSize": len(insurance_orgs) + 1,
                    "department": org,
                    **item,
                }
            )

    _store_aggregate_rows(
        db,
        model=DashboardMonthlyAggregate,
        scope=normalized_scope,
        domain="hr_allocation",
        period=year,
        rows=hr_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardMonthlyAggregate,
        scope=normalized_scope,
        domain="training",
        period=year,
        rows=training_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardMonthlyAggregate,
        scope=normalized_scope,
        domain="salary_welfare",
        period=year,
        rows=salary_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardMonthlyAggregate,
        scope=normalized_scope,
        domain="social_insurance",
        period=year,
        rows=insurance_rows,
    )

    return {
        "scope": normalized_scope,
        "year": year,
        "sections": {
            "hr_allocation": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardMonthlyAggregate,
                    scope=normalized_scope,
                    domain="hr_allocation",
                    period=year,
                ),
                "warnings": {},
            },
            "training": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardMonthlyAggregate,
                    scope=normalized_scope,
                    domain="training",
                    period=year,
                ),
                "warnings": {},
            },
            "salary_welfare": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardMonthlyAggregate,
                    scope=normalized_scope,
                    domain="salary_welfare",
                    period=year,
                ),
                "warnings": {},
            },
            "social_insurance": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardMonthlyAggregate,
                    scope=normalized_scope,
                    domain="social_insurance",
                    period=year,
                ),
                "warnings": {},
            },
        },
    }


def build_yearly_dashboard(
    db: Session,
    *,
    scope: str,
    year: str,
    monthly_dashboard: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    if monthly_dashboard is None:
        from app.crud.human_resources import dashboard as dashboard_crud

        monthly = dashboard_crud.read_monthly_dashboard(
            db,
            scope=normalized_scope,
            year=year,
        ) or dashboard_crud.build_monthly_dashboard(
            db,
            scope=normalized_scope,
            year=year,
        )
    else:
        monthly = monthly_dashboard
    monthly_hr = monthly["sections"]["hr_allocation"]["rows"]
    monthly_training = monthly["sections"]["training"]["rows"]
    monthly_salary = monthly["sections"]["salary_welfare"]["rows"]
    monthly_insurance = monthly["sections"]["social_insurance"]["rows"]

    months = _year_months(year)
    orgs: list[str] = [
        org for org in list_scope_orgs(normalized_scope) if org is not None
    ]
    insurance_orgs = _insurance_orgs_for_scope(normalized_scope)
    summary_rows: list[dict[str, Any]] = []
    post_staff_rows: list[dict[str, Any]] = []
    hr_rows: list[dict[str, Any]] = []
    training_rows: list[dict[str, Any]] = []
    salary_rows: list[dict[str, Any]] = []
    insurance_rows: list[dict[str, Any]] = []

    counts_by_month_org: dict[str, dict[str, dict[str, Any]]] = {
        month: _snapshot_counts_by_org(
            db, scope=normalized_scope, snapshot_date=_month_end(month)
        )
        for month in months
    }
    month_numbers = list(range(1, 13))

    def build_month_row_map(
        rows: list[dict[str, Any]]
    ) -> dict[tuple[str, str], dict[str, Any]]:
        result: dict[tuple[str, str], dict[str, Any]] = {}
        for row in rows:
            if row.get("rowType") != "month":
                continue
            month_value = str(row.get("month") or row.get("sequence") or "")
            org_value = str(row.get("department") or row.get("division") or "")
            result[(month_value, org_value)] = row
        return result

    monthly_hr_map = build_month_row_map(monthly_hr)
    monthly_training_map = build_month_row_map(monthly_training)
    monthly_salary_map = build_month_row_map(monthly_salary)
    monthly_insurance_map = build_month_row_map(monthly_insurance)

    def monthly_row_lookup(
        row_map: dict[tuple[str, str], dict[str, Any]], month_str: str, department: str
    ) -> dict[str, Any]:
        return row_map.get((month_str, department), {})

    def count_snapshot(month_index: int, org: str) -> dict[str, Any]:
        return counts_by_month_org[months[month_index - 1]].get(org, {})

    def sum_numeric_items(items: list[dict[str, Any]], key: str) -> float:
        return sum(_to_float(item.get(key)) for item in items)

    def salary_metric_payload(
        *,
        salary: float = 0.0,
        welfare_total: float = 0.0,
        monthly_incentive_total: float = 0.0,
        temporary_reward_total: float = 0.0,
        deduction: float = 0.0,
        cadre_salary_total: float = 0.0,
        staff_salary_total: float = 0.0,
        salary_total: float = 0.0,
        headcount: float = 0.0,
        cadre_count: float = 0.0,
        staff_count: float = 0.0,
    ) -> dict[str, Any]:
        rounded_salary_total = _round(salary_total, 2)
        rounded_welfare_total = _round(welfare_total, 2)
        per_capita = _round(salary_total / headcount, 2) if headcount else "-"
        cadre_average = (
            _round(cadre_salary_total / cadre_count, 2) if cadre_count else "-"
        )
        staff_average = (
            _round(staff_salary_total / staff_count, 2) if staff_count else "-"
        )
        return {
            "salary": _round(salary, 2),
            "annualWelfareTotal": rounded_welfare_total,
            "monthlyIncentiveTotal": _round(monthly_incentive_total, 2),
            "temporaryRewardTotal": _round(temporary_reward_total, 2),
            "deduction": _round(deduction, 2),
            "cadreSalaryTotal": _round(cadre_salary_total, 2),
            "staffSalaryTotal": _round(staff_salary_total, 2),
            "salaryTotal": rounded_salary_total,
            "annualSalaryTotal": rounded_salary_total,
            "perCapitaSalary": per_capita,
            "annualSalaryPerCapita": per_capita,
            "cadreAverageSalary": cadre_average,
            "staffAverageSalary": staff_average,
            "welfareTotal": rounded_welfare_total,
        }

    def salary_metric_payload_from_items(
        items: list[dict[str, Any]],
        *,
        headcount: float,
        cadre_count: float,
        staff_count: float,
    ) -> dict[str, Any]:
        return salary_metric_payload(
            salary=sum_numeric_items(items, "salary"),
            welfare_total=sum_numeric_items(items, "annualWelfareTotal"),
            monthly_incentive_total=sum_numeric_items(items, "monthlyIncentiveTotal"),
            temporary_reward_total=sum_numeric_items(items, "temporaryRewardTotal"),
            deduction=sum_numeric_items(items, "deduction"),
            cadre_salary_total=sum_numeric_items(items, "cadreSalaryTotal"),
            staff_salary_total=sum_numeric_items(items, "staffSalaryTotal"),
            salary_total=sum_numeric_items(items, "salaryTotal"),
            headcount=headcount,
            cadre_count=cadre_count,
            staff_count=staff_count,
        )

    def training_metric_payload_from_items(
        items: list[dict[str, Any]]
    ) -> dict[str, Any]:
        participants = sum_numeric_items(items, "trainingParticipants")
        passes = sum_numeric_items(items, "passParticipants")
        fails = sum_numeric_items(items, "failParticipants")
        total_cost = sum_numeric_items(items, "totalTrainingCost")
        return {
            "trainingSessions": sum_numeric_items(items, "trainingSessions"),
            "trainingParticipants": participants,
            "averageScore": (
                _round(
                    sum(
                        _to_float(item.get("averageScore"))
                        * _to_float(item.get("trainingParticipants"))
                        for item in items
                    )
                    / participants,
                    2,
                )
                if participants
                else 0
            ),
            "passParticipants": passes,
            "passList": "",
            "failParticipants": fails,
            "failList": "",
            "passRate": _safe_percent(passes, participants),
            "avgTrainingDuration": (
                _round(
                    sum(
                        _to_float(item.get("avgTrainingDuration"))
                        * _to_float(item.get("trainingParticipants"))
                        for item in items
                    )
                    / participants,
                    2,
                )
                if participants
                else 0
            ),
            "avgSatisfactionScore": (
                _round(
                    sum(
                        _to_float(item.get("avgSatisfactionScore"))
                        * _to_float(item.get("trainingParticipants"))
                        for item in items
                    )
                    / participants,
                    2,
                )
                if participants
                else 0
            ),
            "totalTrainingCost": _round(total_cost, 2),
            "perCapitaCost": (
                _round(total_cost / participants, 2) if participants else "-"
            ),
        }

    def hr_metric_payload_from_items(
        items: list[dict[str, Any]], *, current_headcount: float
    ) -> dict[str, Any]:
        required_recruitment = sum_numeric_items(items, "neededPosts")
        interview_count = sum_numeric_items(items, "interviewCount")
        invite_count = sum_numeric_items(items, "inviteCount")
        onboard_count = sum_numeric_items(items, "onboardCount")
        retention_count = sum_numeric_items(items, "newRetentionCount")
        resign_count = sum_numeric_items(items, "resignCount")
        return {
            "authorizedPosts": sum_numeric_items(items, "authorizedPosts"),
            "currentPosts": sum_numeric_items(items, "currentPosts"),
            "requiredRecruitment": required_recruitment,
            "neededPosts": required_recruitment,
            "resumeCount": 0,
            "inviteCount": invite_count,
            "interviewCount": interview_count,
            "interviewArrivalRate": _safe_percent(interview_count, invite_count),
            "onboardCount": onboard_count,
            "recruitmentCompletionRate": _safe_percent(
                onboard_count, required_recruitment
            ),
            "recruitCompletionRate": _safe_percent(onboard_count, required_recruitment),
            "totalOnboardRate": _safe_percent(onboard_count, interview_count),
            "newStaffRetentionCount": retention_count,
            "newRetentionCount": retention_count,
            "newStaffRetentionRate": _safe_percent(retention_count, onboard_count),
            "newRetentionRate": _safe_percent(retention_count, onboard_count),
            "currentHeadcount": current_headcount,
            "transferCount": sum_numeric_items(items, "transferCount"),
            "plannedOptimizeCount": sum_numeric_items(items, "plannedOptimizeCount"),
            "optimizeCount": sum_numeric_items(items, "actualOptimizeCount"),
            "actualOptimizeCount": sum_numeric_items(items, "actualOptimizeCount"),
            "resignCount": resign_count,
            "resignRate": _safe_percent(resign_count, current_headcount),
        }

    def build_hq_grouped_detail_rows(
        *,
        domain_key: str,
        total_payload_factory,
        subtotal_payload_factory,
        month_total_payload_factory,
        org_payload_factory,
        org_list: Optional[list[str]] = None,
    ) -> list[dict[str, Any]]:
        current_orgs = org_list or orgs
        rows: list[dict[str, Any]] = []
        rows.append(
            {
                "key": f"000-{domain_key}-grand-total",
                "rowType": "grandTotal",
                "sequence": "总合计",
                "sequenceGroupFirstRow": True,
                "sequenceGroupSize": 1,
                "division": "",
                **total_payload_factory(),
            }
        )
        for org_index, org in enumerate(current_orgs):
            rows.append(
                {
                    "key": f"010-{domain_key}-subtotal-{org_index:02d}",
                    "rowType": "monthSubtotal",
                    "sequence": "月合计",
                    "sequenceGroupFirstRow": org_index == 0,
                    "sequenceGroupSize": len(current_orgs),
                    "division": org,
                    **subtotal_payload_factory(org),
                }
            )
        for month_index in month_numbers:
            rows.append(
                {
                    "key": f"{100 + month_index:03d}-{domain_key}-month-0-total",
                    "rowType": "month",
                    "sequence": str(month_index),
                    "sequenceGroupFirstRow": True,
                    "sequenceGroupSize": len(current_orgs) + 1,
                    "division": "合计",
                    **month_total_payload_factory(month_index),
                }
            )
            for org_index, org in enumerate(current_orgs):
                rows.append(
                    {
                        "key": f"{100 + month_index:03d}-{domain_key}-month-1-{org_index:02d}",
                        "rowType": "month",
                        "sequence": str(month_index),
                        "sequenceGroupFirstRow": False,
                        "sequenceGroupSize": len(current_orgs) + 1,
                        "division": org,
                        **org_payload_factory(month_index, org),
                    }
                )
        return rows

    def build_standard_detail_rows(
        *,
        domain_key: str,
        total_payload_factory,
        org_payload_factory,
        org_list: Optional[list[str]] = None,
    ) -> list[dict[str, Any]]:
        current_orgs = org_list or orgs
        rows: list[dict[str, Any]] = [
            {
                "key": f"000-annual-{domain_key}-total",
                "rowType": "yearTotal",
                "sequence": "年度合计",
                "sequenceGroupFirstRow": True,
                "sequenceGroupSize": 1,
                "division": "",
                **total_payload_factory(),
            }
        ]
        for month_index in month_numbers:
            for org_index, org in enumerate(current_orgs):
                rows.append(
                    {
                        "key": f"100-annual-{domain_key}-{month_index:02d}-{org_index:02d}",
                        "rowType": "month",
                        "sequence": str(month_index),
                        "sequenceGroupFirstRow": org_index == 0,
                        "sequenceGroupSize": len(current_orgs),
                        "division": org,
                        **org_payload_factory(month_index, org),
                    }
                )
        return rows

    summary_items: list[dict[str, Any]] = []
    for department in orgs:
        dept_counts = counts_by_month_org[months[-1]].get(department, {})
        hr_items = [
            monthly_row_lookup(monthly_hr_map, str(index + 1), department)
            for index in range(12)
        ]
        training_items = [
            monthly_row_lookup(monthly_training_map, str(index + 1), department)
            for index in range(12)
        ]
        salary_items = [
            monthly_row_lookup(monthly_salary_map, str(index + 1), department)
            for index in range(12)
        ]
        insurance_items = [
            monthly_row_lookup(monthly_insurance_map, str(index + 1), department)
            for index in range(12)
        ]
        total_interviews = sum(
            _to_float(item.get("interviewCount")) for item in hr_items
        )
        total_onboard = sum(_to_float(item.get("onboardCount")) for item in hr_items)
        total_participants = sum(
            _to_float(item.get("trainingParticipants")) for item in training_items
        )
        total_pass = sum(
            _to_float(item.get("passParticipants")) for item in training_items
        )
        total_salary = sum(_to_float(item.get("salaryTotal")) for item in salary_items)
        total_welfare = sum(
            _to_float(item.get("annualWelfareTotal")) for item in salary_items
        )
        should_insure = sum(
            _to_float(item.get("shouldInsureCount")) for item in insurance_items
        )
        actual_insure = sum(
            _to_float(item.get("actualInsureCount")) for item in insurance_items
        )
        insurance_pay_total = sum(
            _to_float(item.get("totalPayment")) for item in insurance_items
        )
        item = {
            "key": f"000-summary-{department}",
            "sequence": len(summary_items) + 2,
            "division": department,
            "deptCount": int(dept_counts.get("headcount", 0)),
            "cadreCount": int(dept_counts.get("cadre_count", 0)),
            "staffCount": int(dept_counts.get("staff_count", 0)),
            "interviewCount": int(total_interviews),
            "onboardCount": int(total_onboard),
            "onboardRate": _safe_percent(total_onboard, total_interviews),
            "transferCount": int(
                sum(_to_float(hr.get("transferCount")) for hr in hr_items)
            ),
            "optimizeCount": int(
                sum(_to_float(hr.get("actualOptimizeCount")) for hr in hr_items)
            ),
            "resignCount": int(
                sum(_to_float(hr.get("resignCount")) for hr in hr_items)
            ),
            "resignRate": _safe_percent(
                sum(_to_float(hr.get("resignCount")) for hr in hr_items),
                dept_counts.get("headcount", 0),
            ),
            "trainingSessions1": int(
                sum(_to_float(tr.get("trainingSessions")) for tr in training_items)
            ),
            "trainingSessions2": int(
                sum(_to_float(tr.get("trainingSessions")) for tr in training_items)
            ),
            "trainingParticipants": int(total_participants),
            "trainingPassRate": _safe_percent(total_pass, total_participants),
            "annualSalaryTotal": _round(total_salary, 2),
            "annualSalaryPerCapita": (
                _round(total_salary / dept_counts.get("headcount", 0), 2)
                if dept_counts.get("headcount", 0)
                else "-"
            ),
            "annualWelfareTotal": _round(total_welfare, 2),
            "shouldInsureCount": int(should_insure),
            "actualInsureCount": int(actual_insure),
            "insureRate": _safe_percent(actual_insure, should_insure),
            "insurancePayTotal": _round(insurance_pay_total, 2),
        }
        summary_items.append(item)

    summary_rows.append(
        {
            "key": "000-summary-total",
            "sequence": 1,
            "division": "合计",
            "deptCount": sum(item["deptCount"] for item in summary_items),
            "cadreCount": sum(item["cadreCount"] for item in summary_items),
            "staffCount": sum(item["staffCount"] for item in summary_items),
            "interviewCount": sum(item["interviewCount"] for item in summary_items),
            "onboardCount": sum(item["onboardCount"] for item in summary_items),
            "onboardRate": _safe_percent(
                sum(item["onboardCount"] for item in summary_items),
                sum(item["interviewCount"] for item in summary_items),
            ),
            "transferCount": sum(item["transferCount"] for item in summary_items),
            "optimizeCount": sum(item["optimizeCount"] for item in summary_items),
            "resignCount": sum(item["resignCount"] for item in summary_items),
            "resignRate": _safe_percent(
                sum(item["resignCount"] for item in summary_items),
                sum(item["deptCount"] for item in summary_items),
            ),
            "trainingSessions1": sum(
                item["trainingSessions1"] for item in summary_items
            ),
            "trainingSessions2": sum(
                item["trainingSessions2"] for item in summary_items
            ),
            "trainingParticipants": sum(
                item["trainingParticipants"] for item in summary_items
            ),
            "trainingPassRate": _safe_percent(
                sum(
                    (
                        item["trainingParticipants"]
                        * float(str(item["trainingPassRate"]).replace("%", ""))
                        / 100
                        if isinstance(item["trainingPassRate"], str)
                        and item["trainingPassRate"] != "-"
                        else 0
                    )
                    for item in summary_items
                ),
                sum(item["trainingParticipants"] for item in summary_items),
            ),
            "annualSalaryTotal": _round(
                sum(_to_float(item["annualSalaryTotal"]) for item in summary_items), 2
            ),
            "annualSalaryPerCapita": (
                _round(
                    sum(_to_float(item["annualSalaryTotal"]) for item in summary_items)
                    / sum(item["deptCount"] for item in summary_items),
                    2,
                )
                if sum(item["deptCount"] for item in summary_items)
                else "-"
            ),
            "annualWelfareTotal": _round(
                sum(_to_float(item["annualWelfareTotal"]) for item in summary_items), 2
            ),
            "shouldInsureCount": sum(
                item["shouldInsureCount"] for item in summary_items
            ),
            "actualInsureCount": sum(
                item["actualInsureCount"] for item in summary_items
            ),
            "insureRate": _safe_percent(
                sum(item["actualInsureCount"] for item in summary_items),
                sum(item["shouldInsureCount"] for item in summary_items),
            ),
            "insurancePayTotal": _round(
                sum(_to_float(item["insurancePayTotal"]) for item in summary_items), 2
            ),
        }
    )
    summary_rows.extend(summary_items)

    year_end_counts = counts_by_month_org[months[-1]]
    if normalized_scope == HQ_SCOPE:
        total_headcount = sum(
            int(count_snapshot(month_index, org).get("headcount", 0))
            for month_index in month_numbers
            for org in orgs
        )
        total_cadre_count = sum(
            int(count_snapshot(month_index, org).get("cadre_count", 0))
            for month_index in month_numbers
            for org in orgs
        )
        total_staff_count = sum(
            int(count_snapshot(month_index, org).get("staff_count", 0))
            for month_index in month_numbers
            for org in orgs
        )
        post_staff_rows.append(
            {
                "key": "000-post-grand-total",
                "rowType": "grandTotal",
                "month": "总合计",
                "monthGroupFirstRow": True,
                "monthGroupSize": 1,
                "division": "",
                "postCount": total_headcount,
                "cadreCount": total_cadre_count,
                "staffCount": total_staff_count,
                "cadreTargetRatio": "-",
                "cadreActualRatio": _safe_percent(total_cadre_count, total_headcount),
            }
        )
        for org_index, org in enumerate(orgs):
            org_headcount = sum(
                int(count_snapshot(month_index, org).get("headcount", 0))
                for month_index in month_numbers
            )
            org_cadre_count = sum(
                int(count_snapshot(month_index, org).get("cadre_count", 0))
                for month_index in month_numbers
            )
            org_staff_count = sum(
                int(count_snapshot(month_index, org).get("staff_count", 0))
                for month_index in month_numbers
            )
            post_staff_rows.append(
                {
                    "key": f"010-post-subtotal-{org_index:02d}",
                    "rowType": "monthSubtotal",
                    "month": "月合计",
                    "monthGroupFirstRow": org_index == 0,
                    "monthGroupSize": len(orgs),
                    "division": org,
                    "postCount": org_headcount,
                    "cadreCount": org_cadre_count,
                    "staffCount": org_staff_count,
                    "cadreTargetRatio": "-",
                    "cadreActualRatio": _safe_percent(org_cadre_count, org_headcount),
                }
            )
        for month_index, month in enumerate(months, start=1):
            month_counts = counts_by_month_org[month]
            month_headcount = sum(
                int(month_counts.get(org, {}).get("headcount", 0)) for org in orgs
            )
            month_cadre_count = sum(
                int(month_counts.get(org, {}).get("cadre_count", 0)) for org in orgs
            )
            month_staff_count = sum(
                int(month_counts.get(org, {}).get("staff_count", 0)) for org in orgs
            )
            post_staff_rows.append(
                {
                    "key": f"{100 + month_index:03d}-post-month-0-total",
                    "rowType": "month",
                    "month": str(month_index),
                    "monthGroupFirstRow": True,
                    "monthGroupSize": len(orgs) + 1,
                    "division": "合计",
                    "postCount": month_headcount,
                    "cadreCount": month_cadre_count,
                    "staffCount": month_staff_count,
                    "cadreTargetRatio": "-",
                    "cadreActualRatio": _safe_percent(
                        month_cadre_count, month_headcount
                    ),
                }
            )
            for org_index, org in enumerate(orgs):
                counts = month_counts.get(org, {})
                post_staff_rows.append(
                    {
                        "key": f"{100 + month_index:03d}-post-month-1-{org_index:02d}",
                        "rowType": "month",
                        "month": str(month_index),
                        "monthGroupFirstRow": False,
                        "monthGroupSize": len(orgs) + 1,
                        "division": org,
                        "postCount": int(counts.get("headcount", 0)),
                        "cadreCount": int(counts.get("cadre_count", 0)),
                        "staffCount": int(counts.get("staff_count", 0)),
                        "cadreTargetRatio": "-",
                        "cadreActualRatio": _safe_percent(
                            int(counts.get("cadre_count", 0)),
                            int(counts.get("headcount", 0)),
                        ),
                    }
                )
    else:
        post_staff_rows.append(
            {
                "key": "000-post-year-end",
                "rowType": "yearEnd",
                "month": "年末人数",
                "monthGroupFirstRow": True,
                "monthGroupSize": 1,
                "division": "",
                "postCount": sum(
                    int(year_end_counts.get(org, {}).get("headcount", 0))
                    for org in orgs
                ),
                "cadreCount": sum(
                    int(year_end_counts.get(org, {}).get("cadre_count", 0))
                    for org in orgs
                ),
                "staffCount": sum(
                    int(year_end_counts.get(org, {}).get("staff_count", 0))
                    for org in orgs
                ),
                "cadreTargetRatio": "-",
                "cadreActualRatio": _safe_percent(
                    sum(
                        int(year_end_counts.get(org, {}).get("cadre_count", 0))
                        for org in orgs
                    ),
                    sum(
                        int(year_end_counts.get(org, {}).get("headcount", 0))
                        for org in orgs
                    ),
                ),
            }
        )
        for month_index, month in enumerate(months, start=1):
            counts = counts_by_month_org[month]
            for org_index, org in enumerate(orgs):
                post_staff_rows.append(
                    {
                        "key": f"100-post-{month_index:02d}-{org_index:02d}",
                        "rowType": "month",
                        "month": str(month_index),
                        "monthGroupFirstRow": org_index == 0,
                        "monthGroupSize": len(orgs),
                        "division": org,
                        "postCount": int(counts.get(org, {}).get("headcount", 0)),
                        "cadreCount": int(counts.get(org, {}).get("cadre_count", 0)),
                        "staffCount": int(counts.get(org, {}).get("staff_count", 0)),
                        "cadreTargetRatio": "-",
                        "cadreActualRatio": _safe_percent(
                            int(counts.get(org, {}).get("cadre_count", 0)),
                            int(counts.get(org, {}).get("headcount", 0)),
                        ),
                    }
                )

    if normalized_scope == HQ_SCOPE:
        hr_rows = build_hq_grouped_detail_rows(
            domain_key="hr",
            total_payload_factory=lambda: hr_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_hr_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in orgs
                ],
                current_headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
            ),
            subtotal_payload_factory=lambda org: hr_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_hr_map, str(month_index), org)
                    for month_index in month_numbers
                ],
                current_headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for month_index in month_numbers
                ),
            ),
            month_total_payload_factory=lambda month_index: hr_metric_payload_from_items(
                [monthly_row_lookup(monthly_hr_map, str(month_index), "合计")],
                current_headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for org in orgs
                ),
            ),
            org_payload_factory=lambda month_index, org: hr_metric_payload_from_items(
                [monthly_row_lookup(monthly_hr_map, str(month_index), org)],
                current_headcount=int(
                    count_snapshot(month_index, org).get("headcount", 0)
                ),
            ),
        )
        training_rows = build_hq_grouped_detail_rows(
            domain_key="training",
            total_payload_factory=lambda: training_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_training_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in orgs
                ]
            ),
            subtotal_payload_factory=lambda org: training_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_training_map, str(month_index), org)
                    for month_index in month_numbers
                ]
            ),
            month_total_payload_factory=lambda month_index: training_metric_payload_from_items(
                [monthly_row_lookup(monthly_training_map, str(month_index), "合计")]
            ),
            org_payload_factory=lambda month_index, org: training_metric_payload_from_items(
                [monthly_row_lookup(monthly_training_map, str(month_index), org)]
            ),
        )
        salary_rows = build_hq_grouped_detail_rows(
            domain_key="salary",
            total_payload_factory=lambda: salary_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_salary_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in orgs
                ],
                headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
                cadre_count=sum(
                    int(count_snapshot(month_index, org).get("cadre_count", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
                staff_count=sum(
                    int(count_snapshot(month_index, org).get("staff_count", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
            ),
            subtotal_payload_factory=lambda org: salary_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_salary_map, str(month_index), org)
                    for month_index in month_numbers
                ],
                headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for month_index in month_numbers
                ),
                cadre_count=sum(
                    int(count_snapshot(month_index, org).get("cadre_count", 0))
                    for month_index in month_numbers
                ),
                staff_count=sum(
                    int(count_snapshot(month_index, org).get("staff_count", 0))
                    for month_index in month_numbers
                ),
            ),
            month_total_payload_factory=lambda month_index: salary_metric_payload_from_items(
                [monthly_row_lookup(monthly_salary_map, str(month_index), "合计")],
                headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for org in orgs
                ),
                cadre_count=sum(
                    int(count_snapshot(month_index, org).get("cadre_count", 0))
                    for org in orgs
                ),
                staff_count=sum(
                    int(count_snapshot(month_index, org).get("staff_count", 0))
                    for org in orgs
                ),
            ),
            org_payload_factory=lambda month_index, org: salary_metric_payload_from_items(
                [monthly_row_lookup(monthly_salary_map, str(month_index), org)],
                headcount=int(count_snapshot(month_index, org).get("headcount", 0)),
                cadre_count=int(count_snapshot(month_index, org).get("cadre_count", 0)),
                staff_count=int(count_snapshot(month_index, org).get("staff_count", 0)),
            ),
        )
        insurance_rows = build_hq_grouped_detail_rows(
            domain_key="insurance",
            total_payload_factory=lambda: _insurance_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_insurance_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in insurance_orgs
                ]
            ),
            subtotal_payload_factory=lambda org: _insurance_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_insurance_map, str(month_index), org)
                    for month_index in month_numbers
                ]
            ),
            month_total_payload_factory=lambda month_index: _insurance_metric_payload_from_items(
                [monthly_row_lookup(monthly_insurance_map, str(month_index), "合计")]
            ),
            org_payload_factory=lambda month_index, org: _insurance_metric_payload_from_items(
                [monthly_row_lookup(monthly_insurance_map, str(month_index), org)]
            ),
            org_list=insurance_orgs,
        )
    else:
        hr_rows = build_standard_detail_rows(
            domain_key="hr",
            total_payload_factory=lambda: hr_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_hr_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in orgs
                ],
                current_headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
            ),
            org_payload_factory=lambda month_index, org: hr_metric_payload_from_items(
                [monthly_row_lookup(monthly_hr_map, str(month_index), org)],
                current_headcount=int(
                    count_snapshot(month_index, org).get("headcount", 0)
                ),
            ),
        )
        training_rows = build_standard_detail_rows(
            domain_key="training",
            total_payload_factory=lambda: training_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_training_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in orgs
                ]
            ),
            org_payload_factory=lambda month_index, org: training_metric_payload_from_items(
                [monthly_row_lookup(monthly_training_map, str(month_index), org)]
            ),
        )
        salary_rows = build_standard_detail_rows(
            domain_key="salary",
            total_payload_factory=lambda: salary_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_salary_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in orgs
                ],
                headcount=sum(
                    int(count_snapshot(month_index, org).get("headcount", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
                cadre_count=sum(
                    int(count_snapshot(month_index, org).get("cadre_count", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
                staff_count=sum(
                    int(count_snapshot(month_index, org).get("staff_count", 0))
                    for month_index in month_numbers
                    for org in orgs
                ),
            ),
            org_payload_factory=lambda month_index, org: salary_metric_payload_from_items(
                [monthly_row_lookup(monthly_salary_map, str(month_index), org)],
                headcount=int(count_snapshot(month_index, org).get("headcount", 0)),
                cadre_count=int(count_snapshot(month_index, org).get("cadre_count", 0)),
                staff_count=int(count_snapshot(month_index, org).get("staff_count", 0)),
            ),
        )
        insurance_rows = build_standard_detail_rows(
            domain_key="insurance",
            total_payload_factory=lambda: _insurance_metric_payload_from_items(
                [
                    monthly_row_lookup(monthly_insurance_map, str(month_index), org)
                    for month_index in month_numbers
                    for org in insurance_orgs
                ]
            ),
            org_payload_factory=lambda month_index, org: _insurance_metric_payload_from_items(
                [monthly_row_lookup(monthly_insurance_map, str(month_index), org)]
            ),
            org_list=insurance_orgs,
        )

    performance_rows: list[dict[str, Any]] = []
    performance_metrics: dict[tuple[int, str], dict[str, float]] = defaultdict(
        lambda: {
            "avgScoreTotal": 0.0,
            "avgScoreCount": 0.0,
            "leaderScoreTotal": 0.0,
            "leaderScoreCount": 0.0,
            "staffScoreTotal": 0.0,
            "staffScoreCount": 0.0,
        }
    )
    performance_facts = list_performance_facts(
        db,
        scope=normalized_scope,
        start_month=date(int(year), 1, 1),
        end_month=date(int(year), 12, 1),
    )
    for fact in performance_facts:
        resolved_org: Optional[str] = (
            normalize_hq_department(fact.org_name)
            if normalized_scope == HQ_SCOPE
            else _normalize_scope_org_name(normalized_scope, fact.org_name)
        )
        if not resolved_org or fact.stat_month.year != int(year):
            continue
        metric = performance_metrics[(fact.stat_month.month, resolved_org)]
        avg_score = _to_float(fact.average_score)
        leader_score = _to_float(fact.leader_average_score)
        staff_score = _to_float(fact.staff_average_score)
        if avg_score or leader_score or staff_score:
            metric["avgScoreTotal"] += avg_score
            metric["avgScoreCount"] += 1
        if leader_score:
            metric["leaderScoreTotal"] += leader_score
            metric["leaderScoreCount"] += 1
        if staff_score:
            metric["staffScoreTotal"] += staff_score
            metric["staffScoreCount"] += 1

    def to_performance_values(metric: dict[str, float]) -> dict[str, Any]:
        avg_count = metric["avgScoreCount"]
        leader_count = metric["leaderScoreCount"]
        staff_count = metric["staffScoreCount"]
        return {
            "avgScore": (
                _round(metric["avgScoreTotal"] / avg_count, 2) if avg_count else ""
            ),
            "leaderAvgScore": (
                _round(metric["leaderScoreTotal"] / leader_count, 2)
                if leader_count
                else ""
            ),
            "staffAvgScore": (
                _round(metric["staffScoreTotal"] / staff_count, 2)
                if staff_count
                else ""
            ),
        }

    annual_perf_metric = {
        "avgScoreTotal": 0.0,
        "avgScoreCount": 0.0,
        "leaderScoreTotal": 0.0,
        "leaderScoreCount": 0.0,
        "staffScoreTotal": 0.0,
        "staffScoreCount": 0.0,
    }
    for metric in performance_metrics.values():
        for key, value in metric.items():
            annual_perf_metric[key] += value

    performance_rows.append(
        {
            "key": "000-annual-performance-total",
            "rowType": "yearTotal",
            "sequence": "年度合计",
            "sequenceGroupFirstRow": True,
            "division": "",
            **to_performance_values(annual_perf_metric),
        }
    )
    for month_index in range(1, 13):
        month_metric = {
            "avgScoreTotal": 0.0,
            "avgScoreCount": 0.0,
            "leaderScoreTotal": 0.0,
            "leaderScoreCount": 0.0,
            "staffScoreTotal": 0.0,
            "staffScoreCount": 0.0,
        }
        for org_index, org in enumerate(orgs):
            metric = performance_metrics[(month_index, org)]
            for key, value in metric.items():
                month_metric[key] += value
            performance_rows.append(
                {
                    "key": f"100-annual-performance-{month_index:02d}-{org_index:02d}",
                    "rowType": "month",
                    "sequence": str(month_index),
                    "sequenceGroupFirstRow": org_index == 0,
                    "division": org,
                    **to_performance_values(metric),
                }
            )
        performance_rows.append(
            {
                "key": f"090-annual-performance-month-total-{month_index:02d}",
                "rowType": "monthTotal",
                "sequence": str(month_index),
                "sequenceGroupFirstRow": True,
                "division": "合计",
                **to_performance_values(month_metric),
            }
        )

    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="summary",
        period=year,
        rows=summary_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="post_staff",
        period=year,
        rows=post_staff_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="hr_allocation",
        period=year,
        rows=hr_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="training",
        period=year,
        rows=training_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="salary_welfare",
        period=year,
        rows=salary_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="social_insurance",
        period=year,
        rows=insurance_rows,
    )
    _store_aggregate_rows(
        db,
        model=DashboardYearlyAggregate,
        scope=normalized_scope,
        domain="performance",
        period=year,
        rows=performance_rows,
    )

    return {
        "scope": normalized_scope,
        "year": year,
        "sections": {
            "summary": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="summary",
                    period=year,
                ),
                "warnings": {},
            },
            "post_staff": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="post_staff",
                    period=year,
                ),
                "warnings": {},
            },
            "hr_allocation": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="hr_allocation",
                    period=year,
                ),
                "warnings": {},
            },
            "training": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="training",
                    period=year,
                ),
                "warnings": {},
            },
            "salary_welfare": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="salary_welfare",
                    period=year,
                ),
                "warnings": {},
            },
            "social_insurance": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="social_insurance",
                    period=year,
                ),
                "warnings": {},
            },
            "performance": {
                "rows": _load_aggregate_rows(
                    db,
                    model=DashboardYearlyAggregate,
                    scope=normalized_scope,
                    domain="performance",
                    period=year,
                ),
                "warnings": {},
            },
        },
    }
