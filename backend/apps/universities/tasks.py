from __future__ import annotations

from celery import shared_task

from apps.universities.services.niche_automation import RetryableScrapeError, scrape_university_with_rotation


@shared_task(bind=True, autoretry_for=(RetryableScrapeError,), retry_backoff=True, retry_jitter=True, max_retries=3)
def scrape_niche_university_task(
    self,
    university_id: int,
    run_id: int,
    max_sections: int = 8,
    full_depth: bool = False,
    dry_run: bool = False,
):
    retry_index = int(self.request.retries or 0)
    return scrape_university_with_rotation(
        university_id=university_id,
        run_id=run_id,
        retry_index=retry_index,
        max_sections=max_sections,
        full_depth=full_depth,
        dry_run=dry_run,
    )
