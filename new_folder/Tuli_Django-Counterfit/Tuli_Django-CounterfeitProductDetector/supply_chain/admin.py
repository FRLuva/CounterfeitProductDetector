from django.contrib import admin
from .models import SupplyChainEvent, SupplyChainRecord

class EventInline(admin.TabularInline):
    model = SupplyChainEvent
    extra = 0

@admin.register(SupplyChainRecord)
class SupplyChainRecordAdmin(admin.ModelAdmin):
    list_display = ["trace_id", "product_name", "barcode", "batch_number", "current_stage", "authenticity_status"]
    list_filter = ["current_stage", "authenticity_status"]
    search_fields = ["trace_id", "product_name", "brand_name", "barcode", "batch_number"]
    inlines = [EventInline]
