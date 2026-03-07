import { cookies } from "next/headers";
import Link from "next/link";

const palette = {
  bg: "#F9F5F6",
  black: "#000000",
  cyan: "#DAF5F0",
  orange: "#F8D6B3",
  white: "#FFFFFF",
  primary: "#FFDB58",
  yellowSoft: "#FDFD96",
};

const pains = [
  "10+ РґРµРґР»Р°Р№РЅРѕРІ РЅР° СЂР°Р·РЅС‹Рµ С‚РёРїС‹ РїРѕРґР°С‡Рё",
  "СЂР°Р·РЅС‹Рµ С‚СЂРµР±РѕРІР°РЅРёСЏ Сѓ РєР°Р¶РґРѕРіРѕ СѓРЅРёРІРµСЂСЃРёС‚РµС‚Р°",
  "СЌСЃСЃРµ, С„РѕСЂРјС‹ aid, РѕС†РµРЅРєРё, СЂРµРєРѕРјРµРЅРґР°С†РёРё",
  "РІРЅРµС€РЅРёРµ СЃРµСЂРІРёСЃС‹, РїРёСЃСЊРјР° Рё РґРѕРєСѓРјРµРЅС‚С‹ РІСЂР°Р·РЅРѕР±РѕР№",
];

const proof = [
  "100+ СѓРЅРёРІРµСЂСЃРёС‚РµС‚РѕРІ СѓР¶Рµ РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅС‹",
  "СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅРЅС‹Рµ РґРµРґР»Р°Р№РЅС‹ Рё С‚СЂРµР±РѕРІР°РЅРёСЏ",
  "РїСЂРѕРґСѓРєС‚ СЃРґРµР»Р°РЅ РґР»СЏ РјРµР¶РґСѓРЅР°СЂРѕРґРЅС‹С… СЃС‚СѓРґРµРЅС‚РѕРІ",
];

const objections = [
  "Р­С‚Рѕ РЅРµ Р°РіРµРЅС‚СЃС‚РІРѕ",
  "Р­С‚Рѕ РЅРµ РіР°СЂР°РЅС‚РёСЏ РїРѕСЃС‚СѓРїР»РµРЅРёСЏ",
  "Р­С‚Рѕ РЅРµ СЃР»СѓС‡Р°Р№РЅС‹Р№ С‡РµРєР»РёСЃС‚",
  "Р­С‚Рѕ С‡РµС‚РєР°СЏ СЃРёСЃС‚РµРјР° РґРµР№СЃС‚РІРёР№",
];

