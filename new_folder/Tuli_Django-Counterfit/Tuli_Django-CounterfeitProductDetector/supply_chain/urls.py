from django.urls import path
from . import views

app_name = "supply_chain"
urlpatterns = [
    path("", views.verify_trace, name="verify"),
    path("mine/", views.my_records, name="mine"),
    path("new/", views.create_record, name="create"),
    path("<str:trace_id>/", views.trace_detail, name="detail"),
    path("<str:trace_id>/events/new/", views.add_event, name="add_event"),
]
