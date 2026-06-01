# ============================================================================
# Stage 1: Build frontend
# ============================================================================
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# ============================================================================
# Stage 2: Python runtime
# ============================================================================
FROM python:3.11-slim AS runtime

LABEL org.opencontainers.image.title="Vibe-Trading" \
    org.opencontainers.image.description="Natural-language finance research AI agent with backtesting" \
    org.opencontainers.image.version="0.1.7" \
    org.opencontainers.image.source="https://github.com/HKUDS/Vibe-Trading" \
    org.opencontainers.image.licenses="MIT"

WORKDIR /app

# System deps (curl + bash needed for Cursor CLI installer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*

# Install Cursor agent binary (used by cursor_proxy.py for the cursor provider)
RUN curl https://cursor.com/install -fsS | bash \
    && ln -sf /root/.local/bin/agent /usr/local/bin/agent \
    && agent --version

# Python deps (install before copying code for layer caching)
COPY agent/requirements.txt agent/requirements.txt
RUN pip install --no-cache-dir -r agent/requirements.txt

# Copy project
COPY pyproject.toml LICENSE README.md ./
COPY cursor_proxy.py ./
COPY agent/ agent/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist frontend/dist

# Install CLI entrypoint
RUN pip install --no-cache-dir -e .

# Create vibe user for ownership reference; runtime uses entrypoint to drop privs
RUN useradd --create-home --shell /usr/sbin/nologin vibe \
    && mkdir -p agent/runs agent/sessions agent/uploads agent/.swarm/runs \
    && chown -R vibe:vibe /app

# Entrypoint: runs as root, fixes /data permissions, then exec's app as vibe
RUN printf '#!/bin/sh\n\
mkdir -p /data/runs /data/sessions /data/uploads /data/swarm_runs \\\n\
    /data/vibe_trading/shadow_accounts \\\n\
    /data/vibe_trading/shadow_runs \\\n\
    /data/vibe_trading/shadow_reports\n\
chown -R vibe:vibe /data\n\
exec su vibe -s /bin/sh -c \\\n\
    "python /app/cursor_proxy.py & sleep 1 && exec vibe-trading serve --host 0.0.0.0 --port ${PORT:-8899}"\n\
' > /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Default port
EXPOSE 8899

# Health check — use $PORT so it works both locally and on Railway
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,os; urllib.request.urlopen('http://localhost:'+os.getenv('PORT','8899')+'/health')" || exit 1

# Entrypoint fixes /data ownership (Railway volumes mount as root) then drops to vibe
CMD ["/usr/local/bin/entrypoint.sh"]
