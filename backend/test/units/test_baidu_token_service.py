from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

import app.services.market.baidu_marketing.models as token_models
from app.services.market.baidu_marketing.token_service import (
    BaiduTokenService,
    TokenInfo,
    _build_token_info,
)


pytestmark = pytest.mark.unit


class Field:
    def __init__(self, name: str) -> None:
        self.name = name

    def __eq__(self, other):
        return (self.name, other)


class FakeTokenModel:
    user_id = Field("user_id")
    app_id = Field("app_id")
    status = Field("status")

    def __init__(self, **kwargs) -> None:
        self.__dict__.update(kwargs)


class FakeQuery:
    def __init__(self, first_result=None, all_result=None) -> None:
        self.first_result = first_result
        self.all_result = list(all_result or [])
        self.filters = []
        self.updated_payload = None

    def filter(self, *criteria) -> "FakeQuery":
        self.filters.extend(criteria)
        return self

    def first(self):
        return self.first_result

    def all(self):
        return list(self.all_result)

    def update(self, payload) -> int:
        self.updated_payload = payload
        return 1


class FakeDB:
    def __init__(self, *, first_result=None, all_result=None, fail: bool = False) -> None:
        self.first_result = first_result
        self.all_result = all_result
        self.fail = fail
        self.added = []
        self.commit_count = 0
        self.rollback_count = 0
        self.last_query = None

    def query(self, model):
        if self.fail:
            raise RuntimeError("db boom")
        self.last_query = FakeQuery(self.first_result, self.all_result)
        return self.last_query

    def add(self, item) -> None:
        self.added.append(item)

    def commit(self) -> None:
        self.commit_count += 1

    def rollback(self) -> None:
        self.rollback_count += 1


class FakeOAuthService:
    def __init__(self, result=None) -> None:
        self.app_id = "app-123"
        self.result = result or {
            "code": 0,
            "data": {
                "accessToken": "new-access",
                "refreshToken": "new-refresh",
                "expiresIn": 120,
                "refreshExpiresIn": 3600,
            },
        }
        self.calls = []

    async def refresh_access_token(self, refresh_token: str, user_id: int):
        self.calls.append((refresh_token, user_id))
        return self.result


def make_token(
    *,
    user_id: int = 1,
    access_token: str = "access",
    refresh_token: str = "refresh",
    expires_at: datetime | None = None,
    refresh_expires_at: datetime | None = None,
) -> TokenInfo:
    now = datetime.now()
    return TokenInfo(
        user_id=user_id,
        user_name=f"user-{user_id}",
        access_token=access_token,
        refresh_token=refresh_token,
        open_id=f"open-{user_id}",
        expires_at=expires_at or (now + timedelta(minutes=30)),
        refresh_expires_at=refresh_expires_at or (now + timedelta(days=1)),
        app_id="app-123",
    )


@pytest.fixture(autouse=True)
def _patch_token_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(token_models, "BaiduMarketingToken", FakeTokenModel)


def test_token_info_and_build_token_info_cover_flags_and_missing_open_id() -> None:
    expired = make_token(
        expires_at=datetime.now() - timedelta(minutes=1),
        refresh_expires_at=datetime.now() - timedelta(minutes=1),
    )
    should_refresh = make_token(expires_at=datetime.now() + timedelta(minutes=2))
    record = SimpleNamespace(
        user_id=3,
        user_name="alice",
        open_id=None,
        access_token="token-a",
        refresh_token="token-r",
        expires_at=datetime.now() + timedelta(minutes=10),
        refresh_expires_at=datetime.now() + timedelta(days=1),
        app_id="app-123",
        user_acct_type=2,
        master_name="master",
        status=1,
        updated_at=datetime.now(),
    )

    record_info = _build_token_info(record)

    assert expired.is_access_token_expired is True
    assert expired.is_refresh_token_expired is True
    assert should_refresh.should_refresh is True
    assert record_info.open_id == ""
    assert record_info.to_dict()["user_acct_type"] == 2


def test_save_to_db_updates_existing_records_and_inserts_new_ones() -> None:
    service = BaiduTokenService(FakeOAuthService())
    token_info = make_token()
    existing = SimpleNamespace(
        user_id=1,
        user_name="old-user",
        open_id="old-open",
        access_token="old-access",
        refresh_token="old-refresh",
        expires_at=datetime.now(),
        refresh_expires_at=datetime.now(),
        app_id="app-123",
        user_acct_type=1,
        master_name=None,
        status=0,
        updated_at=datetime.now(),
    )

    db_existing = FakeDB(first_result=existing)
    service._save_to_db(token_info, db_existing)

    assert existing.access_token == "access"
    assert existing.refresh_token == "refresh"
    assert existing.status == 1
    assert db_existing.commit_count == 1
    assert db_existing.added == []

    db_new = FakeDB(first_result=None)
    service._save_to_db(token_info, db_new)

    assert db_new.commit_count == 1
    assert len(db_new.added) == 1
    assert db_new.added[0].user_id == token_info.user_id
    assert db_new.added[0].app_id == "app-123"


