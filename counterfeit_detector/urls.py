from django.contrib import admin


from django.urls import path, include

urlpatterns = [

    path('django-admin/', admin.site.urls),
    path('', include('admin_panel.urls')),

    path("pdf-reports/", include("pdf_reports.urls")),

    path("user/", include("verification_history.urls")),

    path('product-comparison/', include('product_comparison.urls')),
]