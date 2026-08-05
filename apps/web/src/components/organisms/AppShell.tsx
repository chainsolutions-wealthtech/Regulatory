import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children, active = "dashboard" }: { children: ReactNode; active?: "dashboard" | "projects" | "library" | "settings" }) {
  return <div className="app-shell"><AppSidebar active={active} /><main className="app-main">{children}</main></div>;
}
