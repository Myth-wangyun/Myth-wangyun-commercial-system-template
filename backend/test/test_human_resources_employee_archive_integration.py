"""Employee Archive CRUD Integration Tests

Tests the CRUD layer directly against a PostgreSQL test database.
No HTTP server subprocess needed — fast and reliable.
"""
from __future__ import annotations

import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.db]

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.models.user import Base, User, UserRole, UserStatus
from app.models.human_resources.employee import EmployeeProfile
from app.models.human_resources.interview_registration import InterviewRegistration
from app.models.human_resources.regularization_application import RegularizationApplication
from app.models.human_resources.resignation_approval import ResignationApproval
from app.models.human_resources.social_insurance_application import SocialInsuranceApplication
from app.models.human_resources.unpaid_leave_application import UnpaidLeaveApplication
from app.models.config_master import CampusProfile
from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources import interview_registration as interview_registration_crud
from app.crud.human_resources import social_insurance_application as social_insurance_crud
from app.crud.human_resources.employee_archive import (
    list_employee_archives,
    get_archive_options,
    upsert_employee_archive,
    serialize_employee_archive,
)
from app.schemas.human_resources.employee_archive import EmployeeArchiveUpsert
from app.schemas.human_resources.interview_registration import (
    InterviewRegistrationCreate,
    InterviewRegistrationUpdate,
)
from app.schemas.human_resources.social_insurance_application import (
    SocialInsuranceApplicationCreate,
)


# ---------------------------------------------------------------------------
# Database configuration — read from .env.test if available, else use defaults
# ---------------------------------------------------------------------------
def _load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


_env = _load_env_file(PROJECT_ROOT / ".env.test")
_DB_USER = _env.get("DB_USER", "postgres")
_DB_PASSWORD = _env.get("DB_PASSWORD", "qingmeijiaoyu123..")
_DB_HOST = _env.get("DB_HOST", "localhost")
_DB_PORT = _env.get("DB_PORT", "5432")
TEST_DB = "qmjy_test_archive"


def _db_url(dbname: str) -> str:
    return f"postgresql+psycopg://{_DB_USER}:{_DB_PASSWORD}@{_DB_HOST}:{_DB_PORT}/{dbname}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_user(
    session,
    *,
    username,
    real_name,
    department,
    position,
    campus="最高议事厅",
    phone="13800000000",
    gender="女",
    role=UserRole.STAFF,
    is_superuser=False,
):
    user = User(
        username=username,
        password_hash="noop",
        real_name=real_name,
        department=department,
        position=position,
        campus=campus,
        phone=phone,
        gender=gender,
        role=role,
        status=UserStatus.ACTIVE,
        is_superuser=is_superuser,
        entry_date=datetime(2025, 1, 10, 9, 0, 0),
    )
    session.add(user)
    session.flush()
    return user


# ---------------------------------------------------------------------------
# Module-scoped fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def _test_engine():
    """Create a throwaway test database and yield a SQLAlchemy Engine."""
    sys_engine = create_engine(_db_url("postgres"), isolation_level="AUTOCOMMIT")
    with sys_engine.connect() as conn:
        conn.execute(text(
            f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            f"WHERE datname = '{TEST_DB}' AND pid <> pg_backend_pid()"
        ))
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB}"'))
        conn.execute(text(f'CREATE DATABASE "{TEST_DB}"'))
    sys_engine.dispose()

    engine = create_engine(_db_url(TEST_DB))
    # Create every schema referenced by Base models
    schemas = {t.schema for t in Base.metadata.tables.values() if t.schema}
    with engine.connect() as conn:
        for schema in schemas:
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        conn.commit()
    Base.metadata.create_all(engine)

    yield engine
    engine.dispose()

    sys_engine = create_engine(_db_url("postgres"), isolation_level="AUTOCOMMIT")
    with sys_engine.connect() as conn:
        conn.execute(text(
            f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            f"WHERE datname = '{TEST_DB}' AND pid <> pg_backend_pid()"
        ))
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB}"'))
    sys_engine.dispose()


