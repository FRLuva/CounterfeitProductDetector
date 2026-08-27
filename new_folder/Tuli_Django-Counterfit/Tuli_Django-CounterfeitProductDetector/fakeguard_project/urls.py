from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import home


admin.site.site_header = 'FakeGuard administration'
admin.site.site_title = 'FakeGuard admin'
admin.site.index_title = 'Alerts and supply-chain records'

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('community/', include('community_alerts.urls')),
    path('trace/', include('supply_chain.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
