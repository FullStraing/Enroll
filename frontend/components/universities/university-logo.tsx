"use client";

import Image from "next/image";
import { getUniversityInitials, getUniversityLogoPath } from "@/app/universities/logo-map";

type UniversityLogoProps = {
  name: string;
  size?: "sm" | "md";
};

const SIZE_STYLES = {
  sm: {
    container: "h-10 w-10 rounded-xl",
    image: 28,
    text: "text-sm",
  },
  md: {
    container: "h-14 w-14 rounded-2xl",
    image: 40,
    text: "text-base",
  },
} as const;

export function UniversityLogo({ name, size = "md" }: UniversityLogoProps) {
  const logoPath = getUniversityLogoPath(name);
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] ${sizeStyle.container}`}
      aria-hidden="true"
    >
      {logoPath ? (
        <Image
          src={logoPath}
          alt=""
          width={sizeStyle.image}
          height={sizeStyle.image}
          className="h-auto w-auto object-contain"
        />
      ) : (
        <span className={`font-black tracking-[-0.04em] text-[var(--enroll-fg)] ${sizeStyle.text}`}>
          {getUniversityInitials(name)}
        </span>
      )}
    </div>
  );
}

