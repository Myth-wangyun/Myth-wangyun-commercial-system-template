# Backend Static Debt TODO

当前后端静态债务治理已经切换到“分类优先、轨道推进”的执行方式。

## Source Of Truth

- 批次账本: `specs/static-debt/backend-batches.yaml`
- 热点分类账本: `specs/static-debt/backend-error-ledger.yaml`
- 重构原则: `specs/static-debt/refactor-principles.md`
- 当前真实基线: `specs/static-debt/current-baseline.json`

## Current Goal

- 先完成 milestone 1 的两个机械 Ruff 批次
- 在不放大 `pyrefly` / `mypy` 的前提下，把 backend `ruff` 压到 `< 680`
- 保持 Excel / openpyxl 导入导出链路继续满足 `ruff + pyrefly + mypy`
- 修复pyrefly的错误
- 修复mypy的错误

## Guardrails

## Checker Policy

- `mypy` is the primary backend gate.
- `pyrefly` is the structural debt radar.
- `ruff` is the first cleanup pass for mechanical and framework-correctness issues.

### Working Rule

- `mypy` green means the current admission gate passes.
- `pyrefly` backlog means structural debt still exists; it does not by itself mean the `mypy` gate is wrong.
- The answer is continued batch cleanup, not weakening either checker.

### Batch Rule

- Keep CI stable with `mypy`.
- Keep touched files on `ruff + pyrefly + mypy + py_compile`.
- Raise `mypy` strictness gradually only after the nearby `pyrefly` boundary debt has been reduced.

## Testing Policy

- Canonical backend pytest config: `pytest.ini`
- Canonical runtime-test rules: `backend/docs/testing-policy.md`
- Default backend gate: `node scripts/development/repo_python.mjs -m pytest -q backend/test`
- Attached/manual suites and localhost probe scripts must stay out of the default automated gate.

- 不新增 `Any` / `cast(..., Any)` / suppression / per-file ignore
- 不为过静态检查改坏 FastAPI、Pydantic 2、SQLAlchemy 2 的惯用法
- legacy / public-boundary 文件先看 `specs/static-debt/legacy-boundaries/`




那就更简单了。

你这种不是“AI 辅助开发”，而是 **AI 全量产码，你只负责下指令、看 diff、跑检查、做回滚**。
在这种模式下，**补全能力、跳转丝滑、编辑器体验**的重要性会明显下降。

所以结论要改成：

**最适合你的主检查器，不是 Pyright/Pylance，而是 mypy。**
**Pyright 可以当快速第二裁判。**
**Pyrefly 先别当主标准。**

原因很直接。

Pyright、mypy、pyrefly 都属于 Python 静态类型检查器，这点是一类工具没错。Pyright 官方强调自己是高性能、标准兼容的检查器，也提供 VS Code 扩展；mypy 官方则是更经典、更成熟的静态类型检查器；Pyrefly 官方定位是“快速类型检查器 + language server”，而且当前配置和行为仍在早期快速演进。([GitHub][1])

但你现在的关键不是“谁更适合边写边提示”，而是：

**谁更适合做 AI 生成代码后的验收门槛。**

这时候优先级就变成了：

1. 稳定
2. 口径统一
3. CI 好接
4. 社区经验多
5. 不容易因为工具本身还在变而把你带沟里

按这个标准，**mypy 最像“AI 产码流水线的质检员”**。官方文档和项目定位都很稳定，适合做命令行批量检查和最终门禁。([mypy][2])

---

## 你这种“完全不手写”的模式，最适合什么分工

### 主标准：mypy

让 AI 先生成，改完后统一跑 mypy。

因为你不需要它帮你补全，也不需要在你敲代码时一路红线提醒。你更需要的是：

* 这波 AI 改动能不能过线
* 签名有没有断
* 返回值有没有漂
* Optional 有没有没判空
* 模型和调用方有没有脱节

mypy 很适合干这个“最终拍板”的角色。([mypy][2])

### 第二视角：Pyright

Pyright 适合当第二裁判，不一定非得开 IDE 才有价值。它本身也有命令行，而且高性能。你可以在本地或 CI 的非阻塞阶段顺手跑一下，看看能不能抓到 mypy 没抓到的问题。([GitHub][1])

但对你来说，它不是第一选择，因为它最大的优势之一其实是 IDE 集成，而你明确说你几乎不用这部分。([GitHub][1])

### 暂不主推：Pyrefly

Pyrefly 的方向很适合现代 agent 和语言服务器场景，速度也快，但官方自己就写了配置仍处于早期阶段，Pydantic 支持也是实验性的，近期 issue 里还能看到 LSP 配置相关 bug。([GitHub][3])

所以你这种“AI 全量生成、我只认结果”的模式下，**拿一个仍在快速变化的检查器做主裁判，不划算。**

---

## 为什么不是只推 Pyright

因为你不吃它最香的那部分红利。

如果一个人自己手写很多代码，Pyright/Pylance 的价值很大：

* 写一半就发现错
* 光标一放就知道类型
* 重构时实时反馈

但你不是这种工作流。你是：

