from __future__ import annotations

from app.crud.human_resources.dashboard_legacy import (
    create_performance_fact,
    create_salary_welfare_fact,
    get_performance_fact,
    get_salary_welfare_fact,
    list_manual_recruitment_entries,
    list_performance_facts,
    list_salary_welfare_facts,
    serialize_manual_recruitment_entry,
    serialize_performance_fact,
    serialize_salary_welfare_fact,
    upsert_manual_recruitment_entry,
    update_performance_fact,
    update_salary_welfare_fact,
)

__all__ = [
    "create_performance_fact",
    "create_salary_welfare_fact",
    "get_performance_fact",
    "get_salary_welfare_fact",
    "list_manual_recruitment_entries",
    "list_performance_facts",
    "list_salary_welfare_facts",
    "serialize_manual_recruitment_entry",
    "serialize_performance_fact",
    "serialize_salary_welfare_fact",
    "upsert_manual_recruitment_entry",
    "update_performance_fact",
    "update_salary_welfare_fact",
]
