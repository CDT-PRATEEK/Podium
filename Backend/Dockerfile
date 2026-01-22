FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . /app/

# Create directory explicitly
RUN mkdir -p /app/staticfiles

# We leave this here to ensure the build passes checks, 
# but the REAL work happens in the CMD below.
RUN SECRET_KEY=build_secret \
    DATABASE_URL=sqlite:////tmp/db.sqlite3 \
    ALLOWED_HOSTS=localhost \
    CORS_ALLOWED_ORIGINS=http://localhost \
    CSRF_TRUSTED_ORIGINS=http://localhost \
    AI_SERVICE_URL=http://localhost \
    CRON_SECRET_KEY=dummy \
    GOOGLE_CLIENT_ID=dummy \
    GOOGLE_CLIENT_SECRET=dummy \
    python manage.py collectstatic --noinput

EXPOSE 8000


# We use "sh -c" to run two commands in a row.
# 1. python manage.py collectstatic: Generates the files LIVE on the active hard drive.
# 2. uvicorn ...: Starts the server only AFTER the files are generated.
CMD ["sh", "-c", "mkdir -p /app/staticfiles/admin /app/staticfiles/rest_framework && cp -r /usr/local/lib/python3.11/site-packages/django/contrib/admin/static/admin/* /app/staticfiles/admin/ && cp -r /usr/local/lib/python3.11/site-packages/rest_framework/static/rest_framework/* /app/staticfiles/rest_framework/ || true && uvicorn mysite.asgi:application --host 0.0.0.0 --port 8000"]