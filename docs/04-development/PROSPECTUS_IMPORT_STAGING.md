# Staging gouverné des imports de prospectus

Date de référence : 2026-08-17

## Objet

Cette tranche fournit une zone de staging auditable pour les extractions de prospectus PDF/DOCX. Elle complète le service d’extraction `EXTRACTED_UNVERIFIED` et le moteur de revue humaine sans autoriser une écriture implicite dans les réponses canoniques du projet.

Le principe d’architecture est volontairement strict :

`preuve CLEAN → extraction → staging → revue humaine → commande canonique explicite future`

Aucune étape intermédiaire ne peut rendre un dossier prêt pour soumission.

## Migration PostgreSQL

La migration `database/migrations/0006_import_staging.sql` ajoute :

- `regulatory.prospectus_import_batches` ;
- `regulatory.prospectus_import_values` ;
- les index par organisation, projet/version et preuve ;
- les triggers de contrôle de portée ;
- les triggers d’immutabilité de la source extraite ;
- les politiques RLS tenant.

Les deux verrous réglementaires sont portés par des contraintes PostgreSQL :

- `canonical_write_allowed = false` ;
- `ready_for_submission = false`.

Une application défaillante ne peut donc pas simplement positionner ces flags à `true`.

## Cohérence de provenance

Un batch n’est accepté que si :

1. sa version de projet appartient au tenant courant et au projet annoncé ;
2. son objet de preuve appartient au même tenant et à la même version ;
3. le SHA-256 annoncé correspond au SHA de l’objet de preuve ;
4. l’objet de preuve est `CLEAN` avec `scan_status=CLEAN` ;
5. le média détecté correspond au média déclaré par le batch.

Chaque valeur importée doit à son tour référencer le même objet de preuve et le même SHA que son batch.

## Immutabilité et revue humaine

Une proposition importée stocke :

- le champ canonique proposé ;
- la valeur extraite ;
- la confiance éventuelle ;
- la localisation source ;
- l’objet de preuve et son SHA ;
- l’état de revue ;
- le reviewer et l’horodatage lorsqu’une décision existe.

Après staging, le contenu source de la proposition ne peut plus être modifié. La première décision humaine est également finale pour cette proposition : une seconde décision est rejetée par le repository et par le trigger PostgreSQL.

Les décisions admises sont :

- `CONFIRMED_BY_HUMAN` ;
- `REJECTED_BY_HUMAN`.

Une revue exige actuellement une identité vérifiée disposant d’un rôle `COMPLIANCE` ou `LEGAL` dans l’organisation.

## Repository serveur

`apps/web/src/server/import/postgres-import-staging-repository.ts` expose :

- `createBatch` ;
- `getBatch` ;
- `reviewValue`.

Chaque opération :

- résout une identité serveur vérifiée ;
- ouvre une transaction PostgreSQL ;
- fixe `app.current_organization_id` ;
- vérifie l’appartenance organisationnelle ;
- laisse RLS imposer l’isolation tenant.

`getBatch` utilise une transaction `READ ONLY`.

Le repository n’expose aucune fonction `apply`, `copyToCanonical`, `saveAnswer` ou équivalent.

## Validation

Le test `apps/web/src/server/import/postgres-import-staging-repository.integration.ts` s’exécute dans le gate PostgreSQL réel de la Regulatory CI.

Il valide notamment :

- preuve CLEAN obligatoire ;
- isolation tenant ;
- refus d’une preuve cross-tenant ;
- persistance de l’identité du reviewer ;
- refus d’une double revue ;
- conservation du SHA source ;
- verrou base de `canonical_write_allowed=false` ;
- verrou base de `ready_for_submission=false`.

Validation produite : `POSTGRESQL_IMPORT_STAGING_VALIDATION_V1`.

La Regulatory CI `32060434442` et la Security and Review Policy CI associée ont validé cette tranche sur PostgreSQL 17.

## Non-objectifs

Cette tranche ne :

- configure pas un antivirus de production ;
- configure pas un stockage objet/KMS réel ;
- ne fournit pas encore l’API utilisateur de staging ;
- ne fournit pas encore l’écran de revue ;
- ne copie aucune valeur confirmée vers `project_answers` ;
- ne constitue aucune validation juridique ou conformité ;
- n’active aucune règle, clause, sanction ou exigence réglementaire ;
- n’autorise aucune soumission.

## Étape suivante

La prochaine couche autonome est l’exposition du staging derrière le runtime applicatif puis une API et une interface de revue gouvernées.

La future commande permettant d’utiliser une valeur confirmée devra rester distincte et imposer au minimum :

- une autorisation `ANSWER_WRITE` ;
- `expectedVersion` ;
- une nouvelle version projet ;
- un audit explicite de provenance import/SHA/reviewer ;
- le maintien de `ready_for_submission=false`.
