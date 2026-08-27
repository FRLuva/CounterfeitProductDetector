from django.urls import path
from . import views

app_name = "community_alerts"
urlpatterns = [
    path("", views.alert_list, name="list"),
    path("new/", views.create_alert, name="create"),
    path("mine/", views.my_alerts, name="mine"),
    path("moderation/", views.moderation_queue, name="moderation_queue"),
    path("<int:pk>/", views.alert_detail, name="detail"),
    path("<int:pk>/confirm/", views.confirm_alert, name="confirm"),
    path("<int:pk>/comment/", views.add_comment, name="comment"),
    path("<int:pk>/moderate/", views.moderate_alert, name="moderate"),
]
