# Étape 7 — Livrables finaux — progression 2026-08-08

> Plan maître : `regulatory/plans/MASTER_COMPLETION_PLAN_8_STEPS.md`  
> État : `IMPLEMENTED_PENDING_CI_REVALIDATION_AND_HUMAN_GATES`  
> `ready_for_submission=false`

## Chaîne documentaire existante conservée

Le DOCX reste la source documentaire composée et validée. Aucun second moteur de rendu réglementaire n'est créé.

Chaîne actuelle :

`snapshot canonique → compositeur historique → document-model → DOCX → validation DOCX → PDF de revue → package ZIP de revue`

## PDF de revue reproductible

Script : `scripts/generate_pdf_review_package.py`.

Principes :

- rendu depuis le DOCX avec LibreOffice Writer headless ;
- uniquement `libreoffice` et `pdfinfo`, déjà présents dans la CI historique ;
- deux rendus LibreOffice dans deux profils isolés ;
- normalisation Python à longueur constante des dates/IDs PDF volatils ;
- les deux flux PDF normalisés doivent être byte-identiques ;
- sinon échec `PDF_NORMALIZATION_NOT_DETERMINISTIC` ;
- magic `%PDF-` et nombre de pages contrôlés ;
- SHA-256 du DOCX et du PDF conservés ;
- `pdf-manifest.json` ;
- statut `DRAFT_PRE_COMPLIANCE_REVIEW` ;
- `ready_for_submission=false`.

## Package ZIP de revue déterministe

Artefacts :

- `review-package-manifest.json` ;
- `review-package.zip`.

Le ZIP utilise :

- ordre lexicographique ;
- timestamp fixe `1980-01-01T00:00:00Z` ;
- permissions `0644` ;
- compression DEFLATE niveau 9 ;
- hashes/taille/MIME de chaque payload dans le manifeste ;
- seconde reconstruction du ZIP et comparaison byte-à-byte.

Le package est `PRE_COMPLIANCE_REVIEW_PACKAGE`, jamais un package de soumission.

## Intégration web

`src/cli/generate-from-web-snapshot.js` :

- mode explicite `--review-package-mode enabled|disabled` ;
- `enabled` sur l'action de génération ;
- `disabled` lors d'un simple aperçu.

`apps/web/src/server/generation-adapter.ts` :

- artefacts de base conservés ;
- ajout de `canonical-snapshot.json` aux artefacts persistés ;
- ajout `prospectus-draft.pdf` ;
- ajout `pdf-manifest.json` ;
- ajout `review-package-manifest.json` ;
- ajout `review-package.zip`.

Le bundle explicite passe donc de 11 artefacts historiques à 16 artefacts persistés.

## Distribution sécurisée

Les PDF/ZIP utilisent le `GenerationArtifactRepository` de l'étape 6 :

- listing contrôlé ;
- téléchargement avec `Content-Disposition: attachment` ;
- `Cache-Control: no-store, private` ;
- `X-Content-Type-Options: nosniff` ;
- SHA exposé ;
- contrôle d'intégrité serveur ;
- contexte tenant/RLS PostgreSQL.

## Tests préparés

- PostgreSQL integration : isolation tenant + lecture + corruption volontaire ;
- `scripts/test-web-artifacts-api.mjs` :
  - au moins 16 artefacts ;
  - PDF/ZIP présents ;
  - magic PDF ;
  - SHA téléchargement = SHA inventaire ;
  - `ready_for_submission=false` ;
  - tentative de path traversal rejetée ;
- `npm run web:test:api` enchaîne le test historique et le test artefacts.

## Correction anti-régression effectuée

Une première modification trop large de `apps/web/src/domain/types.ts` a été immédiatement détectée par inspection du diff et annulée. La comparaison finale avec le dernier état sain montre seulement les champs supplémentaires PDF/ZIP attendus (`5 additions / 1 deletion` net sur les deux commits correctifs). Aucun type métier n'est volontairement modifié.

## Reste pour déclarer l'étape 7 DONE

- exécuter réellement la CI sur la tête courante après résolution du blocage billing ;
- prouver `pdf_reproducible=true` et `package_reproducible=true` sur runner ;
- inspection visuelle du PDF de revue ;
- vérifier concordance DOCX/PDF et pagination ;
- compléter le package final avec les éventuelles décisions de revue/approbation lorsque l'étape 4 est franchie ;
- distinguer définitivement package de revue et package de soumission ;
- ne créer un package de soumission qu'après gates réglementaires, sécurité et recette.