def test_save_token_and_db_error_paths_cover_cache_and_rollbacks() -> None:
    service = BaiduTokenService(FakeOAuthService())
    db = FakeDB(first_result=None)

    saved = service.save_token(
        user_id=7,
        user_name="saved-user",
        access_token="saved-access",
        refresh_token="saved-refresh",
        open_id="saved-open",
        expires_in=60,
        refresh_expires_in=120,
        db=db,
    )

    assert service._token_cache[7] is saved
    assert db.commit_count == 1

    failing_db = FakeDB(fail=True)
    with pytest.raises(RuntimeError):
        service._save_to_db(make_token(user_id=8), failing_db)
    assert failing_db.rollback_count == 1


def test_load_delete_and_get_token_cover_db_and_cache_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    service = BaiduTokenService(FakeOAuthService())
    record = SimpleNamespace(
        user_id=5,
        user_name="bob",
        open_id=None,
        access_token="db-access",
        refresh_token="db-refresh",
        expires_at=datetime.now() + timedelta(minutes=10),
        refresh_expires_at=datetime.now() + timedelta(days=1),
        app_id="app-123",
        user_acct_type=1,
        master_name=None,
        status=1,
        updated_at=datetime.now(),
    )
    db = FakeDB(first_result=record)

    loaded = service._load_from_db(5, db)

    assert loaded is not None
    assert loaded.user_id == 5
    assert loaded.open_id == ""

    db_delete = FakeDB()
    service._delete_from_db(5, db_delete)
    assert db_delete.commit_count == 1
    assert db_delete.last_query.updated_payload["status"] == 0
    assert service._load_from_db(5, FakeDB(fail=True)) is None

    calls = {"count": 0}

    def fake_load_from_db(user_id: int, db_obj) -> TokenInfo:
        calls["count"] += 1
        return make_token(user_id=user_id, access_token="loaded-token")

    monkeypatch.setattr(service, "_load_from_db", fake_load_from_db)

    first = service.get_token(9, object())
    second = service.get_token(9, object())

    assert first is second
    assert first.access_token == "loaded-token"
    assert calls["count"] == 1
    assert service.get_token(404) is None


