"use client";

import { useRef } from "react";
import Link from "next/link";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";
import messengerAnimation from "@/public/animations/messenger.json";
import instagramAnimation from "@/public/animations/instagram.json";

const SOCIALS = [
  {
    href: "https://t.me",
    label: "Telegram",
    sublabel: "Задавай вопросы и следи за обновлениями продукта.",
    animationData: messengerAnimation,
    toneClass: "bg-[#DAF5F0]",
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
    sublabel: "Смотри обновления продукта, советы и реальные истории студентов.",
    animationData: instagramAnimation,
    toneClass: "bg-[#FFF4CC]",
  },
] as const;

export function SocialLottieButtons() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SOCIALS.map((item) => <SocialLottieButton key={item.label} {...item} />)}
    </div>
  );
}

function SocialLottieButton({
  href,
  label,
  sublabel,
  animationData,
  toneClass,
}: (typeof SOCIALS)[number]) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  function playAnimation() {
    lottieRef.current?.goToAndPlay(0, true);
  }

  function resetAnimation() {
    lottieRef.current?.goToAndStop(0, true);
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={playAnimation}
      onMouseLeave={resetAnimation}
      onFocus={playAnimation}
      onBlur={resetAnimation}
      className="group flex items-center gap-4 rounded-[24px] border-2 border-black bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#000]"
    >
      <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] border-2 border-black ${toneClass}`}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          className="h-14 w-14 transition group-hover:scale-[1.04]"
        />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black tracking-[-0.03em] text-black">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-black/65">{sublabel}</p>
      </div>
    </Link>
  );
}
