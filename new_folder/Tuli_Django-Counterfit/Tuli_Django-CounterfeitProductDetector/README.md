# FakeGuard Standalone Django Edition

FakeGuard is an independent Django port of Tuli's original React and MongoDB prototype. It preserves her feature design, data concepts, and user workflows while using the Django stack selected by the team.

This folder runs by itself. It does not import or require the team's scanner application, database, source tree, or virtual environment.

## Features

- Local registration, login, logout, and Django administration.
- Community reports with risk levels, product and purchase details, up to five evidence images, and optional GPS metadata.
- Private pending reports, public approved reports, confirmations, comments, personal history, and staff moderation.
- Supply-chain records with product identity, ownership, locations, authenticity decisions, and ordered trace events.
- Public barcode and batch verification with optional distance comparison against the latest geotagged event.
- Responsive, accessible server-rendered interface suitable for a classroom demonstration.
- Idempotent demonstration data and automated tests.

## Requirements

- Python 3.12 or newer
- Internet access for the one-time dependency installation

SQLite is used automatically, so no database server is required.

## Windows setup

For a one-command classroom demonstration, double-click `start_windows.bat`. It creates the local environment, installs dependencies, prepares demo data, and starts the server.

Alternatively, open PowerShell in this folder and run each step manually:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_demo
.\.venv\Scripts\python.exe manage.py runserver
```

Then open <http://127.0.0.1:8000/>.

The virtual environment does not need to be activated when the commands above are used.

## macOS or Linux setup

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python manage.py migrate
./.venv/bin/python manage.py seed_demo
./.venv/bin/python manage.py runserver
```

Then open <http://127.0.0.1:8000/>.

## Demonstration accounts

Run `python manage.py seed_demo` after migrations. The command is safe to run repeatedly.

| Account | Access | Password |
|---|---|---|
| `tuli_demo` | Reports and trace ownership | `FakeGuardDemo2026!` |
| `community_demo` | Community confirmation and discussion | `FakeGuardDemo2026!` |
| `teacher_admin` | Staff moderation and Django admin | `FakeGuardDemo2026!` |

These credentials are for local demonstration only.

To test public trace verification, use:

- Barcode: `8901234567890`
- Batch number: `SAFE-B1`

An approved high-risk alert, a pending moderation example, an authentic trace, and a suspicious flagged trace are also created.

## Main pages

| URL | Purpose |
|---|---|
| `/` | Project home and activity summary |
| `/community/` | Approved community alerts |
| `/community/new/` | Submit a report after login |
| `/community/moderation/` | Staff review queue |
| `/trace/` | Public barcode and batch verification |
| `/trace/new/` | Create a trace record after login |
| `/admin/` | Django administration for staff |

## Validation

Run the complete project checks from the virtual environment:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test
```

For a true handoff test, extract the submitted ZIP into a new directory and repeat installation, migration, demo seeding, and tests there. Do not rely on an existing database or virtual environment.

## Project boundaries

The reusable work lives in three Django apps:

- `accounts`
- `community_alerts`
- `supply_chain`

`fakeguard_project` is only the small standalone launcher. During team integration, the reusable apps can be installed in the main Django project and the launcher can be left behind.

Scanner relationships are deliberately absent from this pre-integration submission. A later host-side bridge can link an alert to a scan or a trace to a product reference without making Tuli's core apps dependent on another team member's migrations. See `INTEGRATION_GUIDE.md`.

## Intentional limitations

- Local Django accounts are used; social login is not represented as complete.
- Coordinates can be captured, but address geocoding requires an external provider.
- Distance checking uses a Haversine calculation and does not require PostGIS.
- The original React client is not required to run this edition; its workflows are represented by Django templates and lightweight browser JavaScript.

## Attribution and academic disclosure

The alert system, supply-chain concepts, user flows, and original prototype design came from Tuli's work. `PORTING_NOTES.md` documents how those concepts map to Django.

Any conversion assistance or development tools should be disclosed according to the teacher's academic-integrity policy.
