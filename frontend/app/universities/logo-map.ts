const UNIVERSITY_LOGO_MAP: Record<string, string> = {
  "arizona-state-university": "/universities/logos/asu.png",
  "auburn-university": "/universities/logos/auburn.png",
  "boston-college": "/universities/logos/boston-college.png",
  "boston-university": "/universities/logos/boston-university.png",
  "brigham-young-university": "/universities/logos/byu.png",
  "brown-university": "/universities/logos/brown.png",
  "clemson-university": "/universities/logos/clemson.png",
  "princeton-university": "/universities/logos/princeton.png",
};

function slugifyUniversityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getUniversityLogoPath(name: string): string | null {
  return UNIVERSITY_LOGO_MAP[slugifyUniversityName(name)] ?? null;
}

export function getUniversityInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}
