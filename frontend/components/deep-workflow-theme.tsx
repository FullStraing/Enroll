"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function DeepWorkflowTheme({ children, className }: Props) {
  return (
    <div className={joinClasses("workflow-theme-scope", className)}>
      {children}
      <style>{`
        html.dark .workflow-theme-scope {
          color: var(--enroll-fg);
        }

        html.dark .workflow-theme-scope .surface-card,
        html.dark .workflow-theme-scope .surface-panel,
        html.dark .workflow-theme-scope .surface-inset,
        html.dark .workflow-theme-scope [class*="bg-white"] {
          background-color: var(--enroll-surface-elevated) !important;
        }

        html.dark .workflow-theme-scope [class*="bg-white/"] {
          background-color: color-mix(in srgb, var(--enroll-surface-elevated) 86%, transparent) !important;
        }

        html.dark .workflow-theme-scope [class*="bg-black/"] {
          background-color: color-mix(in srgb, var(--enroll-fg) 7%, transparent) !important;
        }

        html.dark .workflow-theme-scope [class*="text-black"] {
          color: var(--enroll-fg) !important;
        }

        html.dark .workflow-theme-scope [class*="text-black/"] {
          color: var(--enroll-muted) !important;
        }

        html.dark .workflow-theme-scope [class*="border-black"] {
          border-color: var(--enroll-surface-border-strong) !important;
        }

        html.dark .workflow-theme-scope [class*="border-black/"] {
          border-color: var(--enroll-surface-border) !important;
        }

        html.dark .workflow-theme-scope input,
        html.dark .workflow-theme-scope textarea,
        html.dark .workflow-theme-scope select {
          background-color: var(--enroll-surface-elevated) !important;
          color: var(--enroll-fg) !important;
          border-color: var(--enroll-surface-border) !important;
        }

        html.dark .workflow-theme-scope input::placeholder,
        html.dark .workflow-theme-scope textarea::placeholder {
          color: var(--enroll-muted) !important;
        }

        html.dark .workflow-theme-scope [class*="bg-[#DAF5F0]"] {
          background-color: color-mix(in srgb, var(--enroll-cyan) 20%, var(--enroll-surface-elevated)) !important;
        }

        html.dark .workflow-theme-scope [class*="bg-[#FFF9E8]"],
        html.dark .workflow-theme-scope [class*="bg-[#FFF4CC]"],
        html.dark .workflow-theme-scope [class*="bg-[#FFDB58]"],
        html.dark .workflow-theme-scope [class*="bg-[#F5F8FC]"],
        html.dark .workflow-theme-scope [class*="bg-[#E8F4CF]"],
        html.dark .workflow-theme-scope [class*="bg-[#F8F9FA]"] {
          background-color: color-mix(in srgb, var(--enroll-yellow-soft) 12%, var(--enroll-surface-elevated)) !important;
        }

        html.dark .workflow-theme-scope .bg-gradient-to-br {
          background-image: linear-gradient(135deg, var(--enroll-surface-elevated), color-mix(in srgb, var(--enroll-cyan) 10%, var(--enroll-surface-elevated))) !important;
        }
      `}</style>
    </div>
  );
}
