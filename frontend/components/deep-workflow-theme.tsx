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
  return <div className={joinClasses("workflow-theme-scope", className)}>{children}</div>;
}
