from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ProviderUniversityRecord:
    external_id: str
    name: str
    country: str = "USA"
    city: str = ""
    state: str = ""
    website_url: str = ""
    source_url: str = ""
    updated_at: datetime | None = None
    raw_payload: dict[str, Any] = field(default_factory=dict)
    metrics: dict[str, Any] = field(default_factory=dict)
    media: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseUniversityConnector:
    source_provider = "other"

    def fetch_university_list(self) -> list[ProviderUniversityRecord]:
        raise NotImplementedError

    def fetch_updates(self, since: datetime | None = None) -> list[ProviderUniversityRecord]:
        raise NotImplementedError

    def fetch_university_details(self, external_id: str) -> ProviderUniversityRecord | None:
        raise NotImplementedError
