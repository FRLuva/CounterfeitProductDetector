from django import forms
from .models import AlertComment, CommunityAlert
from .validators import validate_evidence_image


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleImageField(forms.ImageField):
    widget = MultipleFileInput

    def clean(self, data, initial=None):
        files = data if isinstance(data, (list, tuple)) else ([data] if data else [])
        if len(files) > 5:
            raise forms.ValidationError("Upload no more than five evidence images.")
        return [super(MultipleImageField, self).clean(item, initial) for item in files]


class CommunityAlertForm(forms.ModelForm):
    evidence_images = MultipleImageField(required=False, validators=[validate_evidence_image])

    class Meta:
        model = CommunityAlert
        fields = ["product_name", "brand_name", "category", "barcode", "batch_number", "shop_name", "purchase_location", "suspicious_reason", "description", "risk_level", "latitude", "longitude", "geo_accuracy", "geo_source", "geo_address"]
        widgets = {"latitude": forms.HiddenInput(), "longitude": forms.HiddenInput(), "geo_accuracy": forms.HiddenInput()}

    def clean(self):
        cleaned = super().clean()
        if (cleaned.get("latitude") is None) != (cleaned.get("longitude") is None):
            raise forms.ValidationError("Latitude and longitude must be provided together.")
        return cleaned


class AlertCommentForm(forms.ModelForm):
    class Meta:
        model = AlertComment
        fields = ["text"]


class AlertModerationForm(forms.ModelForm):
    class Meta:
        model = CommunityAlert
        fields = ["status", "admin_note", "geo_verification_status", "geo_verification_note", "is_within_claimed_area"]
