# STATUS — État courant du projet

> **Date de référence :** 2026-08-05  
> **Branche :** `main`  
> **Boucle active :** `LOOP-DEV-001`  
> **État global :** `EXECUTABLE_VERTICAL_SLICE_IN_PROGRESS`

## Résumé

Le dépôt n’est plus uniquement documentaire. Il contient maintenant une première tranche verticale exécutable du Prospectus Composer UMOA/FCP.

La tranche lit les quatre matrices CIRC005 existantes, applique un jeu de réponses structurées à un modèle canonique, exécute des contrôles déterministes, sélectionne des clauses DRAFT, compose un projet de prospectus Markdown et produit la concordance et le manifeste de génération.

## État technique

- runtime : Node.js `22+` ;
- dépendances externes : aucune ;
- tests locaux : `7/7 PASS` ;
- commande complète : `npm run check` ;
- exigences chargées : `62` ;
- questions applicables au cas : `58` ;
- réponses du cas : `30` ;
- composants documentaires : `29`.

## Cas United Capital Diamond

- exigences `IN_PROSPECTUS` : `46` ;
- exigences `NOT_APPLICABLE` : `1` ;
- exigences `MISSING` : `15` ;
- blocages automatiques : `0` ;
- avertissements : `2` ;
- statut : `DATA_INCOMPLETE` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

Les deux avertissements actuels concernent :

- l’absence de source fiscale validée ;
- l’interprétation du point 5.3 relatif aux informations d’ordre économique.

## Livrables actuels

Le dépôt versionne le projet de prospectus, le rapport de contrôles et le manifeste. La commande `npm run generate:sample` régénère en plus les données canoniques, l’état du questionnaire, la concordance complète, le modèle documentaire et le journal des réponses.

## Limites

- prototype technique, pas application de production ;
- aucun DOCX/PDF généré ;
- aucune persistance ni interface web ;
- aucune clause approuvée ;
- 15 exigences encore manquantes ;
- corpus réglementaire incomplet ;
- Instruction n°66 non atomisée ;
- revue juridique, conformité et fiscale non réalisée.

## Boucle réglementaire

`LOOP-REG-001` est `PAUSED_BY_OWNER_PRIORITY`, non clôturée. Ses résultats et tâches restantes restent valides.

## Prochaine action

Voir `NEXT_ACTION.md` : couvrir les 15 exigences manquantes sans inventer de données ni détourner les statuts de couverture.

<!-- AUTO:LOOP-DEV-001-COVERAGE:START -->
## Mise à jour LOOP-DEV-001 — Réconciliation CIRC005 V0.2

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

Le prospectus reste un projet de pré-conformité. Les profils institutionnels, la fiscalité, la constitution du Fonds, la gouvernance, le dépositaire, la liquidation et les autres rubriques non vérifiées restent en attente de revue.
<!-- AUTO:LOOP-DEV-001-COVERAGE:END -->

<!-- AUTO:LOOP-DEV-001-DOCX:START -->
## Mise à jour LOOP-DEV-001 — DOCX V0.1

