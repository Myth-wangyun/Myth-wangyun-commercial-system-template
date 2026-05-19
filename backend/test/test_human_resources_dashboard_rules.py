"""Focused human_resources dashboard rule tests."""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy.orm import sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.http, pytest.mark.db]

os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
sys.dont_write_bytecode = True

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
TEST_DIR = BACKEND_DIR / "test"
sys.path.insert(0, str(TEST_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from hr_test_support import (
    TEST_LOGIN_USERNAME,
    create_db_engine,
    ensure_admin_user,
    ensure_user,
    running_test_server,
)
from app.crud.human_resources import dashboard as dashboard_crud
from app.crud.human_resources.dashboard_legacy import (
    _build_hq_daily_recruitment,
    _infer_hq_interview_department,
)
from app.crud.human_resources.dashboard_scope import (
    HQ_SCOPE,
    ONLINE_SCOPE,
    OFFLINE_SCOPE,
    normalize_offline_campus,
    normalize_hq_department,
    normalize_online_org,
    resolve_interview_registration_org_name,
    resolve_interview_registration_scope,
    resolve_recruitment_request_org_name,
    resolve_recruitment_request_scope,
    resolve_org_name,
    resolve_scope,
)
from app.models.human_resources.hr_dashboard import (
    DashboardDailyAggregate,
    DashboardMonthlyAggregate,
    DashboardYearlyAggregate,
    EmployeeArchiveSnapshot,
)
from app.models.human_resources.interview_registration import InterviewRegistration
from app.models.user import User, UserRole
from app.schemas.human_resources.dashboard import (
    DashboardManualRecruitmentDailyUpsert,
    PerformanceFactCreate,
    SalaryWelfareFactCreate,
)


TEST_DB = "qmjy_test_hr_dashboard_rules"


@pytest.fixture(scope="module")
def db():
    with running_test_server(TEST_DB):
        ensure_admin_user(TEST_DB)
        ensure_user(
            db_name=TEST_DB,
            username="rules_staff_hq",
            password="rules_staff_hq_123",
            real_name="规则测试总部员工",
            department="运营部",
            position="运营专员",
            campus="最高议事厅",
            phone="13810001001",
            role=UserRole.STAFF,
            is_superuser=False,
        )
        ensure_user(
            db_name=TEST_DB,
            username="rules_staff_offline",
            password="rules_staff_offline_123",
            real_name="规则测试线下员工",
            department="线下事业部",
            position="神殿主管",
            campus="主神殿",
            phone="13810001002",
            role=UserRole.STAFF,
            is_superuser=False,
        )
        engine = create_db_engine(TEST_DB)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()
            engine.dispose()


def test_scope_resolver_handles_hq_offline_online_aliases():
    assert resolve_scope(campus="最高议事厅") == HQ_SCOPE
    assert resolve_scope(campus="最高议事厅神殿") == HQ_SCOPE
    assert resolve_scope(department="人力资源行政中心", position="专员") == HQ_SCOPE
    assert resolve_scope(campus="盛邦") == OFFLINE_SCOPE
    assert resolve_scope(campus="永恒殿") == OFFLINE_SCOPE
    assert resolve_scope(department="线下事业部", position="顾问") == OFFLINE_SCOPE
    assert normalize_hq_department("财务负责人") == "神藏司"
    assert normalize_offline_campus("邕美") == "神恩殿"
    assert normalize_online_org("短视频招商主管") == "短视频运营"
    assert resolve_org_name(HQ_SCOPE, department="市场招商主管") == "市场部"
    assert resolve_org_name(OFFLINE_SCOPE, campus="盛邦") == "主神殿"
    assert resolve_scope(campus="线上事业部") == ONLINE_SCOPE
    assert resolve_scope(department="线上祈福司", position="咨询主管") == ONLINE_SCOPE
    assert resolve_org_name(ONLINE_SCOPE, department="投流平台主管") == "投流手"


def test_recruitment_request_scope_prefers_campus_semantics():
    assert resolve_recruitment_request_scope(campus="最高议事厅", department="市场部", position="招商主管") == HQ_SCOPE
    assert resolve_recruitment_request_scope(campus="主神殿", department="祈福司", position="咨询主管") == OFFLINE_SCOPE
    assert resolve_recruitment_request_scope(campus="线上事业部", department="祈福司", position="咨询主管") == ONLINE_SCOPE
    assert resolve_recruitment_request_scope(campus=None, department="市场部", position="招商主管") == HQ_SCOPE
    assert normalize_hq_department("人事部专员") == "人资部"
    assert resolve_recruitment_request_org_name(HQ_SCOPE, campus="最高议事厅", department="市场部", position="招商主管") == "市场部"
    assert resolve_recruitment_request_org_name(HQ_SCOPE, campus="最高议事厅神殿", department="最高议事厅", position="人事部专员") == "人资部"
    assert resolve_recruitment_request_org_name(OFFLINE_SCOPE, campus="主神殿", department="祈福司", position="咨询主管") == "主神殿"
    assert resolve_recruitment_request_org_name(ONLINE_SCOPE, campus="线上事业部", department="祈福司", position="咨询主管") == "线上咨询师"


def test_interview_registration_scope_routes_to_matching_daily_dashboard():
    assert resolve_interview_registration_scope(campus="最高议事厅神殿", position="人事部专员") == HQ_SCOPE
    assert resolve_interview_registration_scope(campus="主神殿", position="咨询主管") == OFFLINE_SCOPE
    assert resolve_interview_registration_scope(campus="线上事业部", position="主播") == ONLINE_SCOPE
    assert resolve_interview_registration_scope(campus="新媒体业务", position="主播") == ONLINE_SCOPE
    assert resolve_interview_registration_org_name(HQ_SCOPE, campus="最高议事厅神殿", position="人事部专员") == "人资部"
    assert resolve_interview_registration_org_name(OFFLINE_SCOPE, campus="主神殿", position="咨询主管") == "主神殿"
    assert resolve_interview_registration_org_name(ONLINE_SCOPE, campus="线上事业部", position="主播") == "主播"


def test_hq_interview_department_falls_back_to_creator_position():
    record = InterviewRegistration(
        campus_name="最高议事厅神殿",
        name="规则测试候选人",
        position="AI研发专员",
        invite_date=date(2026, 3, 19),
        created_by_user_id=23,
    )

    department = _infer_hq_interview_department(
        record,
        {},
        {23: ("最高议事厅", "人事部专员")},
    )

    assert department == "人资部"


def test_interview_registration_only_affects_interview_count_and_manual_invites(db):
    admin_user = db.query(User).filter(User.username == TEST_LOGIN_USERNAME).one()
    hq_user = db.query(User).filter(User.username == "rules_staff_hq").one()
    anchor_date = date(2026, 4, 18)

    dashboard_crud.upsert_manual_recruitment_entry(
        db,
        payload=DashboardManualRecruitmentDailyUpsert(
            scope="hq",
            stat_date=anchor_date,
            org_name="运营部",
            authorized_posts=0,
            current_posts=0,
            boss_invite_count=5,
            zhilian_invite_count=0,
            other_platform_invite_count=0,
            planned_optimize_count=0,
            actual_optimize_count=0,
            transfer_names=[],
            optimize_names=[],
            resign_names=[],
        ),
        current_user=admin_user,
    )

    record = InterviewRegistration(
        campus_name="最高议事厅神殿",
        name="规则测试候选人二",
        source="boss",
        position="AI研发专员",
        invite_date=anchor_date,
        attended_first="是",
        created_by_user_id=hq_user.user_id,
        created_by_name=hq_user.real_name,
    )
    db.add(record)
    db.commit()

    rows, warnings = _build_hq_daily_recruitment(db, month="2026-04")
    target = next(
        row
        for row in rows
        if row.get("rowType") == "departmentDay"
        and row.get("date") == "18"
        and row.get("department") == "运营部"
    )

    assert warnings.get("unmatchedInterviewCount", 0) == 0
    assert target["bossInviteCount"] == 5
    assert target["bossInterviewCount"] == 1


def test_social_metric_formula_is_stable():
    payload = dashboard_crud._social_metric_payload(should_count=10, actual_count=8, payment_base=1000.0)
    assert payload["shouldInsureCount"] == 10
    assert payload["actualInsureCount"] == 8
    assert payload["insureRate"] == "80.0%"
    assert payload["companyTotalPayment"] == pytest.approx(247.0)
    assert payload["personalTotalPayment"] == pytest.approx(103.0)
    assert payload["totalPayment"] == pytest.approx(350.0)
    assert payload["injuryCompanyRate"] == pytest.approx(5.0)
    assert payload["pensionCompanyRate"] == pytest.approx(160.0)
    assert payload["medicalPersonalRate"] == pytest.approx(20.0)


def test_refresh_chain_is_idempotent_for_same_scope_and_period(db):
    admin_user = db.query(User).filter(User.username == TEST_LOGIN_USERNAME).one()
    anchor_date = date(2026, 3, 10)

    dashboard_crud.upsert_manual_recruitment_entry(
        db,
        payload=DashboardManualRecruitmentDailyUpsert(
            scope="hq",
            stat_date=anchor_date,
            org_name="运营部",
            authorized_posts=7,
            current_posts=5,
            planned_optimize_count=1,
            actual_optimize_count=1,
            transfer_names=["规则调岗"],
            optimize_names=["规则优化"],
            resign_names=["规则离职"],
        ),
        current_user=admin_user,
    )
    dashboard_crud.create_salary_welfare_fact(
        db,
        payload=SalaryWelfareFactCreate(
            scope="hq",
            org_kind="department",
            org_name="运营部",
            stat_date=anchor_date,
            person_name="规则薪酬",
            position="运营主管",
            position_category="干部",
            headcount=1,
            salary="12000",
            annual_welfare_total="500",
            monthly_incentive_total="300",
            temporary_reward_total="50",
            deduction="20",
            cadre_salary_total="12000",
            staff_salary_total="0",
        ),
        current_user=admin_user,
    )
    dashboard_crud.create_performance_fact(
        db,
        payload=PerformanceFactCreate(
            scope="hq",
            org_kind="department",
            org_name="运营部",
            stat_month=anchor_date.replace(day=1),
            person_name="规则绩效",
            position_category="干部",
            average_score="91.5",
            leader_average_score="91.5",
            staff_average_score="0",
        ),
        current_user=admin_user,
    )

    dashboard_crud.refresh_scope_dashboard_chain(db, scope="hq", anchor_date=anchor_date)
    first_counts = {
        "snapshots": db.query(EmployeeArchiveSnapshot)
        .filter(EmployeeArchiveSnapshot.scope == "hq", EmployeeArchiveSnapshot.snapshot_date == anchor_date)
        .count(),
        "daily": db.query(DashboardDailyAggregate)
        .filter(DashboardDailyAggregate.scope == "hq", DashboardDailyAggregate.period == "2026-03")
        .count(),
        "monthly": db.query(DashboardMonthlyAggregate)
        .filter(DashboardMonthlyAggregate.scope == "hq", DashboardMonthlyAggregate.period == "2026")
        .count(),
        "yearly": db.query(DashboardYearlyAggregate)
        .filter(DashboardYearlyAggregate.scope == "hq", DashboardYearlyAggregate.period == "2026")
        .count(),
    }

    dashboard_crud.refresh_scope_dashboard_chain(db, scope="hq", anchor_date=anchor_date)
    second_counts = {
        "snapshots": db.query(EmployeeArchiveSnapshot)
        .filter(EmployeeArchiveSnapshot.scope == "hq", EmployeeArchiveSnapshot.snapshot_date == anchor_date)
        .count(),
        "daily": db.query(DashboardDailyAggregate)
        .filter(DashboardDailyAggregate.scope == "hq", DashboardDailyAggregate.period == "2026-03")
        .count(),
        "monthly": db.query(DashboardMonthlyAggregate)
        .filter(DashboardMonthlyAggregate.scope == "hq", DashboardMonthlyAggregate.period == "2026")
        .count(),
        "yearly": db.query(DashboardYearlyAggregate)
        .filter(DashboardYearlyAggregate.scope == "hq", DashboardYearlyAggregate.period == "2026")
        .count(),
    }

    assert second_counts == first_counts
    assert first_counts["snapshots"] >= 1
    assert first_counts["daily"] > 0
    assert first_counts["monthly"] > 0
    assert first_counts["yearly"] > 0


def test_store_aggregate_rows_upserts_existing_rows_and_preserves_key_order(db):
    scope = "hq"
    domain = "training"
    period = "2026-03"

    dashboard_crud._store_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=scope,
        domain=domain,
        period=period,
        rows=[
            {"key": "100-training-day-total-01", "rowType": "dayTotal", "department": "合计", "trainingSessions": 1},
            {"key": "000-training-grand-total", "rowType": "grandTotal", "department": "", "trainingSessions": 10},
            {"key": "100-training-day-total-01", "rowType": "dayTotal", "department": "合计", "trainingSessions": 2},
        ],
    )

    first_rows = dashboard_crud._load_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=scope,
        domain=domain,
        period=period,
    )
    first_records = (
        db.query(DashboardDailyAggregate)
        .filter(
            DashboardDailyAggregate.scope == scope,
            DashboardDailyAggregate.domain == domain,
            DashboardDailyAggregate.period == period,
        )
        .all()
    )

    assert [row["key"] for row in first_rows] == [
        "000-training-grand-total",
        "100-training-day-total-01",
    ]
    assert [row["trainingSessions"] for row in first_rows] == [10, 2]
    assert len(first_records) == 2

    dashboard_crud._store_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=scope,
        domain=domain,
        period=period,
        rows=[
            {"key": "000-training-grand-total", "rowType": "grandTotal", "department": "", "trainingSessions": 20},
        ],
    )

    second_rows = dashboard_crud._load_aggregate_rows(
        db,
        model=DashboardDailyAggregate,
        scope=scope,
        domain=domain,
        period=period,
    )
    second_records = (
        db.query(DashboardDailyAggregate)
        .filter(
            DashboardDailyAggregate.scope == scope,
            DashboardDailyAggregate.domain == domain,
            DashboardDailyAggregate.period == period,
        )
        .all()
    )

    assert second_rows == [
        {
            "key": "000-training-grand-total",
            "rowType": "grandTotal",
            "department": "",
            "trainingSessions": 20,
        }
    ]
    assert len(second_records) == 1


