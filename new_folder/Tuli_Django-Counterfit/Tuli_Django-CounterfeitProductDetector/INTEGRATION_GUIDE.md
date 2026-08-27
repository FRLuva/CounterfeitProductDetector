# Later Integration Guide

The standalone launcher and reusable feature apps are deliberately separated. Integration should reuse the apps without introducing scanner dependencies into their core migrations.

## Reuse from this package

Copy or merge:

- `accounts`
- `community_alerts`
- `supply_chain`
- `templates/tuli_compat`
- `static/tuli_compat`

Do not copy `fakeguard_project/settings.py` over the host project's settings. It exists only to run this submission independently.

Add the apps to the host settings:

```python
INSTALLED_APPS += [
    'accounts',
    'community_alerts',
    'supply_chain',
]
```

Include the URL modules under the paths selected by the team:

```python
path('accounts/', include('accounts.urls')),
path('community/', include('community_alerts.urls')),
path('trace/', include('supply_chain.urls')),
```

Set the host login redirects and ensure its media settings can serve `AlertEvidence` uploads.

## Scanner bridge

Create a separate host-side app, for example `tuli_scanner_bridge`, whose migrations may depend on the scanner app:

```python
class AlertScanLink(models.Model):
    alert = models.OneToOneField(
        'community_alerts.CommunityAlert',
        on_delete=models.CASCADE,
        related_name='scan_link',
    )
    scan = models.ForeignKey(
        'scanner.ProductScan',
        on_delete=models.CASCADE,
        related_name='alert_links',
    )


class TraceProductLink(models.Model):
    record = models.OneToOneField(
        'supply_chain.SupplyChainRecord',
        on_delete=models.CASCADE,
        related_name='product_link',
    )
    product = models.ForeignKey(
        'scanner.ProductReference',
        on_delete=models.CASCADE,
        related_name='trace_links',
    )
```

The bridge can prefill Tuli's product snapshot fields from a scan or product reference. The snapshot should remain on the alert or trace so historical reports do not silently change when catalog data is edited.

## Integration sequence

1. Review Tuli's fields, permissions, statuses, and deferred decisions with the team.
2. Install the reusable apps and run their tests against the host settings.
3. Apply their standalone migrations to a test database.
4. Add the bridge app and bridge migrations.
5. Connect host navigation and scanner actions to the new URLs.
6. Run both the existing scanner tests and the FakeGuard tests before deployment.

This design keeps Tuli's submission runnable and attributable while leaving a clear, low-conflict path into the shared project.
