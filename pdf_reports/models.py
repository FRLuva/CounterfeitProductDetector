from django.db import models


class PDFReport(models.Model):

    product_id = models.IntegerField()

    product_name = models.CharField(max_length=200)

    verdict = models.CharField(max_length=100)

    score = models.IntegerField()

    downloaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product_name} ({self.downloaded_at.strftime('%Y-%m-%d %H:%M')})"