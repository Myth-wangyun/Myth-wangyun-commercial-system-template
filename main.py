#!/usr/bin/env python3
"""
项目根目录统一 Python 启动入口。

设计约束：
1. 项目必须支持在仓库根目录执行 `python main.py` 启动后端主进程。
2. 入口只能依赖项目内相对路径，不能依赖调用方先 `cd backend`。
3. 开发机与 Linux 服务器共用同一入口，避免部署方式分叉。

用法：
  python main.py
  python main.py --mode dev
  python main.py --mode test --port 8001
  python main.py --mode prod --host 0.0.0.0 --port 8000

说明：
  本文件是稳定入口包装器，真实应用入口仍然是 `backend/main.py`。
"""

from __future__ import annotations

import os
import runpy
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
BACKEND_MAIN = BACKEND_DIR / "main.py"
PROJECT_VENV_DIR = PROJECT_ROOT / ".venv"
PROJECT_VENV_UNIX = PROJECT_ROOT / ".venv" / "bin" / "python"
PROJECT_VENV_WINDOWS = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"


def _maybe_reexec_into_project_venv() -> None:
    if os.environ.get("QM_MAIN_REEXECED") == "1":
        return

    candidates = [PROJECT_VENV_UNIX, PROJECT_VENV_WINDOWS]
    venv_python = next((path for path in candidates if path.exists()), None)
    if venv_python is None:
        return

    current_prefix = Path(sys.prefix).resolve()
    if current_prefix == PROJECT_VENV_DIR.resolve():
        return

    env = os.environ.copy()
    env["QM_MAIN_REEXECED"] = "1"
    os.execve(str(venv_python), [str(venv_python), str(__file__), *sys.argv[1:]], env)


def main() -> None:
    if not BACKEND_MAIN.exists():
        raise SystemExit(f"后端入口不存在: {BACKEND_MAIN}")

    _maybe_reexec_into_project_venv()

    os.chdir(BACKEND_DIR)
    backend_path = str(BACKEND_DIR)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    runpy.run_path(str(BACKEND_MAIN), run_name="__main__")


if __name__ == "__main__":
    main()
