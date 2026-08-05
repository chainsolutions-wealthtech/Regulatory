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
