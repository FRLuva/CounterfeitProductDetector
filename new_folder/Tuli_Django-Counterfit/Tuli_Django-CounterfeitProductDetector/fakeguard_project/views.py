from django.shortcuts import render

from community_alerts.models import CommunityAlert
from supply_chain.models import SupplyChainRecord


def home(request):
    approved_alerts = CommunityAlert.objects.filter(
        status=CommunityAlert.Status.APPROVED
    ).select_related('reported_by')[:3]
    recent_records = SupplyChainRecord.objects.select_related('created_by')[:3]
    return render(request, 'tuli_compat/home.html', {
        'approved_alerts': approved_alerts,
        'recent_records': recent_records,
        'approved_count': CommunityAlert.objects.filter(
            status=CommunityAlert.Status.APPROVED
        ).count(),
        'trace_count': SupplyChainRecord.objects.count(),
    })
