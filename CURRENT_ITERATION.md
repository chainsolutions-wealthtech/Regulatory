# CURRENT_ITERATION — LOOP-DEV-001

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## Overlay courant — LOOP-GOV-002

Statut de `LOOP-GOV-002` : `CLOSED_OBJECTIVE_COMPLETE`.

Objectif atteint : consolider la gouvernance et synchroniser la mémoire persistante sans réécrire la baseline historique de `LOOP-DEV-001` ni les travaux de `LOOP-REG-001`.

Résultats atteints :

- gouvernance transversale `GOVERNANCE.md` ;
- `main` explicitement désignée branche canonique ;
- adaptateurs agents alignés ;
- CI préexistante en échec diagnostiquée et réparée ;
- compatibilité descendante legacy conservée et testée ;
- reproductibilité PDF renforcée sans affaiblissement du contrôle byte-for-byte ;
- prochaine action réglementaire propriétaire conservée.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `d0f961b257a964f41f401e4eb2d49d1ce9030ddb` ;
- date du HEAD source : `2026-08-17` ;
- run Regulatory CI : `32062079858` ;
- validation API CIRC005 : `PASS` ;
- compatibilité descendante des 10 collections structurées : `PASS` ;
- persistance canonique des anciens payloads : `PASS` ;
- reproductibilité PDF après normalisation fixe des métadonnées LibreOffice, dont `/DocChecksum` : `PASS` ;
- dépôt PostgreSQL transactionnel : `PASS` ;
- `ready_for_submission` : `false` ;
- dépendances externes Instruction 66 : `49` occurrences, `33` résolues documentairement, `16` non résolues ;
- circulaires : `34` total, `25` résolues, `9` non résolues ;
- instructions génériques : `7` total, `5` résolues, `2` non résolues ;
- activation réglementaire automatique : `FORBIDDEN` ;
- revues juridique et conformité : `PENDING`.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->

> **Statut :** `IN_PROGRESS`  
> **Ouverte le :** 2026-08-05

## Objectif

Construire la première tranche verticale exécutable du moteur de prospectus FCP/OPCVM UMOA afin de transformer les matrices réglementaires et des réponses structurées en données canoniques, contrôles, composants documentaires, prospectus de travail et table de concordance.

## Décision de priorité

Le propriétaire a demandé de commencer immédiatement le code de construction du prospectus. `LOOP-REG-001` n’est pas clôturée : elle est suspendue avec ses travaux restants préservés. La priorité active devient `LOOP-DEV-001`.

## État initial vérifié

- branche unique : `main` ;
- commit de départ : `a2a7d0a26802169a859b5bf02ca5e88798f483a8` ;
- aucun code applicatif ni `package.json` ;
- 62 exigences CIRC005 ;
- quatre matrices CSV ;
- modèle canonique architectural de 30 objets ;
- aucune clause `APPROVED` ou `ACTIVE`.

## Travail réalisé dans l’itération

- ajout d’un projet Node.js 22 sans dépendance externe ;
- chargement exécutable des quatre matrices CIRC005 ;
- création du catalogue de questions ;
- application contrôlée des réponses aux chemins canoniques ;
- création d’un moteur conditionnel initial ;
- création d’un moteur de règles initial ;
- création d’une bibliothèque de clauses DRAFT ;
- création du modèle documentaire et du compositeur Markdown ;
- création de la table de concordance et du manifeste déterministe ;
- création du cas United Capital Diamond prérempli ;
- génération de sorties de contrôle et de traçabilité ;
- ajout de sept tests automatisés ;
- résultat local : `7/7` tests réussis ;
- couverture du cas initial : `46` exigences dans le prospectus, `1` non applicable et `15` manquantes ;
- contrôles : `0` blocage, `2` avertissements ;
- statut du dossier : `DATA_INCOMPLETE` ;
- soumission : interdite.

## Périmètre restant

