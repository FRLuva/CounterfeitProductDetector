from django.conf import settings
from django.contrib.auth import login
from django.shortcuts import redirect, render

from .forms import RegistrationForm


def register(request):
    if request.user.is_authenticated:
        return redirect(settings.LOGIN_REDIRECT_URL)
    form = RegistrationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        return redirect(settings.LOGIN_REDIRECT_URL)
    return render(request, "tuli_compat/accounts/register.html", {"form": form})
