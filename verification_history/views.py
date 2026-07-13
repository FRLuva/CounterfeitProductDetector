from django.shortcuts import render


def user_home(request):
    return render(request, 'verification_history/user_home.html')

def verification_history(request):

    verification_records = [

    {
        "id": 1,
        "product_name": "Nike Air Max",
        "score": "95%",
        "result": "Authentic",
        "date": "12 Jul 2026",
    },

    {
        "id": 2,
        "product_name": "Apple AirPods Pro",
        "score": "22%",
        "result": "Fake",
        "date": "10 Jul 2026",
    },

    {
        "id": 3,
        "product_name": "Samsung USB Charger",
        "score": "84%",
        "result": "Likely Authentic",
        "date": "08 Jul 2026",
    },

    {
        "id": 4,
        "product_name": "Sony Headphones",
        "score": "56%",
        "result": "Fake",
        "date": "08 Jul 2026",
    },

    {
        "id": 5,
        "product_name": "Nivea Acne Control Cleanser",
        "score": "78%",
        "result": "Likely Authentic",
        "date": "05 Jul 2026",
    },

]

    context = {

        "verification_records": verification_records

    }

    return render(
        request,
        "verification_history/history.html",
        context
    )