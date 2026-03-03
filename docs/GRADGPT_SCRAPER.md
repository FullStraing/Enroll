# GradGPT Scraper

Primary source: `https://www.gradgpt.com/common-data-set`.

## Run

```bash
python backend/manage.py scrape_gradgpt_universities --dry-run --limit 5
python backend/manage.py scrape_gradgpt_universities --limit 100
```

Optional flags:

- `--only-url https://www.gradgpt.com/common-data-set/harvard-university`
- `--index-url https://www.gradgpt.com/common-data-set`
- `--timeout 30`

## What is stored

- `UniversitySourceSnapshot` with full raw payload.
- `UniversitySourceSection` (`overview` section).
- `UniversityMetric` normalized metrics (admissions + costs + factors + diversity + ids-based values).
- `UniversityMediaRef` image metadata/urls.
- `ScrapeRun` and `ScrapeRunItem` execution logs.

## Standard profile per university (v1)

Each scraped university stores a `standard_profile` inside `raw_payload`:

- source/meta: provider, source_url, external_id, fetched_at, parser_version, raw_html_hash
- identity: name/location/ranking/type (from `cds_raw.university`)
- admissions: acceptance, GPA, SAT/ACT, undergrad counts (from `cds_raw.admissions`)
- important factors of admission: normalized list (`factor_name`, `importance_level`)
- costs: tuition, living expenses, books, transportation, personal expenses, totals
- campus diversity: `student_count` + `diversity_breakdown`
- completeness score: `data_completeness_score` (0..100)

The full original JSON block from page (`div.cds-raw`) is stored under `sections[].parsed_payload.cds_raw_json`.

## Quality gate + reason codes

A row is marked `success` only if all required blocks pass:

1. admissions core
2. costs core
3. important factors present
4. campus diversity present

If blocks are missing, status becomes `partial`/`failed` with reason codes:

- `MISSING_ADMISSIONS_CORE`
- `MISSING_COSTS_CORE`
- `MISSING_IMPORTANT_FACTORS`
- `MISSING_CAMPUS_DIVERSITY`

`ScrapeRunItem.error_text` includes reason codes and completeness score.

## Env

In `backend/.env`:

```env
GRADGPT_INDEX_URL=https://www.gradgpt.com/common-data-set
GRADGPT_REQUEST_TIMEOUT=30
```