export default function LandingPage() {
  const token = cookies().get("enroll_token")?.value;
  const introQuizDone = cookies().get("enroll_intro_quiz_done")?.value === "1";
  const primaryHref = token || introQuizDone ? "/dashboard" : "/intro-quiz";

  return (
    <main
      className="min-h-screen px-4 py-6 md:px-8"
      style={{
        backgroundColor: palette.bg,
        color: palette.black,
        backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
      }}
    >
      <div className="blob blob-cyan" />
      <div className="blob blob-orange" />

      <div className="relative mx-auto max-w-6xl rounded-[28px] border-2 border-black bg-white/85 shadow-[0_10px_0_#000]">
        <header className="fade-up flex flex-wrap items-center justify-between gap-4 border-b-2 border-black px-5 py-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/icons/logo.svg" alt="Enroll AI" className="h-10 w-10 rounded-lg border-2 border-black bg-white p-1" />
            <span className="text-2xl font-black tracking-tight">Enroll AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
              Р’РѕР№С‚Рё
            </Link>
            <Link
              href={primaryHref}
              className="rounded-xl border-2 border-black px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_#000]"
              style={{ backgroundColor: palette.primary }}
            >
              РќР°С‡Р°С‚СЊ
            </Link>
          </div>
        </header>

        <section className="grid gap-7 px-5 py-12 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-16">
          <div className="fade-up">
            <span
              className="inline-flex rounded-md border-2 border-black px-4 py-1 text-xs font-black uppercase tracking-wide"
              style={{ backgroundColor: palette.orange }}
            >
              РЎРёСЃС‚РµРјР° РїРѕСЃС‚СѓРїР»РµРЅРёСЏ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[0.95] md:text-7xl">РџРѕСЃС‚СѓРїР»РµРЅРёРµ РІ РЎРЁРђ РЅРµ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ С…Р°РѕСЃРѕРј.</h1>
            <p className="mt-5 max-w-xl text-base text-black/70 md:text-xl">
              Р”РµРґР»Р°Р№РЅС‹, РґРѕРєСѓРјРµРЅС‚С‹ Рё С‚СЂРµР±РѕРІР°РЅРёСЏ вЂ” РІ РѕРґРЅРѕР№ РїРѕРЅСЏС‚РЅРѕР№ СЃРёСЃС‚РµРјРµ. РўС‹ РІСЃРµРіРґР° Р·РЅР°РµС€СЊ, С‡С‚Рѕ РґРµР»Р°С‚СЊ РґР°Р»СЊС€Рµ.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="rounded-xl border-2 border-black px-8 py-3 text-lg font-black transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#000]"
                style={{ backgroundColor: palette.primary }}
              >
                РќР°С‡Р°С‚СЊ
              </Link>
              <Link
                href="/pilot"
                className="rounded-xl border-2 border-black px-8 py-3 text-lg font-bold transition hover:-translate-y-0.5"
                style={{ backgroundColor: palette.cyan }}
              >
                РџРёР»РѕС‚
              </Link>
            </div>
          </div>

          <div className="fade-up delay-2 rounded-2xl border-2 border-black bg-white p-4 shadow-[0_8px_0_#000]">
            <p className="text-sm font-black uppercase">РџСЂРёРјРµСЂ СЂР°Р±РѕС‡РµРіРѕ СЌРєСЂР°РЅР°</p>
            <div className="mt-3 grid gap-2">
              <div className="rounded-lg border-2 border-black p-3" style={{ backgroundColor: palette.cyan }}>
                <p className="text-xs font-black">Р”РµРґР»Р°Р№РЅС‹</p>
                <p className="mt-1 text-sm">RD: Jan 5 В· EA: Nov 1 В· ED: Nov 15</p>
              </div>
              <div className="rounded-lg border-2 border-black p-3" style={{ backgroundColor: palette.orange }}>
                <p className="text-xs font-black">Р—Р°РґР°С‡Рё РЅР° РЅРµРґРµР»СЋ</p>
                <p className="mt-1 text-sm">Р­СЃСЃРµ В· СЂРµРєРѕРјРµРЅРґР°С†РёРё В· financial forms</p>
              </div>
              <div className="rounded-lg border-2 border-black p-3" style={{ backgroundColor: palette.yellowSoft }}>
                <p className="text-xs font-black">Р”РѕРєСѓРјРµРЅС‚С‹</p>
                <p className="mt-1 text-sm">Р’РµСЂСЃРёРё СЌСЃСЃРµ Рё С‡РµРєР»РёСЃС‚ С‚СЂРµР±РѕРІР°РЅРёР№</p>
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up border-t-2 border-black px-5 py-8 md:px-8">
          <div className="rounded-2xl border-2 border-black p-6 shadow-[0_6px_0_#000]" style={{ backgroundColor: palette.orange }}>
            <h2 className="text-2xl font-black uppercase">Р“РґРµ СЃС‚СѓРґРµРЅС‚С‹ С‚РµСЂСЏСЋС‚СЃСЏ</h2>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {pains.map((item) => (
                <li key={item} className="rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-semibold">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-lg font-bold">Р‘РѕР»СЊС€РёРЅСЃС‚РІРѕ РЅРµ РїСЂРѕРІР°Р»РёРІР°СЋС‚СЃСЏ РёР·-Р·Р° Р·РЅР°РЅРёР№. РџСЂРѕРІР°Р»РёРІР°СЋС‚СЃСЏ, РїРѕС‚РѕРјСѓ С‡С‚Рѕ С‡С‚Рѕ-С‚Рѕ СѓРїСѓСЃРєР°СЋС‚.</p>
          </div>
        </section>

        <section className="fade-up delay-2 border-t-2 border-black px-5 py-8 md:px-8">
          <h2 className="text-3xl font-black uppercase">Р§С‚Рѕ РµСЃР»Рё СЃРёСЃС‚РµРјР° СЃР°РјР° РІРµРґРµС‚ С‚РµР±СЏ РїРѕ С€Р°РіР°Рј?</h2>
          <p className="mt-2 text-black/70">Dashboard РїРѕРєР°Р·С‹РІР°РµС‚, С‡С‚Рѕ РґРµР»Р°С‚СЊ РґР°Р»СЊС€Рµ РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ: РґРµРґР»Р°Р№РЅС‹, Р·Р°РґР°С‡Рё, РґРѕРєСѓРјРµРЅС‚С‹, СЃС‚Р°С‚СѓСЃ.</p>
          <div className="mt-4 rounded-2xl border-2 border-black p-4 shadow-[0_5px_0_#000]" style={{ backgroundColor: palette.cyan }}>
            <p className="text-sm font-bold">Enroll AI вЂ” СЌС‚Рѕ С†РёС„СЂРѕРІРѕР№ РјРµРЅС‚РѕСЂ РїРѕ РїРѕСЃС‚СѓРїР»РµРЅРёСЋ, Р° РЅРµ РїСЂРѕСЃС‚Рѕ Р±Р°Р·Р° РІСѓР·РѕРІ.</p>
          </div>
        </section>

        <section className="fade-up border-t-2 border-black px-5 py-8 md:px-8">
          <h2 className="text-2xl font-black uppercase">РџРѕС‡РµРјСѓ РЅР°Рј РґРѕРІРµСЂСЏСЋС‚ СѓР¶Рµ РЅР° СЃС‚Р°СЂС‚Рµ</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {proof.map((item) => (
              <div key={item} className="rounded-xl border-2 border-black bg-white p-4 text-sm font-semibold transition hover:-translate-y-0.5">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="fade-up delay-2 border-t-2 border-black px-5 py-8 md:px-8">
          <h2 className="text-2xl font-black uppercase">Р§С‚Рѕ СЌС‚Рѕ Рё С‡С‚Рѕ СЌС‚Рѕ РЅРµ С‚Р°Рє</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {objections.map((item, idx) => (
              <div
                key={item}
                className="rounded-xl border-2 border-black p-4 text-sm font-bold transition hover:-translate-y-0.5"
                style={{ backgroundColor: idx % 2 === 0 ? palette.white : palette.cyan }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="fade-up border-t-2 border-black px-5 py-10 text-center md:px-8">
          <h2 className="text-3xl font-black uppercase">Р’С‹Р±РµСЂРё СѓРЅРёРІРµСЂСЃРёС‚РµС‚С‹ Рё РЅР°С‡РЅРё РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-xl border-2 border-black px-8 py-3 text-lg font-black transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#000]"
              style={{ backgroundColor: palette.primary }}
            >
              РќР°С‡Р°С‚СЊ
            </Link>
            <Link href="/pilot" className="rounded-xl border-2 border-black bg-white px-8 py-3 text-lg font-bold transition hover:-translate-y-0.5">
              Р—Р°РїРёСЃР°С‚СЊСЃСЏ РІ РїРёР»РѕС‚
            </Link>
          </div>
          <p className="mt-4 text-sm text-black/60">РќРµ РіР°СЂР°РЅС‚РёСЏ РїРѕСЃС‚СѓРїР»РµРЅРёСЏ. Р РµС€РµРЅРёРµ РїСЂРёРЅРёРјР°РµС‚ СѓРЅРёРІРµСЂСЃРёС‚РµС‚.</p>
          <div className="mt-3">
            <Link href="/privacy-policy" className="text-sm font-semibold underline underline-offset-2">
              Privacy Policy
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        .blob {
          position: fixed;
          z-index: 0;
          width: 280px;
          height: 280px;
          border-radius: 9999px;
          filter: blur(55px);
          opacity: 0.45;
          animation: floaty 7s ease-in-out infinite;
          pointer-events: none;
        }
        .blob-cyan {
          top: 12%;
          left: -40px;
          background: ${palette.cyan};
        }
        .blob-orange {
          bottom: 5%;
          right: -60px;
          background: ${palette.orange};
          animation-delay: 1.4s;
        }
        .fade-up {
          animation: fadeUp 0.7s ease-out both;
        }
        .delay-2 {
          animation-delay: 0.2s;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floaty {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-14px) scale(1.04);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}


