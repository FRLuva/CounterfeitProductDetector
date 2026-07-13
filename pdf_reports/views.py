from django.shortcuts import render
from django.http import HttpResponse
from .models import PDFReport
from product_comparison.data import products
from .pdf_generator import generate_pdf


def report_history(request):

    reports = PDFReport.objects.order_by("-downloaded_at")

    return render(
        request,
        "pdf_reports/report_history.html",
        {
            "reports": reports
        }
    )


def report_overview(request, product_id):

    comparison_data = products.get(product_id)

    if comparison_data is None:
        return HttpResponse("Product not found.", status=404)

    report = {

        "id": product_id,

        "product_name": comparison_data["user_product"]["name"],

        "brand": comparison_data["user_product"]["brand"],

        "score": comparison_data["score"],

        "verdict": comparison_data["verdict"],

        "reason": comparison_data["reason"]

    }

    return render(
        request,
        "pdf_reports/report_overview.html",
        {
            "report": report
        }
    )


def download_report(request, product_id):

    comparison_data = products.get(product_id)

    if comparison_data is None:
        return HttpResponse("Product not found.", status=404)

    report = {

        "product_name": comparison_data["user_product"]["name"],

        "brand": comparison_data["user_product"]["brand"],

        "score": comparison_data["score"],

        "verdict": comparison_data["verdict"],

        "reason": comparison_data["reason"],

        "user_image": comparison_data["user_product"]["image"],

        "original_image": comparison_data["original_product"]["image"]

    }

    # Save download history
    PDFReport.objects.create(

        product_id=product_id,

        product_name=report["product_name"],

        verdict=report["verdict"],

        score=report["score"]

    )

    return generate_pdf(product_id, report)