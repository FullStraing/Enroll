"use client";

import { useEffect, useMemo, useState } from "react";
import { Hammer, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DeepWorkflowTheme } from "@/components/deep-workflow-theme";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivitiesFiltersPanel } from "@/components/activities/activities-filters";
import { OpportunityCard } from "@/components/activities/opportunity-card";
import { ACTIVITIES_PAGE_STORAGE_KEY, ACTIVITIES_SEED_DATA, DEFAULT_ACTIVITIES_FILTERS, MAX_PROFILE_ACTIVITIES } from "@/app/activities/constants";
import type { ActivitiesFilters } from "@/app/activities/types";
import { applyActivitiesFilters, buildProfileActivityPrefix, buildProfileActivityText, countUsefulForCis } from "@/app/activities/utils";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { clearSessionCaches, readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";

type ActivitiesProfile = {
  activities?: string[];
  common_app_profile?: {
    activity_recommendation_ids?: string[];
  };
};

type ActivitiesCachePayload = {
  profileActivities: string[];
  selectedActivityIds: string[];
};

export default function ActivitiesPage() {
  const [filters, setFilters] = useState<ActivitiesFilters>(DEFAULT_ACTIVITIES_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [loading, setLoading] = useState(true);
  const [profileActivities, setProfileActivities] = useState<string[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    const token = getToken();
    try {
      const raw = window.localStorage.getItem(ACTIVITIES_PAGE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ActivitiesFilters>;
      setFilters((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore invalid local state.
    } finally {
      if (!token) {
        window.setTimeout(() => setLoading(false), 280);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.setTimeout(() => setLoading(false), 280);
      return;
    }

    const run = async () => {
      const { payload: cached, isFresh } = readSessionCache<ActivitiesCachePayload>(
        SESSION_CACHE_KEYS.activities,
        SESSION_CACHE_TTLS.activities,
      );
      if (cached) {
        setProfileActivities(cached.profileActivities);
        setSelectedActivityIds(cached.selectedActivityIds);
        setLoading(false);
      }

      if (isFresh) {
        setStatusText("");
        return;
      }

      try {
        const profile = await apiFetch<ActivitiesProfile>("/api/auth/profile/", { method: "GET" }, token);
        const nextProfileActivities = Array.isArray(profile.activities) ? profile.activities.filter(Boolean) : [];
        const nextSelectedIds = Array.isArray(profile.common_app_profile?.activity_recommendation_ids) ? profile.common_app_profile.activity_recommendation_ids : [];
        setProfileActivities(nextProfileActivities);
        setSelectedActivityIds(nextSelectedIds);
        writeSessionCache(SESSION_CACHE_KEYS.activities, {
          profileActivities: nextProfileActivities,
          selectedActivityIds: nextSelectedIds,
        });
      } catch (error) {
        if (!cached) {
          setStatusText(error instanceof Error ? error.message : "Failed to load profile activity state.");
        }
      } finally {
        window.setTimeout(() => setLoading(false), 280);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (loading) return;
    writeSessionCache(SESSION_CACHE_KEYS.activities, {
      profileActivities,
      selectedActivityIds,
    });
  }, [loading, profileActivities, selectedActivityIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 220);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVITIES_PAGE_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);
  const filteredItems = useMemo(() => applyActivitiesFilters(ACTIVITIES_SEED_DATA, effectiveFilters), [effectiveFilters]);
  const usefulForCisCount = useMemo(() => countUsefulForCis(ACTIVITIES_SEED_DATA), []);

  async function handleToggleAdd(item: (typeof ACTIVITIES_SEED_DATA)[number]) {
    const token = getToken();
    if (!token) return;

    const activityText = buildProfileActivityText(item);
    const activityPrefix = buildProfileActivityPrefix(item);
    const isAdded = selectedActivityIds.includes(item.id);

    if (!isAdded && profileActivities.length >= MAX_PROFILE_ACTIVITIES) {
      setStatusText(`Your dashboard snapshot supports up to ${MAX_PROFILE_ACTIVITIES} activities. Remove one in Edit profile first.`);
      return;
    }

    const nextActivityIds = isAdded
      ? selectedActivityIds.filter((id) => id !== item.id)
      : [...selectedActivityIds, item.id];

    const nextActivities = isAdded
      ? profileActivities.filter((entry) => !entry.startsWith(activityPrefix))
      : [...profileActivities, activityText];

    setSyncingId(item.id);
    try {
      const updatedProfile = await apiFetch<ActivitiesProfile>(
        "/api/auth/profile/",
        {
          method: "PATCH",
          body: JSON.stringify({
            activities: nextActivities,
            common_app_profile: {
              activity_recommendation_ids: nextActivityIds,
            },
          }),
        },
        token,
      );

      setProfileActivities(Array.isArray(updatedProfile.activities) ? updatedProfile.activities.filter(Boolean) : nextActivities);
      setSelectedActivityIds(
        Array.isArray(updatedProfile.common_app_profile?.activity_recommendation_ids)
          ? updatedProfile.common_app_profile.activity_recommendation_ids
          : nextActivityIds,
      );
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard, SESSION_CACHE_KEYS.settings, SESSION_CACHE_KEYS.onboarding]);
      setStatusText(isAdded ? "Activity removed from profile." : "Activity added to profile.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to update profile activities.");
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <ProtectedPage>
      <AppShell
        title="Activities"
        subtitle="Useful extracurricular opportunities that can realistically strengthen a student profile for CA, CIS, and international admissions paths."
      >
        <DeepWorkflowTheme>
          <div className="theme-workflow space-y-5">
          <Card className="border-2 border-black bg-[#FFF4CC] shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hammer className="h-4 w-4" />
                  Page in progress
                </CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-black/70">
                  This is a curated MVP. We will keep expanding it with more verified opportunities, deadlines, eligibility details, and better coverage for CA/CIS students.
                </CardDescription>
              </div>
              <span className="rounded-full border border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-black/70">
                MVP
              </span>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
            <div className="space-y-5">
              <ActivitiesFiltersPanel
                filters={filters}
                resultsCount={filteredItems.length}
                onChange={setFilters}
                onReset={() => window.localStorage.removeItem(ACTIVITIES_PAGE_STORAGE_KEY)}
              />

              <Card className="shadow-none">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-4 w-4" />
                  What we count as useful
                </CardTitle>
                <CardDescription className="mt-2">
                  Not just pretty programs. We prioritize opportunities that create real admissions signal: leadership, competition, research, service, and project ownership.
                </CardDescription>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-black/10 bg-[#DAF5F0] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">CA / CIS fit</p>
                    <p className="mt-2 text-2xl font-black text-black">{usefulForCisCount}</p>
                    <p className="mt-1 text-sm text-black/65">
                      Out of {ACTIVITIES_SEED_DATA.length} starter records, these are already marked as more practical for CA and CIS students.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#FFF4CC] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Source rule</p>
                    <p className="mt-2 text-sm text-black/70">
                      We always keep the official source visible. If eligibility, cost, or access is unclear, we do not invent details.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="shadow-none">
                <CardTitle className="text-lg">Saved to profile</CardTitle>
                <CardDescription className="mt-2">
                  Activities added here appear in your Dashboard snapshot and inside Edit profile.
                </CardDescription>
                <div className="mt-4 rounded-2xl border border-black/10 bg-[#F5F8FC] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Selected now</p>
                  <p className="mt-2 text-2xl font-black text-black">
                    {profileActivities.length} / {MAX_PROFILE_ACTIVITIES}
                  </p>
                  <p className="mt-1 text-sm text-black/65">Use this page to add curated activities directly into your profile.</p>
                </div>
              </Card>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Curated now</p>
                      <p className="mt-2 text-3xl font-black text-black">{ACTIVITIES_SEED_DATA.length}</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-black/45" />
                  </div>
                </Card>
                <Card className="shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Visible after filters</p>
                      <p className="mt-2 text-3xl font-black text-black">{filteredItems.length}</p>
                    </div>
                    <Target className="h-5 w-5 text-black/45" />
                  </div>
                </Card>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-64 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                </div>
              ) : filteredItems.length ? (
                <div className="grid gap-4">
                  {filteredItems.map((item) => (
                    <OpportunityCard
                      key={item.id}
                      item={item}
                      isAdded={selectedActivityIds.includes(item.id)}
                      syncing={syncingId === item.id}
                      onToggleAdd={handleToggleAdd}
                    />
                  ))}
                </div>
              ) : (
                <Card className="shadow-none">
                  <CardTitle className="text-lg">No matches found</CardTitle>
                  <CardDescription className="mt-2">
                    Your current filters are too strict. Relax CA/CIS fit, international eligibility, or category to see more opportunities.
                  </CardDescription>
                </Card>
              )}

              {statusText ? (
                <div className="rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-black/70">{statusText}</div>
              ) : null}
            </div>
          </div>
          </div>
        </DeepWorkflowTheme>
      </AppShell>
    </ProtectedPage>
  );
}
