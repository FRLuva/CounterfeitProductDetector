from django.contrib import admin
from .models import AlertComment, AlertConfirmation, AlertEvidence, CommunityAlert

class EvidenceInline(admin.TabularInline):
    model = AlertEvidence
    extra = 0

@admin.register(CommunityAlert)
class CommunityAlertAdmin(admin.ModelAdmin):
    list_display = ["product_name", "brand_name", "reported_by", "risk_level", "status", "created_at"]
    list_filter = ["status", "risk_level", "geo_verification_status"]
    search_fields = ["product_name", "brand_name", "barcode", "batch_number", "reported_by__username"]
    inlines = [EvidenceInline]

admin.site.register(AlertComment)
admin.site.register(AlertConfirmation)
