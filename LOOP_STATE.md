# LOOP_STATE — État persistant de la boucle

> **Statut :** `APPLICABLE`

## Boucle active

- Loop : `LOOP-DEV-001`
- Tâche : `TASK-DEV-001 — Construire la première tranche verticale du Prospectus Composer`
- Type : développement applicatif et preuve exécutable
- État : `IN_PROGRESS`
- Date d’ouverture : `2026-08-05`
- Branche conservée : `main`
- Commit de départ : `a2a7d0a26802169a859b5bf02ca5e88798f483a8`
- Création ou changement de branche : interdit et non réalisé

## Boucle réglementaire suspendue

- Loop : `LOOP-REG-001`
- État : `PAUSED_BY_OWNER_PRIORITY`
- Motif : démarrage explicite du code demandé par le propriétaire
- Travail préservé : source et plan d’atomisation de l’Instruction n°66
- Reprise obligatoire : matérialisation, empreinte, index des articles, versions et crosswalk

## Objectif actif

Rendre exécutable la chaîne suivante sans casser les sources existantes :

```text
matrices CIRC005
+ données préchargées
+ réponses structurées
→ données canoniques
→ contrôles
→ clauses DRAFT
→ composants documentaires
→ prospectus de travail
→ concordance
→ manifeste
```

## Sorties disponibles

- `package.json` ;
- `IMPLEMENTATION.md` ;
- `src/adapters/circ005-matrix-loader.js` ;
- moteur de questionnaire, conditions, règles, clauses et composition ;
- fixture United Capital Diamond ;
- sorties générées sous `examples/generated/united-capital-diamond/` ;
- tests sous `test/` ;
- `ADR-0008`.

## Contrôles locaux

- tests : `7/7 PASS` ;
- exigences chargées : `62` ;
- questions applicables dans le cas : `58` ;
- composants générés : `29` ;
- exigences couvertes : `46` ;
- non applicables : `1` ;
- manquantes : `15` ;
- blocages : `0` ;
- avertissements : `2` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

## Invariants

- conserver les identifiants `CIRC005_*` ;
- lire les matrices existantes au lieu de les recopier ;
- ne jamais transformer une fixture en règle normative ;
- ne jamais présenter une clause DRAFT comme approuvée ;
- conserver `ready_for_submission: false` avant les validations formelles ;
- produire des sorties déterministes pour un même snapshot ;
- ne pas créer de branche.

## Condition de reprise de LOOP-REG-001

La boucle réglementaire sera reprise après la tranche de couverture standard ou plus tôt si une règle d’implémentation dépend d’un article non atomisé de l’Instruction n°66.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## État V0.2 de LOOP-DEV-001

- objectif intermédiaire `15 → 0 MISSING` : `ACHIEVED` ;
- exigences en attente de revue : `20` ;
- génération déterministe : activée ;
- branche conservée : `main` ;
- soumission : interdite ;
- prochaine tranche : export DOCX déterministe de pré-conformité.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## État DOCX de LOOP-DEV-001

- générateur OOXML déterministe : `IMPLEMENTED` ;
- validateur structurel : `IMPLEMENTED` ;
- rendu LibreOffice de contrôle : `IMPLEMENTED_IN_CI` ;
- nombre de pages de contrôle : `10` ;
- soumission : `FORBIDDEN` ;
- prochaine tranche : API locale et questionnaire progressif.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->

<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:START -->
## État applicatif de LOOP-DEV-001

- Next.js App Router : `IMPLEMENTED` ;
- Atomic Design : `IMPLEMENTED` ;
- questionnaire local : `IMPLEMENTED_V0_1` ;
- API locale : `IMPLEMENTED_V0_1` ;
- persistance locale : `IMPLEMENTED_PROTOTYPE` ;
- build CI : `ENABLED` ;
- production : `FORBIDDEN` ;
- prochaine tranche : intégration moteur, tests API et DOCX générique.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## État de LOOP-DEV-001 après connexion au compositeur

- matrices → catalogue web : `IMPLEMENTED` ;
- API catalogue et questionnaire : `IMPLEMENTED` ;
- migration non destructive des réponses : `IMPLEMENTED` ;
- snapshot canonique versionné : `IMPLEMENTED` ;
- adaptateur snapshot → compositeur historique : `IMPLEMENTED_V0_1` ;
- génération Markdown, concordance, contrôles et DOCX par projet : `IMPLEMENTED_V0_1` ;
- persistance du bundle versionné : `IMPLEMENTED` ;
- tests unitaires et HTTP : `PASS` ;
- prochaine tranche : composants structurés pour les données répétables ;
- production et soumission : `FORBIDDEN`.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## LOOP-DEV-001 — Collections répétables

- classes de parts : `IMPLEMENTED_AND_VALIDATED` ;
- fourchettes d’allocation : `NEXT` ;
- commissions et frais : `PENDING` ;
- méthodes de valorisation : `PENDING` ;
- gouvernance et intervenants : `PENDING` ;
- documents et listes diverses : `PENDING`.

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->
