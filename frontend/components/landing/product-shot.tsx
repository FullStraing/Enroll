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
  cyan: "bg-[#DAF5F0]",
  orange: "bg-[#F8D6B3]",
  yellow: "bg-[#FFF4CC]",
} as const;

export function ProductShot({
  label,
  title,
  rows,
  imageSrc,
  tone = "cyan",
}: ProductShotProps) {
  return (
    <div className="rounded-[28px] border-2 border-black bg-white p-4 shadow-[0_8px_0_#000]">
      <div className="rounded-[22px] border border-black/10 bg-[#F5F8FC] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45">{label}</p>
            <p className="mt-1 text-lg font-black tracking-[-0.03em] text-black">{title}</p>
          </div>
          <span className={`rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/65 ${toneClassMap[tone]}`}>
            Enroll
          </span>
        </div>

        {imageSrc ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
            <Image
              src={imageSrc}
              alt={title}
              width={1200}
              height={720}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-2 rounded-2xl border border-black/10 bg-white p-3">
            {rows.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2"
              >
                <span className="text-sm font-semibold text-black/70">{row.label}</span>
                <span
                  className="rounded-full border border-black/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em]"
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
