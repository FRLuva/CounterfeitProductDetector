# Porting Notes and Attribution

## Purpose

This edition preserves the application ideas and workflows Tuli developed in the original FakeGuard React and MongoDB prototype. The implementation was ported because the team later agreed to use Django, not because the original feature work was disposable.

The standalone project is intentionally pre-integration: it demonstrates Tuli's module without importing another team member's code.

## Concept mapping

| Original implementation | Standalone Django implementation |
|---|---|
| React pages and forms | Django templates with responsive CSS and lightweight JavaScript |
| Express routes and controllers | Django URL patterns and views |
| MongoDB user document and JWT | Django user model, sessions, and authentication views |
| Alert document | `CommunityAlert` |
| Embedded evidence images | `AlertEvidence` rows with validated uploads |
| Embedded confirmations | Unique `AlertConfirmation` rows |
| Embedded comments | Ordered `AlertComment` rows |
| Supply-chain document | `SupplyChainRecord` |
| Embedded trace history | Ordered `SupplyChainEvent` rows |
| Administrator role check | Django `is_staff` permission |
| GPS coordinates | Validated latitude, longitude, accuracy, source, and review fields |

## Preserved behavior

- Suspicious-product reporting and evidence collection.
- Alert risks, review states, location states, community confirmations, comments, and moderation.
- Product identity, barcode and batch lookup, trace IDs, actors, stages, event documents, locations, and verification states.
- Public approved alerts and public product verification.
- Protected report creation, personal history, record ownership, and moderation.
- Automatic initial trace event creation and suspicious status when a trace is flagged.

## Intentional compatibility changes

- Relational models replace embedded MongoDB structures.
- Django CSRF protection applies to all state-changing forms.
- Ownership and staff checks run on the server.
- Uploaded evidence is checked for size, dimensions, and supported image format.
- Passwords and sessions are managed by Django rather than custom JWT code.
- SQLite makes the submitted project self-contained; the reusable apps remain database-independent and can use PostgreSQL in the integrated project.

## Pre-integration boundary

The standalone models do not contain foreign keys to `scanner.ProductScan` or `scanner.ProductReference`. Product name, brand, category, barcode, and batch values are retained as the report or trace snapshot, so all original FakeGuard workflows work independently.

Scanner links should be added later in a small host-owned bridge app. This avoids migration conflicts and keeps responsibility for the pre-integration module clear.

## Deferred choices

- Whether confirmation should be reversible.
- Whether comments should also be allowed while a report is pending.
- Whether business accounts need a dedicated role.
- Whether event verification should become staff-only.
- Whether the default five-kilometre location threshold should be configurable per product or stage.
- Whether social login and external geocoding are required in a later release.
