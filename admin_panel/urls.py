from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='landing'),
    path('admin-login/', views.admin_login, name='admin_login'),
    path(
    "dashboard/",
    views.dashboard,
    name="admin_dashboard"
),
]