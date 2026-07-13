from django.contrib import admin


from django.urls import path, include

urlpatterns = [

    path("pdf-reports/", include("pdf_reports.urls")),

    path("", include("verification_history.urls")),

    path('product-comparison/', include('product_comparison.urls')),

    path(
        "admin/",
        admin.site.urls
    ),

]