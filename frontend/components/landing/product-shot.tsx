import Image from "next/image";
import { landingTheme } from "@/app/landing-content";

type ProductShotProps = {
  label: string;
  title: string;
  rows: ReadonlyArray<{ label: string; value: string }>;
  imageSrc?: string | null;
  tone?: "cyan" | "orange" | "yellow";
};

const toneClassMap = {
  cyan: "bg-[var(--enroll-cyan)]",
  orange: "bg-[var(--enroll-orange)]",
  yellow: "bg-[var(--enroll-yellow-soft)]",
} as const;

export function ProductShot({
  label,
  title,
  rows,
  imageSrc,
  tone = "cyan",
}: ProductShotProps) {
  return (
    <div className="rounded-[28px] border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] p-4 shadow-[0_8px_0_var(--enroll-strong-shadow)]">
      <div className="rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-panel)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--enroll-muted)]">{label}</p>
            <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[var(--enroll-fg)]">{title}</p>
          </div>
          <span className={`rounded-full border border-[var(--enroll-surface-border)] px-3 py-1 text-xs font-semibold text-[var(--enroll-fg)] ${toneClassMap[tone]}`}>
            Enroll
          </span>
        </div>

        {imageSrc ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)]">
            <Image
              src={imageSrc}
              alt={title}
              width={1200}
              height={720}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-2 rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-3">
            {rows.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2"
              >
                <span className="text-sm font-semibold text-[var(--enroll-muted)]">{row.label}</span>
                <span
                  className="rounded-full border border-[var(--enroll-surface-border)] px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-fg)]"
                  style={{ backgroundColor: landingTheme.white }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
