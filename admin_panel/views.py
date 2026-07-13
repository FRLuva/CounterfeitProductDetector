from django.shortcuts import render, redirect


def home(request):
    return render(request, "landing.html")


def admin_login(request):

    if request.method == "POST":

        secret_id = request.POST.get("secret_id")
        email = request.POST.get("email")
        password = request.POST.get("password")

        if (
            secret_id == "ADMIN2026"
            and email == "admin@counterfeit.com"
            and password == "Admin@123"
        ):

            return redirect("admin_dashboard")

        else:

            context = {
                "error": "Invalid Secret ID, Email, or Password."
            }

            return render(
                request,
                "admin_panel/admin_login.html",
                context
            )

    return render(request, "admin_panel/admin_login.html")


def dashboard(request):
    return render(
        request,
        "admin_panel/dashboard.html"
    )