- couvrir les 15 exigences encore manquantes ;
- enrichir le catalogue de questions conditionnelles ;
- produire le JSON Schema canonique détaillé ;
- ajouter la persistance versionnée ;
- séparer les clauses du code vers un registre versionné ;
- ajouter le rendu DOCX puis PDF ;
- reprendre et terminer `LOOP-REG-001` pour l’Instruction n°66 ;
- obtenir les validations juridique, conformité et fiscale.

## Critères de sortie de LOOP-DEV-001

- [x] moteur exécutable sans dépendance externe ;
- [x] matrices existantes utilisées comme source ;
- [x] cas d’exemple généré ;
- [x] tests automatisés réussis localement ;
- [x] concordance produite sur les 62 exigences ;
- [ ] zéro exigence obligatoire non traitée dans le cas standard ;
- [ ] schéma canonique détaillé validé structurellement ;
- [ ] clauses externalisées et versionnées ;
- [ ] rendu DOCX déterministe ;
- [ ] rendu PDF contrôlé ;
- [ ] revue humaine du modèle et des clauses.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Résultat de l’itération de couverture

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

L’objectif de réduction des 15 exigences `MISSING` est atteint sans faux reclassement en `NOT_APPLICABLE`. Les informations non vérifiées sont exposées comme `PENDING_REVIEW`.

Reste à collecter les preuves institutionnelles et constitutives, valider la fiscalité et le point 5.3, reprendre l’Instruction n°66/2021 et produire le DOCX déterministe.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Résultat de l’itération DOCX

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.

Le modèle documentaire est désormais consommable sous forme de fichier bureautique. La traçabilité reste incluse dans le document et dans `docx-manifest.json`. Le PDF de CI est seulement un support d’inspection visuelle.
<!-- AUTO:LOOP-DEV-001-DOCX:END -->

<!-- AUTO:LOOP-DEV-001-DOCX-VISUAL-QA:START -->
## Inspection visuelle DOCX clôturée — 2026-08-05

- pages rendues et inspectées : `10/10` ;
- première anomalie : puces de risques invisibles — `CORRECTED` ;
- seconde anomalie : ligne de traçabilité fractionnée entre pages — `CORRECTED` ;
- seconde inspection complète : `PASS` ;
- limitation déclarée : densité élevée de l’annexe technique, sans texte coupé ni ligne fractionnée ;
- rapport : `docs/05-quality/DOCX_VISUAL_INSPECTION_2026-08-05.md` ;
- nature du verdict : qualité structurelle et visuelle d’un document de pré-conformité, non validation juridique ou réglementaire.
<!-- AUTO:LOOP-DEV-001-DOCX-VISUAL-QA:END -->

<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:START -->
## Résultat courant — Application de pré-conformité

La tranche applicative couvre désormais le questionnaire, les contrôles, la génération déterministe, les revues humaines, PostgreSQL/RLS, la sécurité des preuves et l'historique de versions.

### Critères atteints

- App Router / Atomic Design ;
- Server Components par défaut ;
- catalogue réglementaire structuré ;
- persistance locale et PostgreSQL ;
- RLS, OIDC, RBAC et séparation des tâches ;
- DOCX/PDF/ZIP déterministes ;
- API HTTP testée ;
- import sécurisé non vérifié ;
- versions et diff read-only ;
- CI Regulatory et Security actives.

### Gates restant externes ou humains

- fournisseur OIDC réellement configuré ;
- stockage objet et antivirus réels ;
- sauvegarde/restauration ;
- recette navigateur/accessibilité/sécurité d'exploitation ;
- validation juridique, conformité et fiscale ;
- décision de production ;
- soumission réglementaire, toujours désactivée.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Résultat de l’itération compositeur documentaire web

- exigences chargées depuis les matrices : `62` ;
- questions réglementaires interactives : `58` ;
- questions système : `4` ;
- groupes réglementaires générés : `16` ;
- identifiants d’exigence uniques : `62` ;
- identifiants de question uniques : `62` ;
- empreinte du catalogue : `c1f288bcc865becee580e52049ea4757ecd7e1fc97fcccd3f4b61aba3089ea1b` ;
- test d’intégration API : `PASS` ;
- compositeur documentaire historique invoqué : `true` ;
- bundle documentaire complet persisté : `true` ;
- DOCX déterministe validé : `true` ;
- soumission automatique : `false`.