def test_offline_multi_salary_facts_are_aggregated_to_single_day_row(db):
    admin_user = db.query(User).filter(User.username == TEST_LOGIN_USERNAME).one()
    target_date = date(2026, 4, 5)

    dashboard_crud.create_salary_welfare_fact(
        db,
        payload=SalaryWelfareFactCreate(
            scope="offline",
            org_kind="campus",
            org_name="主神殿",
            stat_date=target_date,
            person_name="线下甲",
            position="咨询师",
            position_category="员工",
            headcount=1,
            salary="4000",
            annual_welfare_total="200",
            monthly_incentive_total="100",
            temporary_reward_total="30",
            deduction="10",
            cadre_salary_total="0",
            staff_salary_total="4000",
        ),
        current_user=admin_user,
    )
    dashboard_crud.create_salary_welfare_fact(
        db,
        payload=SalaryWelfareFactCreate(
            scope="offline",
            org_kind="campus",
            org_name="盛邦",
            stat_date=target_date,
            person_name="线下乙",
            position="班主任",
            position_category="员工",
            headcount=1,
            salary="5000",
            annual_welfare_total="300",
            monthly_incentive_total="150",
            temporary_reward_total="40",
            deduction="20",
            cadre_salary_total="0",
            staff_salary_total="5000",
        ),
        current_user=admin_user,
    )

    daily = dashboard_crud.build_daily_dashboard(db, scope="offline", month="2026-04")
    matched_rows = [
        row
        for row in daily["sections"]["salary_welfare"]["rows"]
        if row.get("rowType") == "departmentDay"
        and row.get("department") == "主神殿"
        and row.get("dayOfMonth") == 5
    ]

    assert len(matched_rows) == 1
    row = matched_rows[0]
    assert row["personName"] == "线下甲、线下乙"
    assert row["salary"] == pytest.approx(9000.0)
    assert row["staffSalaryTotal"] == pytest.approx(9000.0)
    assert row["salaryTotal"] == pytest.approx(9000.0)