- DOCX : `prospectus-draft.docx` ;
- taille : `13208` octets ;
- empreinte SHA-256 : `673b075cbe8cb31fb9418bc7157af7bbed1f882c53e41627f4d61910f523aa95` ;
- composants tracés : `44` ;
- lignes de traçabilité : `44` ;
- tableaux OOXML : `9` ;
- pages rendues pour contrôle visuel : `10` ;
- statut : `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- prêt pour soumission : `false`.

Le DOCX reste un document de pré-conformité. Les exigences `PENDING_REVIEW` et les validations humaines demeurent inchangées.
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
## Mise à jour LOOP-DEV-001 — Next.js et Atomic Design

- application : `apps/web` ;
- framework : Next.js App Router + React + TypeScript ;
- architecture UI : Atomic Design ;
- groupes de questionnaire : `18` ;
- API locale : projets, questions, réponses et génération ;
- persistance : JSON local versionné avec audit NDJSON ;
- build : vérifié par GitHub Actions ;
- authentification : non implémentée ;
- production : interdite ;
- soumission réglementaire : interdite.

La prochaine étape porte sur la connexion exhaustive du catalogue web au moteur réglementaire, la généralisation de la génération DOCX et les tests d’intégration.
<!-- AUTO:LOOP-DEV-001-NEXTJS-ATOMIC-DESIGN:END -->

<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:START -->
## Mise à jour LOOP-DEV-001 — Compositeur générique depuis le snapshot web

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

Le blocage « snapshot canonique non consommé par le moteur historique » est levé. La génération reste locale, pré-conformité et non déployée. Les champs répétables encore stockés sous une représentation provisoire doivent maintenant être remplacés par des composants structurés dédiés.
<!-- AUTO:LOOP-DEV-001-REGULATORY-CATALOG:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:START -->
## Tranche structurée 1 — Classes de parts

- composant dédié : `SHARE_CLASS_COLLECTION` ;
- question canonique conservée : `Q_SHARE_CLASSES_COUNT` ;
- exigence conservée : `CIRC005_1_10_FCP_PARTS_CHARACTERISTICS` ;
- validation ligne par ligne et unicité des identifiants : `PASS` ;
- migration non destructive des anciennes valeurs booléennes : `IMPLEMENTED` ;
- écriture directe dans `canonicalData.share_classes[]` : `PASS` ;
- stockage provisoire dans `_repeating.share_classes` : `REMOVED` ;
- génération par le compositeur historique et DOCX déterministe : `PASS` ;
- `ready_for_submission` : `false`.

La première donnée répétable du questionnaire n’est plus saisie sous forme de booléen ou de texte générique. Elle dispose d’un éditeur Atomic Design, d’une validation serveur et d’une collection canonique directement consommable par le compositeur.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-SHARE-CLASSES:END -->

<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:START -->
## Tranche structurée V1 — Collections canoniques

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

Les principales données répétables du parcours disposent désormais d’un éditeur Atomic Design partagé, d’une normalisation, d’une validation serveur, de contrôles intercollections et d’une écriture directe dans le snapshot canonique. Les lignes restent non confirmées tant qu’un rôle compétent ne les a pas revues.
<!-- AUTO:LOOP-DEV-001-STRUCTURED-COLLECTIONS-V1:END -->

<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:START -->
## Modèle canonique et PostgreSQL — baseline V1

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

Le schéma transactionnel est testé mais non déployé. L’application utilise une interface de dépôt explicite et conserve le stockage local de démonstration tant que l’adaptateur PostgreSQL, l’identité et les contrôles d’exploitation ne sont pas activés.
<!-- AUTO:LOOP-DEV-001-CANONICAL-SCHEMA-POSTGRES-V1:END -->

<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:START -->
## Dépôt PostgreSQL transactionnel — V1

- dépôt PostgreSQL : `IMPLEMENTED_AND_TESTED` ;
- identité serveur vérifiée exigée : `true` ;
- appartenance à l’organisation exigée : `true` ;
- isolation de deux tenants : `PASS` ;
- version créée à chaque écriture : `PASS` ;
- conflit de concurrence optimiste : `PASS` ;
- snapshot canonique par version : `PASS` ;
- collections normalisées synchronisées : `PASS` ;
- métadonnées documentaires persistées : `PASS` ;
- artefacts staged puis commit : `PASS` ;
- chaîne d’audit SHA-256 : `PASS` ;
- versions observées dans le test : `4` ;
- snapshots observés : `5` ;
- événements d’audit : `5` ;
- `ready_for_submission` : `false`.

L’adaptateur est testé sur PostgreSQL éphémère avec une identité fixe exclusivement réservée à la CI. Le driver actif de l’application reste `local-json` tant qu’un fournisseur d’identité réel, un stockage d’artefacts sécurisé et une revue d’exploitation ne sont pas configurés.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
