from io import StringIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from community_alerts.models import CommunityAlert
from supply_chain.models import SupplyChainEvent, SupplyChainRecord


class StandaloneProjectTests(TestCase):
    def test_home_page_renders_primary_workflows(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Community alerts')
        self.assertContains(response, 'Verify a product')

    def test_settings_are_standalone(self):
        self.assertNotIn('scanner', settings.INSTALLED_APPS)
        self.assertEqual(settings.LOGIN_REDIRECT_URL, 'home')
        self.assertTrue(settings.MEDIA_URL.startswith('/'))

    def test_demo_seed_is_idempotent(self):
        output = StringIO()
        call_command('seed_demo', stdout=output)
        first_counts = (
            get_user_model().objects.count(),
            CommunityAlert.objects.count(),
            SupplyChainRecord.objects.count(),
            SupplyChainEvent.objects.count(),
        )
        call_command('seed_demo', stdout=output)
        self.assertEqual(first_counts, (
            get_user_model().objects.count(),
            CommunityAlert.objects.count(),
            SupplyChainRecord.objects.count(),
            SupplyChainEvent.objects.count(),
        ))
        self.assertEqual(first_counts, (3, 2, 2, 4))
        self.assertTrue(get_user_model().objects.get(username='teacher_admin').check_password('FakeGuardDemo2026!'))
