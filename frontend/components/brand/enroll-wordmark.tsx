import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

type EnrollWordmarkProps = {
  size?: "sm" | "md" | "lg";
  subtitle?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "text-xl tracking-[-0.07em]",
  md: "text-[2rem] tracking-[-0.08em]",
  lg: "text-[2.3rem] tracking-[-0.09em]",
} as const;

export function EnrollWordmark({
  size = "md",
  subtitle = false,
  className = "",
}: EnrollWordmarkProps) {
  return (
    <div className={`${spaceGrotesk.className} leading-none text-[var(--enroll-fg)] ${className}`}>
      <div className={`font-black ${sizeMap[size]}`}>Enroll</div>
      {subtitle ? (
        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--enroll-muted)]">
          Admissions OS
        </div>
      ) : null}
    </div>
  );
}