@pytest.mark.asyncio
async def test_get_valid_access_token_and_refresh_token_cover_refresh_logic(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = BaiduTokenService(FakeOAuthService())

    assert await service.get_valid_access_token(404) is None

    expired_refresh = make_token(
        user_id=2,
        expires_at=datetime.now() + timedelta(minutes=2),
        refresh_expires_at=datetime.now() - timedelta(minutes=1),
    )
    service._token_cache[2] = expired_refresh
    assert await service.get_valid_access_token(2) is None

    refresh_candidate = make_token(
        user_id=3,
        access_token="old-access",
        expires_at=datetime.now() + timedelta(minutes=1),
        refresh_expires_at=datetime.now() + timedelta(days=1),
    )
    service._token_cache[3] = refresh_candidate

    async def fake_refresh_token(user_id: int, db=None) -> bool:
        service._token_cache[user_id] = make_token(
            user_id=user_id,
            access_token="refreshed-access",
            expires_at=datetime.now() + timedelta(minutes=30),
            refresh_expires_at=datetime.now() + timedelta(days=1),
        )
        return True

    monkeypatch.setattr(service, "refresh_token", fake_refresh_token)

    assert await service.get_valid_access_token(3) == "refreshed-access"

    service._token_cache[4] = make_token(
        user_id=4,
        access_token="still-old",
        expires_at=datetime.now() + timedelta(minutes=1),
        refresh_expires_at=datetime.now() + timedelta(days=1),
    )

    async def fake_failed_refresh(user_id: int, db=None) -> bool:
        return False

    monkeypatch.setattr(service, "refresh_token", fake_failed_refresh)

    assert await service.get_valid_access_token(4) is None


@pytest.mark.asyncio
async def test_refresh_token_and_refresh_all_expiring_tokens_cover_success_and_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    oauth = FakeOAuthService()
    service = BaiduTokenService(oauth)
    service._token_cache[1] = make_token(
        user_id=1,
        expires_at=datetime.now() + timedelta(minutes=1),
        refresh_expires_at=datetime.now() + timedelta(days=1),
    )

    saved = {}

    def fake_save_token(**kwargs):
        saved.update(kwargs)
        token = make_token(
            user_id=kwargs["user_id"],
            access_token=kwargs["access_token"],
            refresh_token=kwargs["refresh_token"],
            expires_at=datetime.now() + timedelta(seconds=kwargs["expires_in"]),
            refresh_expires_at=datetime.now() + timedelta(seconds=kwargs["refresh_expires_in"]),
        )
        service._token_cache[kwargs["user_id"]] = token
        return token

    monkeypatch.setattr(service, "save_token", fake_save_token)

    assert await service.refresh_token(1) is True
    assert saved["access_token"] == "new-access"
    assert oauth.calls == [("refresh", 1)]

    failing_service = BaiduTokenService(FakeOAuthService(result={"code": 1, "message": "fail"}))
    failing_service._token_cache[1] = make_token(user_id=1)
    assert await failing_service.refresh_token(1) is False
    assert await failing_service.refresh_token(404) is False

    refreshing = make_token(
        user_id=11,
        expires_at=datetime.now() + timedelta(minutes=1),
        refresh_expires_at=datetime.now() + timedelta(days=1),
    )
    refresh_expired = make_token(
        user_id=12,
        expires_at=datetime.now() + timedelta(minutes=1),
        refresh_expires_at=datetime.now() - timedelta(minutes=1),
    )
    stable = make_token(
        user_id=13,
        expires_at=datetime.now() + timedelta(minutes=30),
        refresh_expires_at=datetime.now() + timedelta(days=1),
    )
    batch_service = BaiduTokenService(FakeOAuthService())
    monkeypatch.setattr(batch_service, "get_all_tokens", lambda db=None: [refreshing, refresh_expired, stable])
    refreshed_ids = []

    async def fake_batch_refresh(user_id: int, db=None) -> bool:
        refreshed_ids.append(user_id)
        return True

    monkeypatch.setattr(batch_service, "refresh_token", fake_batch_refresh)

    result = await batch_service.refresh_all_expiring_tokens()

    assert result == {"total": 3, "refreshed": 1, "failed": 0, "skipped": 2}
    assert refreshed_ids == [11]

    failing_batch_service = BaiduTokenService(FakeOAuthService())
    monkeypatch.setattr(
        failing_batch_service,
        "get_all_tokens",
        lambda db=None: [
            make_token(
                user_id=21,
                expires_at=datetime.now() + timedelta(minutes=1),
                refresh_expires_at=datetime.now() + timedelta(days=1),
            )
        ],
    )

    async def fake_failed_batch_refresh(user_id: int, db=None) -> bool:
        return False

    monkeypatch.setattr(failing_batch_service, "refresh_token", fake_failed_batch_refresh)
    assert await failing_batch_service.refresh_all_expiring_tokens() == {
        "total": 1,
        "refreshed": 0,
        "failed": 1,
        "skipped": 0,
    }


def test_load_all_tokens_and_delete_token_cover_cache_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    service = BaiduTokenService(FakeOAuthService())
    records = [
        SimpleNamespace(
            user_id=1,
            user_name="alice",
            open_id="open-1",
            access_token="token-1",
            refresh_token="refresh-1",
            expires_at=datetime.now() + timedelta(minutes=10),
            refresh_expires_at=datetime.now() + timedelta(days=1),
            app_id="app-123",
            user_acct_type=1,
            master_name=None,
            status=1,
            updated_at=datetime.now(),
        ),
        SimpleNamespace(
            user_id=2,
            user_name="bob",
            open_id="open-2",
            access_token="token-2",
            refresh_token="refresh-2",
            expires_at=datetime.now() + timedelta(minutes=10),
            refresh_expires_at=datetime.now() + timedelta(days=1),
            app_id="app-123",
            user_acct_type=1,
            master_name=None,
            status=1,
            updated_at=datetime.now(),
        ),
    ]
    db = FakeDB(all_result=records)

    loaded = service._load_all_from_db(db)

    assert [item.user_id for item in loaded] == [1, 2]
    assert set(service._token_cache) == {1, 2}
    assert service.load_tokens_from_db(db) == 2

    cached_only = make_token(user_id=99)
    service._token_cache = {99: cached_only}
    fallback = service._load_all_from_db(FakeDB(fail=True))

    assert fallback == [cached_only]
    assert service.get_all_tokens() == [cached_only]
    assert service.get_all_tokens(db=db)[0].user_id == 1

    deleted = []
    monkeypatch.setattr(service, "_delete_from_db", lambda user_id, db_obj: deleted.append((user_id, db_obj)))
    service.delete_token(99, db="db-session")

    assert 99 not in service._token_cache
    assert deleted == [(99, "db-session")]

    failing_delete_db = FakeDB(fail=True)
    error_service = BaiduTokenService(FakeOAuthService())
    with pytest.raises(RuntimeError):
        error_service._delete_from_db(1, failing_delete_db)
    assert failing_delete_db.rollback_count == 1
