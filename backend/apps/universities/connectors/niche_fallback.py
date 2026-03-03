from __future__ import annotations

from playwright.sync_api import BrowserContext

from apps.universities.services.niche_scraper import scrape_university


class NicheFallbackConnector:
    source_provider = "niche"

    def enrich_university(self, context: BrowserContext, university, max_sections: int = 8) -> dict:
        if not university.source_url:
            raise ValueError("University.source_url is required for niche fallback.")
        return scrape_university(
            context=context,
            root_url=university.source_url,
            full_depth=True,
            max_sections=max_sections,
        )