def test_yearly_dashboard_uses_scope_specific_row_shapes_and_salary_aliases(db):
    admin_user = db.query(User).filter(User.username == TEST_LOGIN_USERNAME).one()
    hq_anchor_date = date(2026, 5, 12)
    offline_anchor_date = date(2026, 5, 13)

    dashboard_crud.upsert_manual_recruitment_entry(
        db,
        payload=DashboardManualRecruitmentDailyUpsert(
            scope="hq",
            stat_date=hq_anchor_date,
            org_name="运营部",
            authorized_posts=10,
            current_posts=8,
            planned_optimize_count=1,
            actual_optimize_count=1,
            transfer_names=["年度规则调岗"],
            optimize_names=["年度规则优化"],
            resign_names=["年度规则离职"],
        ),
        current_user=admin_user,
    )
    dashboard_crud.create_salary_welfare_fact(
        db,
        payload=SalaryWelfareFactCreate(
            scope="hq",
            org_kind="department",
            org_name="运营部",
            stat_date=hq_anchor_date,
            person_name="年度规则总部薪酬",
            position="运营主管",
            position_category="干部",
            headcount=1,
            salary="15000",
            annual_welfare_total="600",
            monthly_incentive_total="200",
            temporary_reward_total="80",
            deduction="50",
            cadre_salary_total="15000",
            staff_salary_total="0",
        ),
        current_user=admin_user,
    )
    dashboard_crud.refresh_scope_dashboard_chain(db, scope="hq", anchor_date=hq_anchor_date)

    hq_yearly = dashboard_crud.build_yearly_dashboard(db, scope="hq", year="2026")
    hq_post_rows = hq_yearly["sections"]["post_staff"]["rows"]
    hq_hr_rows = hq_yearly["sections"]["hr_allocation"]["rows"]
    hq_salary_rows = hq_yearly["sections"]["salary_welfare"]["rows"]
    hq_insurance_rows = hq_yearly["sections"]["social_insurance"]["rows"]

    assert hq_post_rows[0]["rowType"] == "grandTotal"
    assert any(row.get("rowType") == "monthSubtotal" for row in hq_post_rows)
    assert hq_hr_rows[0]["rowType"] == "grandTotal"
    assert any(row.get("rowType") == "monthSubtotal" for row in hq_hr_rows)
    assert any(
        row.get("rowType") == "month"
        and row.get("sequence") == str(hq_anchor_date.month)
        and row.get("division") == "运营部"
        for row in hq_hr_rows
    )

    hq_salary_total_row = hq_salary_rows[0]
    assert hq_salary_total_row["rowType"] == "grandTotal"
    assert hq_salary_total_row["salaryTotal"] == hq_salary_total_row["annualSalaryTotal"]
    assert hq_salary_total_row["welfareTotal"] == hq_salary_total_row["annualWelfareTotal"]
    assert "perCapitaSalary" in hq_salary_total_row
    assert "annualSalaryPerCapita" in hq_salary_total_row

    hq_insurance_total_row = hq_insurance_rows[0]
    assert hq_insurance_total_row["rowType"] == "grandTotal"
    assert "totalPayment" in hq_insurance_total_row
    assert "insurancePayTotal" in hq_insurance_total_row
    assert "companyPayment" in hq_insurance_total_row
    assert "personalPayment" in hq_insurance_total_row
    assert "serviceFee" in hq_insurance_total_row

    dashboard_crud.upsert_manual_recruitment_entry(
        db,
        payload=DashboardManualRecruitmentDailyUpsert(
            scope="offline",
            stat_date=offline_anchor_date,
            org_name="主神殿",
            authorized_posts=12,
            current_posts=10,
            planned_optimize_count=1,
            actual_optimize_count=0,
            transfer_names=["线下年度调岗"],
            optimize_names=[],
            resign_names=["线下年度离职"],
        ),
        current_user=admin_user,
    )
    dashboard_crud.create_salary_welfare_fact(
        db,
        payload=SalaryWelfareFactCreate(
            scope="offline",
            org_kind="campus",
            org_name="主神殿",
            stat_date=offline_anchor_date,
            person_name="年度规则线下薪酬",
            position="校长",
            position_category="干部",
            headcount=1,
            salary="9800",
            annual_welfare_total="500",
            monthly_incentive_total="150",
            temporary_reward_total="0",
            deduction="20",
            cadre_salary_total="9800",
            staff_salary_total="0",
        ),
        current_user=admin_user,
    )
    dashboard_crud.refresh_scope_dashboard_chain(db, scope="offline", anchor_date=offline_anchor_date)

    offline_yearly = dashboard_crud.build_yearly_dashboard(db, scope="offline", year="2026")
    offline_post_rows = offline_yearly["sections"]["post_staff"]["rows"]
    offline_hr_rows = offline_yearly["sections"]["hr_allocation"]["rows"]
    offline_salary_rows = offline_yearly["sections"]["salary_welfare"]["rows"]

    assert offline_post_rows[0]["rowType"] == "yearEnd"
    assert not any(row.get("rowType") == "monthSubtotal" for row in offline_post_rows)
    assert offline_hr_rows[0]["rowType"] == "yearTotal"
    assert not any(row.get("rowType") == "monthSubtotal" for row in offline_hr_rows)
    assert any(
        row.get("rowType") == "month"
        and row.get("sequence") == str(offline_anchor_date.month)
        and row.get("division") == "主神殿"
        for row in offline_hr_rows
    )

    offline_salary_total_row = offline_salary_rows[0]
    assert offline_salary_total_row["rowType"] == "yearTotal"
    assert offline_salary_total_row["salaryTotal"] == offline_salary_total_row["annualSalaryTotal"]
    assert offline_salary_total_row["welfareTotal"] == offline_salary_total_row["annualWelfareTotal"]

    online_anchor_date = date(2026, 5, 14)
    dashboard_crud.upsert_manual_recruitment_entry(
        db,
        payload=DashboardManualRecruitmentDailyUpsert(
            scope="online",
            stat_date=online_anchor_date,
            org_name="线上主任",
            authorized_posts=6,
            current_posts=5,
            planned_optimize_count=1,
            actual_optimize_count=0,
            transfer_names=["线上年度调岗"],
            optimize_names=[],
            resign_names=["线上年度离职"],
        ),
        current_user=admin_user,
    )
    dashboard_crud.create_salary_welfare_fact(
        db,
        payload=SalaryWelfareFactCreate(
            scope="online",
            org_kind="division",
            org_name="线上主任",
            stat_date=online_anchor_date,
            person_name="线上年度薪酬",
            position="线上主管",
            position_category="干部",
            headcount=1,
            salary="12000",
            annual_welfare_total="480",
            monthly_incentive_total="160",
            temporary_reward_total="30",
            deduction="10",
            cadre_salary_total="12000",
            staff_salary_total="0",
        ),
        current_user=admin_user,
    )
    dashboard_crud.refresh_scope_dashboard_chain(db, scope="online", anchor_date=online_anchor_date)

    online_annual = dashboard_crud.build_yearly_dashboard(db, scope="online", year="2026")
    online_post_rows = online_annual["sections"]["post_staff"]["rows"]
    online_hr_rows = online_annual["sections"]["hr_allocation"]["rows"]
    assert online_post_rows[0]["rowType"] == "yearEnd"
    assert not any(row.get("rowType") == "monthSubtotal" for row in online_post_rows)
    assert online_hr_rows[0]["rowType"] == "yearTotal"
    assert any(
        row.get("rowType") == "month"
        and row.get("sequence") == str(online_anchor_date.month)
        and row.get("division") == "线上主任"
        for row in online_hr_rows
    )

    online_salary_total = online_annual["sections"]["salary_welfare"]["rows"][0]
    assert online_salary_total["salaryTotal"] == online_salary_total["annualSalaryTotal"]
    assert online_salary_total["welfareTotal"] == online_salary_total["annualWelfareTotal"]


