import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export type AppNavigationKey = "dashboard" | "operations" | "projects" | "reviews" | "library" | "library-admin" | "settings";

export function AppShell({
  children,
  active = "dashboard",
}: {
  children: ReactNode;
  active?: AppNavigationKey;
}) {
  return <div className="app-shell"><AppSidebar active={active} /><main className="app-main">{children}</main></div>;
}
