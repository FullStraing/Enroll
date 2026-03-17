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
  const stopWords = new Set(["of", "the", "and", "at", "for"]);
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean);
  const preferredWords = words.filter((word) => !stopWords.has(word.toLowerCase()));
  const sourceWords = preferredWords.length > 0 ? preferredWords : words;

  if (sourceWords.length === 0) return "U";
  if (sourceWords.length === 1) return sourceWords[0].slice(0, 2).toUpperCase();

  return `${sourceWords[0][0] ?? ""}${sourceWords[1][0] ?? ""}`.toUpperCase();
}
