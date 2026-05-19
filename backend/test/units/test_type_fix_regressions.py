from __future__ import annotations

from datetime import date

import pytest

import app.logs.sqlalchemy as audit_sqlalchemy
from app.core.config import _resolve_env_files
from app.core.paths import PROJECT_ROOT as APP_PROJECT_ROOT, resolve_project_storage_path
from app.crud import project_plan as project_plan_crud
from app.models.project_plan import CampusProjectPlan
from app.services.market.baidu_marketing.config import BaiduMarketingConfig
from app.services.market.baidu_marketing.crypto_utils import SignatureService
from app.services.market.baidu_marketing.oauth_service import BaiduOAuthService


pytestmark = [pytest.mark.unit, pytest.mark.smoke]


def test_baidu_marketing_config_from_env_accepts_valid_values(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BAIDU_MARKETING_APP_ID", "app-123")
    monkeypatch.setenv("BAIDU_MARKETING_SECRET_KEY", "secret-456")
    monkeypatch.setenv("BAIDU_MARKETING_CALLBACK_URL", "https://example.com/callback")
    monkeypatch.setenv("BAIDU_MARKETING_DEVELOPER_USER_ID", "789")
    monkeypatch.setenv("BAIDU_MARKETING_SCOPE", "1_0_1")

    config = BaiduMarketingConfig.from_env()

    assert config is not None
    assert config.app_id == "app-123"
    assert config.secret_key == "secret-456"
    assert config.callback_url == "https://example.com/callback"
    assert config.developer_user_id == 789
    assert config.scope == "1_0_1"


def test_baidu_marketing_config_from_env_rejects_invalid_user_id(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BAIDU_MARKETING_APP_ID", "app-123")
    monkeypatch.setenv("BAIDU_MARKETING_SECRET_KEY", "secret-456")
    monkeypatch.setenv("BAIDU_MARKETING_CALLBACK_URL", "https://example.com/callback")
    monkeypatch.setenv("BAIDU_MARKETING_DEVELOPER_USER_ID", "not-an-int")

    assert BaiduMarketingConfig.from_env() is None


def test_project_plan_helpers_preserve_payload_shape() -> None:
    assert project_plan_crud._parse_iso_date("2026-03-11") == date(2026, 3, 11)
    assert project_plan_crud._parse_iso_date("bad-date") is None

    records = [
        CampusProjectPlan(
            campus_name="主神殿",
            class_id="CLS-001",
            class_name="AI就业班",
            class_advisor="班主任A",
            reinforcement_instructor="强化教员B",
            project_number="1",
            project_name="项目一",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 31),
            tasks=[{"title": "任务1"}],
        )
    ]

    payload = project_plan_crud.serialize_project_plan(records)

    assert payload == {
        "campus": "主神殿",
        "class_id": "CLS-001",
        "class_name": "AI就业班",
        "class_advisor": "班主任A",
        "reinforcement_instructor": "强化教员B",
        "projects": [
            {
                "number": "1",
                "name": "项目一",
                "start_date": "2026-03-01",
                "end_date": "2026-03-31",
                "tasks": [{"title": "任务1"}],
            }
        ],
    }


def test_oauth_verify_callback_accepts_existing_signature_protocol() -> None:
    service = BaiduOAuthService(
        app_id="app-123",
        secret_key="secret-456789012345",
        callback_url="https://example.com/callback",
        developer_user_id=42,
    )
    state = SignatureService.generate_state(service.app_id, service.developer_user_id)
    params = {
        "appId": service.app_id,
        "authCode": "auth-code",
        "userId": "1001",
        "state": state,
        "timestamp": "1710000000",
    }
    signature = SignatureService.generate_signature(params, service.secret_key)

    result = service.verify_callback(
        app_id=service.app_id,
        auth_code="auth-code",
        user_id="1001",
        timestamp="1710000000",
        state=state,
        signature=signature,
    )

    assert result == {"success": True, "error": None}


def test_oauth_verify_callback_rejects_mismatched_app_id() -> None:
    service = BaiduOAuthService(
        app_id="app-123",
        secret_key="secret-456789012345",
        callback_url="https://example.com/callback",
        developer_user_id=42,
    )

    result = service.verify_callback(
        app_id="wrong-app",
        auth_code="auth-code",
        user_id="1001",
        timestamp="1710000000",
        state="ignored",
        signature="ignored",
    )

    assert result == {"success": False, "error": "appId不匹配"}


def test_register_audit_listeners_is_idempotent(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[object, str, object]] = []

    def fake_listen(target: object, identifier: str, callback: object) -> None:
        calls.append((target, identifier, callback))

    monkeypatch.setattr(audit_sqlalchemy, "_AUDIT_LISTENERS_INSTALLED", False)
    monkeypatch.setattr(audit_sqlalchemy.event, "listen", fake_listen)

    audit_sqlalchemy.register_audit_listeners()
    audit_sqlalchemy.register_audit_listeners()

    assert [identifier for _, identifier, _ in calls] == ["before_flush", "after_flush"]
    assert audit_sqlalchemy._AUDIT_LISTENERS_INSTALLED is True


def test_resolve_env_files_prefers_test_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "test")

    assert _resolve_env_files() == (".env.test", ".env")


def test_resolve_project_storage_path_remaps_data_root_in_test(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "test")

    resolved = resolve_project_storage_path("/data/uploads")

    assert resolved == APP_PROJECT_ROOT / ".runtime" / "test" / "uploads"
