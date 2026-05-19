from __future__ import annotations

import builtins
import importlib.util
import sys
from pathlib import Path
from threading import Timer

import pytest
from starlette.requests import Request

from app.core import dynamic_import
from app.logs.contextvars import get_current_request, reset_current_request, set_current_request
from app.logs.diff import build_diff
from app.services.approvals.broker import ApprovalStreamBroker


pytestmark = pytest.mark.unit


def test_build_diff_handles_equal_scalar_and_dict_changes() -> None:
    assert build_diff({"a": 1}, {"a": 1}) == {}
    assert build_diff(None, "after") == {"$value": {"from": None, "to": "after"}}
    assert build_diff("before", "after") == {"$value": {"from": "before", "to": "after"}}
    assert build_diff({"a": 1, "b": 2}, {"a": 1, "b": 3, "c": 4}) == {
        "b": {"from": 2, "to": 3},
        "c": {"from": None, "to": 4},
    }


def test_request_contextvars_round_trip() -> None:
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/health",
            "headers": [],
        }
    )

    assert get_current_request() is None

    token = set_current_request(request)

    assert get_current_request() is request

    reset_current_request(token)

    assert get_current_request() is None


def test_approval_stream_broker_waits_until_version_changes() -> None:
    broker = ApprovalStreamBroker()
    timer = Timer(0.05, broker.touch)
    timer.start()
    try:
        assert broker.version == 0
        assert broker.wait_for_change(99, timeout=0.01) == 0
        assert broker.wait_for_change(0, timeout=1.0) == 1
        assert broker.version == 1
    finally:
        timer.cancel()


def test_find_module_by_path_returns_loaded_module(tmp_path) -> None:
    module_path = tmp_path / "sample_module.py"
    module_path.write_text("VALUE = 7\n", encoding="utf-8")

    module = importlib.util.module_from_spec(
        importlib.util.spec_from_file_location("sample_module_loaded", module_path)
    )
    module.__file__ = str(module_path)
    sys.modules["sample_module_loaded"] = module
    try:
        found = dynamic_import._find_module_by_path(module_path.resolve())
        assert found is module
    finally:
        sys.modules.pop("sample_module_loaded", None)


def test_find_module_by_path_ignores_modules_with_invalid_file_values() -> None:
    bad_module = type(sys)("bad_module_for_find")
    bad_module.__file__ = 123
    sys.modules["bad_module_for_find"] = bad_module
    try:
        assert dynamic_import._find_module_by_path((Path(__file__).parent / "does-not-exist.py").resolve()) is None
    finally:
        sys.modules.pop("bad_module_for_find", None)


def test_enable_importlib_cache_reuses_same_file_without_reexecution(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    module_path = tmp_path / "cached_module.py"
    module_path.write_text(
        "\n".join(
            [
                "import builtins",
                "builtins._dynamic_import_exec_count = getattr(",
                '    builtins, "_dynamic_import_exec_count", 0',
                ") + 1",
                "VALUE = builtins._dynamic_import_exec_count",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.delattr(builtins, "_dynamic_import_exec_count", raising=False)
    monkeypatch.setattr(
        dynamic_import._importlib_util,
        "spec_from_file_location",
        dynamic_import._original_spec_from_file_location,
    )

    dynamic_import.enable_importlib_cache()

    spec_one = importlib.util.spec_from_file_location("cached_one", module_path)
    assert spec_one is not None and spec_one.loader is not None
    module_one = importlib.util.module_from_spec(spec_one)
    spec_one.loader.exec_module(module_one)

    spec_two = importlib.util.spec_from_file_location("cached_two", module_path)
    assert spec_two is not None and spec_two.loader is not None
    module_two = importlib.util.module_from_spec(spec_two)
    spec_two.loader.exec_module(module_two)

    assert builtins._dynamic_import_exec_count == 1
    assert module_one.VALUE == 1
    assert module_two.VALUE == 1
    assert sys.modules["cached_one"] is module_one
    assert sys.modules["cached_two"] is module_one


def test_cached_spec_returns_none_when_original_importlib_cannot_build_spec(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(dynamic_import, "_original_spec_from_file_location", lambda *args, **kwargs: None)

    assert dynamic_import.spec_from_file_location_cached("broken", "missing.py") is None
