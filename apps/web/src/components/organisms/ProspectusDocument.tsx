import { Badge } from "@/components/atoms/Badge";
import type { ProspectusPreviewSection } from "@/server/generation-adapter";

export function ProspectusDocument({ title, sections, generationId, readyForComplianceReview }: { title: string; sections: ProspectusPreviewSection[]; generationId: string; readyForComplianceReview: boolean }) {
  return (
    <article className="document-preview">
      <header className="document-preview__cover">
        <Badge tone="warning">Document de pré-conformité</Badge>
        <h1>{title}</h1>
        <p>Prospectus — projet généré automatiquement</p>
        <dl><div><dt>Génération</dt><dd>{generationId}</dd></div><div><dt>Revue conformité</dt><dd>{readyForComplianceReview ? "Prête" : "Non prête"}</dd></div><div><dt>Soumission</dt><dd>Interdite</dd></div></dl>
      </header>
      <div className="document-preview__warning">Cette version ne constitue ni un agrément, ni un visa, ni une approbation de l’AMF-UMOA.</div>
      {sections.map((section) => (
        <section className="document-preview__section" key={section.id}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={`${section.id}-${index}`}>{paragraph}</p>)}
        </section>
      ))}
    </article>
  );
}
