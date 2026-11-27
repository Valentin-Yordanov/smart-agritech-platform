"""Shared pytest setup: run the app in test mode so internal-key auth is optional unless a test sets it."""

import os

os.environ.setdefault("ENV", "test")
