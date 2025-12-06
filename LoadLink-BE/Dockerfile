# ---------- Base ----------
FROM python:3.11-slim AS base
WORKDIR /app
COPY LoadLink-BE/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---------- Builder ----------
FROM base AS builder
COPY LoadLink-BE/ .

# ---------- Runtime ----------
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]