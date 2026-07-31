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

    context = {

        "total_users": 250,

        "total_verifications": 820,

        "fake_products": 96,

        "pdf_reports": 315,

        "community_alerts": 18,

        "recent_verifications": [

    {
        "product": "Nike Air Max",
        "user": "user01",
        "result": "Authentic",
        "date": "12 Jul 2026",
    },

    {
        "product": "Apple AirPods Pro",
        "user": "user02",
        "result": "Fake",
        "date": "11 Jul 2026",
    },

    {
        "product": "Sony WH-1000XM5",
        "user": "user03",
        "result": "Authentic",
        "date": "10 Jul 2026",
    },

    {
        "product": "Samsung USB Charger",
        "user": "user04",
        "result": "Fake",
        "date": "09 Jul 2026",
    },

],

    "verification_statistics":
    {
        "Authentic": 520,
        "Likely Authentic": 204,
        "Fake": 96,
    },

    "verification_trend": [

    {"day": "Mon", "count": 82},
    {"day": "Tue", "count": 95},
    {"day": "Wed", "count": 110},
    {"day": "Thu", "count": 97},
    {"day": "Fri", "count": 125},
    {"day": "Sat", "count": 138},
    {"day": "Sun", "count": 173},

],         

}

    return render(
        request,
        "admin_panel/dashboard.html",
        context
    )

def user_management(request):

    return render(
        request,
        "admin_panel/user_management.html"
    )


def verification_logs(request):

    return render(
        request,
        "admin_panel/verification_logs.html"
    )


def fake_products(request):

    return render(
        request,
        "admin_panel/fake_products.html"
    )


def community_alerts(request):

    return render(
        request,
        "admin_panel/community_alerts.html"
    )


def system_settings(request):

    return render(
        request,
        "admin_panel/system_settings.html"
    )