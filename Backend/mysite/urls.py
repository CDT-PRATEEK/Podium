from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

def health_check(request):
    return JsonResponse({
        "status": "online",
        "project": "Podium API",
        "author": "Prateek Sinha"
    })


urlpatterns = [
    path('', health_check),

    path('admin/', admin.site.urls),

    path('api/', include('users.urls')),

    path('api/', include('blog.urls')),

    path('api/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)