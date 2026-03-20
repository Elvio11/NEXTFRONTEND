# 1. Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# 2. Final Server 5 Python Environment
FROM python:3.12-slim
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install logic tools + dependencies for OpenFang and Next.js
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libssl-dev \
    pkg-config \
    supervisor \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for Next.js standalone runner
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# Install OpenFang (Rust binary) — The base Company OS
RUN curl -fsSL https://openfang.sh/install | sh
ENV PATH="/root/.agent/bin:${PATH}"

WORKDIR /app

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy logic
COPY main.py ./
COPY openfang ./openfang

# Copy built frontend (Next.js 15)
COPY --from=frontend-builder /app/.next/standalone ./frontend-standalone
COPY --from=frontend-builder /app/.next/static ./frontend-standalone/.next/static
COPY --from=frontend-builder /app/public ./frontend-standalone/public

# Setup directories for OpenFang hands/workflows/skills
RUN mkdir -p /app/openfang/config /app/openfang/hands /app/openfang/workflows /app/openfang/skills

# Supervisor configuration to orchestrate Python + OpenFang + Next.js
#   Python: Port 8005 (Master OS)
#   Next.js: Port 3000 (UI)
RUN echo "[supervisord]\nnodaemon=true\n\n[program:python-os]\ncommand=uvicorn main:app --host 0.0.0.0 --port 8005\nautostart=true\nautorestart=true\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\n\n[program:openfang]\ncommand=openfang start --config /app/openfang/config/config.toml\nautostart=false\nautorestart=false\n\n[program:nextjs]\ncommand=node /app/frontend-standalone/server.js\nenvironment=PORT=3000\nautostart=true\nautorestart=true\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0" > /etc/supervisor/conf.d/supervisord.conf

# Expose Next.js (3000) and Master OS (8005)
EXPOSE 3000 8005

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]