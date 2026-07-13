from django.urls import path
from . import views

urlpatterns = [
    path("", views.report_history, name="report_history"),

    path(
        "overview/<int:product_id>/",
        views.report_overview,
        name="report_overview",
    ),

    path(
        "download/<int:product_id>/",
        views.download_report,
        name="download_report",
    ),
]