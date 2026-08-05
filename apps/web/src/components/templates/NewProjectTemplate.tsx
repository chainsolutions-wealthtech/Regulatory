import { AppHeader } from "@/components/organisms/AppHeader";
import { AppShell } from "@/components/organisms/AppShell";
import { NewProjectForm } from "@/components/organisms/NewProjectForm";

export function NewProjectTemplate() {
  return (
    <AppShell active="projects">
      <AppHeader title="Créer un projet de prospectus" description="Le système initialise le pack UMOA/FCP et prépare le parcours adapté." />
      <div className="narrow-page"><NewProjectForm /></div>
    </AppShell>
  );
}
