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

path(
    "dashboard/users/",
    views.user_management,
    name="user_management",
),

path(
    "dashboard/verifications/",
    views.verification_logs,
    name="verification_logs",
),

path(
    "dashboard/fake-products/",
    views.fake_products,
    name="fake_products",
),

path(
    "dashboard/community-alerts/",
    views.community_alerts,
    name="community_alerts",
),

path(
    "dashboard/settings/",
    views.system_settings,
    name="system_settings",
),
]