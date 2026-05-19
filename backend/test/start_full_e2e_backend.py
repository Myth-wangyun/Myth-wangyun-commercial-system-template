"""Start backend instance for full Playwright page smoke tests."""

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
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR / "test"))

from hr_test_support import create_db_engine, ensure_user  # noqa: E402

from app.crud.human_resources import dashboard as dashboard_crud  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.schemas.human_resources.dashboard import (  # noqa: E402
    DashboardManualRecruitmentDailyUpsert,
    PerformanceFactCreate,
    SalaryWelfareFactCreate,
)

ADMIN_USERNAME = os.environ.get("PLAYWRIGHT_FULL_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("PLAYWRIGHT_FULL_ADMIN_PASSWORD", "qingmeijiaoyu123..")
ADMIN_REAL_NAME = os.environ.get("PLAYWRIGHT_FULL_ADMIN_REAL_NAME", "系统管理员")


def wait_for_health(base_url: str, process: subprocess.Popen[str], timeout: int = 240) -> None:
    deadline = time.time() + timeout
    session = requests.Session()
    session.trust_env = False
    try:
        while time.time() < deadline:
            if process.poll() is not None:
                raise RuntimeError(f"full-e2e 后端提前退出，exit={process.returncode}")
            try:
                response = session.get(f"{base_url}/health", timeout=5)
                if response.status_code == 200:
                    print(f"[full-e2e] 后端已就绪: {base_url}", flush=True)
                    return
            except requests.RequestException:
                pass
            time.sleep(2)
    finally:
        session.close()
    raise RuntimeError(f"等待 full-e2e 后端健康检查超时: {base_url}")


def ensure_admin_user(db_name: str) -> int:
    return ensure_user(
        db_name=db_name,
        username=ADMIN_USERNAME,
        password=ADMIN_PASSWORD,
        real_name=ADMIN_REAL_NAME,
        department="最高议事厅",
        position="系统管理员",
        campus="最高议事厅",
        phone="13800000000",
        role=UserRole.ADMIN,
        is_superuser=True,
    )


def seed_runtime_data(db_name: str) -> None:
    admin_id = ensure_admin_user(db_name)
    ensure_user(
        db_name=db_name,
        username="playwright_full_hq_staff",
        password=ADMIN_PASSWORD,
        real_name="最高议事厅测试员工",
        department="运营部",
        position="运营主管",
        campus="最高议事厅",
        phone="13800006661",
        role=UserRole.STAFF,
        is_superuser=False,
    )
    ensure_user(
        db_name=db_name,
        username="playwright_full_offline_staff",
        password=ADMIN_PASSWORD,
        real_name="线下测试员工",
        department="线下事业部",
        position="校长",
        campus="主神殿",
        phone="13800006662",
        role=UserRole.STAFF,
        is_superuser=False,
    )

    engine = create_db_engine(db_name)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.user_id == admin_id).first()
        if admin_user is None:
            raise RuntimeError("未找到 full-e2e 管理员用户")

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
                    person_name="最高议事厅测试员工",
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
                    remark="full-e2e seed",
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
                    person_name="线下测试员工",
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
                    remark="full-e2e seed",
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
                    person_name="最高议事厅测试员工",
                    position_category="干部",
                    average_score=89,
                    leader_average_score=91,
                    staff_average_score=0,
                    remark="full-e2e seed",
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
                    person_name="线下测试员工",
                    position_category="干部",
                    average_score=86,
                    leader_average_score=88,
                    staff_average_score=0,
                    remark="full-e2e seed",
                ),
                current_user=admin_user,
            )

        dashboard_crud.refresh_scope_dashboard_chain(db, scope="hq", anchor_date=seed_day)
        dashboard_crud.refresh_scope_dashboard_chain(db, scope="offline", anchor_date=seed_day)
        print("[full-e2e] 运行时测试数据已完成初始化", flush=True)
    finally:
        db.close()
        engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=49082)
    parser.add_argument("--db", default="qmjy_test_e2e_all")
    parser.add_argument("--skip-seed", action="store_true")
    args = parser.parse_args()

    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    os.environ["APP_ENV"] = "test"
    os.environ["DB_NAME"] = args.db
    os.environ["TEST_LOGIN_USERNAME"] = ADMIN_USERNAME
    os.environ["TEST_LOGIN_PASSWORD"] = ADMIN_PASSWORD
    os.environ["NO_PROXY"] = "127.0.0.1,localhost"
    os.environ["no_proxy"] = "127.0.0.1,localhost"

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
        if not args.skip_seed:
            try:
                seed_runtime_data(args.db)
            except SQLAlchemyError as exc:
                print(f"[full-e2e] 运行时测试数据初始化失败，继续启动服务: {exc}", flush=True)
        print(f"[full-e2e] 登录账号: {ADMIN_USERNAME} / {ADMIN_PASSWORD}", flush=True)
        return process.wait()
    finally:
        if process.poll() is None:
            process.terminate()
            with suppress(subprocess.TimeoutExpired):
                process.wait(timeout=20)


if __name__ == "__main__":
    raise SystemExit(main())