from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.consult.consultation_record import _validate_import_operator
from app.schemas.consult.consultation_record import 咨询量导入行, 咨询量批量导入请求


pytestmark = [pytest.mark.unit, pytest.mark.smoke]


def _find_field_name(model_cls: type, marker: str) -> str:
    return next(name for name in model_cls.model_fields if marker in name)


def _make_request() -> 咨询量批量导入请求:
    source_field = _find_field_name(咨询量批量导入请求, "来源")
    rows_field = _find_field_name(咨询量批量导入请求, "列表")
    importer_id_field = _find_field_name(咨询量批量导入请求, "ID")
    importer_name_field = _find_field_name(咨询量批量导入请求, "姓名")
    phone_field = _find_field_name(咨询量导入行, "电话")

    row = 咨询量导入行.model_construct(**{phone_field: "13800000000"})
    return 咨询量批量导入请求.model_construct(
        **{
            source_field: "任意",
            rows_field: [row],
            importer_id_field: 1,
            importer_name_field: "赵红娜",
        }
    )


def test_validate_import_operator_match() -> None:
    request = _make_request()
    user = SimpleNamespace(user_id=1, real_name="赵红娜")
    _validate_import_operator(request, user)


def test_validate_import_operator_mismatch_id() -> None:
    request = _make_request()
    user = SimpleNamespace(user_id=2, real_name="赵红娜")
    with pytest.raises(HTTPException):
        _validate_import_operator(request, user)


def test_validate_import_operator_mismatch_name() -> None:
    request = _make_request()
    user = SimpleNamespace(user_id=1, real_name="陆杨勇")
    with pytest.raises(HTTPException):
        _validate_import_operator(request, user)