Le même snapshot produit le même identifiant de génération et le même document. La traçabilité relie les réponses web, leurs champs canoniques, les exigences CIRC005, les composants du modèle documentaire et les fichiers générés. `ready_for_submission` reste forcé à `false` dans le snapshot, le manifeste de génération, le manifeste DOCX et l’API.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## Résultat — Éditeur structuré des classes de parts

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

Les anciennes réponses `false` et `true` restent lisibles et sont transformées respectivement en une ou deux classes par défaut lors de la construction du snapshot. Une nouvelle réponse enregistrée est obligatoirement une collection validée.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## Résultat — Dix collections canoniques structurées

- collections structurées testées : `10` ;
- classes de parts : `share_classes[]` ;
- fourchettes d’allocation : `investment_policy.asset_class_ranges[]` ;
- frais transactionnels : `fees.transaction[]` ;
- rémunérations : `remunerations[]` ;
- méthodes de valorisation : `valuation.methods[]` ;
- gouvernance : `manager.governance_members[]` ;
- intervenants : `service_providers[]` ;
- risques : `risks[]` ;
- dispositifs pays : `distribution_countries[]` ;
- justificatifs : `evidence[]` ;
- repli de ces collections dans `_repeating` : `REMOVED` ;
- test HTTP complet : `PASS` ;
- compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

Les contrôles couvrent notamment l’unicité des identifiants, les fourchettes `0 ≤ minimum ≤ cible ≤ maximum ≤ 100`, la cohérence des méthodes de valorisation, la présence du dépositaire, les dispositifs par pays et le statut des preuves.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## Résultat — Contrat canonique et base transactionnelle V1

- contrat : `PROSPECTUS_CANONICAL_MODEL_V1.schema.json` ;
- standard : JSON Schema draft 2020-12 ;
- collections structurées couvertes : `10` ;
- tables PostgreSQL : `25` ;
- tables avec RLS activée : `18` ;
- politiques tenant : `18` ;
- versions gelables : `IMPLEMENTED` ;
- audit append-only : `IMPLEMENTED` ;
- soumission verrouillée à `false` : `IMPLEMENTED` ;
- migration exécutée sur PostgreSQL éphémère en CI : `PASS` ;
- stockage actif dans l’application : `local-json` ;
- adaptateur PostgreSQL applicatif : `NOT_ACTIVATED`.

La migration vérifie l’intégrité des fourchettes, l’unicité de l’État d’établissement, le gel des versions, l’audit non modifiable, l’isolation de deux organisations et l’interdiction de `ready_for_submission=true`.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## Résultat — persistance PostgreSQL et import gouverné

Le repository projet et le staging d’import sont tous deux validés sur PostgreSQL 17 en CI.

- dépôt PostgreSQL projet : `IMPLEMENTED_AND_TESTED` ;
- identité serveur vérifiée : `REQUIRED` ;
- appartenance organisation : `REQUIRED` ;
- isolation multi-tenant : `PASS` ;
- version par écriture : `PASS` ;
- concurrence optimiste : `PASS` ;
- snapshot canonique : `PASS` ;
- chaîne d’audit SHA-256 : `PASS` ;
- `ready_for_submission` : `false`.

- migration : `database/migrations/0006_import_staging.sql` ;
- staging PostgreSQL tenant-scopé : `IMPLEMENTED_AND_TESTED` ;
- preuve source CLEAN exigée : `PASS` ;
- liaison projet/version/preuve/SHA : `PASS` ;
- RLS tenant : `PASS` ;
- réutilisation cross-tenant d’une preuve : `REJECTED` ;
- revue humaine persistée avec identité : `PASS` ;
- seconde décision sur une valeur revue : `REJECTED` ;
- source extraite après staging : `IMMUTABLE` ;
- `canonical_write_allowed` : `false` verrouillé en base ;
- `ready_for_submission` : `false` verrouillé en base.

Prochaine tranche autonome : exposer le staging via un port runtime/API gouverné puis une interface de revue, sans écrire automatiquement dans le canonique.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
