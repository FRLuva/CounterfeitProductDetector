from django.urls import path

from . import views

urlpatterns = [

    path(
        "",
        views.home,
        name="home"
    ),

    path(
        "history/",
        views.verification_history,
        name="history"
    ),

]