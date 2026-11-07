# Multi-stage lean Dockerfile for CPU-optimized AI Vision Microservice
FROM python:3.11-slim as runtime

# Build metadata
LABEL maintainer="AgriTech AI Core Team" \
      service="ai-vision-inference" \
      version="1.0.0"

# Python runtime and CPU thread tuning environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/workspace \
    # OpenMP / CPU threadpool constraints for sub-100ms inference without thread thrashing
    OMP_NUM_THREADS=4 \
    MKL_NUM_THREADS=4 \
    ONNX_INTRA_OP_NUM_THREADS=4 \
    ONNX_INTER_OP_NUM_THREADS=1 \
    PORT=8000

# Install minimal OS runtime dependencies (libglib and libgomp for OpenCV/ONNX, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged application user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

WORKDIR /workspace

# Install Python dependencies first for caching
COPY requirements.txt /workspace/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code, models, and metadata
COPY app /workspace/app

# Set non-root permissions
RUN chown -R appuser:appgroup /workspace
USER appuser

# Expose microservice HTTP port
EXPOSE 8000

# Container healthcheck targeting liveness probe
HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/liveness || exit 1

# Production server entrypoint: single worker with internal threadpools
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
