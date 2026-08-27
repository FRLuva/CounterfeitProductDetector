from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from .validators import validate_evidence_image


class CommunityAlert(models.Model):
    class Risk(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class GeoSource(models.TextChoices):
        GPS = "gps", "GPS"
        MANUAL = "manual", "Manual"
        NETWORK = "network", "Network"
        UNKNOWN = "unknown", "Unknown"

    class GeoStatus(models.TextChoices):
        NOT_PROVIDED = "not_provided", "Not provided"
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_alerts")
    product_name = models.CharField(max_length=200)
    brand_name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    barcode = models.CharField(max_length=200, blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    shop_name = models.CharField(max_length=200, blank=True)
    purchase_location = models.CharField(max_length=255)
    suspicious_reason = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    risk_level = models.CharField(max_length=10, choices=Risk.choices, default=Risk.MEDIUM)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    latitude = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-180), MaxValueValidator(180)])
    geo_accuracy = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)])
    geo_source = models.CharField(max_length=12, choices=GeoSource.choices, default=GeoSource.UNKNOWN)
    geo_address = models.CharField(max_length=255, blank=True)
    geo_captured_at = models.DateTimeField(null=True, blank=True)
    geo_verification_status = models.CharField(max_length=15, choices=GeoStatus.choices, default=GeoStatus.NOT_PROVIDED)
    geo_verification_note = models.CharField(max_length=255, blank=True)
    is_within_claimed_area = models.BooleanField(default=False)
    admin_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_community_alerts")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "-created_at"]), models.Index(fields=["barcode"])]
        constraints = [models.CheckConstraint(condition=(Q(latitude__isnull=True) & Q(longitude__isnull=True)) | (Q(latitude__isnull=False) & Q(longitude__isnull=False)), name="alert_coordinates_both_or_neither")]

    def __str__(self):
        return f"{self.product_name} — {self.get_status_display()}"


class AlertEvidence(models.Model):
    alert = models.ForeignKey(CommunityAlert, on_delete=models.CASCADE, related_name="evidence")
    image = models.ImageField(upload_to="community_alerts/%Y/%m/", validators=[validate_evidence_image])
    uploaded_at = models.DateTimeField(auto_now_add=True)


class AlertConfirmation(models.Model):
    alert = models.ForeignKey(CommunityAlert, on_delete=models.CASCADE, related_name="confirmations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    confirmed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["alert", "user"], name="one_confirmation_per_user")]


class AlertComment(models.Model):
    alert = models.ForeignKey(CommunityAlert, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
