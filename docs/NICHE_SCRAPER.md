# Niche Full-Data Scraper

This document describes the full-data scraper pipeline for universities sourced from `niche.com`.

## What is stored

- Full snapshot payload (`UniversitySourceSnapshot.raw_payload`) per scrape.
- Per-section parsed payload and status (`UniversitySourceSection`).
- Normalized metric records (`UniversityMetric`) for product usage and filtering.
- Media references (`UniversityMediaRef`) with URL + metadata only.
- Run logs (`ScrapeRun`, `ScrapeRunItem`) for monitoring and debugging.

## Commands

1. Install backend deps and Chromium runtime:

```bash
pip install -r backend/requirements.txt
python -m playwright install chromium
```

2. Bootstrap authenticated browser session:

```bash
python backend/manage.py niche_session_bootstrap
```

For worker profiles (recommended for rotation):

```bash
python backend/manage.py niche_profile_bootstrap --profile profile_a
python backend/manage.py niche_profile_bootstrap --profile profile_b
python backend/manage.py niche_profile_bootstrap --profile profile_c
```

3. Scrape universities (`source='niche'`):

```bash
python backend/manage.py scrape_niche_universities --full-depth --max-sections 20
```

Useful flags:

- `--dry-run`
- `--limit N`
- `--only-id <id>` (repeatable)
- `--since-days N`
- `--headful`

If Niche shows anti-bot challenge, run with `--headful` and solve the challenge in the opened browser when prompted.

4. Reparse stored snapshots without network calls:

```bash
python backend/manage.py reparse_snapshots
```

5. Local HTML fallback (no live requests):

```bash
python backend/manage.py import_niche_html_dump --university-id 1 --html-dir ./tmp/niche_harvard
```

Expected file names in `html-dir`: `overview.html`, `admissions.html`, `cost.html`, etc.

## Session state

The scraper reads `NICHE_SESSION_STATE_PATH` from environment.
Default path: `backend/.secrets/niche_session.json`.

Persistent browser profile path is read from `NICHE_PROFILE_DIR`.
Default path: `backend/.secrets/playwright-profile`.

## API additions

- `GET /api/universities/<id>/source-snapshot/`
- `GET /api/universities/<id>/metrics/`

`/api/universities/` now also returns:

- `last_scraped_at`
- `data_freshness_days`
- `net_price`
- `room_and_board`
- `housing_cost`

## Notes

- If anti-bot checks block headless scraping, run `--headful` and refresh session bootstrap.
- The scraper is fail-soft: partial section failures still produce a `partial` snapshot.

## Niche-first queue mode (1000+ scale)

Run Celery worker:

```bash
celery -A config worker -l info --concurrency=4
```

Enqueue jobs:

```bash
python backend/manage.py niche_enqueue_full_weekly --limit 1000
python backend/manage.py niche_enqueue_delta_daily --since-days 1
python backend/manage.py niche_enqueue_recovery_failed
```

If Redis is not running, add `--local` to execute tasks inline:

```bash
python backend/manage.py niche_enqueue_delta_daily --since-days 1 --local
```

Optional scheduler (APScheduler fallback):

```bash
python backend/manage.py run_niche_scheduler
```


## Position in ingestion strategy

Niche scraping is fallback/enrichment only.
Primary automated ingestion for scale (1000+ universities) is the licensed provider pipeline.
See `docs/INGESTION_AUTOMATION.md` for full/delta/backfill scheduling.
