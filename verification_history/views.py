from django.shortcuts import render


def home(request):
    return render(
        request,
        "dashboard/home.html"
    )


def verification_history(request):

    verification_records = [

        {
            "product_name": "Nike Air Max",
            "score": "95%",
            "result": "Authentic",
            "date": "12 Jul 2026",
        },

        {
            "product_name": "Apple AirPods Pro",
            "score": "22%",
            "result": "Fake",
            "date": "10 Jul 2026",
        },

        {
            "product_name": "Samsung USB Charger",
            "score": "84%",
            "result": "Likely Authentic",
            "date": "08 Jul 2026",
        },

    ]

    context = {

        "verification_records": verification_records

    }

    return render(
        request,
        "dashboard/history.html",
        context
    )