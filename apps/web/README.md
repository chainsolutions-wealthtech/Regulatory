# Prospectus Composer Web

Application Next.js construite selon Atomic Design pour le questionnaire, les contrôles, l’aperçu et la génération d’un projet de prospectus OPCVM/FCP UMOA.

## Architecture Atomic Design

- `components/atoms` : boutons, badges, champs, icônes, progression.
- `components/molecules` : statistiques, lignes de navigation, questions, alertes.
- `components/organisms` : shell applicatif, navigation, wizard, résumé de contrôles, aperçu.
- `components/templates` : compositions de pages sans logique métier spécifique.
- `app` : routes Next.js App Router et Route Handlers.
- `domain` : types, catalogue de questions et logique de progression.
- `server` : persistance locale versionnée et adaptateur de génération.

## Commandes

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Limite

La persistance JSON est locale et réservée au prototype. Elle ne constitue ni une base de production, ni un mécanisme sécurisé de multi-tenant, ni un dispositif de soumission réglementaire.

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Génération documentaire

`POST /api/projects/{projectId}/generate` construit le snapshot canonique puis exécute `src/cli/generate-from-web-snapshot.js`. Le compositeur historique génère le modèle, le Markdown, la concordance, les contrôles et le DOCX déterministe.

Les artefacts sont enregistrés sous `.local-data/projects/{projectId}/generations/{generationId}/`. Cette persistance est locale et ne constitue pas une architecture de production.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->
