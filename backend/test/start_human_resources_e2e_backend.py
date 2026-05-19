"""Start a deterministic backend instance for human_resources Playwright tests."""

from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from contextlib import suppress
from datetime import date
from pathlib import Path

import requests
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR / "test"))

from hr_test_support import (  # noqa: E402
    TEST_LOGIN_PASSWORD,
    TEST_LOGIN_USERNAME,
    create_db_engine,
    ensure_admin_user,
    ensure_user,
    reset_database,
)

from app.crud.human_resources import dashboard as dashboard_crud  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.schemas.human_resources.dashboard import (  # noqa: E402
    DashboardManualRecruitmentDailyUpsert,
    PerformanceFactCreate,
    SalaryWelfareFactCreate,
)


def wait_for_health(base_url: str, process: subprocess.Popen[str], timeout: int = 240) -> None:
    deadline = time.time() + timeout
    session = requests.Session()
    session.trust_env = False
    try:
        while time.time() < deadline:
            if process.poll() is not None:
                raise RuntimeError(f"后端测试服务提前退出，exit={process.returncode}")
            try:
                response = session.get(f"{base_url}/health", timeout=5)
                if response.status_code == 200:
                    print(f"[hr-e2e] 后端已就绪: {base_url}", flush=True)
                    return
            except requests.RequestException:
                pass
            time.sleep(2)
    finally:
        session.close()
    raise RuntimeError(f"等待后端健康检查超时: {base_url}")


