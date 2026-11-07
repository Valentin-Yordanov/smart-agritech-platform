"""Structured logging utility for the microservice."""

import logging
import sys
from typing import Any, Dict

from app.core.config import get_settings


class Formatter(logging.Formatter):
    """Custom clean formatter for stdout with timestamp, level, and logger name."""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        level = record.levelname.ljust(8)
        logger_name = record.name
        message = record.getMessage()

        # Append extra info if present
        extra_info: Dict[str, Any] = getattr(record, "extra_info", {})
        extra_str = f" | {extra_info}" if extra_info else ""

        return f"[{timestamp}] [{level}] [{logger_name}] {message}{extra_str}"


def setup_logger(name: str = "ai-service") -> logging.Logger:
    """Configures and returns a named logger instance."""
    settings = get_settings()
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(Formatter())
        logger.addHandler(handler)

    level = logging.DEBUG if settings.DEBUG else logging.INFO
    logger.setLevel(level)
    logger.propagate = False
    return logger


logger = setup_logger()
