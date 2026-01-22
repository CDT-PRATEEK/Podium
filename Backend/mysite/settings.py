"""
Django settings for mysite project.
Production Ready: NeonDB, Cloudinary, WhiteNoise, and Environment Variables.
"""

from pathlib import Path
import os
import environ
import dj_database_url 
from datetime import timedelta
import django

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize Environment Variables
env = environ.Env()
# Read .env file if it exists (for local development)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# =========================================================
#  CORE SETTINGS
# =========================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
# Default to False for safety
DEBUG = env.bool('DEBUG', default=False)

# Allow hosts from environment (e.g., '.koyeb.app')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')


# =========================================================
#  APPS & MIDDLEWARE
# =========================================================

INSTALLED_APPS = [
    'blog.apps.BlogConfig',
    'users.apps.UsersConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',
    'django.contrib.staticfiles', # Required for WhiteNoise
    
    # Third Party
    'rest_framework',
    'rest_framework.authtoken',
    'taggit',
    'corsheaders',
    'django_filters',
    'django_rest_passwordreset',
    'cloudinary',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # <--- Added for Static Files
    'corsheaders.middleware.CorsMiddleware',      # <--- CORS must be high up
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mysite.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mysite.wsgi.application'


# =========================================================
#  DATABASE (NeonDB Support)
# =========================================================

# Looks for 'DATABASE_URL' in env. If not found, falls back to local postgres
DATABASES = {
    'default': dj_database_url.config(
        default=env('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True if not DEBUG else False
    )
}


# =========================================================
#  SECURITY & CORS
# =========================================================


FRONTEND_URL= env('FRONTEND_URL', default='http://localhost:5173')
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS')


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',  # <--- CRITICAL for "Token ..." header
        'rest_framework.authentication.SessionAuthentication', 
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}


# =========================================================
#  STATIC FILES (CSS/JS)
# =========================================================

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
WHITENOISE_ROOT = STATIC_ROOT

STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]


# =========================================================
#  MEDIA FILES (Cloudinary)
# =========================================================

# Check if Cloudinary keys exist in .env
if os.environ.get('CLOUDINARY_CLOUD_NAME'):
    
    # 1. Cloudinary Credentials
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
        'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
        'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
    }

    # Set media backend for Cloudinary
    MY_MEDIA_BACKEND = "cloudinary_storage.storage.MediaCloudinaryStorage"

else:
    # Local Development Fallback (If no keys in .env, use local folder)
    print(" No Cloudinary Keys found. Using local filesystem for Media.")
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
    MY_MEDIA_BACKEND = "django.core.files.storage.FileSystemStorage"


# =========================================================
#  UNIFIED STORAGE CONFIGURATION
# =========================================================
# This ensures Static Files works consistently in Docker AND Production.

STORAGES = {
    # Media files change based on environment (Cloudinary vs Local)
    "default": {
        "BACKEND": MY_MEDIA_BACKEND,
    },
    
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# =========================================================
#  CUSTOM SETTINGS (AI & EMAIL)
# =========================================================

# AI Service URL (Use internal Docker URL in prod, localhost in dev)
AI_SERVICE_URL = env('AI_SERVICE_URL')

# Email / Google Auth (Env vars required)
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REFRESH_TOKEN = env('GOOGLE_REFRESH_TOKEN', default='')

# cleanup
CRON_SECRET_KEY = env('CRON_SECRET_KEY')

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-in'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'



# Login
LOGIN_REDIRECT_URL = 'post-login'
LOGIN_URL = 'login'
TAGGIT_CASE_INSENSITIVE = True
CKEDITOR_CONFIGS = {'default': {'toolbar': 'full', 'height': 300, 'width': '100%'}}


SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'




LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

