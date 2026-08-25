from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from .forms import SupplyChainRecordForm
from .models import SupplyChainEvent, SupplyChainRecord
from .services import generate_trace_id, verify_location

class SupplyChainTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user("owner", password="StrongPass123")
        self.other = get_user_model().objects.create_user("other", password="StrongPass123")
        self.record = SupplyChainRecord.objects.create(trace_id=" trace-1 ", product_name="Sample", brand_name="Brand", category="Food", barcode="123", batch_number="B1", manufacturer_name="Factory", created_by=self.owner)

    def test_trace_id_is_normalized_and_publicly_accessible(self):
        self.assertEqual(self.record.trace_id, "TRACE-1")
        self.assertEqual(self.client.get(reverse("supply_chain:detail", args=["TRACE-1"])).status_code, 200)

    def test_form_and_model_have_no_scanner_dependency(self):
        self.assertNotIn("product_reference", SupplyChainRecordForm().fields)
        self.assertNotIn("product_reference", [field.name for field in SupplyChainRecord._meta.get_fields()])

    def test_generated_trace_id_is_short_and_url_safe(self):
        trace_id = generate_trace_id("A very/long barcode value with spaces" * 4, "Batch / 2026" * 4)
        self.assertLessEqual(len(trace_id), 50)
        self.assertRegex(trace_id, r"^TRC-[A-Z0-9]+-[A-Z0-9]+-[0-9A-F]{6}$")

    def test_unrelated_user_cannot_add_event(self):
        self.client.force_login(self.other)
        self.assertEqual(self.client.get(reverse("supply_chain:add_event", args=["TRACE-1"])).status_code, 404)

    def test_expiry_must_follow_manufacture(self):
        self.record.manufacture_date = timezone.localdate()
        self.record.expiry_date = self.record.manufacture_date - timedelta(days=1)
        with self.assertRaises(ValidationError):
            self.record.full_clean()
        self.record.expiry_date = self.record.manufacture_date
        with self.assertRaises(ValidationError):
            self.record.full_clean()

    def test_location_verification_uses_latest_geo_event(self):
        SupplyChainEvent.objects.create(record=self.record, stage="shipped", actor_type="manufacturer", actor_name="Factory", location_name="Dhaka", latitude=23.8103, longitude=90.4125, event_time=timezone.now())
        self.assertTrue(verify_location(self.record, 23.8103, 90.4125)["within_range"])

    def test_location_verification_handles_missing_and_distant_locations(self):
        self.assertEqual(verify_location(self.record, 23.8103, 90.4125)["status"], "unavailable")
        SupplyChainEvent.objects.create(record=self.record, stage="shipped", actor_type="manufacturer", actor_name="Factory", location_name="Dhaka", latitude=23.8103, longitude=90.4125, event_time=timezone.now())
        result = verify_location(self.record, 22.3569, 91.7832)
        self.assertEqual(result["status"], "outside_range")
        self.assertFalse(result["within_range"])

    def test_create_record_generates_trace_and_initial_event(self):
        self.client.force_login(self.owner)
        response = self.client.post(reverse("supply_chain:create"), {
            "product_name": "Medicine", "brand_name": "SafeBrand", "category": "Health",
            "barcode": "ABC 123", "batch_number": "B 7", "manufacturer_name": "Factory",
            "current_owner": "", "current_location": "Dhaka", "authenticity_status": "pending",
            "initial_stage": "manufactured", "actor_type": "manufacturer", "actor_name": "Factory",
            "location_name": "Dhaka", "document_ref": "DOC-1", "note": "Created",
        })
        self.assertEqual(response.status_code, 302)
        created = SupplyChainRecord.objects.exclude(pk=self.record.pk).get()
        self.assertRegex(created.trace_id, r"^TRC-ABC123-B7-[0-9A-F]{6}$")
        self.assertEqual(created.events.count(), 1)
        self.assertEqual(created.events.get().stage, "manufactured")

    def test_flagged_event_marks_record_suspicious(self):
        self.client.force_login(self.owner)
        response = self.client.post(reverse("supply_chain:add_event", args=[self.record.trace_id]), {
            "stage": "flagged", "actor_type": "retailer", "actor_name": "Retailer",
            "location_name": "Dhaka", "event_time": timezone.localtime().strftime("%Y-%m-%dT%H:%M"),
            "document_ref": "", "note": "Mismatch", "verification_status": "suspicious",
        })
        self.assertEqual(response.status_code, 302)
        self.record.refresh_from_db()
        self.assertEqual(self.record.authenticity_status, SupplyChainRecord.Authenticity.SUSPICIOUS)

    def test_verified_event_updates_current_record_and_reviewer(self):
        self.client.force_login(self.owner)
        response = self.client.post(reverse("supply_chain:add_event", args=[self.record.trace_id]), {
            "stage": "shipped", "actor_type": "distributor", "actor_name": "Demo Distributor",
            "location_name": "Chattogram", "event_time": timezone.localtime().strftime("%Y-%m-%dT%H:%M"),
            "document_ref": "SHIP-1", "note": "Released for transport", "verification_status": "verified",
        })
        self.assertEqual(response.status_code, 302)
        event = self.record.events.get(stage="shipped")
        self.assertEqual(event.verified_by, self.owner)
        self.record.refresh_from_db()
        self.assertEqual(self.record.current_owner, "Demo Distributor")
        self.assertEqual(self.record.current_location, "Chattogram")

    def test_event_requires_both_coordinates(self):
        event = SupplyChainEvent(
            record=self.record, stage="shipped", actor_type="manufacturer", actor_name="Factory",
            location_name="Dhaka", latitude=23.8103, event_time=timezone.now(),
        )
        with self.assertRaises(ValidationError):
            event.full_clean()

    def test_private_record_pages_require_login(self):
        self.assertEqual(self.client.get(reverse("supply_chain:mine")).status_code, 302)
        self.assertEqual(self.client.get(reverse("supply_chain:create")).status_code, 302)

    def test_verify_and_personal_list_templates_render(self):
        self.assertEqual(self.client.get(reverse("supply_chain:verify")).status_code, 200)
        response = self.client.get(reverse("supply_chain:verify"), {"barcode": "123", "batch_number": "B1"})
        self.assertContains(response, "Sample")
        self.client.force_login(self.owner)
        self.assertEqual(self.client.get(reverse("supply_chain:mine")).status_code, 200)
