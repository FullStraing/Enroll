"use client";

import { useEffect } from "react";

let activeLocks = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";
let previousBodyPaddingRight = "";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const html = document.documentElement;

    if (activeLocks === 0) {
      previousBodyOverflow = body.style.overflow;
      previousHtmlOverflow = html.style.overflow;
      previousBodyPaddingRight = body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - html.clientWidth;
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        body.style.overflow = previousBodyOverflow;
        html.style.overflow = previousHtmlOverflow;
        body.style.paddingRight = previousBodyPaddingRight;
      }
    };
  }, [active]);
}
