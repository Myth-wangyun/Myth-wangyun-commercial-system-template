"""
Dynamic import helpers to avoid duplicate module execution.
"""
from __future__ import annotations

import sys
from importlib import util as _importlib_util
from pathlib import Path
from types import ModuleType
from typing import Any, Callable, Optional, cast

_original_spec_from_file_location = _importlib_util.spec_from_file_location


def _find_module_by_path(path: Path) -> Optional[ModuleType]:
    for module in list(sys.modules.values()):
        module_file = getattr(module, "__file__", None)
        if not module_file:
            continue
        try:
            if Path(module_file).resolve() == path:
                return module
        except Exception:
            continue
    return None


def spec_from_file_location_cached(name: str, location: str, *args, **kwargs):
    """Return a spec whose loader caches modules by file path.

    Ensures that modules loaded via spec_from_file_location are executed once per file
    and then reused, preventing duplicate declarative model registration.
    """
    spec = _original_spec_from_file_location(name, location, *args, **kwargs)
    if spec is None or spec.loader is None:
        return spec

    origin = Path(location).resolve()
    loader = cast(Any, spec.loader)
    original_exec: Callable[[ModuleType], object] = loader.exec_module

    def exec_module(module: ModuleType) -> object:
        existing = _find_module_by_path(origin)
        if existing is not None:
            # Alias the requested name to the existing module
            sys.modules[name] = existing
            module.__dict__.update(existing.__dict__)
            return existing

        # Cache by module name before execution
        sys.modules[name] = module
        return original_exec(module)

    loader.exec_module = exec_module
    return spec


def enable_importlib_cache() -> None:
    """Enable importlib caching wrapper for spec_from_file_location."""
    if _importlib_util.spec_from_file_location is not spec_from_file_location_cached:
        cast(Any, _importlib_util).spec_from_file_location = spec_from_file_location_cached
