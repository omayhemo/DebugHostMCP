# Python Base Image for Debug Host
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        curl \
        build-essential && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install Python packages for file watching and development
RUN pip install --no-cache-dir \
    watchdog==3.0.0 \
    python-dotenv==1.0.0 \
    flask==3.0.0 \
    django==4.2.8 \
    fastapi==0.104.1 \
    uvicorn==0.24.0

# Set working directory
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 pythonuser && \
    useradd -r -u 1001 -g pythonuser pythonuser && \
    chown -R pythonuser:pythonuser /app

# Copy Python watcher script
COPY scripts/python-watcher.py /usr/local/bin/python-watcher.py
RUN chmod +x /usr/local/bin/python-watcher.py

USER pythonuser

# Default command uses python-watcher for auto-restart
CMD ["python", "/usr/local/bin/python-watcher.py", "python", "main.py"]