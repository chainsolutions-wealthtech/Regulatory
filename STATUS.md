# STATUS — État courant du projet

<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:START -->
## Réconciliation courante — gouvernance, non-régression et preuves 2026-08-13

Le dépôt est désormais explicitement gouverné en mode **une branche canonique : `main`**, sans création de branche par les agents et sans PR de travail normale. La réconciliation n’a supprimé ni remplacé les documents historiques : les photographies anciennes restent des preuves datées et le présent bloc porte l’état courant de contrôle.

- branche canonique : `main` ;
- HEAD source vérifié par la boucle : `637f4f39e81e357f6c2463dfbd9c94a64079c2cd` ;
- date du HEAD source : `2026-08-17` ;
- run Regulatory CI : `32067523311` ;
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

La défaillance CI préexistante observée au HEAD initial `6eb645fc...` a été isolée puis corrigée sans supprimer de couverture : routes HTTP fantômes retirées du test général, test dédié de compatibilité legacy ajouté, et non-déterminisme PDF attribué au champ LibreOffice `/DocChecksum` puis normalisé sans modifier les longueurs/offsets. La comparaison PDF reste byte-for-byte après normalisation.
<!-- AUTO:LOOP-GOV-002-GOVERNANCE-RECONCILIATION:END -->

> **Date de référence :** 2026-08-07  
> **Branche :** `main`  
> **Boucles actives :** `LOOP-DEV-001` + `LOOP-REG-001`  
> **État global :** `FUNCTIONAL_PRE_COMPLIANCE_PLATFORM_REGULATORY_REVIEW_IN_PROGRESS`

## Résumé courant

Le dépôt contient une plateforme Next.js exécutable de composition de prospectus UMOA/FCP, un moteur réglementaire déterministe, un modèle canonique, une persistance locale versionnée, un dépôt PostgreSQL transactionnel multi-tenant testé, un workflow de revue RBAC, un stockage de preuves en quarantaine, un compositeur Markdown/JSON/DOCX déterministe et un corpus réglementaire structuré.

Le produit reste un système de **pré-conformité**. Il ne délivre aucun agrément, visa, approbation AMF-UMOA ni verdict automatique de conformité. `ready_for_submission` reste `false`.

## CIRC005 — état du cas de référence

- exigences analysées : `62` ;
- composants documentaires : `44` ;
- `IN_PROSPECTUS` : `40` ;
- `PENDING_REVIEW` : `20` ;
- `MISSING` : `0` ;
- `NOT_APPLICABLE` : `1` ;
- `SYSTEM_METADATA` : `1` ;
- avertissements : `7` ;
- blocages automatiques : `0` ;
- prêt pour revue conformité : `false` ;
- prêt pour soumission : `false`.

Les données non vérifiées restent en `PENDING_REVIEW`; aucune non-applicabilité n'est utilisée pour masquer une donnée manquante.

## Application Next.js / Atomic Design

- application : `apps/web` ;
- Next.js App Router + React + TypeScript ;
- Atomic Design : atoms, molecules, organisms et templates ;
- création et versionnement de projets ;
- questionnaire réglementaire dynamique ;
- collections canoniques structurées ;
- contrôles métier et réglementaires ;
- aperçu et génération documentaire ;
- espace de revue et décisions humaines ;
- API locale et API de revue ;
- build de production vérifié en CI.

## Modèle canonique et persistance

- JSON Schema canonique versionné : `PROSPECTUS_CANONICAL_MODEL_V1.schema.json` ;
- 10 collections répétables écrites directement dans le snapshot canonique ;
- stockage local JSON versionné disponible pour le prototype ;
- PostgreSQL 17 testé avec migrations ;
- RLS multi-tenant ;
- contrôle de concurrence optimiste ;
- versions gelables ;
- chaîne d'audit SHA-256 append-only ;
- artefacts staged puis commit ;
- `ready_for_submission=true` interdit par les invariants.

## Sécurité, RBAC et workflow humain

- fournisseur OIDC générique implémenté derrière configuration réelle ;
- aucune identité, session ou signature fictive ;
- rôles : Administrateur, Produit, Risques, Conformité, Juridique, Fiscal, Opérations, Sécurité, Audit, Lecteur ;
- refus par défaut et vérification serveur ;
- séparation des tâches ;
- auto-approbation interdite ;
- demandes de revue, commentaires, décisions et approbations ;
- gel interne distinct d'une décision du régulateur ;
- actions de soumission réglementaire désactivées.

## Stockage sécurisé des preuves

- politique exécutable de stockage ;
- quarantaine obligatoire à l'entrée ;
- séparation preuve logique / objet binaire ;
- résultat antivirus accepté uniquement depuis un service serveur de confiance ;
- libération uniquement après résultat propre ;
- absence d'URL publique permanente ;
- rétention et gel juridique ;
- migrations et tests de sécurité validés en CI.

Le stockage objet de production, l'antivirus réel, le chiffrement d'exploitation, les URL temporaires et la politique de sauvegarde restent à configurer avec une infrastructure réelle.

## Instruction n°66/CREPMF/2021

Source officielle matérialisée :

- PDF : `regulatory/materialized/INSTRUCTION_66_CREPMF_2021.pdf` ;
- SHA-256 : `3f964f2f6ab9ce9eb16912ccda13f34b5023a188dfb18fcba7065590c770d396` ;
- taille : `3 470 163` octets ;
- pages : `65` ;
- articles indexés : `1–92`, sans numéro manquant ;
- date portée sur l'acte observée : `2021-12-16` ;
- prise d'effet observée : `2022-01-01` ;
- statut du registre AMF-UMOA vérifié : `NON ABROGE`.

