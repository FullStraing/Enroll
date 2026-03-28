import { apiFetch } from "@/lib/api";

type GateProfile = {
  full_name?: string;
  country?: string;
  intended_major?: string;
  onboarding_completed?: boolean;
  common_app_profile?: {
    intro_quiz_answers?: {
      intakeYear?: string;
      schoolLevel?: string;
    };
  };
};

export function isProfileReadyForDashboard(profile: GateProfile | null | undefined) {
  if (!profile) return false;
  if (typeof profile.onboarding_completed === "boolean") {
    return profile.onboarding_completed;
  }

  const intro = profile.common_app_profile?.intro_quiz_answers;
  return Boolean(
    profile.full_name?.trim() &&
      profile.country?.trim() &&
      profile.intended_major?.trim() &&
      intro?.intakeYear?.trim() &&
      intro?.schoolLevel?.trim(),
  );
}

export async function resolvePostAuthDestination(access: string) {
  const profile = await apiFetch<GateProfile>("/api/auth/profile/", { method: "GET" }, access);
  return isProfileReadyForDashboard(profile) ? "/dashboard" : "/onboarding";
}

