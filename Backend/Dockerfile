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

EXPOSE 8000

# 1. Run collectstatic
# 2. Start UVICORN (Async Server) pointing to 'mysite.asgi:application'
CMD ["sh", "-c", "python manage.py collectstatic --noinput --ignore cloudinary && uvicorn mysite.asgi:application --host 0.0.0.0 --port 8000"]