from __future__ import annotations

from pathlib import Path

import pytest

from app.core import database
from migrations import auto_migrate


pytestmark = pytest.mark.unit


class FakeConnection:
    def __init__(self) -> None:
        self.executed = []
        self.committed = False

    def execute(self, statement, params=None):
        self.executed.append((str(statement), params))
        return self

    def commit(self) -> None:
        self.committed = True

    def __enter__(self) -> "FakeConnection":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


class FakeEngine:
    def __init__(self) -> None:
        self.connections = []

    def connect(self) -> FakeConnection:
        connection = FakeConnection()
        self.connections.append(connection)
        return connection


class ExplodingStrError(Exception):
    def __str__(self) -> str:
        raise UnicodeEncodeError("utf-8", "x", 0, 1, "boom")


class ScriptedResult:
    def __init__(self, *, fetchone=None, scalar=None) -> None:
        self._fetchone = fetchone
        self._scalar = scalar

    def fetchone(self):
        return self._fetchone

    def scalar(self):
        return self._scalar


class ScriptedBeginConnection:
    def __init__(self, responses, fail_at: int | None = None) -> None:
        self.responses = list(responses)
        self.fail_at = fail_at
        self.calls = 0
        self.executed = []

    def execute(self, statement, params=None):
        self.calls += 1
        self.executed.append((str(statement), params))
        if self.fail_at is not None and self.calls == self.fail_at:
            raise RuntimeError("db boom")
        if self.responses:
            return self.responses.pop(0)
        return ScriptedResult()

    def __enter__(self) -> "ScriptedBeginConnection":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


class ScriptedBeginEngine:
    def __init__(self, responses, fail_at: int | None = None) -> None:
        self.connection = ScriptedBeginConnection(responses, fail_at=fail_at)

    def begin(self) -> ScriptedBeginConnection:
        return self.connection


def test_safe_error_str_and_runtime_ready_state(monkeypatch: pytest.MonkeyPatch) -> None:
    error = ExplodingStrError(b"\xe4\xb8\xad", 7)

    rendered = database.safe_error_str(error)

    assert "7" in rendered
    assert rendered

    calls = {"count": 0}

    def fake_init_db() -> bool:
        calls["count"] += 1
        return True

    monkeypatch.setattr(database, "init_db", fake_init_db)
    database.reset_runtime_db_ready()

    assert database.ensure_runtime_db_ready() is True
    assert database.ensure_runtime_db_ready() is True
    assert database.is_runtime_db_ready() is True
    assert calls["count"] == 1

    monkeypatch.setattr(database, "init_db", lambda: False)
    database.reset_runtime_db_ready()

    assert database.ensure_runtime_db_ready() is False
    assert database.is_runtime_db_ready() is False


