# SOURCE_OF_TRUTH — Hiérarchie d’autorité

> **Statut :** `APPLICABLE`  
> **Propriétaire :** propriétaire du dépôt et rôles compétents à définir.

## Principes

1. Les textes réglementaires officiels, versionnés et vérifiables sont la source normative.
2. Les prospectus existants sont des cas d’étude et de test, jamais des sources normatives.
3. Les décisions validées sont conservées dans `docs/DECISIONS.md` et `docs/adr/`.
4. L’architecture canonique actuelle est `docs/ARCHITECTURE.md`.
5. La spécification fonctionnelle canonique actuelle est `docs/PROSPECTUS_ENGINE_SPEC.md`.
6. Le mapping réglementaire est décrit dans `docs/REGULATORY_MAPPING.md` et les artefacts sous `regulatory/`.
7. `SUIVI.md` est l’historique chronologique canonique.
8. `STATUS.md` est la photographie de l’état courant.
9. `TODO.md` est le registre opérationnel principal du travail restant.
10. Les YAML, CSV, JSON et schémas sont les sources machine-readable.
11. `GOVERNANCE.md` est l’adaptateur transversal de gouvernance et renvoie vers les règles canoniques existantes ; il ne les remplace pas.
12. Les conversations ne constituent jamais la mémoire canonique du projet.

## Matrice d’autorité

| Domaine | Source canonique | Adaptateurs ou vues |
|---|---|---|
| Gouvernance | `AGENTS.md`, `docs/01-governance/PROJECT_RULES.md`, décisions de gouvernance dans `docs/adr/` | `GOVERNANCE.md`, `00_START_HERE.md` |
| Vision et périmètre | `README.md`, `SCOPE.md`, `PROJECT_CONTEXT.md` | `PROJECT_BRIEF.md`, `PROJECT_CHARTER.md` |
| Règles des agents | `AGENTS.md` | `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` |
| Décisions | `docs/DECISIONS.md`, `docs/adr/` | `DECISIONS.md` |
| Architecture | `docs/ARCHITECTURE.md` | `docs/03-architecture/ARCHITECTURE.md` |
| Spécification | `docs/PROSPECTUS_ENGINE_SPEC.md` | documents spécialisés |
| Réglementation | sources officielles et `regulatory/` | `docs/REGULATORY_MAPPING.md` |
| Historique | `SUIVI.md`, Git | `WORK_LOG.md`, `docs/09-loop/ITERATION_LOG.md` |
| État courant | `STATUS.md` | `HANDOFF.md`, `LOOP_STATE.md` |
| Travail restant | `TODO.md` | `BACKLOG.md`, `ROADMAP.md`, `NEXT_ACTION.md` |

## Règle documentaire

Un document n’est jamais déclaré redondant sur son seul nom ou sujet. Avant fusion, déplacement, dépréciation ou suppression, lire son contenu, vérifier son rôle, son historique, ses références et l’information unique qu’il conserve. L’intégration doit préserver la connaissance et la traçabilité.

## Résolution des contradictions

Appliquer la règle la plus restrictive, interrompre toute action irréversible, enregistrer la contradiction dans `OPEN_QUESTIONS.md` et créer une ADR lorsqu’elle est structurante. Ne jamais trancher silencieusement.

Une photographie historique reste vraie pour sa date même si l’état courant a évolué. Ne pas réécrire l’histoire pour la rendre conforme au présent ; corriger les documents d’état courant et ajouter une nouvelle entrée chronologique.

## Checklist

- [ ] Source la plus autoritative identifiée.
- [ ] Version et date d’effet vérifiées.
- [ ] Adaptateur distingué du document canonique.
- [ ] Documents proches lus avant conclusion de redondance.
- [ ] Contradiction documentée.
- [ ] Provenance et historique conservés.
