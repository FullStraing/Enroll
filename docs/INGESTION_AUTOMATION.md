# University Ingestion Automation (1000+)

This runbook describes automated ingestion for 1000+ universities.
It now supports two modes:
- Niche-first browser automation (primary when no official API exists).
- Licensed provider ingestion (optional/secondary).

## Core strategy (Niche-first automation)

- Queue workers: Celery + Redis
- Browser runtime: Playwright persistent profiles + proxy rotation
- Commands:
  - `niche_enqueue_full_weekly`
  - `niche_enqueue_delta_daily`
  - `niche_enqueue_recovery_failed`
  - `run_niche_scheduler`
- Storage:
  - `UniversitySourceSnapshot`
  - `UniversitySourceSection`
  - `UniversityMetric`
  - `UniversityMediaRef`
  - `ScrapeRun` / `ScrapeRunItem`

## Niche-first queue commands

```bash
celery -A config worker -l info --concurrency=4
python backend/manage.py niche_enqueue_full_weekly --limit 1000
python backend/manage.py niche_enqueue_delta_daily --since-days 1
python backend/manage.py niche_enqueue_recovery_failed
python backend/manage.py run_niche_scheduler
```

## Commands

### Full ingest

```bash
python backend/manage.py ingest_universities_full --limit 100
```

### Daily delta ingest

```bash
python backend/manage.py ingest_universities_delta --since-days 1
```

### Backfill batches

```bash
python backend/manage.py ingest_backfill --start-offset 0 --limit 100
```

### Quality report

```bash
python backend/manage.py ingest_quality_report
python backend/manage.py ingest_quality_report --failed-threshold 10
```

### Scheduler fallback (APScheduler)

```bash
python backend/manage.py run_ingestion_scheduler
```

Schedules:
- weekly full: Sunday 02:00 UTC
- daily delta: 03:00 UTC

## Connector modes

Licensed connector supports:
- `LICENSED_FEED_MODE=mock` (default)
- `LICENSED_FEED_MODE=api`

Environment variables:
- `LICENSED_FEED_MOCK_PATH` (default `backend/apps/universities/fixtures/licensed_feed_mock.json`)
- `LICENSED_FEED_URL`
- `LICENSED_FEED_TOKEN`

Niche automation env:
- `NICHE_PROFILE_ROOT`
- `NICHE_AUTOMATION_PROFILES`
- `NICHE_PROXY_POOL`
- `NICHE_HEADLESS`
- `NICHE_MIN_DELAY_SEC`
- `NICHE_MAX_DELAY_SEC`

## Quality gate

Item cannot be `success` unless:
- admissions core exists (`acceptance_rate`)
- and at least one cost/housing metric exists (`net_price`, `room_and_board`, `housing_cost`, etc.)

Otherwise:
- `partial` if only part of core is available
- `failed` if both admissions and cost/housing are missing

## Cleanup policy

Use `scripts/clean_local.ps1` for safe cleanup:
- removes only approved artifacts (`backend/.secrets/*`, `tmp`, optional `frontend/.next`)
- does **not** delete `node_modules`
