"""Safe parsing of chat attachments (images and documents) for the RAG advisor.

The file type is decided from magic bytes, never from the client's filename or MIME header.
Every parser is bounded (pages, characters, uncompressed size) so a hostile file cannot
exhaust memory or the LLM context.
"""

from __future__ import annotations

import base64
import csv
import io
import zipfile
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from PIL import Image, ImageOps

from app.core.config import Settings, get_settings
from app.core.logger import logger

IMAGE_KINDS = {"jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
DOC_MIMES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "csv": "text/csv",
    "txt": "text/plain",
}
MAX_IMAGE_PIXELS = 40_000_000
CSV_MAX_ROWS = 300


class AttachmentError(ValueError):
    """Raised when an attachment is rejected outright (unsupported or too large)."""


@dataclass
class ParsedAttachment:
    name: str
    kind: str  # image | document
    mime: str
    status: str = "readable"  # readable | unreadable
    summary: str = ""
    text: str = ""
    image_b64: Optional[str] = None
    detection: Optional[Dict[str, Any]] = None
    notes: List[str] = field(default_factory=list)

    def public(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "kind": self.kind,
            "mime": self.mime,
            "status": self.status,
            "summary": self.summary,
            "detection": self.detection,
        }


def sniff_type(data: bytes, filename: str) -> str:
    """Returns one of jpeg/png/webp/pdf/docx/csv/txt from content, or raises AttachmentError."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[:1024].lstrip().startswith(b"%PDF-"):
        return "pdf"
    if data.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                if "word/document.xml" in zf.namelist():
                    return "docx"
        except zipfile.BadZipFile:
            pass
        raise AttachmentError("Unsupported archive; only .docx Word documents are accepted.")

    # Plain text has no signature: require valid UTF-8 without NUL bytes
    if b"\x00" in data[:8192]:
        raise AttachmentError("Unsupported binary file type.")
    try:
        data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise AttachmentError("Text files must be UTF-8 encoded.") from exc
    return "csv" if filename.lower().endswith(".csv") else "txt"


def _clip(text: str, limit: int) -> str:
    text = text.strip()
    return text if len(text) <= limit else text[:limit].rstrip() + " …[truncated]"


def _preview(text: str, limit: int = 280) -> str:
    return " ".join(text.split())[:limit]


def parse_pdf(data: bytes, settings: Settings) -> tuple[str, List[str]]:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception:
            return "", ["password protected"]
    notes: List[str] = []
    total = len(reader.pages)
    pages = reader.pages[: settings.ATTACHMENT_PDF_MAX_PAGES]
    if total > settings.ATTACHMENT_PDF_MAX_PAGES:
        notes.append(f"first {settings.ATTACHMENT_PDF_MAX_PAGES} of {total} pages read")
    parts: List[str] = []
    budget = settings.ATTACHMENT_TEXT_MAX_CHARS
    for page in pages:
        chunk = page.extract_text() or ""
        parts.append(chunk)
        budget -= len(chunk)
        if budget <= 0:
            break
    notes.insert(0, f"{total} page{'s' if total != 1 else ''}")
    return "\n".join(parts), notes


def parse_docx(data: bytes, settings: Settings) -> tuple[str, List[str]]:
    # Zip-bomb guard: check declared sizes and ratios before python-docx inflates anything
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        infos = zf.infolist()
        if len(infos) > 1000:
            raise AttachmentError("Word document has too many internal parts.")
        uncompressed = sum(i.file_size for i in infos)
        if uncompressed > settings.ATTACHMENT_DOCX_MAX_UNCOMPRESSED:
            raise AttachmentError("Word document expands to an unsafe size.")
        for info in infos:
            if info.compress_size and info.file_size / info.compress_size > 200 and info.file_size > 1_000_000:
                raise AttachmentError("Word document has a suspicious compression ratio.")

    import docx

    document = docx.Document(io.BytesIO(data))
    lines = [p.text for p in document.paragraphs if p.text.strip()]
    for table in document.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells]
            if any(cells):
                lines.append(" | ".join(cells))
    return "\n".join(lines), []


def parse_csv(text: str) -> tuple[str, List[str]]:
    rows: List[str] = []
    reader = csv.reader(io.StringIO(text))
    count = 0
    for row in reader:
        count += 1
        if count <= CSV_MAX_ROWS:
            rows.append(" | ".join(cell.strip() for cell in row))
    notes = [f"{count} rows"]
    if count > CSV_MAX_ROWS:
        notes.append(f"first {CSV_MAX_ROWS} rows read")
    return "\n".join(rows), notes


def prepare_image(data: bytes, settings: Settings, budget_b64: int) -> tuple[str, np.ndarray]:
    """Re-encodes to a bounded JPEG and returns (base64, BGR array for ONNX)."""
    with Image.open(io.BytesIO(data)) as probe:
        width, height = probe.size
    if width * height > MAX_IMAGE_PIXELS:
        raise AttachmentError("Image resolution is too large.")

    with Image.open(io.BytesIO(data)) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        bgr = cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2BGR)

        side = settings.ATTACHMENT_IMAGE_MAX_SIDE
        quality = 85
        while True:
            copy = img.copy()
            copy.thumbnail((side, side))
            buffer = io.BytesIO()
            copy.save(buffer, format="JPEG", quality=quality, optimize=True)
            encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
            if len(encoded) <= budget_b64 or side <= 320:
                return encoded, bgr
            if quality > 60:
                quality -= 10
            else:
                side = int(side * 0.75)


def summarize_detection(pipeline: Any, bgr: np.ndarray, settings: Settings) -> Optional[Dict[str, Any]]:
    """Runs the YOLO + MobileNet pipeline and keeps only what the LLM needs."""
    if pipeline is None:
        return None
    try:
        result = pipeline.diagnose(image_bgr=bgr)
    except Exception as exc:
        logger.warning(f"ONNX pipeline failed on chat attachment: {exc}")
        return None

    top = result.full_image_classification.top_prediction if result.full_image_classification else None
    confidence = float(top.confidence) if top else 0.0
    uncertain = result.status == "UNCERTAIN" or confidence < settings.CLASSIFIER_CONF_THRESHOLD
    return {
        "crop": result.primary_species or (top.species if top else None) or "Unknown",
        "condition": "Healthy" if result.status == "HEALTHY" else (result.primary_disease or "Unknown"),
        "status": result.status,
        "confidence": round(confidence, 4),
        "uncertain": uncertain,
    }


def detection_line(detection: Optional[Dict[str, Any]]) -> str:
    if not detection:
        return "on-device plant model unavailable"
    if detection["uncertain"]:
        return f"plant model uncertain (best guess {detection['crop']}, {detection['confidence']:.0%})"
    return f"plant model: {detection['crop']} / {detection['condition']} ({detection['confidence']:.0%})"


def parse_attachments(
    files: List[tuple[str, bytes]],
    pipeline: Any = None,
    settings: Optional[Settings] = None,
) -> List[ParsedAttachment]:
    """Parses up to ATTACHMENT_MAX_FILES files; raises AttachmentError for request-level violations."""
    settings = settings or get_settings()
    if len(files) > settings.ATTACHMENT_MAX_FILES:
        raise AttachmentError(f"At most {settings.ATTACHMENT_MAX_FILES} files per message.")

    sniffed: List[tuple[str, bytes, str]] = []
    for name, data in files:
        if not data:
            raise AttachmentError(f"'{name}' is empty.")
        if len(data) > settings.ATTACHMENT_MAX_BYTES:
            raise AttachmentError(f"'{name}' is larger than 10 MB.")
        sniffed.append((name, data, sniff_type(data, name)))

    image_count = sum(1 for _, _, t in sniffed if t in IMAGE_KINDS)
    if image_count > settings.ATTACHMENT_MAX_IMAGES:
        raise AttachmentError(f"At most {settings.ATTACHMENT_MAX_IMAGES} images per message.")
    per_image_budget = settings.ATTACHMENT_IMAGE_B64_BUDGET // max(1, image_count)

    text_budget = settings.ATTACHMENT_TEXT_MAX_CHARS
    parsed: List[ParsedAttachment] = []
    for name, data, ftype in sniffed:
        if ftype in IMAGE_KINDS:
            item = ParsedAttachment(name=name, kind="image", mime=IMAGE_KINDS[ftype])
            try:
                item.image_b64, bgr = prepare_image(data, settings, per_image_budget)
                item.detection = summarize_detection(pipeline, bgr, settings)
                item.summary = f"Photo; {detection_line(item.detection)}."
            except AttachmentError:
                raise
            except Exception as exc:
                logger.warning(f"Unreadable image attachment {name!r}: {exc}")
                item.status = "unreadable"
                item.summary = "Image could not be decoded."
            parsed.append(item)
            continue

        item = ParsedAttachment(name=name, kind="document", mime=DOC_MIMES[ftype])
        try:
            if ftype == "pdf":
                text, notes = parse_pdf(data, settings)
            elif ftype == "docx":
                text, notes = parse_docx(data, settings)
            else:
                raw = data.decode("utf-8-sig")
                text, notes = parse_csv(raw) if ftype == "csv" else (raw, [])
        except AttachmentError:
            raise
        except Exception as exc:
            logger.warning(f"Unreadable document attachment {name!r}: {exc}")
            text, notes = "", ["could not be parsed"]

        text = text.strip()
        if not text:
            item.status = "unreadable"
            reason = "no extractable text (scanned or image-only PDFs are not OCR'd)" if ftype == "pdf" else "no readable text"
            item.summary = f"{ftype.upper()}; {', '.join(notes + [reason])}."
            parsed.append(item)
            continue

        if text_budget <= 0:
            item.status = "unreadable"
            item.summary = f"{ftype.upper()}; skipped because the {settings.ATTACHMENT_TEXT_MAX_CHARS:,}-character document limit was reached."
            parsed.append(item)
            continue

        clipped = _clip(text, text_budget)
        text_budget -= len(clipped)
        if len(clipped) < len(text):
            notes.append("truncated")
        item.text = clipped
        meta = ", ".join([ftype.upper(), *notes, f"{len(clipped):,} chars read"])
        item.summary = f"{meta}. Starts: {_preview(clipped)}"
        parsed.append(item)

    return parsed
