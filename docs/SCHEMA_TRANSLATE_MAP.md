# `schema_translate_map academic->teaching_quality` 是什么意思

你看到的日志：

`[teaching-quality] 运行期 Session 已启用 schema_translate_map academic->teaching_quality`

来自 `backend/app/core/database.py` 的 `TQSessionLocal` 初始化逻辑：

- 它使用 SQLAlchemy 的 `schema_translate_map`：当 ORM/SQL 里引用 schema 名称 `academic` 时，运行时会被“重写”为 `teaching_quality`。
- 本质上这是一个 **兼容层/过渡层**：允许代码里仍写着 `academic.xxx` 的表/外键/模型，在数据库实际使用 `teaching_quality.xxx` 时仍能工作。

## 为什么会有它

你现在有两个模块：学术（academic）和教质（teaching_quality）。

但历史上教质模块可能复用了学术模块的模型/外键声明（schema 写死为 `academic`），因此需要这个映射把它“落到”教质 schema 里。

## 影响与风险

- **风险 1：跨模块混淆**：看到 `academic` 以为在学术库/学术 schema，实际上落到了 `teaching_quality`。
- **风险 2：原生 SQL/视图容易踩坑**：很多地方为了避免映射影响，改成了“原始 SQL”（例如 `campus_core_data_summary.py` 里多处注释）。
- **风险 3：长期维护成本高**：模型/外键/迁移脚本会越来越难统一。

## 推荐的长期改法（更干净）

- 教质模块的 ORM 模型全部显式使用 `__table_args__ = {"schema": "teaching_quality"}`（或统一 Base 的 schema），
- 学术模块使用 `schema=academic`，
- 然后逐步移除 `schema_translate_map`，让 schema 名称与模块语义一致。

短期内如果要继续保留映射：
- 请确保 **只有教质模块** 使用 `get_teaching_quality_db()`，不要在学术模块里误用。