def test_get_database_engine_and_session_use_selected_database(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured = {"urls": []}

    class FakeSettings:
        DB_NAME = "default_db"
        DB_POOL_SIZE = 2
        DB_MAX_OVERFLOW = 4
        DB_POOL_RECYCLE = 60
        SQL_ECHO = False

        @staticmethod
        def get_database_url(name: str) -> str:
            captured["urls"].append(name)
            return f"postgresql:///{name}"

    fake_engine = object()

    def fake_create_engine(url: str, **kwargs):
        captured["engine_url"] = url
        captured["engine_kwargs"] = kwargs
        return fake_engine

    def fake_sessionmaker(**kwargs):
        captured["session_kwargs"] = kwargs

        def factory():
            return "session-object"

        return factory

    monkeypatch.setattr(database, "settings", FakeSettings())
    monkeypatch.setattr(database, "create_engine", fake_create_engine)
    monkeypatch.setattr(database, "sessionmaker", fake_sessionmaker)
    monkeypatch.setattr(database, "get_campus_config", lambda campus_code: {"db_name": f"{campus_code}_db"})

    assert database.get_database_engine(campus_code="north") is fake_engine
    assert captured["urls"][-1] == "north_db"
    assert database.get_database_engine(db_name="reporting") is fake_engine
    assert captured["urls"][-1] == "reporting"
    assert database.get_database_engine() is fake_engine
    assert captured["urls"][-1] == "default_db"
    assert database.get_database_session(db_name="reporting") == "session-object"
    assert captured["session_kwargs"]["bind"] is fake_engine
    assert captured["engine_kwargs"]["pool_pre_ping"] is True


def test_database_schema_helpers_cover_add_skip_and_failure_paths(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    market_engine = ScriptedBeginEngine([ScriptedResult(fetchone=("INTEGER",)), ScriptedResult()])
    monkeypatch.setattr(database, "engine", market_engine)
    assert database.ensure_market_schema_column_types() is True
    assert any("ALTER TABLE market" in sql for sql, _ in market_engine.connection.executed)

    market_skip_engine = ScriptedBeginEngine([ScriptedResult(fetchone=("DOUBLE PRECISION",))])
    monkeypatch.setattr(database, "engine", market_skip_engine)
    assert database.ensure_market_schema_column_types() is True
    assert len(market_skip_engine.connection.executed) == 1

    consult_responses = [
        ScriptedResult(fetchone=("table",)),
        ScriptedResult(fetchone=None),
        ScriptedResult(),
    ] + [ScriptedResult(fetchone=None) for _ in range(8)]
    consult_engine = ScriptedBeginEngine(consult_responses)
    monkeypatch.setattr(database, "engine", consult_engine)
    assert database.ensure_consult_schema_columns() is True
    assert any("ADD COLUMN" in sql for sql, _ in consult_engine.connection.executed)

    users_engine = ScriptedBeginEngine(
        [
            ScriptedResult(scalar=True),
            ScriptedResult(scalar=False),
            ScriptedResult(),
            ScriptedResult(),
            ScriptedResult(),
        ]
    )
    monkeypatch.setattr(database, "engine", users_engine)
    assert database.ensure_public_users_columns() is True
    assert any("campus_access_list" in sql for sql, _ in users_engine.connection.executed)

    users_skip_engine = ScriptedBeginEngine([ScriptedResult(scalar=False)])
    monkeypatch.setattr(database, "engine", users_skip_engine)
    assert database.ensure_public_users_columns() is True
    assert len(users_skip_engine.connection.executed) == 1

    monkeypatch.setattr(database, "engine", ScriptedBeginEngine([], fail_at=1))
    assert database.ensure_market_schema_column_types() is False
    monkeypatch.setattr(database, "engine", ScriptedBeginEngine([], fail_at=1))
    assert database.ensure_consult_schema_columns() is False
    monkeypatch.setattr(database, "engine", ScriptedBeginEngine([], fail_at=1))
    assert database.ensure_public_users_columns() is False


def test_call_if_no_required_args_and_split_sql_statements() -> None:
    called = []

    def no_args() -> None:
        called.append("no_args")

    def optional_arg(value: int = 1) -> None:
        called.append(f"optional:{value}")

    def required_arg(value: int) -> None:
        called.append(f"required:{value}")

    assert auto_migrate._call_if_no_required_args(no_args) is True
    assert auto_migrate._call_if_no_required_args(optional_arg) is True
    assert auto_migrate._call_if_no_required_args(required_arg) is False
    assert called == ["no_args", "optional:1"]

    sql = """
    INSERT INTO demo VALUES ('a;1');
    DO $body$
    BEGIN
      RAISE NOTICE 'semi;colon';
    END
    $body$;
    SELECT "semi;quoted";
    """
    statements = auto_migrate.split_sql_statements(sql)

    assert len(statements) == 3
    assert "a;1" in statements[0]
    assert "RAISE NOTICE" in statements[1]
    assert '"semi;quoted"' in statements[2]


def test_get_migration_scripts_and_run_sql_migration(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    migrations_dir = tmp_path / "migrations"
    migrations_dir.mkdir()
    for name in ["001_init.py", "002_seed.sql", "README.md", "__init__.py", "notes.txt", "auto_migrate.py"]:
        (migrations_dir / name).write_text("-- file\n", encoding="utf-8")

    monkeypatch.setattr(auto_migrate.os.path, "dirname", lambda _: str(migrations_dir))
    scripts = auto_migrate.get_migration_scripts()

    assert scripts == [
        ("001_init.py", str(migrations_dir / "001_init.py")),
        ("002_seed.sql", str(migrations_dir / "002_seed.sql")),
    ]

    sql_file = tmp_path / "sample.sql"
    sql_file.write_text("SELECT 1; SELECT 'two;still';", encoding="utf-8")
    fake_engine = FakeEngine()
    monkeypatch.setattr(auto_migrate, "engine", fake_engine)

    assert auto_migrate.run_sql_migration(str(sql_file)) is True
    assert len(fake_engine.connections) == 1
    executed = fake_engine.connections[0].executed
    assert len(executed) == 2
    assert "SELECT 1" in executed[0][0]
    assert "two;still" in executed[1][0]


def test_run_migration_script_and_run_pending_migrations(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    marker = tmp_path / "marker.txt"
    script_path = tmp_path / "003_script.py"
    script_path.write_text(
        "\n".join(
            [
                "from pathlib import Path",
                f"MARKER = Path(r'{marker}')",
                "def run_migration():",
                "    MARKER.write_text('ran', encoding='utf-8')",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    assert auto_migrate.run_migration_script("003_script.py", str(script_path)) is True
    assert marker.read_text(encoding="utf-8") == "ran"

    records = []
    monkeypatch.setattr(auto_migrate, "ensure_migration_table", lambda: None)
    monkeypatch.setattr(auto_migrate, "get_executed_migrations", lambda: {"done.py"})
    monkeypatch.setattr(
        auto_migrate,
        "get_migration_scripts",
        lambda: [("done.py", "x"), ("a.py", "y"), ("b.py", "z")],
    )
    monkeypatch.setattr(
        auto_migrate,
        "run_migration_script",
        lambda name, path: name == "a.py",
    )
    monkeypatch.setattr(auto_migrate, "record_migration", lambda name: records.append(name))

    assert auto_migrate.run_pending_migrations() is False
    assert records == ["a.py"]