Atomisation :

- blocs article OCR : `92` ;
- atomes article : `92` ;
- exigences candidates détaillées compilées : `111` ;
- exigences staged non compilées : `0` ;
- activation : `FORBIDDEN` ;
- revue juridique : `PENDING` ;
- revue conformité : `PENDING` ;
- matrices `CIRC005_*` : byte-identiques pendant la compilation.

Le texte OCR est uniquement un dérivé d'extraction. La source normative reste le PDF officiel hashé. Aucun seuil numérique OCR, aucune exemption et aucune interprétation ne deviennent actifs sans double revue humaine.

## CI validées sur l'état 111 candidats

- compilation Instruction 66 : `PASS` — run `31213464616` ;
- revalidation compilation sans staging : `PASS` — run `31213688759` ;
- cohérence métadonnées source : `PASS` — run `31213627286` ;
- Security and Review Policy CI : `PASS` — run `31213688666` ;
- Regulatory CI complète : `PASS` — run `31213688838`.

La Regulatory CI couvre notamment PostgreSQL, catalogue web, TypeScript, dépôt transactionnel, build Next.js, API HTTP, moteur réglementaire, génération du dossier, DOCX, rendu visuel et invariants documentaires.

## Génération documentaire

Pour le cas de référence :

- Markdown déterministe ;
- snapshot canonique JSON ;
- modèle documentaire ;
- concordance ;
- rapport de contrôles ;
- manifeste de génération ;
- DOCX déterministe ;
- contrôle visuel sur 10 pages ;
- avertissements de pré-conformité conservés ;
- `ready_for_submission=false`.

## Travaux réglementaires ouverts

- revue juridique et conformité des `111` candidats Instruction 66 ;
- rapprochement historique complet des 7 textes cités à l'article 92 ;
- recherche exhaustive des modificatifs et rectificatifs dans les décisions et bulletins officiels ;
- capture du lien binaire AMF-UMOA depuis le registre dynamique ;
- segmentation et classification normative plus fine des dispositions restantes ;
- vérification exacte des domaines commissariat aux comptes, conseil, commercialisation/distribution et cycle de vie restant ;
- ne créer aucune exigence « sanctions » à partir de l'Instruction 66 tant qu'une disposition source explicite n'est pas identifiée.

## Travaux produit ouverts

- connecter uniquement les exigences Instruction 66 humainement validées au catalogue applicatif ;
- construire l'administration des clauses et sources réglementaires ;
- finaliser le stockage objet de production et l'antivirus réel ;
- configurer un fournisseur d'identité réel ;
- import DOCX/PDF avec statut `EXTRACTED_UNVERIFIED` ;
- comparaison de versions ;
- PDF réglementaire déterministe final ;
- rapports de pré-conformité et dossier ZIP ;
- tests navigateurs, accessibilité, sécurité et exploitation ;
- revues juridique, conformité et fiscale ;
- déploiement uniquement après recette et décision explicite.

## Historique

Les anciens états, jalons et décisions restent dans `SUIVI.md`, `WORK_LOG.md`, `CHANGELOG.md` et les rapports de qualité. `STATUS.md` représente uniquement l'état courant.

## Prochaine action

Voir `NEXT_ACTION.md`.

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
## Mise à jour LOOP-DEV-001 — Application Next.js / état 2026-08-17

- application : `apps/web` ;
- framework : Next.js App Router + React + TypeScript ;
- architecture UI : Atomic Design ;
- catalogue et questionnaire CIRC005 : `IMPLEMENTED` ;
- driver JSON local versionné : `IMPLEMENTED_PROTOTYPE` ;
- repository PostgreSQL transactionnel : `IMPLEMENTED_AND_TESTED` ;
- isolation RLS multi-tenant : `PASS_CI` ;
- OIDC : `IMPLEMENTED_REQUIRES_REAL_CONFIGURATION` ;
- RBAC et séparation des tâches : `IMPLEMENTED_AND_TESTED` ;
- revues humaines : `IMPLEMENTED_WORKFLOW` ;
- DOCX déterministe : `PASS_CI` ;
- PDF déterministe normalisé : `PASS_CI` ;
- package ZIP de revue : `PASS_CI` ;
- import sécurisé : `IMPLEMENTED_STAGING_EXTRACTED_UNVERIFIED` ;
- historique + diff de versions : `IMPLEMENTED_READ_ONLY` ;
- production : `NOT_AUTHORIZED` ;
- soumission réglementaire : `DISABLED` ;
- `ready_for_submission` : `false`.

Les travaux autonomes restants concernent notamment l'administration gouvernée des clauses/sources, l'industrialisation de l'import et les tests navigateur/accessibilité. Les activations réglementaires, validations juridiques/conformité/fiscales et la production restent soumises aux gates humains et externes.
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
## PostgreSQL transactionnel et staging d’import — état 2026-08-17

- dépôt PostgreSQL projet : `IMPLEMENTED_AND_TESTED` ;
- identité serveur vérifiée : `REQUIRED` ;
- appartenance organisation : `REQUIRED` ;
- isolation multi-tenant : `PASS` ;
- version par écriture : `PASS` ;
- concurrence optimiste : `PASS` ;
- snapshot canonique : `PASS` ;
- chaîne d’audit SHA-256 : `PASS` ;
- `ready_for_submission` : `false`.

### Import prospectus

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

La confirmation humaine d’une valeur extraite ne constitue **jamais** une écriture dans le modèle canonique. Le passage vers une réponse projet devra rester une commande distincte, versionnée, autorisée et auditée.
<!-- AUTO:LOOP-DEV-001-POSTGRES-REPOSITORY-V1:END -->
