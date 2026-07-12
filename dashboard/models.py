from django.db import models
from django.contrib.auth.models import User


class VerificationHistory(models.Model):
    """
    TEMPORARY (Dummy) model.
    Replace this with Member 2's model later if necessary.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    product_name = models.CharField(max_length=200)

    authenticity_score = models.IntegerField()

    result = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.product_name