# ---- Build Stage ----
FROM python:3.11-slim as builder
WORKDIR /app
COPY LoadLink-BE/requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ---- Runtime Stage ----
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY LoadLink-BE/app ./app

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]