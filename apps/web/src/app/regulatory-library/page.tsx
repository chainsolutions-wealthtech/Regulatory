import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";

export default function RegulatoryLibraryPage() {
  return <AppShell active="library"><AppHeader title="Bibliothèque réglementaire" description="Sources, exigences, clauses, versions et analyses d’impact." /><section className="content-section content-section--standalone"><div className="empty-state"><h2>Module préparé</h2><p>La bibliothèque sera alimentée par le registre AMF-UMOA, la Circulaire 05, l’Instruction 66 et les textes complémentaires.</p></div></section></AppShell>;
}