* 让 Claude Code / Copilot / Codex 整段整段改
* 然后你看 diff
* 然后你跑检查
* 然后你决定接不接受

这时候实时交互价值下降，**门禁价值上升**。
所以成熟、稳、可当唯一标准的 mypy 更适合你。

---

## 你真正需要的不是“最聪明的检查器”，而是“最适合 AI 产码流水线的检查器”

对你来说，类型检查器更像这三样东西：

* **验收器**
* **回归报警器**
* **约束 AI 的护栏**

而不是“写代码时的老师”。

所以最好的策略通常是：

**AI 负责产码**
**ruff 负责风格和低级错误**
**mypy 负责类型门禁**
**pytest 负责行为验证**

这套比“纠结到底 mypy 还是 pyrefly 更先进”更重要。

---

## 那 Pyright 还有没有必要装

有，但不是必须。

它适合两种情况：

第一，你想给 AI 多一个第二视角。
有些问题 mypy 不报，Pyright 会报。这样你能多一层保险。([GitHub][1])

第二，你偶尔还是会在编辑器里看类型、看跳转。
哪怕你不手写，审 diff 和读代码时也可能受益。

但如果你只想要最省心的一套：

**只上 mypy 也完全可以。**

---

## 那 Pyrefly 对你有没有价值

有，但更像“实验性加成”。

你是 FastAPI + Pydantic 用户，这点上 Pyrefly 的方向确实有吸引力，因为它官方在推 Pydantic v2 的实验支持。([Pyrefly][4])

但你现在最重要的是让 AI 生成的代码有一条稳定的验收线，而不是再给自己引入一个还在快速变化的主检查器。官方也明确说它仍在 active development，配置还可能变化。([GitHub][3])

所以我的建议还是：

**先别让 Pyrefly 当裁判。**

---

## 最后给你一个直接结论

对于你这种 **“完全不手写、纯 AI 产码”的 vibe coding 模式**：

**最适合当主检查器的是 mypy。**
**Pyright 适合做可选第二裁判。**
**Pyrefly 先不要做主标准。**

一句话概括：

**你要的不是最强 IDE 体验，而是最稳的 AI 验收门。mypy 更像这扇门。**

如果你愿意，我下一条直接给你一套适合这种模式的最小闭环：

**Claude Code / Copilot / Codex → ruff → mypy → pytest** 的落地流程。

[1]: https://github.com/microsoft/pyright?utm_source=chatgpt.com "microsoft/pyright: Static Type Checker for Python"
[2]: https://mypy.readthedocs.io/?utm_source=chatgpt.com "mypy 1.19.1 documentation"
[3]: https://github.com/facebook/pyrefly?utm_source=chatgpt.com "facebook/pyrefly: A fast type checker and language server ..."
[4]: https://pyrefly.org/en/docs/pydantic/?utm_source=chatgpt.com "Experimental Pydantic Support"



能。**mypy 完全可以检查 Pydantic v2**，而且 Pydantic 官方现在就还在维护 **mypy 插件**。你只要在 mypy 配置里启用 `pydantic.mypy` 就行；如果你用的是 `pydantic.v1` 兼容命名空间，才改用 `pydantic.v1.mypy`。([Pydantic][1])

最关键的一点是：

**不用插件时，mypy 已经能懂一部分 Pydantic。**
Pydantic 官方文档明确写了，mypy 本身就已经支持一些特性，比如为 Pydantic models 和 dataclasses 合成 `__init__`；但启用 `pydantic.mypy` 插件后，会额外获得更强的检查能力。([Pydantic][1])

这些额外能力包括：

* 检查模型初始化时**缺少必填参数**
* 检查**未类型化字段**
* 更好地发现**不存在的属性/字段名**
* 针对模型配置提供更多类型检查支持。([Pydantic][1])

配置也很直接。
`mypy.ini` 里通常写：

```ini
[mypy]
plugins = pydantic.mypy
```

或者 `pyproject.toml` 里写：

```toml
[tool.mypy]
plugins = ["pydantic.mypy"]
```

这就是 Pydantic 官方文档给的启用方式。([Pydantic][1])

所以对你这种 **AI 全量产码 + FastAPI/Pydantic v2** 的工作流，我的建议反而更明确了：

**可以继续用 mypy 当主门禁，而且最好把 `pydantic.mypy` 插件打开。**
这样你既保留了 mypy 的稳定性，又拿到了对 Pydantic v2 更贴身的检查。([Pydantic][1])

不过要实话实说，mypy 也不是“装了插件就全懂 Pydantic v2 的所有动态行为”。
Pydantic 官方写的是它增加了“important pydantic-specific features”与额外能力，不是说能完美覆盖所有运行时特性。你仍然需要测试来兜住运行时验证逻辑。([Pydantic][1])

你如果只想要一句落地结论：

**能检查，而且应该检查；做法是 mypy + `pydantic.mypy` 插件。**

如果你愿意，我下一条直接给你一份适合 **FastAPI + Pydantic v2 + AI 产码** 的 `pyproject.toml` 里 mypy 最小可用配置。

[1]: https://docs.pydantic.dev/latest/integrations/mypy/?utm_source=chatgpt.com "Mypy - Pydantic Validation"
