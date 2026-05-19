from __future__ import annotations

import asyncio
import sys
from datetime import timedelta
from types import ModuleType, SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import column

import app.core.permissions as permissions
import app.core.security as security


pytestmark = pytest.mark.unit


class FakeQuery:
    def __init__(self, rows) -> None:
        self.rows = rows
        self.filters = []

    def join(self, *args, **kwargs) -> "FakeQuery":
        return self

    def filter(self, *args, **kwargs) -> "FakeQuery":
        self.filters.extend(args)
        return self

    def all(self):
        return list(self.rows)


class CapturingQuery:
    def __init__(self) -> None:
        self.filters = []

    def filter(self, *args, **kwargs) -> "CapturingQuery":
        self.filters.extend(args)
        return self


class ScopeDB:
    def __init__(self, user_roles, role_permissions) -> None:
        self.user_roles = user_roles
        self.role_permissions = role_permissions

    def query(self, *entities):
        if len(entities) == 1 and entities[0] is permissions.UserRole:
            return FakeQuery(self.user_roles)
        return FakeQuery(self.role_permissions)


class ExecuteResult:
    def __init__(self, rows) -> None:
        self.rows = rows

    def fetchall(self):
        return list(self.rows)


class ExecuteDB:
    def __init__(self, rows=None, should_fail: bool = False) -> None:
        self.rows = rows or []
        self.should_fail = should_fail
        self.executed = []
        self.commit_count = 0
        self.rollback_count = 0

    def execute(self, statement, params=None):
        self.executed.append((str(statement), params))
        if self.should_fail:
            raise RuntimeError("execute failed")
        return ExecuteResult(self.rows)

    def commit(self) -> None:
        self.commit_count += 1

    def rollback(self) -> None:
        self.rollback_count += 1


class RoleQuery:
    def __init__(self, result=None, should_fail: bool = False) -> None:
        self.result = result
        self.should_fail = should_fail

    def join(self, *args, **kwargs) -> "RoleQuery":
        return self

    def filter(self, *args, **kwargs) -> "RoleQuery":
        if self.should_fail:
            raise RuntimeError("query failed")
        return self

    def all(self):
        if self.should_fail:
            raise RuntimeError("query failed")
        return list(self.result or [])

    def first(self):
        if self.should_fail:
            raise RuntimeError("query failed")
        return self.result


class RoleDB:
    _UNSET = object()

    def __init__(self, *, roles=None, first=_UNSET, should_fail: bool = False) -> None:
        self.roles = roles or []
        self.first = first
        self.should_fail = should_fail

    def query(self, model):
        if model is permissions.Role:
            result = self.roles if self.first is self._UNSET else self.first
            return RoleQuery(result=result, should_fail=self.should_fail)
        raise AssertionError(f"unexpected model: {model}")


