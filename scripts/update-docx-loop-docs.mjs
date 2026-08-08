import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = path.join(repoRoot, "examples", "generated", "united-capital-diamond");
const docx = await readJson(path.join(generatedRoot, "docx-manifest.json"));
const render = await readJson(path.join(generatedRoot, "render-manifest.json"));

const summary = [
  `- DOCX : \`prospectus-draft.docx\` ;`,
  `- taille : \`${docx.docx_size_bytes}\` octets ;`,
  `- empreinte SHA-256 : \`${docx.docx_sha256}\` ;`,
  `- composants tracés : \`${docx.component_count}\` ;`,
  `- lignes de traçabilité : \`${docx.traceability_row_count}\` ;`,
  `- tableaux OOXML : \`${docx.table_count}\` ;`,
  `- pages rendues pour contrôle visuel : \`${render.page_count}\` ;`,
  `- statut : \`${docx.status}\` ;`,
  `- prêt pour soumission : \`${docx.ready_for_submission}\`.`,
].join("\n");

const blocks = {
  "README.md": `## 17. Export DOCX déterministe de pré-conformité — 2026-08-05

Le modèle documentaire intermédiaire produit désormais un fichier DOCX OOXML sans dépendance Python externe. Le document contient les titres, paragraphes, avertissements, tableaux, pied de page, état de pré-conformité et annexe technique de traçabilité.

${summary}

Le PDF et les images de pages générés dans la CI servent uniquement à l’inspection visuelle du DOCX. Ils ne constituent pas encore l’export PDF réglementaire déterministe du produit.`,

  "IMPLEMENTATION.md": `## Export DOCX V0.1

La commande \`npm run generate:docx\` exécute \`scripts/generate_docx.py\`. Elle génère un paquet OOXML déterministe à partir de \`document-model.json\` et de \`generation-manifest.json\`.

La commande \`npm run validate:docx\` vérifie les parties OOXML obligatoires, la validité XML, les avertissements réglementaires, la traçabilité et le maintien de \`ready_for_submission: false\`.

${summary}`,

  "STATUS.md": `## Mise à jour LOOP-DEV-001 — DOCX V0.1

${summary}

Le DOCX reste un document de pré-conformité. Les exigences \`PENDING_REVIEW\` et les validations humaines demeurent inchangées.`,

  "LOOP_STATE.md": `## État DOCX de LOOP-DEV-001

- générateur OOXML déterministe : \`IMPLEMENTED\` ;
- validateur structurel : \`IMPLEMENTED\` ;
- rendu LibreOffice de contrôle : \`IMPLEMENTED_IN_CI\` ;
- nombre de pages de contrôle : \`${render.page_count}\` ;
- soumission : \`FORBIDDEN\` ;
- prochaine tranche : API locale et questionnaire progressif.`,

  "CURRENT_ITERATION.md": `## Résultat de l’itération DOCX

${summary}

Le modèle documentaire est désormais consommable sous forme de fichier bureautique. La traçabilité reste incluse dans le document et dans \`docx-manifest.json\`. Le PDF de CI est seulement un support d’inspection visuelle.`,

  "WORK_LOG.md": `## 2026-08-05 — LOOP-DEV-001 — Export DOCX déterministe

1. Création du générateur OOXML standard-library-only.
2. Ajout des styles de couverture, titres, avertissements, listes et tableaux.
3. Ajout d’une annexe de traçabilité composant → exigences → clause → statut de revue.
4. Ajout du validateur structurel DOCX.
5. Ajout du rendu CI LibreOffice/PDF/PNG pour inspection visuelle.
6. Ajout de l’artefact de revue téléchargeable dans GitHub Actions.

${summary}

Aucune mention de conformité finale, d’agrément ou d’approbation n’a été ajoutée.`,

  "SUIVI.md": `## 2026-08-05 — Première génération DOCX déterministe

### Objectif

Transformer le modèle documentaire traçable en fichier DOCX de pré-conformité, sans perdre les identifiants, les exigences, les clauses ni les statuts de revue.

### Résultat

${summary}

### Contrôles

- paquet OOXML structurellement validé ;
- avertissements obligatoires présents ;
- soumission explicitement interdite ;
- rendu PDF/PNG produit pour inspection visuelle ;
- données sources et concordance inchangées.`,

  "TODO.md": `## Mise à jour opérationnelle — DOCX V0.1

- [x] Générer le DOCX depuis le modèle documentaire.
- [x] Conserver la traçabilité dans le DOCX.
- [x] Ajouter les styles, tableaux et avertissements.
- [x] Ajouter un validateur OOXML.
- [x] Produire un rendu PDF/PNG de contrôle dans la CI.
- [ ] Examiner visuellement toutes les pages et corriger les défauts détectés.
- [ ] Créer l’API locale du questionnaire dynamique.
- [ ] Créer la première interface web progressive.
- [ ] Ajouter la persistance versionnée des projets et réponses.
- [ ] Reprendre l’Instruction n°66/2021.`,

  "CHANGELOG.md": `## [Unreleased] — Export DOCX V0.1 — 2026-08-05

### Added

- générateur DOCX OOXML déterministe ;
- manifeste DOCX avec SHA-256 et métriques ;
- annexe de traçabilité ;
- validateur structurel ;
- rendu PDF/PNG de contrôle dans GitHub Actions ;
- artefact de revue de 14 jours.

### Security and compliance

Le DOCX affiche qu’il s’agit d’un document de pré-conformité non visé, non approuvé et non prêt pour soumission.`,

  "HANDOFF.md": `## Transmission DOCX V0.1

${summary}

Fichiers prioritaires :

- \`scripts/generate_docx.py\` ;
- \`scripts/validate_docx.py\` ;
- \`examples/generated/united-capital-diamond/prospectus-draft.docx\` ;
- \`examples/generated/united-capital-diamond/docx-manifest.json\` ;
- workflow \`.github/workflows/ci.yml\`.

Le rendu PDF/PNG est un outil de contrôle, non le moteur PDF final.`,
};

for (const [file, markdown] of Object.entries(blocks)) {
  await upsertBlock(file, "LOOP-DEV-001-DOCX", markdown);
}



console.log(JSON.stringify({
  updated_documents: Object.keys(blocks).length,
  docx_sha256: docx.docx_sha256,
  rendered_pages: render.page_count,
  next_action: "LOCAL_QUESTIONNAIRE_API",
}, null, 2));

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function upsertBlock(relativePath, id, markdown) {
  const filePath = path.join(repoRoot, relativePath);
  const start = `<!-- AUTO:${id}:START -->`;
  const end = `<!-- AUTO:${id}:END -->`;
  const block = `${start}\n${markdown.trim()}\n${end}`;
  let current = await readFile(filePath, "utf8");
  const expression = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  current = expression.test(current)
    ? current.replace(expression, block)
    : `${current.trimEnd()}\n\n${block}\n`;
  await writeFile(filePath, current, "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
