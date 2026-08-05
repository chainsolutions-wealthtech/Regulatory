import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";

export default function SettingsPage() {
  return <AppShell active="settings"><AppHeader title="Paramètres" description="Configuration locale du prototype et des packs réglementaires." /><section className="content-section content-section--standalone"><div className="empty-state"><h2>Prototype local uniquement</h2><p>Aucune authentification, aucun multi-tenant et aucun déploiement de production ne sont activés.</p></div></section></AppShell>;
}
