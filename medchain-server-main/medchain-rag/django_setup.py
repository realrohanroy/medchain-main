import os
import sys
import django
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def init_django():
    """
    Bootstrap Django so FastAPI can import and use Django models and shared logic.
    """
    try:
        from django.apps import apps
        if apps.ready:
            return
    except Exception:
        pass

    # Add medchain-server-main to python path
    parent_dir = str(BASE_DIR.parent)
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medchain_backend.settings")
    os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
    django.setup()
