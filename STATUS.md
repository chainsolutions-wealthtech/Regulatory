# STATUS — État courant du projet

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
