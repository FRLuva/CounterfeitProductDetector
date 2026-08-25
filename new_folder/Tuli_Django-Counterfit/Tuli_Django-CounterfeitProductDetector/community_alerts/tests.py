from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from PIL import Image

from .forms import CommunityAlertForm
from .models import AlertComment, AlertConfirmation, AlertEvidence, CommunityAlert


class CommunityAlertTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('tuli', password='StrongPass123')
        self.other = get_user_model().objects.create_user('other', password='StrongPass123')
        self.alert = CommunityAlert.objects.create(
            reported_by=self.user,
            product_name='Sample',
            brand_name='Brand',
            category='Food',
            purchase_location='Dhaka',
            suspicious_reason='Packaging mismatch',
        )

    @staticmethod
    def alert_data(**overrides):
        data = {
            'product_name': 'Medicine',
            'brand_name': 'SafeBrand',
            'category': 'Health',
            'barcode': 'FG-100',
            'batch_number': 'B-7',
            'shop_name': 'Demo Pharmacy',
            'purchase_location': 'Dhaka',
            'suspicious_reason': 'Seal mismatch',
            'description': 'The printed seal differs from the normal package.',
            'risk_level': 'medium',
            'geo_source': 'unknown',
            'geo_address': '',
        }
        data.update(overrides)
        return data

    @staticmethod
    def image_upload(name):
        output = BytesIO()
        Image.new('RGB', (80, 80), 'red').save(output, format='JPEG')
        return SimpleUploadedFile(name, output.getvalue(), content_type='image/jpeg')

    def test_pending_alert_is_private_to_reporter_and_staff(self):
        self.client.force_login(self.other)
        self.assertEqual(self.client.get(reverse('community_alerts:detail', args=[self.alert.pk])).status_code, 404)
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse('community_alerts:detail', args=[self.alert.pk])).status_code, 200)

    def test_only_approved_alerts_are_publicly_listed(self):
        approved = CommunityAlert.objects.create(
            reported_by=self.user,
            product_name='Public sample',
            brand_name='Brand',
            category='Food',
            purchase_location='Dhaka',
            suspicious_reason='Label mismatch',
            status=CommunityAlert.Status.APPROVED,
        )
        response = self.client.get(reverse('community_alerts:list'))
        self.assertContains(response, approved.product_name)
        self.assertNotContains(response, self.alert.product_name)
        self.assertEqual(self.client.get(reverse('community_alerts:detail', args=[approved.pk])).status_code, 200)

    def test_form_and_model_have_no_scanner_dependency(self):
        self.assertNotIn('source_scan', CommunityAlertForm().fields)
        self.assertNotIn('source_scan', [field.name for field in CommunityAlert._meta.get_fields()])

    def test_create_alert_sets_reporter_and_location_review_state(self):
        self.client.force_login(self.user)
        response = self.client.post(reverse('community_alerts:create'), self.alert_data(
            latitude='23.8103', longitude='90.4125', geo_accuracy='12', geo_source='gps'
        ))
        self.assertEqual(response.status_code, 302)
        created = CommunityAlert.objects.exclude(pk=self.alert.pk).get()
        self.assertEqual(created.reported_by, self.user)
        self.assertEqual(created.status, CommunityAlert.Status.PENDING)
        self.assertEqual(created.geo_verification_status, CommunityAlert.GeoStatus.PENDING)
        self.assertIsNotNone(created.geo_captured_at)

    def test_alert_rejects_a_single_coordinate(self):
        self.client.force_login(self.user)
        response = self.client.post(reverse('community_alerts:create'), self.alert_data(latitude='23.8103'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Latitude and longitude must be provided together')

    def test_create_alert_persists_multiple_evidence_images(self):
        self.client.force_login(self.user)
        with TemporaryDirectory() as media_root, self.settings(MEDIA_ROOT=media_root):
            data = self.alert_data()
            data['evidence_images'] = [self.image_upload('one.jpg'), self.image_upload('two.jpg')]
            response = self.client.post(reverse('community_alerts:create'), data)
            self.assertEqual(response.status_code, 302)
            created = CommunityAlert.objects.exclude(pk=self.alert.pk).get()
            self.assertEqual(AlertEvidence.objects.filter(alert=created).count(), 2)

    def test_confirmation_is_unique_in_database_and_http_flow(self):
        self.alert.status = CommunityAlert.Status.APPROVED
        self.alert.save(update_fields=['status'])
        AlertConfirmation.objects.create(alert=self.alert, user=self.user)
        with self.assertRaises(IntegrityError), transaction.atomic():
            AlertConfirmation.objects.create(alert=self.alert, user=self.user)
        self.client.force_login(self.other)
        url = reverse('community_alerts:confirm', args=[self.alert.pk])
        self.assertEqual(self.client.post(url).status_code, 302)
        self.assertEqual(self.client.post(url).status_code, 400)
        self.assertEqual(AlertConfirmation.objects.filter(alert=self.alert, user=self.other).count(), 1)

    def test_comment_requires_an_approved_alert_and_valid_text(self):
        self.client.force_login(self.other)
        pending_url = reverse('community_alerts:comment', args=[self.alert.pk])
        self.assertEqual(self.client.post(pending_url, {'text': 'Seen nearby'}).status_code, 404)
        self.alert.status = CommunityAlert.Status.APPROVED
        self.alert.save(update_fields=['status'])
        self.assertEqual(self.client.post(pending_url, {'text': ''}).status_code, 400)
        self.assertEqual(self.client.post(pending_url, {'text': 'Seen nearby'}).status_code, 302)
        self.assertTrue(AlertComment.objects.filter(alert=self.alert, user=self.other).exists())

    def test_mutating_actions_require_post_and_moderation_requires_staff(self):
        self.alert.status = CommunityAlert.Status.APPROVED
        self.alert.save(update_fields=['status'])
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse('community_alerts:confirm', args=[self.alert.pk])).status_code, 405)
        self.assertEqual(self.client.get(reverse('community_alerts:comment', args=[self.alert.pk])).status_code, 405)
        self.assertEqual(self.client.get(reverse('community_alerts:moderate', args=[self.alert.pk])).status_code, 302)

    def test_staff_can_find_and_moderate_pending_alerts(self):
        staff = get_user_model().objects.create_user('staff', password='StrongPass123', is_staff=True)
        self.client.force_login(staff)
        queue = self.client.get(reverse('community_alerts:moderation_queue'))
        self.assertContains(queue, self.alert.product_name)
        response = self.client.post(reverse('community_alerts:moderate', args=[self.alert.pk]), {
            'status': CommunityAlert.Status.APPROVED,
            'admin_note': 'Evidence accepted.',
            'geo_verification_status': CommunityAlert.GeoStatus.VERIFIED,
            'geo_verification_note': 'Location reviewed.',
            'is_within_claimed_area': 'on',
        })
        self.assertEqual(response.status_code, 302)
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.reviewed_by, staff)
        self.assertIsNotNone(self.alert.reviewed_at)