def test_online_daily_dashboard_builds_recruitment_and_training_rows(db):
    admin_user = db.query(User).filter(User.username == TEST_LOGIN_USERNAME).one()
    target_date = date(2026, 4, 6)

    dashboard_crud.upsert_manual_recruitment_entry(
        db,
        payload=DashboardManualRecruitmentDailyUpsert(
            scope="online",
            stat_date=target_date,
            org_name="投流平台主管",
            authorized_posts=7,
            current_posts=5,
            planned_optimize_count=1,
            actual_optimize_count=0,
            transfer_names=["线上调岗甲"],
            optimize_names=["线上优化甲"],
            resign_names=["线上离职甲"],
        ),
        current_user=admin_user,
    )

    daily = dashboard_crud.build_daily_dashboard(db, scope="online", month="2026-04")
    recruitment_rows = daily["sections"]["recruitment"]["rows"]
    training_rows = daily["sections"]["training"]["rows"]

    assert recruitment_rows
    assert training_rows
    assert recruitment_rows[0]["rowType"] == "grandTotal"
    assert training_rows[0]["rowType"] == "grandTotal"

    matched_rows = [
        row
        for row in recruitment_rows
        if row.get("rowType") == "departmentDay"
        and row.get("department") == "投流手"
        and row.get("dayOfMonth") == 6
    ]

    assert len(matched_rows) == 1
    row = matched_rows[0]
    assert row["authorizedPosts"] == 7
    assert row["currentPosts"] == 5
    assert "线上调岗甲" in row["transferNames"]