@pytest.fixture(scope="module")
def db(_test_engine):
    """Yield a SQLAlchemy Session bound to the test database."""
    Session = sessionmaker(bind=_test_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture(scope="module")
def users(db):
    """Seed test users and supporting HR records, return a dict of user IDs."""
    db.add(CampusProfile(
        name="最高议事厅", code="HQ", short_name="最高议事厅", city="石家庄", is_active=True,
    ))
    db.flush()

    hr = _make_user(db, username="arc_hr", real_name="档案人资",
                     department="人资部", position="人资经理", phone="13800001000")
    self_ = _make_user(db, username="arc_self", real_name="自助员工",
                        department="运营部", position="运营专员", phone="13800001001")
    sync = _make_user(db, username="arc_sync", real_name="同步员工",
                       department="神藏司", position="出纳", phone="13800001002")
    formal = _make_user(db, username="arc_formal", real_name="转正员工",
                         department="市场部", position="市场专员", phone="13800001003")
    unpaid = _make_user(db, username="arc_unpaid", real_name="停薪员工",
                         department="智慧司", position="学术专员", phone="13800001004")
    resigned = _make_user(db, username="arc_resigned", real_name="离职员工",
                           department="祈福司", position="咨询师", phone="13800001005")

    # Social insurance → formal
    db.add(SocialInsuranceApplication(
        application_no="SI-ARC-001", fill_date=date(2026, 3, 8),
        campus="最高议事厅", name=formal.real_name, department=formal.department,
        position=formal.position, phone=formal.phone,
        id_number="130101199001010011", household_type="城镇", id_expiry="长期",
        hire_date=date(2025, 1, 10), registered_address="测试户籍地",
        insurance_type="新参保", hr_start_date=date(2026, 2, 1),
        status="approved",
        created_by_user_id=hr.user_id, created_by_name=hr.real_name,
    ))

    # Regularization → formal & unpaid
    for u, no, completed in [
        (formal, "REG-ARC-001", datetime(2026, 2, 15, 10)),
        (unpaid, "REG-ARC-002", datetime(2026, 1, 15, 10)),
    ]:
        db.add(RegularizationApplication(
            application_no=no, fill_date=date(2026, 2, 1),
            campus="最高议事厅", name=u.real_name, department=u.department,
            position=u.position, gender=u.gender,
            entry_date=date(2025, 1, 10),
            probation_start=date(2025, 1, 10), probation_end=date(2025, 4, 10),
            main_work="测试", self_evaluation="测试",
            status="approved", completed_at=completed,
            created_by_user_id=hr.user_id, created_by_name=hr.real_name,
        ))

    # Unpaid leave → unpaid & resigned
    for u, no, completed in [
        (unpaid, "UL-ARC-001", datetime(2026, 2, 21, 9)),
        (resigned, "UL-ARC-002", datetime(2026, 2, 11, 9)),
    ]:
        db.add(UnpaidLeaveApplication(
            application_no=no, fill_date=date(2026, 2, 20),
            campus="最高议事厅", name=u.real_name, gender=u.gender,
            department=u.department, position=u.position,
            entry_date=date(2025, 1, 10), reason="测试",
            status="approved", completed_at=completed,
            created_by_user_id=hr.user_id, created_by_name=hr.real_name,
        ))

    # Resignation → resigned
    db.add(ResignationApproval(
        application_no="RES-ARC-001", fill_date=date(2026, 3, 1),
        campus="最高议事厅", name=resigned.real_name, gender=resigned.gender,
        department=resigned.department, position=resigned.position,
        entry_date=date(2025, 1, 10), leave_date=date(2026, 3, 5),
        leave_type="主动离职", reason="测试离职",
        status="approved",
        created_by_user_id=hr.user_id, created_by_name=hr.real_name,
    ))

    db.commit()
    return {
        "hr": hr.user_id,
        "self": self_.user_id,
        "sync": sync.user_id,
        "formal": formal.user_id,
        "unpaid": unpaid.user_id,
        "resigned": resigned.user_id,
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
def test_archive_list_options_and_derived_fields(db, users):
    """list + options + derived position_nature / insurance / leave date."""
    hr = db.query(User).filter(User.user_id == users["hr"]).first()
    rows = list_employee_archives(db, scope="hq")
    records = {}
    for user, profile in rows:
        records[user.username] = serialize_employee_archive(db, user, profile, hr)

    # Options
    opts = get_archive_options(db, scope="hq")
    assert "运营部" in opts["departments"]
    assert "运营专员" in opts["positions"]
    assert opts["position_categories"] == ["干部", "员工"]

    # Basic fields
    assert records["arc_sync"]["department"] == "神藏司"
    assert records["arc_sync"]["position"] == "出纳"

    # Derived fields
    assert str(records["arc_formal"]["insurance_start_date"]) == "2026-02-01"
    assert records["arc_formal"]["position_nature"] == "正式"
    assert records["arc_unpaid"]["position_nature"] == "停薪留职"
    assert records["arc_resigned"]["position_nature"] == "离职"
    assert str(records["arc_resigned"]["leave_date"]) == "2026-03-05"


def test_archive_hr_update_creates_profile_and_syncs_user(db, users):
    """HR user creates a profile on first edit and syncs user fields."""
    hr = db.query(User).filter(User.user_id == users["hr"]).first()
    payload = EmployeeArchiveUpsert(
        name="同步员工已更新", department="运营部", position="运营主管",
        phone="13900002002", gender="男", entry_date=date(2025, 6, 1),
        labor_relation_company="清美教育集团", actual_work_company="最高议事厅",
        base_salary=Decimal("8888"), archive_remark="HR 更新测试",
    )
    user, profile = upsert_employee_archive(
        db, users["sync"], payload, hr, scope="hq",
    )

    # User fields synced
    assert user.real_name == "同步员工已更新"
    assert user.department == "运营部"
    assert user.position == "运营主管"
    assert user.phone == "13900002002"
    assert user.gender == "男"
    assert user.entry_date.date() == date(2025, 6, 1)

    # Profile HR-only fields
    assert profile.labor_relation_company == "清美教育集团"
    assert float(profile.base_salary) == 8888
    assert profile.archive_remark == "HR 更新测试"


def test_archive_self_update_allowed_fields_and_forbidden_hr_fields(db, users):
    """Self-edit: allowed fields are saved; HR-only fields are rejected."""
    self_user = db.query(User).filter(User.user_id == users["self"]).first()

    # Allowed self-editable fields
    payload = EmployeeArchiveUpsert(
        current_address="石家庄市测试门牌号 88 号",
        bank_card_number="6222022020202020",
        name="自助员工已更新",
    )
    user, profile = upsert_employee_archive(
        db, users["self"], payload, self_user, scope="hq",
    )
    assert user.real_name == "自助员工已更新"
    assert profile.current_address == "石家庄市测试门牌号 88 号"
    assert profile.bank_card_number == "6222022020202020"

    # Forbidden HR-only fields → PermissionError
    forbidden = EmployeeArchiveUpsert(
        base_salary=Decimal("9999"), archive_remark="员工不能编辑",
    )
    with pytest.raises(PermissionError, match="当前角色不可编辑字段"):
        upsert_employee_archive(
            db, users["self"], forbidden, self_user, scope="hq",
        )

    # Verify salary was NOT changed
    db.refresh(profile)
    assert profile.base_salary is None
    assert profile.archive_remark is None


def test_archive_non_hr_cannot_edit_other_employee(db, users):
    """Non-HR user cannot edit another employee's archive."""
    self_user = db.query(User).filter(User.user_id == users["self"]).first()
    payload = EmployeeArchiveUpsert(current_address="越权修改")
    with pytest.raises(PermissionError, match="无权编辑该员工档案"):
        upsert_employee_archive(
            db, users["sync"], payload, self_user, scope="hq",
        )


def test_offline_archive_scope_accepts_prefixed_campus_names(db):
    """Offline archive should include prefixed campus names like 河北主神殿."""
    user = _make_user(
        db,
        username="arc_offline_prefixed",
        real_name="线下员工",
        department="教务部",
        position="教务老师",
        campus="河北主神殿",
        phone="13800009999",
    )
    db.commit()

    rows = list_employee_archives(db, scope="offline")
    usernames = {item.username for item, _profile in rows}

    assert user.username in usernames


def test_archive_sync_helpers_update_profile_status_and_derived_fields(db, users):
    """Approved 006 records should write back archive basics and derived status."""
    hr = db.query(User).filter(User.user_id == users["hr"]).first()
    target = _make_user(
        db,
        username="arc_flow",
        real_name="流程员工",
        department="教化司",
        position="教质专员",
        phone="13800001006",
    )
    db.commit()

    social = SocialInsuranceApplication(
        application_no="SI-ARC-HELPER-001",
        fill_date=date(2026, 3, 10),
        campus="最高议事厅",
        name="流程员工",
        department="教化司",
        position="教质专员",
        phone="13800001006",
        id_number="130101199001010066",
        household_type="城镇",
        id_expiry="长期",
        hire_date=date(2026, 2, 20),
        registered_address="测试地址",
        insurance_type="新参保",
        hr_start_date=date(2026, 3, 1),
        status="approved",
        created_by_user_id=hr.user_id,
        created_by_name=hr.real_name,
    )
    db.add(social)
    employee_archive_crud.sync_archive_from_social_insurance_approval(db, social)
    db.commit()

    db.refresh(target)
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == target.user_id).first()
    assert profile is not None
    assert profile.contact == "13800001006"
    assert target.entry_date.date() == date(2026, 2, 20)

    serialized = serialize_employee_archive(db, target, profile, hr)
    assert str(serialized["insurance_start_date"]) == "2026-03-01"
    assert serialized["position_nature"] == "试用期"

    regularization = RegularizationApplication(
        application_no="REG-ARC-HELPER-001",
        fill_date=date(2026, 3, 11),
        campus="最高议事厅",
        name="流程员工",
        department="教化司",
        position="教质专员",
        gender="女",
        entry_date=date(2026, 2, 20),
        probation_start=date(2026, 2, 20),
        probation_end=date(2026, 5, 20),
        main_work="测试",
        self_evaluation="测试",
        status="approved",
        completed_at=datetime(2026, 5, 21, 10, 0, 0),
        created_by_user_id=hr.user_id,
        created_by_name=hr.real_name,
    )
    db.add(regularization)
    employee_archive_crud.sync_archive_from_regularization_approval(db, regularization)
    db.commit()

    db.refresh(target)
    db.refresh(profile)
    assert target.status == UserStatus.ACTIVE
    assert profile.is_active is True
    assert serialize_employee_archive(db, target, profile, hr)["position_nature"] == "正式"

    unpaid = UnpaidLeaveApplication(
        application_no="UL-ARC-HELPER-001",
        fill_date=date(2026, 6, 1),
        campus="最高议事厅",
        name="流程员工",
        gender="女",
        department="教化司",
        position="教质专员",
        entry_date=date(2026, 2, 20),
        phone="13800001006",
        reason="测试停薪留职",
        status="approved",
        completed_at=datetime(2026, 6, 2, 9, 0, 0),
        created_by_user_id=hr.user_id,
        created_by_name=hr.real_name,
    )
    db.add(unpaid)
    employee_archive_crud.sync_archive_from_unpaid_leave_approval(db, unpaid)
    db.commit()

    db.refresh(target)
    db.refresh(profile)
    assert target.status == UserStatus.ACTIVE
    assert profile.is_active is True
    assert serialize_employee_archive(db, target, profile, hr)["position_nature"] == "停薪留职"

    resignation = ResignationApproval(
        application_no="RES-ARC-HELPER-001",
        fill_date=date(2026, 7, 1),
        campus="最高议事厅",
        name="流程员工",
        gender="女",
        department="教化司",
        position="教质专员",
        entry_date=date(2026, 2, 20),
        leave_date=date(2026, 7, 10),
        leave_type="主动离职",
        reason="测试离职",
        status="approved",
        created_by_user_id=hr.user_id,
        created_by_name=hr.real_name,
    )
    db.add(resignation)
    employee_archive_crud.sync_archive_from_resignation_approval(db, resignation)
    db.commit()

    db.refresh(target)
    db.refresh(profile)
    serialized = serialize_employee_archive(db, target, profile, hr)
    assert target.status == UserStatus.INACTIVE
    assert profile.is_active is False
    assert serialized["position_nature"] == "离职"
    assert str(serialized["leave_date"]) == "2026-07-10"


def test_social_insurance_final_approval_updates_archive_insurance_start_date(db):
    """社保申请走完整审批流后，员工档案五险缴纳时间应更新为最终审批通过日期。"""
    branch_campus = "主神殿"
    existing_campus = (
        db.query(CampusProfile).filter(CampusProfile.name == branch_campus).first()
    )
    if existing_campus is None:
        db.add(
            CampusProfile(
                name=branch_campus,
                code="SB",
                short_name="盛邦",
                city="石家庄",
                is_active=True,
            )
        )
        db.flush()

    applicant = _make_user(
        db,
        username="arc_si_applicant",
        real_name="社保联动员工",
        department="运营部",
        position="运营专员",
        campus=branch_campus,
        phone="13800002001",
    )
    department_head = _make_user(
        db,
        username="arc_si_dept_head",
        real_name="社保部门主管",
        department="运营部",
        position="运营经理",
        campus=branch_campus,
        phone="13800002002",
    )
    hr_approver = _make_user(
        db,
        username="arc_si_hr",
        real_name="社保人资审批",
        department="人资行政部",
        position="人资专员",
        campus="最高议事厅",
        phone="13800002003",
    )
    principal = _make_user(
        db,
        username="arc_si_principal",
        real_name="社保校长审批",
        department="校务部",
        position="校长",
        campus=branch_campus,
        phone="13800002004",
    )
    db.commit()

    created = social_insurance_crud.create_application(
        db,
        SocialInsuranceApplicationCreate(
            fill_date=date(2026, 3, 18),
            campus=branch_campus,
            account_no="SB-202603-001",
            name=applicant.real_name,
            department=applicant.department,
            position=applicant.position,
            phone=applicant.phone,
            id_number="130101199201010011",
            household_type="本市城镇",
            id_expiry="2036-03-18",
            hire_date=date(2026, 3, 1),
            registered_address="河北省石家庄市测试地址 1 号",
            insurance_type="五险",
            selected_approver_user_ids={},
        ),
        applicant,
    )

    submitted = social_insurance_crud.submit_application(db, created, applicant)
    assert submitted.current_stage == "department_head"

    approved_department = social_insurance_crud.approve_application(
        db,
        submitted,
        department_head,
        comment="部门同意",
    )
    assert approved_department.current_stage == "hr"

    approved_hr = social_insurance_crud.approve_application(
        db,
        approved_department,
        hr_approver,
        comment="人资同意",
        hr_payment_content="正常参保",
        hr_payment_base=6200,
        hr_start_date=date(2026, 4, 1),
        hr_insurance_place=branch_campus,
    )
    assert approved_hr.current_stage == "principal"

    approved_final = social_insurance_crud.approve_application(
        db,
        approved_hr,
        principal,
        comment="校长同意",
    )
    assert approved_final.status == "approved"
    assert approved_final.current_stage is None

    db.refresh(applicant)
    archive_profile = (
        db.query(EmployeeProfile)
        .filter(EmployeeProfile.user_id == applicant.user_id)
        .first()
    )
    assert archive_profile is not None
    serialized = serialize_employee_archive(db, applicant, archive_profile, hr_approver)

    assert approved_final.completed_at is not None
    assert serialized["insurance_start_date"] == approved_final.completed_at.date()


def test_archive_social_insurance_legacy_direct_chairman_uses_approval_date(db):
    """历史直接董事长审批社保单应使用审批通过日期作为员工档案五险缴纳时间。"""
    for campus_name, code, short_name in [
        ("最高议事厅", "HQ", "最高议事厅"),
        ("最高议事厅神殿", "HQ-CAMPUS", "最高议事厅神殿"),
    ]:
        existing_campus = db.query(CampusProfile).filter(CampusProfile.name == campus_name).first()
        if existing_campus is None:
            db.add(
                CampusProfile(
                    name=campus_name,
                    code=code,
                    short_name=short_name,
                    city="石家庄",
                    is_active=True,
                )
            )
    db.flush()

    target = _make_user(
        db,
        username="arc_si_legacy",
        real_name="历史社保员工",
        department="市场部",
        position="AI研发专员",
        campus="最高议事厅",
        phone="13800002101",
    )
    db.commit()

    legacy_record = SocialInsuranceApplication(
        application_no="SI-ARC-LEGACY-001",
        fill_date=date(2026, 3, 18),
        campus="最高议事厅神殿",
        account_no="LEGACY-001",
        name=target.real_name,
        department=target.department,
        position=target.position,
        phone=target.phone,
        id_number="130101199001010088",
        household_type="本市城镇",
        id_expiry="2036-03-18",
        hire_date=date(2026, 4, 2),
        registered_address="历史测试地址",
        insurance_type="五险",
        status="approved",
        completed_at=datetime(2026, 3, 20, 10, 30, 0),
        created_by_user_id=target.user_id,
        created_by_name=target.real_name,
    )
    db.add(legacy_record)
    employee_archive_crud.sync_archive_from_social_insurance_approval(db, legacy_record)
    db.commit()

    db.refresh(target)
    archive_profile = (
        db.query(EmployeeProfile)
        .filter(EmployeeProfile.user_id == target.user_id)
        .first()
    )
    assert archive_profile is not None

    serialized = serialize_employee_archive(db, target, archive_profile, target)
    assert str(serialized["insurance_start_date"]) == "2026-03-20"


def test_interview_registration_create_and_update_sync_archive(db, users):
    """Recruitment onboarding should sync archive on create and update paths."""
    hr = db.query(User).filter(User.user_id == users["hr"]).first()

    created_target = _make_user(
        db,
        username="arc_trial_create",
        real_name="报到员工",
        department="祈福司",
        position="咨询助理",
        phone="13800001007",
    )
    updated_target = _make_user(
        db,
        username="arc_trial_update",
        real_name="补录员工",
        department="市场部",
        position="市场助理",
        phone="13800001008",
    )
    original_update_entry_date = updated_target.entry_date.date()
    db.commit()

    created_record = interview_registration_crud.create_record(
        db,
        InterviewRegistrationCreate(
            region="石家庄",
            campus_name="最高议事厅",
            name="报到员工",
            phone="13800001007",
            position="咨询顾问",
            invite_date=date(2026, 4, 1),
            final_hire_decision="是",
            reported="是",
            onboard_date=date(2026, 4, 8),
        ),
        hr,
    )
    assert isinstance(created_record, InterviewRegistration)

    db.refresh(created_target)
    created_profile = (
        db.query(EmployeeProfile)
        .filter(EmployeeProfile.user_id == created_target.user_id)
        .first()
    )
    assert created_profile is not None
    assert created_target.entry_date.date() == date(2026, 4, 8)
    assert created_target.position == "咨询顾问"
    assert serialize_employee_archive(db, created_target, created_profile, hr)["position_nature"] == "试用期"

    pending_record = interview_registration_crud.create_record(
        db,
        InterviewRegistrationCreate(
            region="石家庄",
            campus_name="最高议事厅",
            name="补录员工",
            phone="13800001008",
            position="市场招商主管",
            invite_date=date(2026, 4, 2),
            final_hire_decision="否",
            reported="否",
        ),
        hr,
    )

    db.refresh(updated_target)
    assert updated_target.entry_date.date() == original_update_entry_date
    assert updated_target.position == "市场助理"

    interview_registration_crud.update_record(
        db,
        pending_record,
        InterviewRegistrationUpdate(
            final_hire_decision="是",
            reported="是",
            onboard_date=date(2026, 4, 11),
        ),
    )

    db.refresh(updated_target)
    updated_profile = (
        db.query(EmployeeProfile)
        .filter(EmployeeProfile.user_id == updated_target.user_id)
        .first()
    )
    assert updated_profile is not None
    assert updated_target.entry_date.date() == date(2026, 4, 11)
    assert updated_target.position == "市场招商主管"
    assert serialize_employee_archive(db, updated_target, updated_profile, hr)["position_nature"] == "试用期"