def test_password_hash_and_verify_round_trip(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(security, "SECRET_KEY", "unit-test-secret")
    monkeypatch.setattr(security, "ALGORITHM", "HS256")
    monkeypatch.setattr(security, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
    monkeypatch.setattr(security, "REFRESH_TOKEN_EXPIRE_DAYS", 7)

    hashed = security.SecurityManager.get_password_hash("abc123")

    assert security.SecurityManager.verify_password("abc123", hashed) is True
    assert security.SecurityManager.verify_password("wrong123", hashed) is False
    assert security.SecurityManager.verify_password("abc123", "not-a-bcrypt-hash") is False


def test_token_helpers_cover_access_refresh_and_invalid_token_paths(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(security, "SECRET_KEY", "unit-test-secret")
    monkeypatch.setattr(security, "ALGORITHM", "HS256")
    monkeypatch.setattr(security, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
    monkeypatch.setattr(security, "REFRESH_TOKEN_EXPIRE_DAYS", 7)

    access_token = security.SecurityManager.create_access_token(
        {"sub": "alice", "user_id": 7},
        expires_delta=timedelta(minutes=1),
    )
    refresh_token = security.SecurityManager.create_refresh_token(
        {"sub": "alice", "user_id": 7},
        expires_delta=timedelta(days=1),
    )

    payload = security.SecurityManager.verify_token(access_token, "access")
    refreshed = security.TokenManager.refresh_access_token(refresh_token)

    assert payload["sub"] == "alice"
    assert payload["user_id"] == 7
    assert security.SecurityManager.verify_token(
        refreshed["access_token"], "access"
    )["user_id"] == 7

    with pytest.raises(HTTPException) as wrong_type:
        security.SecurityManager.verify_token(access_token, "refresh")
    with pytest.raises(HTTPException) as invalid_token:
        security.SecurityManager.verify_token("invalid-token", "access")

    assert wrong_type.value.status_code == 401
    assert invalid_token.value.status_code == 401


def test_validation_helpers_cover_positive_and_negative_cases() -> None:
    assert security.SecurityManager.validate_password_strength("12345")[0] is False
    assert security.SecurityManager.validate_password_strength("a" * 129)[0] is False
    assert security.SecurityManager.validate_password_strength("abcdef")[0] is False
    assert security.SecurityManager.validate_password_strength("123456")[0] is False
    assert security.SecurityManager.validate_password_strength("abc123") == (True, "")

    assert security.SecurityManager.validate_username("ab")[0] is False
    assert security.SecurityManager.validate_username("a" * 51)[0] is False
    assert security.SecurityManager.validate_username("bad-user")[0] is False
    assert security.SecurityManager.validate_username("good_user_7") == (True, "")

    assert security.SecurityManager.validate_email("valid@example.com") is True
    assert security.SecurityManager.validate_email("missing-at.example.com") is False
    assert security.SecurityManager.generate_session_id() != security.SecurityManager.generate_session_id()


def test_security_exceptions_are_wrapped_or_re_raised(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(security.bcrypt, "gensalt", lambda: (_ for _ in ()).throw(RuntimeError("salt failed")))
    with pytest.raises(RuntimeError):
        security.SecurityManager.get_password_hash("abc123")

    monkeypatch.setattr(security.jwt, "encode", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("encode failed")))
    with pytest.raises(HTTPException) as access_exc:
        security.SecurityManager.create_access_token({"sub": "alice"})
    with pytest.raises(HTTPException) as refresh_exc:
        security.SecurityManager.create_refresh_token({"sub": "alice"})

    assert access_exc.value.status_code == 500
    assert refresh_exc.value.status_code == 500


def test_permission_manager_and_context_repr_cover_exact_wildcard_and_missing() -> None:
    user = SimpleNamespace(user_id=9, username="alice")
    context = permissions.PermissionContext(user=user, data_scope="campus", campus="north")

    assert "alice" in repr(context)
    assert permissions.PermissionManager.check_permission({"*"}, "academic.view") is True
    assert permissions.PermissionManager.check_permission(
        {"academic.*"}, "academic.enterprise.view"
    ) is True
    assert permissions.PermissionManager.check_permission(
        {"academic.enterprise.view"}, "academic.enterprise.view"
    ) is True
    assert permissions.PermissionManager.check_permission(
        {"consult.view"}, "academic.enterprise.view"
    ) is False


def test_get_user_permissions_and_require_permission(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(user_id=7, username="alice", is_superuser=False, campus="north")

    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_direct_permissions",
        lambda db, user_id: {"academic.view"},
    )
    monkeypatch.setattr(permissions, "check_is_export_approver", lambda db, user_id: True)

    permission_codes = permissions.PermissionManager.get_user_permissions(object(), user)

    assert permission_codes == {"academic.view", "consult.export.approve"}
    assert permissions.PermissionManager.get_user_permissions(
        object(),
        SimpleNamespace(user_id=1, username="root", is_superuser=True, campus=None),
    ) == {"*"}

    fake_auth = ModuleType("app.core.auth")
    fake_auth.AuthManager = type("AuthManager", (), {"get_current_user": staticmethod(lambda: None)})
    fake_database = ModuleType("app.core.database")
    fake_database.get_db = lambda: None
    monkeypatch.setitem(sys.modules, "app.core.auth", fake_auth)
    monkeypatch.setitem(sys.modules, "app.core.database", fake_database)
    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_user_permissions",
        lambda db, current_user: {"academic.*"},
    )
    expected_context = permissions.PermissionContext(user=user, data_scope="campus", campus="north")
    monkeypatch.setattr(
        permissions.DataScopeFilter,
        "create_permission_context",
        lambda db, current_user, permission_code: expected_context,
    )

    checker = permissions.require_permission("academic.enterprise.view")
    result = asyncio.run(checker(current_user=user, db=object()))

    assert result is expected_context

    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_user_permissions",
        lambda db, current_user: set(),
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(checker(current_user=user, db=object()))

    assert exc.value.status_code == 403


def test_data_scope_filter_apply_and_resolve_scope(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyModel:
        campus = column("campus")
        owner_id = column("owner_id")

    user = SimpleNamespace(user_id=5, campus="north", is_superuser=False)

    all_query = CapturingQuery()
    assert permissions.DataScopeFilter.apply_filter(
        all_query, user, "all", DummyModel, user_field="owner_id"
    ) is all_query
    assert all_query.filters == []

    campus_query = CapturingQuery()
    permissions.DataScopeFilter.apply_filter(campus_query, user, "campus", DummyModel)
    assert len(campus_query.filters) == 1
    assert "campus" in str(campus_query.filters[0])

    self_query = CapturingQuery()
    permissions.DataScopeFilter.apply_filter(self_query, user, "self", DummyModel, user_field="owner_id")
    assert len(self_query.filters) == 1
    assert "owner_id" in str(self_query.filters[0])
    assert "campus" in str(self_query.filters[0])

    with pytest.raises(ValueError):
        permissions.DataScopeFilter.apply_filter(CapturingQuery(), user, "self", DummyModel)

    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_direct_permissions",
        lambda db, user_id: set(),
    )
    scope_db = ScopeDB(
        user_roles=[SimpleNamespace(role_id=1)],
        role_permissions=[
            (SimpleNamespace(data_scope="campus"), SimpleNamespace()),
            (SimpleNamespace(data_scope="all"), SimpleNamespace()),
        ],
    )

    assert permissions.DataScopeFilter.get_user_data_scope(
        scope_db,
        SimpleNamespace(user_id=5, campus="north", is_superuser=False),
        "academic.enterprise.view",
    ) == "all"


def test_permission_db_helpers_cover_success_and_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    db = ExecuteDB(rows=[("route.users",), ("route.stats",)])
    with monkeypatch.context() as local_patch:
        local_patch.setattr(permissions, "_ensure_user_permissions_direct_table", lambda db_obj: None)
        local_patch.setattr(permissions, "_ensure_route_permission_table", lambda db_obj: None)
        local_patch.setattr(
            permissions,
            "_get_route_permission_map_from_db",
            lambda db_obj, route_keys: {"route.users": ["users.view", "users.edit"]},
        )

        direct_permissions = permissions.PermissionManager.get_direct_permissions(db, 7)

        assert direct_permissions == {"route.users", "route.stats", "users.view", "users.edit"}

        failing_db = ExecuteDB(should_fail=True)
        assert permissions.PermissionManager.get_direct_permissions(failing_db, 7) == set()
        assert failing_db.rollback_count == 1

    helper_db = ExecuteDB()
    permissions._ensure_route_permission_table(helper_db)
    permissions._ensure_user_permissions_direct_table(helper_db)
    assert helper_db.commit_count == 2
    assert len(helper_db.executed) == 3

    failing_helper_db = ExecuteDB(should_fail=True)
    permissions._ensure_route_permission_table(failing_helper_db)
    permissions._ensure_user_permissions_direct_table(failing_helper_db)
    assert failing_helper_db.rollback_count == 2

    route_map_db = ExecuteDB(rows=[("rk", "perm.b"), ("rk", "perm.a"), ("other", "perm.c"), ("rk", "perm.a")])
    route_map = permissions._get_route_permission_map_from_db(route_map_db, ["rk", "other"])
    assert route_map == {"other": ["perm.c"], "rk": ["perm.a", "perm.b"]}
    assert permissions._get_route_permission_map_from_db(route_map_db, []) == {}
    assert permissions._get_route_permission_map_from_db(ExecuteDB(should_fail=True), ["rk"]) == {}


def test_role_helpers_cover_success_and_failure_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(user_id=7, username="alice", is_superuser=False, campus="north")
    role = SimpleNamespace(code="admin")

    roles = permissions.PermissionManager.get_user_roles(RoleDB(roles=[role]), user)
    assert roles == [role]
    assert permissions.PermissionManager.get_user_roles(RoleDB(should_fail=True), user) == []

    assert permissions.PermissionManager.has_role(RoleDB(first=role), user, "admin") is True
    assert permissions.PermissionManager.has_role(RoleDB(first=None), user, "admin") is False
    assert permissions.PermissionManager.has_role(RoleDB(should_fail=True), user, "admin") is False

    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_direct_permissions",
        lambda db, user_id: (_ for _ in ()).throw(RuntimeError("boom")),
    )
    assert permissions.PermissionManager.get_user_permissions(object(), user) == set()
    assert permissions.check_is_export_approver(object(), 1) is False
    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_direct_permissions",
        lambda db, user_id: set(),
    )
    assert permissions.DataScopeFilter.get_user_data_scope(
        ScopeDB(user_roles=[], role_permissions=[]),
        SimpleNamespace(user_id=5, campus="north", is_superuser=False),
        "academic.enterprise.view",
    ) == "self"
    monkeypatch.setattr(
        permissions.PermissionManager,
        "get_direct_permissions",
        lambda db, user_id: {"direct.permission"},
    )
    scope_db = ScopeDB(
        user_roles=[SimpleNamespace(role_id=1)],
        role_permissions=[(SimpleNamespace(data_scope="campus"), SimpleNamespace())],
    )
    assert permissions.DataScopeFilter.get_user_data_scope(
        scope_db,
        SimpleNamespace(user_id=5, campus="north", is_superuser=False),
        "academic.enterprise.view",
    ) == "all"
