from __future__ import annotations

from app.crud.human_resources import recruitment_request as recruitment_request_crud
from app.models.human_resources.recruitment_request import RecruitmentRequest
from app.models.user import User, UserRole, UserStatus


def _make_user(
    *,
    user_id: int,
    real_name: str,
    department: str,
    position: str,
    campus: str = "最高议事厅",
) -> User:
    return User(
        user_id=user_id,
        username=f"user_{user_id}",
        password_hash="x",
        real_name=real_name,
        department=department,
        position=position,
        campus=campus,
        role=UserRole.STAFF,
        status=UserStatus.ACTIVE,
        is_superuser=False,
    )


class _FakeQuery:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def filter(self, *_args, **_kwargs) -> "_FakeQuery":
        return self

    def all(self) -> list[User]:
        return list(self._users)


def test_management_center_market_deputy_manager_requires_department_head_stage() -> None:
    stages = recruitment_request_crud.resolve_management_center_flow_stages(
        "市场部",
        "市场部副经理",
    )

    assert stages == ["department_head", "hr_director", "chairman"]


def test_management_center_department_head_skips_principal_and_department_head_stage() -> None:
    stages = recruitment_request_crud.resolve_management_center_flow_stages(
        "神藏司",
        "神藏司总监",
    )

    assert stages == ["hr_director", "chairman"]


def test_management_center_hr_supervisor_skips_department_head_and_principal_stage() -> None:
    stages = recruitment_request_crud.resolve_management_center_flow_stages(
        "人资部",
        "人资部主管",
    )

    assert stages == ["hr_director", "chairman"]


def test_management_center_teaching_quality_director_skips_department_head_and_principal_stage() -> None:
    stages = recruitment_request_crud.resolve_management_center_flow_stages(
        "教化司",
        "教化司总监",
    )

    assert stages == ["hr_director", "chairman"]


def test_management_center_academic_deputy_director_skips_department_head_and_principal_stage() -> None:
    stages = recruitment_request_crud.resolve_management_center_flow_stages(
        "智慧司",
        "智慧司副总监",
    )

    assert stages == ["hr_director", "chairman"]


def test_management_center_department_head_candidates_follow_department_and_position_rules() -> None:
    users = [
        _make_user(user_id=1, real_name="市场副经理", department="市场部", position="市场部副经理"),
        _make_user(user_id=2, real_name="市场经理", department="市场部", position="市场部经理"),
        _make_user(user_id=3, real_name="市场专员", department="市场部", position="市场专员"),
        _make_user(user_id=4, real_name="学术副总监", department="智慧司", position="智慧司副总监"),
    ]

    candidates = recruitment_request_crud.resolve_management_center_department_head_users(
        users,
        "市场部",
    )

    assert [user.user_id for user in candidates] == [2]


def test_management_center_hr_director_candidates_require_hr_department_and_director_position() -> None:
    users = [
        _make_user(user_id=1, real_name="人资主管", department="人资部", position="人资部主管"),
        _make_user(user_id=2, real_name="人资总监", department="人资部", position="人资部总监"),
        _make_user(user_id=3, real_name="行政总监", department="行政部", position="行政总监"),
        _make_user(user_id=4, real_name="人资经理", department="人资行政部", position="人资经理"),
    ]

    candidates = recruitment_request_crud.resolve_management_center_hr_director_users(users)

    assert [user.user_id for user in candidates] == [2]


def test_get_flow_stages_uses_selected_management_center_campus_instead_of_applicant_campus(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="最高议事厅",
        department="神藏司",
        position="神藏司专员",
        created_by_user_id=999,
    )

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=999,
            real_name="测试申请人",
            department="测试部",
            position="测试专员",
            campus="测试神殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_scoped_users",
        lambda db, current_record: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery([]),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "hr_director", "chairman"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "部门负责人"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "董事长"


def test_management_center_market_manager_skips_department_head_based_on_applicant_position(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        created_by_user_id=101,
    )

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=101,
            real_name="市场经理申请人",
            department="市场部",
            position="市场部经理",
            campus="最高议事厅",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_scoped_users",
        lambda db, current_record: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(
            [
                _make_user(user_id=201, real_name="人资总监", department="人资部", position="人资部总监"),
                _make_user(user_id=202, real_name="董事长", department="董事办", position="董事长", campus="最高议事厅"),
            ]
        ),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director", "chairman"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "董事长"


