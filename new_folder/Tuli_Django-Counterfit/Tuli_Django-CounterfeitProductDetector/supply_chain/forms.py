from django import forms
from django.utils import timezone
from .models import ACTORS, STAGES, SupplyChainEvent, SupplyChainRecord

class SupplyChainRecordForm(forms.ModelForm):
    initial_stage = forms.ChoiceField(choices=STAGES, initial="manufactured")
    actor_type = forms.ChoiceField(choices=ACTORS, initial="manufacturer")
    actor_name = forms.CharField(max_length=200, required=False)
    location_name = forms.CharField(max_length=255, required=False)
    document_ref = forms.CharField(max_length=255, required=False)
    note = forms.CharField(widget=forms.Textarea, required=False)
    latitude = forms.FloatField(required=False, min_value=-90, max_value=90, widget=forms.HiddenInput())
    longitude = forms.FloatField(required=False, min_value=-180, max_value=180, widget=forms.HiddenInput())
    geo_accuracy = forms.FloatField(required=False, min_value=0, widget=forms.HiddenInput())

    class Meta:
        model = SupplyChainRecord
        fields = ["product_name", "brand_name", "category", "barcode", "batch_number", "manufacturer_name", "manufacture_date", "expiry_date", "current_owner", "current_location", "authenticity_status"]
        widgets = {
            "manufacture_date": forms.DateInput(attrs={"type": "date"}),
            "expiry_date": forms.DateInput(attrs={"type": "date"}),
        }

    def clean(self):
        cleaned = super().clean()
        if (cleaned.get("latitude") is None) != (cleaned.get("longitude") is None):
            raise forms.ValidationError("Latitude and longitude must be provided together.")
        return cleaned

class SupplyChainEventForm(forms.ModelForm):
    class Meta:
        model = SupplyChainEvent
        exclude = ["record", "verified_by"]
        widgets = {"event_time": forms.DateTimeInput(attrs={"type": "datetime-local"}), "latitude": forms.HiddenInput(), "longitude": forms.HiddenInput(), "geo_accuracy": forms.HiddenInput()}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["event_time"].initial = timezone.localtime().strftime("%Y-%m-%dT%H:%M")

class TraceVerificationForm(forms.Form):
    barcode = forms.CharField(max_length=200)
    batch_number = forms.CharField(max_length=100)
    latitude = forms.FloatField(required=False, min_value=-90, max_value=90, widget=forms.HiddenInput())
    longitude = forms.FloatField(required=False, min_value=-180, max_value=180, widget=forms.HiddenInput())
    def clean(self):
        cleaned = super().clean()
        if (cleaned.get("latitude") is None) != (cleaned.get("longitude") is None):
            raise forms.ValidationError("Latitude and longitude must be provided together.")
        return cleaned
