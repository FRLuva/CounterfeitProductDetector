from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from community_alerts.models import AlertComment, AlertConfirmation, CommunityAlert
from supply_chain.models import SupplyChainEvent, SupplyChainRecord


DEMO_PASSWORD = 'FakeGuardDemo2026!'


class Command(BaseCommand):
    help = 'Create idempotent local demonstration accounts, alerts, and product traces.'

    def handle(self, *args, **options):
        user_model = get_user_model()
        users = {}
        definitions = {
            'tuli_demo': ('Tuli', 'tuli@example.test', False, False),
            'community_demo': ('Community Reviewer', 'community@example.test', False, False),
            'teacher_admin': ('Teacher Admin', 'teacher@example.test', True, True),
        }
        for username, (name, email, is_staff, is_superuser) in definitions.items():
            user, _ = user_model.objects.get_or_create(username=username)
            user.first_name = name
            user.email = email
            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.set_password(DEMO_PASSWORD)
            user.save()
            users[username] = user

        approved, _ = CommunityAlert.objects.update_or_create(
            product_name='Demo Pain Relief Tablets',
            barcode='8901234567001',
            batch_number='FLAG-B9',
            defaults={
                'reported_by': users['tuli_demo'],
                'brand_name': 'HealthSure',
                'category': 'Medicine',
                'shop_name': 'Old Town Pharmacy',
                'purchase_location': 'Dhaka',
                'suspicious_reason': 'Seal and batch printing do not match known packaging',
                'description': 'The outer seal was loose and the batch ink was visibly uneven.',
                'risk_level': CommunityAlert.Risk.HIGH,
                'status': CommunityAlert.Status.APPROVED,
                'latitude': 23.8103,
                'longitude': 90.4125,
                'geo_accuracy': 18,
                'geo_source': CommunityAlert.GeoSource.GPS,
                'geo_address': 'Dhaka, Bangladesh',
                'geo_captured_at': timezone.now(),
                'geo_verification_status': CommunityAlert.GeoStatus.VERIFIED,
                'is_within_claimed_area': True,
                'reviewed_by': users['teacher_admin'],
                'reviewed_at': timezone.now(),
                'admin_note': 'Demo evidence reviewed.',
            },
        )
        CommunityAlert.objects.update_or_create(
            product_name='Demo Cooking Oil',
            barcode='8901234567999',
            batch_number='REVIEW-C2',
            defaults={
                'reported_by': users['community_demo'],
                'brand_name': 'PureKitchen',
                'category': 'Food',
                'shop_name': 'Neighbourhood Market',
                'purchase_location': 'Dhaka',
                'suspicious_reason': 'Unexpected colour and missing safety mark',
                'description': 'This report is waiting in the moderation queue.',
                'risk_level': CommunityAlert.Risk.MEDIUM,
                'status': CommunityAlert.Status.PENDING,
            },
        )
        AlertConfirmation.objects.get_or_create(alert=approved, user=users['community_demo'])
        AlertComment.objects.get_or_create(
            alert=approved,
            user=users['community_demo'],
            defaults={'text': 'I found a package with the same printing issue.'},
        )

        now = timezone.now()
        authentic, _ = SupplyChainRecord.objects.update_or_create(
            trace_id='TRC-DEMO-100-B1',
            defaults={
                'product_name': 'Demo Oral Saline',
                'brand_name': 'SafeLife',
                'category': 'Healthcare',
                'barcode': '8901234567890',
                'batch_number': 'SAFE-B1',
                'manufacturer_name': 'SafeLife Manufacturing',
                'manufacture_date': date(2026, 6, 1),
                'expiry_date': date(2027, 6, 1),
                'current_stage': 'retailer_received',
                'current_owner': 'Dhaka Demo Pharmacy',
                'current_location': 'Dhaka',
                'authenticity_status': SupplyChainRecord.Authenticity.AUTHENTIC,
                'created_by': users['tuli_demo'],
            },
        )
        SupplyChainEvent.objects.update_or_create(
            record=authentic,
            document_ref='MFG-DEMO-100',
            defaults={
                'stage': 'manufactured',
                'actor_type': 'manufacturer',
                'actor_name': 'SafeLife Manufacturing',
                'location_name': 'Gazipur Factory',
                'latitude': 23.9999,
                'longitude': 90.4203,
                'event_time': now - timedelta(days=14),
                'note': 'Manufacturing and quality records created.',
                'verification_status': SupplyChainEvent.Verification.VERIFIED,
                'verified_by': users['teacher_admin'],
            },
        )
        SupplyChainEvent.objects.update_or_create(
            record=authentic,
            document_ref='RETAIL-DEMO-100',
            defaults={
                'stage': 'retailer_received',
                'actor_type': 'retailer',
                'actor_name': 'Dhaka Demo Pharmacy',
                'location_name': 'Dhaka',
                'latitude': 23.8103,
                'longitude': 90.4125,
                'event_time': now - timedelta(days=2),
                'note': 'Shipment received with seals intact.',
                'verification_status': SupplyChainEvent.Verification.VERIFIED,
                'verified_by': users['teacher_admin'],
            },
        )

        suspicious, _ = SupplyChainRecord.objects.update_or_create(
            trace_id='TRC-DEMO-200-B9',
            defaults={
                'product_name': 'Demo Pain Relief Tablets',
                'brand_name': 'HealthSure',
                'category': 'Medicine',
                'barcode': '8901234567001',
                'batch_number': 'FLAG-B9',
                'manufacturer_name': 'HealthSure Laboratories',
                'manufacture_date': date(2026, 5, 12),
                'expiry_date': date(2027, 5, 12),
                'current_stage': 'flagged',
                'current_owner': 'Old Town Pharmacy',
                'current_location': 'Dhaka',
                'authenticity_status': SupplyChainRecord.Authenticity.SUSPICIOUS,
                'created_by': users['tuli_demo'],
            },
        )
        SupplyChainEvent.objects.update_or_create(
            record=suspicious,
            document_ref='MFG-DEMO-200',
            defaults={
                'stage': 'manufactured',
                'actor_type': 'manufacturer',
                'actor_name': 'HealthSure Laboratories',
                'location_name': 'Gazipur Factory',
                'event_time': now - timedelta(days=20),
                'note': 'Original manufacturing record.',
                'verification_status': SupplyChainEvent.Verification.VERIFIED,
                'verified_by': users['teacher_admin'],
            },
        )
        SupplyChainEvent.objects.update_or_create(
            record=suspicious,
            document_ref='FLAG-DEMO-200',
            defaults={
                'stage': 'flagged',
                'actor_type': 'retailer',
                'actor_name': 'Old Town Pharmacy',
                'location_name': 'Dhaka',
                'latitude': 23.8103,
                'longitude': 90.4125,
                'event_time': now - timedelta(days=1),
                'note': 'Batch printing and packaging seal require investigation.',
                'verification_status': SupplyChainEvent.Verification.SUSPICIOUS,
            },
        )

        self.stdout.write(self.style.SUCCESS('FakeGuard demo data is ready.'))
        self.stdout.write(f'Password for every demo account: {DEMO_PASSWORD}')
        self.stdout.write('Accounts: tuli_demo, community_demo, teacher_admin')
        self.stdout.write('Verification sample: barcode 8901234567890, batch SAFE-B1')
