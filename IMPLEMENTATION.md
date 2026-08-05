# Première tranche verticale exécutable — Prospectus Composer

## Statut

`TECHNICAL_PROTOTYPE — NOT_PRODUCTION_READY`

Cette tranche permet déjà de transformer les matrices réglementaires CIRC005 existantes et un jeu de réponses structurées en :

- données canoniques ;
- état du questionnaire ;
- contrôles déterministes ;
- modèle documentaire traçable ;
- projet de prospectus Markdown ;
- table de concordance ;
- manifeste de génération.

Elle ne produit pas encore le DOCX ni le PDF et aucune clause n’est `APPROVED` ou `ACTIVE`.

## Commandes

Prérequis : Node.js 22 ou version ultérieure.

```bash
npm test
npm run generate:sample
npm run check
```

Aucune installation de dépendances externes n’est nécessaire.

## Entrées exécutables

```text
regulatory/matrices/*.csv
examples/united-capital-diamond/preloaded-data.json
examples/united-capital-diamond/answers.json
```

Les quatre matrices existantes restent la source des identifiants d’exigence, questions, champs, effets, contrôles et sections. Le code ne recrée pas de second registre concurrent.

## Sorties du cas d’exemple

```text
examples/generated/united-capital-diamond/
├── prospectus-draft.md
├── canonical-data.json
├── questionnaire-state.json
├── control-report.json
├── concordance.json
├── document-model.json
├── answer-log.json
└── generation-manifest.json
```

Les fichiers non versionnés dans le dépôt sont régénérés par `npm run generate:sample`.

## Chaîne implémentée

```text
Matrices CIRC005
+ données préchargées
+ réponses structurées
→ catalogue de questions exécutable
→ modèle canonique
→ enrichissements déterministes
→ contrôles
→ sélection des clauses DRAFT
→ composants documentaires
→ prospectus Markdown
→ concordance et manifeste
```

## Règles de sécurité réglementaire

- le cas United Capital Diamond est un cas de test, jamais une norme ;
- les clauses sont `DRAFT_LEGAL_REVIEW_REQUIRED` ;
- le moteur affiche toujours `ready_for_submission: false` ;
- la fiscalité et le point 5.3 « informations d’ordre économique » restent soumis à revue ;
- les champs manquants restent visibles ;
- les identifiants `CIRC005_*` proviennent des matrices existantes ;
- le rendu est déterministe pour un même snapshot et les mêmes versions.

## Prochaine extension technique

La prochaine tranche doit couvrir les exigences encore manquantes, ajouter le schéma JSON canonique détaillé, le stockage versionné d’un projet, les questions conditionnelles complémentaires, la bibliothèque de clauses persistée et le rendu DOCX/PDF après validation des composants.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Réconciliation de couverture V0.2

Le module `src/core/circ005-completeness-extension.js` complète le modèle documentaire et recalcule la concordance après la composition initiale.

Il couvre les 15 exigences précédemment manquantes, sépare les frais directement supportés par le porteur, ajoute les listes `missing_requirement_ids` et `pending_review_requirement_ids`, corrige les sur-couvertures non soutenues par des données vérifiées et maintient `ready_for_submission: false`.

- exigences analysées : `62` ;
- composants documentaires : `44` ;
- couvertes dans le prospectus : `40` ;
- en attente de revue : `20` ;
- manquantes : `0` ;
- non applicables : `1` ;
- métadonnées système : `1` ;
- avertissements : `7` ;
- blocages : `0` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Export DOCX V0.1

La commande `npm run generate:docx` exécute `scripts/generate_docx.py`. Elle génère un paquet OOXML déterministe à partir de `document-model.json` et de `generation-manifest.json`.

La commande `npm run validate:docx` vérifie les parties OOXML obligatoires, la validité XML, les avertissements réglementaires, la traçabilité et le maintien de `ready_for_submission: false`.

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Adaptateur matrices CIRC005 → application web V0.1

La génération du catalogue précède `dev`, `typecheck` et `build`. Elle contrôle l’égalité exacte entre les 62 identifiants des matrices CSV et ceux du registre YAML, l’unicité des identifiants et la présence des champs canoniques, rôles et références sources.

- exigences chargées depuis les matrices : `62` ;
- questions réglementaires interactives : `58` ;
- questions système : `4` ;
- groupes réglementaires générés : `16` ;
- identifiants d’exigence uniques : `62` ;
- identifiants de question uniques : `62` ;
- empreinte du catalogue : `c1f288bcc865becee580e52049ea4757ecd7e1fc97fcccd3f4b61aba3089ea1b` ;
- test d’intégration API : `PASS` ;
- soumission automatique : `false`.

À chaque génération utilisateur, l’application écrit désormais un `canonical-snapshot.json` versionné contenant les réponses structurées, les chemins canoniques, les exigences, les statuts de revue, les réponses historiques non mappées et l’empreinte du catalogue.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->