def test_shengbang_academic_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=301,
    )
    campus_users = [
        _make_user(user_id=302, real_name="后端副校长", department="教化司", position="后端副校长", campus="河北主神殿"),
        _make_user(user_id=303, real_name="校长", department="校长", position="校长", campus="河北主神殿"),
    ]
    hr_users = [_make_user(user_id=304, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=301,
            real_name="学术经理申请人",
            department="智慧司",
            position="智慧司经理",
            campus="河北主神殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_shengbang_backend_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北主神殿",
        department="后端部",
        position="讲师",
        created_by_user_id=311,
    )
    campus_users = [
        _make_user(user_id=312, real_name="校长", department="校长", position="校长", campus="河北主神殿"),
    ]
    hr_users = [_make_user(user_id=313, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=311,
            real_name="后端副校长申请人",
            department="后端部",
            position="后端副校长",
            campus="河北主神殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_shengbang_consult_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=321,
    )
    campus_users = [
        _make_user(user_id=322, real_name="校长", department="校长", position="校长", campus="河北主神殿"),
    ]
    hr_users = [_make_user(user_id=323, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=321,
            real_name="前端副校长申请人",
            department="祈福司",
            position="前端副校长",
            campus="河北主神殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_jinmei_principal_route_uses_hr_only(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西李大殿",
        department="神殿",
        position="讲师",
        created_by_user_id=331,
    )
    hr_users = [_make_user(user_id=332, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=331,
            real_name="晋美校长申请人",
            department="神殿",
            position="校长",
            campus="山西李大殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"


def test_jinmei_academic_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西李大殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=341,
    )
    campus_users = [
        _make_user(user_id=342, real_name="后端副校长", department="后端部", position="后端副校长", campus="山西李大殿"),
        _make_user(user_id=343, real_name="校长", department="神殿", position="校长", campus="山西李大殿"),
    ]
    hr_users = [_make_user(user_id=344, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=341,
            real_name="晋美学术副经理申请人",
            department="智慧司",
            position="智慧司副经理",
            campus="山西李大殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_jinmei_teaching_quality_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西李大殿",
        department="教化司",
        position="讲师",
        created_by_user_id=351,
    )
    campus_users = [
        _make_user(user_id=352, real_name="后端副校长", department="后端部", position="后端副校长", campus="山西李大殿"),
        _make_user(user_id=353, real_name="校长", department="神殿", position="校长", campus="山西李大殿"),
    ]
    hr_users = [_make_user(user_id=354, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=351,
            real_name="晋美教质经理申请人",
            department="教化司",
            position="教化司经理",
            campus="山西李大殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_taimei_principal_route_uses_hr_only(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西光明殿",
        department="神殿",
        position="讲师",
        created_by_user_id=361,
    )
    hr_users = [_make_user(user_id=362, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=361,
            real_name="太美校长申请人",
            department="神殿",
            position="校长",
            campus="山西光明殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"


def test_taimei_backend_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西光明殿",
        department="后端部",
        position="讲师",
        created_by_user_id=371,
    )
    campus_users = [
        _make_user(user_id=372, real_name="校长", department="神殿", position="校长", campus="山西光明殿"),
    ]
    hr_users = [_make_user(user_id=373, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=371,
            real_name="太美后端副校长申请人",
            department="后端部",
            position="后端副校长",
            campus="山西光明殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_taimei_teaching_quality_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西光明殿",
        department="教化司",
        position="讲师",
        created_by_user_id=381,
    )
    campus_users = [
        _make_user(user_id=382, real_name="后端副校长", department="后端部", position="后端副校长", campus="山西光明殿"),
        _make_user(user_id=383, real_name="校长", department="神殿", position="校长", campus="山西光明殿"),
    ]
    hr_users = [_make_user(user_id=384, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=381,
            real_name="太美教质副经理申请人",
            department="教化司",
            position="教化司副经理",
            campus="山西光明殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_jimei_principal_route_uses_hr_only(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北永恒殿",
        department="神殿",
        position="讲师",
        created_by_user_id=391,
    )
    hr_users = [_make_user(user_id=392, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=391,
            real_name="冀美校长申请人",
            department="神殿",
            position="校长",
            campus="河北永恒殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"


def test_jimei_academic_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北永恒殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=401,
    )
    campus_users = [
        _make_user(user_id=402, real_name="后端副校长", department="后端部", position="后端副校长", campus="河北永恒殿"),
        _make_user(user_id=403, real_name="校长", department="神殿", position="校长", campus="河北永恒殿"),
    ]
    hr_users = [_make_user(user_id=404, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=401,
            real_name="冀美学术副经理申请人",
            department="智慧司",
            position="智慧司副经理",
            campus="河北永恒殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_jimei_teaching_quality_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北永恒殿",
        department="教化司",
        position="讲师",
        created_by_user_id=411,
    )
    campus_users = [
        _make_user(user_id=412, real_name="后端副校长", department="后端部", position="后端副校长", campus="河北永恒殿"),
        _make_user(user_id=413, real_name="校长", department="神殿", position="校长", campus="河北永恒殿"),
    ]
    hr_users = [_make_user(user_id=414, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=411,
            real_name="冀美教质经理申请人",
            department="教化司",
            position="教化司经理",
            campus="河北永恒殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_jimei_consult_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北永恒殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=421,
    )
    campus_users = [
        _make_user(user_id=422, real_name="校长", department="神殿", position="校长", campus="河北永恒殿"),
    ]
    hr_users = [_make_user(user_id=423, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=421,
            real_name="永恒殿副校长申请人",
            department="祈福司",
            position="神殿副校长",
            campus="河北永恒殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_jimei_channel_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北永恒殿",
        department="渠道部",
        position="渠道专员",
        created_by_user_id=431,
    )
    campus_users = [
        _make_user(user_id=432, real_name="校长", department="神殿", position="校长", campus="河北永恒殿"),
    ]
    hr_users = [_make_user(user_id=433, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=431,
            real_name="冀美渠道经理申请人",
            department="渠道部",
            position="渠道部经理",
            campus="河北永恒殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_shimei_academic_deputy_route_uses_four_stages(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北慈悲殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=401,
    )
    campus_users = [
        _make_user(user_id=402, real_name="学术经理", department="智慧司", position="智慧司经理", campus="河北慈悲殿"),
        _make_user(user_id=403, real_name="后端副校长", department="教化司", position="副校长", campus="河北慈悲殿"),
        _make_user(user_id=404, real_name="校长", department="校长", position="校长", campus="河北慈悲殿"),
    ]
    hr_users = [_make_user(user_id=405, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=401,
            real_name="学术副经理申请人",
            department="智慧司",
            position="智慧司副经理",
            campus="河北慈悲殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director", "chairman"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "智慧司经理"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[3], db=object()) == "人资总监"


def test_shimei_principal_route_uses_hr_only(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北慈悲殿",
        department="神殿",
        position="讲师",
        created_by_user_id=441,
    )
    hr_users = [_make_user(user_id=442, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=441,
            real_name="石美校长申请人",
            department="神殿",
            position="校长",
            campus="河北慈悲殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"


def test_shimei_backend_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北慈悲殿",
        department="后端部",
        position="讲师",
        created_by_user_id=451,
    )
    campus_users = [
        _make_user(user_id=452, real_name="校长", department="神殿", position="校长", campus="河北慈悲殿"),
    ]
    hr_users = [_make_user(user_id=453, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=451,
            real_name="石美后端副校长申请人",
            department="后端部",
            position="后端副校长",
            campus="河北慈悲殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_shimei_academic_manager_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北慈悲殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=461,
    )
    campus_users = [
        _make_user(user_id=462, real_name="后端副校长", department="教化司", position="副校长", campus="河北慈悲殿"),
        _make_user(user_id=463, real_name="校长", department="神殿", position="校长", campus="河北慈悲殿"),
    ]
    hr_users = [_make_user(user_id=464, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=461,
            real_name="石美学术经理申请人",
            department="智慧司",
            position="智慧司经理",
            campus="河北慈悲殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_shimei_teaching_quality_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="河北慈悲殿",
        department="教化司",
        position="讲师",
        created_by_user_id=471,
    )
    campus_users = [
        _make_user(user_id=472, real_name="后端副校长", department="教化司", position="副校长", campus="河北慈悲殿"),
        _make_user(user_id=473, real_name="校长", department="神殿", position="校长", campus="河北慈悲殿"),
    ]
    hr_users = [_make_user(user_id=474, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=471,
            real_name="石美教质副经理申请人",
            department="教化司",
            position="教化司副经理",
            campus="河北慈悲殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_yuanmei_principal_route_uses_hr_only(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西智慧阁",
        department="神殿",
        position="讲师",
        created_by_user_id=481,
    )
    hr_users = [_make_user(user_id=482, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=481,
            real_name="原美校长申请人",
            department="神殿",
            position="校长",
            campus="山西智慧阁",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"


def test_yuanmei_academic_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西智慧阁",
        department="智慧司",
        position="讲师",
        created_by_user_id=491,
    )
    campus_users = [
        _make_user(user_id=492, real_name="校长", department="神殿", position="校长", campus="山西智慧阁"),
    ]
    hr_users = [_make_user(user_id=493, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=491,
            real_name="原美学术经理申请人",
            department="智慧司",
            position="智慧司经理",
            campus="山西智慧阁",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_yuanmei_teaching_quality_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="山西智慧阁",
        department="教化司",
        position="讲师",
        created_by_user_id=501,
    )
    campus_users = [
        _make_user(user_id=502, real_name="校长", department="神殿", position="校长", campus="山西智慧阁"),
    ]
    hr_users = [_make_user(user_id=503, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=501,
            real_name="原美教质经理申请人",
            department="教化司",
            position="教化司经理",
            campus="山西智慧阁",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_guimei_principal_route_uses_hr_only(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="广西神恩殿",
        department="神殿",
        position="讲师",
        created_by_user_id=511,
    )
    hr_users = [_make_user(user_id=512, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=511,
            real_name="桂美校长申请人",
            department="神殿",
            position="校长",
            campus="广西神恩殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: [],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "人资总监"


def test_guimei_backend_route_uses_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="广西神恩殿",
        department="后端部",
        position="讲师",
        created_by_user_id=521,
    )
    campus_users = [
        _make_user(user_id=522, real_name="校长", department="神殿", position="校长", campus="广西神恩殿"),
    ]
    hr_users = [_make_user(user_id=523, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=521,
            real_name="桂美后端副校长申请人",
            department="后端部",
            position="后端副校长",
            campus="广西神恩殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "人资总监"


def test_guimei_academic_route_uses_backend_then_principal_then_hr(monkeypatch) -> None:
    record = RecruitmentRequest(
        campus="广西神恩殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=531,
    )
    campus_users = [
        _make_user(user_id=532, real_name="后端副校长", department="后端部", position="后端副校长", campus="广西神恩殿"),
        _make_user(user_id=533, real_name="校长", department="神殿", position="校长", campus="广西神恩殿"),
    ]
    hr_users = [_make_user(user_id=534, real_name="人资总监", department="人资部", position="人资部总监", campus="最高议事厅")]

    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=531,
            real_name="桂美学术经理申请人",
            department="智慧司",
            position="智慧司经理",
            campus="广西神恩殿",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_bucket_users",
        lambda db, current_record, campus_bucket: campus_users,
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(hr_users),
    )

    stages = recruitment_request_crud.get_flow_stages(record, db=object())

    assert stages == ["department_head", "principal", "hr_director"]
    assert recruitment_request_crud.get_stage_label(record, stages[0], db=object()) == "后端副校长"
    assert recruitment_request_crud.get_stage_label(record, stages[1], db=object()) == "校长"
    assert recruitment_request_crud.get_stage_label(record, stages[2], db=object()) == "人资总监"


def test_management_center_market_deputy_preview_candidates_match_requested_chain(monkeypatch) -> None:
    monkeypatch.setattr(
        recruitment_request_crud,
        "_get_request_applicant",
        lambda db, current_record: _make_user(
            user_id=501,
            real_name="市场副经理申请人",
            department="市场部",
            position="市场部副经理",
            campus="最高议事厅",
        ),
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_resolve_scoped_users",
        lambda db, current_record: [
            _make_user(user_id=502, real_name="市场经理", department="市场部", position="市场部经理"),
        ],
    )
    monkeypatch.setattr(
        recruitment_request_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(
            [
                _make_user(user_id=503, real_name="管璇", department="人资部", position="人资部总监"),
                _make_user(user_id=504, real_name="董事长", department="董事办", position="董事长"),
            ]
        ),
    )

    preview = recruitment_request_crud.build_approver_candidate_preview(
        object(),
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        created_by_user_id=501,
    )

    assert [item["stage_label"] for item in preview] == ["部门负责人", "人资总监", "董事长"]
    assert preview[0]["recommended_user_ids"] == [502]
    assert preview[1]["recommended_user_ids"] == [503]
    assert preview[2]["recommended_user_ids"] == [504]