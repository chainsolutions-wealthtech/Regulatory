import { LogoMark } from "@/components/atoms/LogoMark";
import { NavItem } from "@/components/molecules/NavItem";

export function AppSidebar({ active = "dashboard" }: { active?: "dashboard" | "projects" | "library" | "settings" }) {
  return (
    <aside className="sidebar">
      <div className="brand"><LogoMark /><div><strong>Regulatory</strong><span>Prospectus Composer</span></div></div>
      <nav className="sidebar__nav" aria-label="Navigation principale">
        <NavItem href="/" icon="dashboard" label="Tableau de bord" active={active === "dashboard"} />
        <NavItem href="/projects" icon="folder" label="Projets de prospectus" active={active === "projects"} />
        <NavItem href="/regulatory-library" icon="shield" label="Bibliothèque réglementaire" active={active === "library"} />
        <NavItem href="/settings" icon="settings" label="Paramètres" active={active === "settings"} />
      </nav>
      <div className="sidebar__footer">
        <div className="environment"><span className="environment__dot" /><div><strong>Prototype local</strong><span>Aucune soumission active</span></div></div>
      </div>
    </aside>
  );
}