def seed_data(db_name: str) -> None:
    admin_id = ensure_admin_user(db_name)
    ensure_user(
        db_name=db_name,
        username="pytest_dashboard_hq_staff",
        password=TEST_LOGIN_PASSWORD,
        real_name="人资总部员工",
        department="运营部",
        position="运营主管",
        campus="最高议事厅",
        phone="13800008881",
        role=UserRole.STAFF,
        is_superuser=False,
    )
    ensure_user(
        db_name=db_name,
        username="pytest_dashboard_offline_staff",
        password=TEST_LOGIN_PASSWORD,
        real_name="线下神殿员工",
        department="线下事业部",
        position="校长",
        campus="主神殿",
        phone="13800008882",
        role=UserRole.STAFF,
        is_superuser=False,
    )

    engine = create_db_engine(db_name)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.user_id == admin_id).first()
        if admin_user is None:
            raise RuntimeError("未找到 E2E 管理员用户")

        seed_day = date.today()
        seed_month = seed_day.replace(day=1)

        dashboard_crud.upsert_manual_recruitment_entry(
            db,
            payload=DashboardManualRecruitmentDailyUpsert(
                scope="hq",
                stat_date=seed_day,
                org_name="运营部",
                authorized_posts=12,
                current_posts=9,
                planned_optimize_count=1,
                actual_optimize_count=0,
                transfer_names=["总部调岗甲"],
                optimize_names=["总部优化乙"],
                resign_names=["总部离职丙"],
            ),
            current_user=admin_user,
        )
        dashboard_crud.upsert_manual_recruitment_entry(
            db,
            payload=DashboardManualRecruitmentDailyUpsert(
                scope="offline",
                stat_date=seed_day,
                org_name="主神殿",
                authorized_posts=20,
                current_posts=17,
                planned_optimize_count=2,
                actual_optimize_count=1,
                transfer_names=["线下调岗甲"],
                optimize_names=["线下优化乙"],
                resign_names=["线下离职丙"],
            ),
            current_user=admin_user,
        )

        if not dashboard_crud.list_salary_welfare_facts(db, scope="hq", start_date=seed_day, end_date=seed_day, org_name="运营部"):
            dashboard_crud.create_salary_welfare_fact(
                db,
                payload=SalaryWelfareFactCreate(
                    scope="hq",
                    org_kind="department",
                    org_name="运营部",
                    stat_date=seed_day,
                    person_name="人资总部员工",
                    position="运营主管",
                    position_category="干部",
                    headcount=1,
                    salary=8800,
                    annual_welfare_total=300,
                    monthly_incentive_total=120,
                    temporary_reward_total=30,
                    deduction=10,
                    cadre_salary_total=8800,
                    staff_salary_total=0,
                    remark="playwright seed",
                ),
                current_user=admin_user,
            )
        if not dashboard_crud.list_salary_welfare_facts(db, scope="offline", start_date=seed_day, end_date=seed_day, org_name="主神殿"):
            dashboard_crud.create_salary_welfare_fact(
                db,
                payload=SalaryWelfareFactCreate(
                    scope="offline",
                    org_kind="campus",
                    org_name="主神殿",
                    stat_date=seed_day,
                    person_name="线下神殿员工",
                    position="校长",
                    position_category="干部",
                    headcount=1,
                    salary=9300,
                    annual_welfare_total=450,
                    monthly_incentive_total=180,
                    temporary_reward_total=0,
                    deduction=20,
                    cadre_salary_total=9300,
                    staff_salary_total=0,
                    remark="playwright seed",
                ),
                current_user=admin_user,
            )

        if not dashboard_crud.list_performance_facts(db, scope="hq", start_month=seed_month, end_month=seed_month, org_name="运营部"):
            dashboard_crud.create_performance_fact(
                db,
                payload=PerformanceFactCreate(
                    scope="hq",
                    org_kind="department",
                    org_name="运营部",
                    stat_month=seed_month,
                    person_name="人资总部员工",
                    position_category="干部",
                    average_score=89,
                    leader_average_score=91,
                    staff_average_score=0,
                    remark="playwright seed",
                ),
                current_user=admin_user,
            )
        if not dashboard_crud.list_performance_facts(db, scope="offline", start_month=seed_month, end_month=seed_month, org_name="主神殿"):
            dashboard_crud.create_performance_fact(
                db,
                payload=PerformanceFactCreate(
                    scope="offline",
                    org_kind="campus",
                    org_name="主神殿",
                    stat_month=seed_month,
                    person_name="线下神殿员工",
                    position_category="干部",
                    average_score=86,
                    leader_average_score=88,
                    staff_average_score=0,
                    remark="playwright seed",
                ),
                current_user=admin_user,
            )

        dashboard_crud.refresh_scope_dashboard_chain(db, scope="hq", anchor_date=seed_day)
        dashboard_crud.refresh_scope_dashboard_chain(db, scope="offline", anchor_date=seed_day)
        print("[hr-e2e] 人事测试数据已完成初始化", flush=True)
    finally:
        db.close()
        engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=48080)
    parser.add_argument("--db", default="qmjy_test_hr_e2e")
    args = parser.parse_args()

    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    os.environ["APP_ENV"] = "test"
    os.environ["DB_NAME"] = args.db
    os.environ["NO_PROXY"] = "127.0.0.1,localhost"
    os.environ["no_proxy"] = "127.0.0.1,localhost"

    reset_database(args.db)

    command = [sys.executable, "main.py", "--mode", "test", "--port", str(args.port)]
    process = subprocess.Popen(command, cwd=str(BACKEND_DIR), env=os.environ.copy())
    base_url = f"http://127.0.0.1:{args.port}"

    def shutdown(_signum: int, _frame) -> None:
        if process.poll() is None:
            process.terminate()
            with suppress(subprocess.TimeoutExpired):
                process.wait(timeout=20)
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    try:
        wait_for_health(base_url, process)
        seed_data(args.db)
        print(
            f"[hr-e2e] 登录账号: {TEST_LOGIN_USERNAME} / {TEST_LOGIN_PASSWORD}",
            flush=True,
        )
        return process.wait()
    finally:
        if process.poll() is None:
            process.terminate()
            with suppress(subprocess.TimeoutExpired):
                process.wait(timeout=20)


if __name__ == "__main__":
    raise SystemExit(main())
