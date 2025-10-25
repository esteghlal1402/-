import importlib
import logging
import pkgutil
from typing import Callable, List

import bot.plugins as plugins_pkg
from bot.services import Services


logger = logging.getLogger(__name__)


def load_plugins(application, services: Services, register_help: Callable[[str, str], None]) -> List[str]:
    loaded: List[str] = []
    for module_info in pkgutil.iter_modules(plugins_pkg.__path__):
        name = module_info.name
        if name.startswith("_"):
            continue
        module_fq = f"{plugins_pkg.__name__}.{name}"
        try:
            module = importlib.import_module(module_fq)
            register = getattr(module, "register", None)
            if callable(register):
                register(application, services, register_help)
                loaded.append(module_fq)
            else:
                logger.warning("Plugin %s has no register() function; skipped", module_fq)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("Failed to load plugin %s: %s", module_fq, exc)
    return loaded

