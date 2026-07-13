from django.shortcuts import render
from .data import products


def comparison(request, product_id):

    comparison_data = products.get(product_id)
    comparison_data["product_id"] = product_id

    return render(
        request,
        "product_comparison/comparison.html",
        comparison_data
    )