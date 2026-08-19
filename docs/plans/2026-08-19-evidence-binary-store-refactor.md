# Plan — séparer métadonnées Evidence et stockage binaire

Date : 2026-08-19

## Problème

`createPostgresTrackedEvidenceStore` considère PostgreSQL comme source de vérité des métadonnées, mais son delegate binaire implémente encore toute l’interface `EvidenceObjectStore`. Le filesystem de développement persiste donc lui aussi un descriptor JSON complet. Reproduire ce modèle avec S3 créerait une seconde source de vérité pour les états, le SHA, le scan et la release.

## Décision

Introduire une interface interne minimale `EvidenceBinaryStore` responsable uniquement des octets :

- `stage(objectId, organizationId, content)` ;
- `readQuarantined(objectId, organizationId)` ;
- `promoteToClean(objectId, organizationId)` ;
- `readClean(objectId, organizationId)` ;
- `delete(objectId, organizationId)`.

PostgreSQL reste seul responsable de :

- `EvidenceObjectDescriptor` ;
- état `QUARANTINED / CLEAN / INFECTED / REJECTED / DELETED` ;
- `scan_status` et attestation scanner ;
- SHA-256 attendu ;
- références KMS/chiffrement ;
- rétention et legal hold ;
- acteur et horodatage de release ;
- RLS et isolation tenant.

## Invariants

1. aucun object store externe ne peut déclarer un objet `CLEAN` au niveau métier ;
2. le passage binaire quarantine → clean est commandé uniquement après `scan_status=CLEAN` validé côté PostgreSQL/service ;
3. chaque lecture binaire est re-hashée et comparée au SHA PostgreSQL ;
4. un retry de promotion binaire doit être idempotent ;
5. un échec après promotion binaire mais avant commit PostgreSQL doit être récupérable au retry ;
6. une suppression est refusée si `legal_hold=true` avant appel au binary store ;
7. le binary store ne reçoit jamais un rôle métier ni un verdict antivirus navigateur ;
8. aucune donnée métier canonique n’est stockée dans l’object store.

## Migration sans régression

### RED 1

Ajouter un test unitaire du nouveau contrat binaire avec un fake in-memory :

- stage en quarantine ;
- read quarantine ;
- promote clean ;
- second promote clean idempotent ;
- read clean ;
- delete idempotent.

### GREEN 1

Créer `evidence-binary-store.ts` et `memory-evidence-binary-store.integration.ts`.

### RED 2

Adapter le test PostgreSQL tracked existant pour utiliser `EvidenceBinaryStore` au lieu d’un `EvidenceObjectStore` complet et prouver que :

- aucun descriptor n’est persistant côté delegate ;
- les mêmes checks PostgreSQL restent PASS ;
- recovery/idempotence de release restent PASS.

### GREEN 2

Refactorer `createPostgresTrackedEvidenceStore` sans modifier son API publique.

### RED/GREEN 3

Créer un adapter filesystem **binary-only** pour développement et rebrancher le runtime actuel. Les comportements HTTP/API restent identiques.

### RED/GREEN 4

Ajouter un adapter S3/S3-compatible binary-only basé sur AWS SDK for JavaScript v3. Les opérations nécessaires sont upload, download, copy/move logique et delete. La configuration réelle (bucket, endpoint, region, credentials/role, KMS) reste fournie par l’environnement cible.

## Production readiness

La présence de l’adapter S3 ne suffit pas à déclarer la production prête. Le verdict `productionReady` exige encore :

- bucket privé réellement provisionné ;
- politique IAM minimale vérifiée ;
- chiffrement/KMS réel ;
- scanner réel ;
- sauvegarde/rétention et monitoring ;
- restore/DR cible ;
- OIDC réel ;
- tests d’acceptation de l’environnement.

Jusqu’à ces validations, `ready_for_submission=false` et la readiness production restent bloquées.
