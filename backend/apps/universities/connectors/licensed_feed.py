from __future__ import annotations

import json
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen

from .base import BaseUniversityConnector, ProviderUniversityRecord


class LicensedFeedConnector(BaseUniversityConnector):
    source_provider = "licensed"

    def __init__(self) -> None:
        self.mode = os.getenv("LICENSED_FEED_MODE", "mock").lower()
        self.mock_path = Path(
            os.getenv(
                "LICENSED_FEED_MOCK_PATH",
                "backend/apps/universities/fixtures/licensed_feed_mock.json",
            )
        )
        self.api_url = os.getenv("LICENSED_FEED_URL", "")
        self.api_token = os.getenv("LICENSED_FEED_TOKEN", "")

    def fetch_university_list(self) -> list[ProviderUniversityRecord]:
        if self.mode == "api":
            return self._fetch_from_api()
        return self._fetch_from_mock()

    def fetch_updates(self, since: datetime | None = None) -> list[ProviderUniversityRecord]:
        records = self.fetch_university_list()
        if since is None:
            return records
        return [record for record in records if not record.updated_at or record.updated_at >= since]

    def fetch_university_details(self, external_id: str) -> ProviderUniversityRecord | None:
        for record in self.fetch_university_list():
            if record.external_id == external_id:
                return record
        return None

    def _fetch_from_mock(self) -> list[ProviderUniversityRecord]:
        if not self.mock_path.exists():
            return []
        payload = json.loads(self.mock_path.read_text(encoding="utf-8"))
        records: list[ProviderUniversityRecord] = []
        for item in payload:
            records.append(self._to_record(item))
        return records

    def _fetch_from_api(self) -> list[ProviderUniversityRecord]:
        if not self.api_url:
            return []
        records: list[ProviderUniversityRecord] = []
        next_url = self.api_url
        while next_url:
            payload = None
            last_error = None
            for attempt in range(3):
                try:
                    request = Request(next_url, headers=self._headers())
                    with urlopen(request, timeout=40) as response:
                        payload = json.loads(response.read().decode("utf-8"))
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    time.sleep(2**attempt)
            if payload is None:
                raise RuntimeError(f"Licensed feed request failed for {next_url}: {last_error}") from last_error
            if isinstance(payload, list):
                items = payload
                next_url = ""
            else:
                items = payload.get("results", [])
                next_url = payload.get("next", "")
            records.extend(self._to_record(item) for item in items)
            if not next_url:
                break
        return records

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json", "User-Agent": "Enroll-Ingestion/1.0"}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
        return headers

    def _to_record(self, item: dict) -> ProviderUniversityRecord:
        updated_raw = item.get("updated_at")
        updated_at = None
        if updated_raw:
            try:
                updated_at = datetime.fromisoformat(updated_raw.replace("Z", "+00:00"))
            except ValueError:
                updated_at = None

        return ProviderUniversityRecord(
            external_id=str(item.get("external_id") or item.get("id") or item.get("slug") or item.get("name")),
            name=item.get("name", "").strip(),
            country=item.get("country", "USA"),
            city=item.get("city", ""),
            state=item.get("state", ""),
            website_url=item.get("website_url", ""),
            source_url=item.get("source_url", ""),
            updated_at=updated_at,
            raw_payload=item,
            metrics=item.get("metrics", {}),
            media=item.get("media", []),
            metadata=item.get("metadata", {}),
        )
