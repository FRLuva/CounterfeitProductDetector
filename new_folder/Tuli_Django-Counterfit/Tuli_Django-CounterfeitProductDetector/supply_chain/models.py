from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

STAGES = [("manufactured", "Manufactured"), ("quality_checked", "Quality checked"), ("packaged", "Packaged"), ("shipped", "Shipped"), ("distributor_received", "Distributor received"), ("wholesaler_received", "Wholesaler received"), ("retailer_received", "Retailer received"), ("sold", "Sold to customer"), ("returned", "Returned"), ("flagged", "Flagged")]
ACTORS = [("manufacturer", "Manufacturer"), ("distributor", "Distributor"), ("wholesaler", "Wholesaler"), ("retailer", "Retailer"), ("customer", "Customer"), ("admin", "Admin"), ("system", "System")]

class SupplyChainRecord(models.Model):
    class Authenticity(models.TextChoices):
        PENDING = "pending", "Pending"
        AUTHENTIC = "authentic", "Authentic"
        SUSPICIOUS = "suspicious", "Suspicious"
        FAKE = "fake", "Fake"
        EXPIRED = "expired", "Expired"

    trace_id = models.CharField(max_length=50, unique=True)
    product_name = models.CharField(max_length=200)
    brand_name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    barcode = models.CharField(max_length=200, db_index=True)
    batch_number = models.CharField(max_length=100, db_index=True)
    manufacturer_name = models.CharField(max_length=200)
    manufacture_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    current_stage = models.CharField(max_length=30, choices=STAGES, default="manufactured")
    current_owner = models.CharField(max_length=200, blank=True)
    current_location = models.CharField(max_length=255, blank=True)
    authenticity_status = models.CharField(max_length=15, choices=Authenticity.choices, default=Authenticity.PENDING)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="supply_chain_records")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["barcode", "batch_number"])]

    def clean(self):
        if self.expiry_date and self.manufacture_date and self.expiry_date <= self.manufacture_date:
            raise ValidationError({"expiry_date": "Expiry date must be later than manufacture date."})

    def save(self, *args, **kwargs):
        self.trace_id = self.trace_id.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trace_id} — {self.product_name}"

class SupplyChainEvent(models.Model):
    class Verification(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        SUSPICIOUS = "suspicious", "Suspicious"

    record = models.ForeignKey(SupplyChainRecord, on_delete=models.CASCADE, related_name="events")
    stage = models.CharField(max_length=30, choices=STAGES)
    actor_type = models.CharField(max_length=20, choices=ACTORS)
    actor_name = models.CharField(max_length=200)
    location_name = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-180), MaxValueValidator(180)])
    geo_accuracy = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)])
    event_time = models.DateTimeField()
    document_ref = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)
    verification_status = models.CharField(max_length=15, choices=Verification.choices, default=Verification.PENDING)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_supply_events")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["event_time", "pk"]

    def clean(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValidationError("Latitude and longitude must be provided together.")
