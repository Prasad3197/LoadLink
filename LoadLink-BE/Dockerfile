# syntax = docker/dockerfile:1.6
FROM python:3.11-slim as builder

WORKDIR /app

# Copy only requirements first (best practice for caching)
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final image
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
# Make sure binaries are in PATH
ENV PATH=/root/.local/bin:$PATH

# Copy source code — CORRECT PATH!
COPY app ./app

# Optional: copy any other needed files (alembic, etc.)
# COPY alembic.ini .
# COPY migrations ./migrations

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0.0", "--port", "8000"]