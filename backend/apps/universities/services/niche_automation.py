from __future__ import annotations

import hashlib
import os
import random
import time
from dataclasses import dataclass
from pathlib import Path

from django.db import transaction
from django.utils import timezone
from playwright.sync_api import sync_playwright

from apps.universities.models import ScrapeRun, ScrapeRunItem, University
from apps.universities.services.ingestion import evaluate_quality
from apps.universities.services.niche_persistence import persist_university_scrape_result
from apps.universities.services.niche_scraper import PARSER_VERSION, scrape_university


class RetryableScrapeError(RuntimeError):
    pass


@dataclass
class AutomationConfig:
    profile_root: Path
    profile_names: list[str]
    proxies: list[str]
    channel: str
    headless: bool
    min_delay_sec: float
    max_delay_sec: float
    max_sections: int


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def load_automation_config(max_sections: int | None = None) -> AutomationConfig:
    profile_root = Path(os.getenv("NICHE_PROFILE_ROOT", "backend/.secrets/profiles"))
    profile_names = _split_csv(os.getenv("NICHE_AUTOMATION_PROFILES", "profile_a"))
    proxies = _split_csv(os.getenv("NICHE_PROXY_POOL", ""))
    channel = os.getenv("NICHE_BROWSER_CHANNEL", "chrome")
    headless = os.getenv("NICHE_HEADLESS", "0") == "1"
    min_delay = float(os.getenv("NICHE_MIN_DELAY_SEC", "1.8"))
    max_delay = float(os.getenv("NICHE_MAX_DELAY_SEC", "3.8"))
    default_sections = int(os.getenv("NICHE_DEFAULT_MAX_SECTIONS", "8"))
    profile_root.mkdir(parents=True, exist_ok=True)
    for name in profile_names:
        (profile_root / name).mkdir(parents=True, exist_ok=True)
    return AutomationConfig(
        profile_root=profile_root,
        profile_names=profile_names,
        proxies=proxies,
        channel=channel,
        headless=headless,
        min_delay_sec=min_delay,
        max_delay_sec=max_delay,
        max_sections=max_sections or default_sections,
    )


def _select_profile_and_proxy(config: AutomationConfig, university_id: int, retry_index: int):
    profile = config.profile_names[(university_id + retry_index) % len(config.profile_names)]
    proxy = ""
    if config.proxies:
        proxy = config.proxies[(university_id + retry_index) % len(config.proxies)]
    return profile, proxy


def _update_run_counters(run_id: int, status: str, error: str = "") -> None:
    with transaction.atomic():
        run = ScrapeRun.objects.select_for_update().get(id=run_id)
        if status in {"success", "partial"}:
            run.targets_ok += 1
        else:
            run.targets_failed += 1
        if error:
            tail = f"\n{error}" if run.error_summary else error
            run.error_summary = (run.error_summary + tail)[-8000:]
        if run.targets_ok + run.targets_failed >= run.targets_total:
            run.finished_at = timezone.now()
            if run.targets_failed == 0 and not run.error_summary:
                run.status = "success"
            elif run.targets_ok > 0:
                run.status = "partial"
            else:
                run.status = "failed"
        run.save()


def scrape_university_with_rotation(
    university_id: int,
    run_id: int,
    retry_index: int = 0,
    max_sections: int | None = None,
    full_depth: bool = False,
    dry_run: bool = False,
):
    university = University.objects.get(id=university_id)
    if not university.source_url:
        raise RetryableScrapeError(f"University {university_id} has empty source_url.")

    config = load_automation_config(max_sections=max_sections)
    profile_name, proxy_url = _select_profile_and_proxy(config, university_id, retry_index)
    profile_dir = config.profile_root / profile_name
    profile_dir.mkdir(parents=True, exist_ok=True)

    launch_kwargs = {
        "user_data_dir": str(profile_dir),
        "headless": config.headless,
        "args": ["--disable-blink-features=AutomationControlled"],
    }
    if config.channel:
        launch_kwargs["channel"] = config.channel
    if proxy_url:
        launch_kwargs["proxy"] = {"server": proxy_url}

    started = time.time()
    status = "failed"
    payload = {}
    error_text = ""
    result = None

    try:
        with sync_playwright() as playwright:
            try:
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            except Exception:
                launch_kwargs.pop("channel", None)
                context = playwright.chromium.launch_persistent_context(**launch_kwargs)
            result = scrape_university(
                context=context,
                root_url=university.source_url,
                full_depth=full_depth,
                max_sections=config.max_sections,
            )
            context.close()

        payload = result["raw_payload"]
        gate = evaluate_quality(result.get("metrics", []))
        if gate.status == "failed":
            result["status"] = "failed"
            if gate.reason:
                result.setdefault("errors", []).append(gate.reason)
        elif result["status"] == "success" and gate.status == "partial":
            result["status"] = "partial"
            if gate.reason:
                result.setdefault("errors", []).append(gate.reason)

        status = result["status"]
        error_text = "; ".join(result["errors"][:6]) if result.get("errors") else ""
        if status in {"success", "partial"} and not dry_run:
            persist_university_scrape_result(
                university=university,
                result=result,
                parser_version=f"{PARSER_VERSION}-auto",
                source="niche",
                root_url=university.source_url,
                mark_ingested=True,
            )
    except Exception as exc:  # noqa: BLE001
        error_text = str(exc)
        status = "failed"
        if "challenge_detected" in error_text.lower():
            raise RetryableScrapeError(error_text) from exc
        raise
    finally:
        duration_ms = int((time.time() - started) * 1000)
        ScrapeRunItem.objects.create(
            run_id=run_id,
            university=university,
            source_url=university.source_url,
            status=status,
            retries=retry_index,
            duration_ms=duration_ms,
            parsed_payload=payload,
            error_text=error_text,
        )
        _update_run_counters(run_id, status, error_text if status == "failed" else "")
        time.sleep(random.uniform(config.min_delay_sec, config.max_delay_sec))


def enqueue_run(name: str, university_ids: list[int]) -> ScrapeRun:
    fingerprint = hashlib.sha1(",".join(str(x) for x in university_ids).encode("utf-8")).hexdigest()[:8]
    run = ScrapeRun.objects.create(
        source="niche",
        status="success",
        targets_total=len(university_ids),
        error_summary=f"queue={name}:{fingerprint}",
    )
    return run
