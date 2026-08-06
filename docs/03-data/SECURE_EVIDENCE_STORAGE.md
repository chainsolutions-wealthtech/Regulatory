# Stockage sécurisé des preuves

## Statut

Baseline technique `SECURE_EVIDENCE_STORAGE_V1`.

Cette baseline définit le contrat, le schéma PostgreSQL et les contrôles nécessaires au stockage de pièces justificatives. Elle ne signifie pas qu'un fournisseur de stockage objet, un KMS, un antivirus ou une sauvegarde de production sont déjà activés.

## Séparation des objets

Une preuve est composée de deux objets distincts :

1. `evidence_items` décrit la preuve métier et réglementaire : type, titre, référence, émetteur, date et décision de vérification ;
2. `evidence_objects` décrit le binaire : stockage opaque, empreinte, taille, type détecté, chiffrement, scan, rétention et cycle de vie.

Une preuve ne peut passer à `VERIFIED` que si son `primary_object_id` désigne, dans la même organisation et la même version de projet, un objet `CLEAN` dont le scan est `CLEAN`. L'empreinte SHA-256 est alors copiée dans `verified_object_sha256` et devient la référence figée de la décision humaine.

## Cycle de vie

```text
réception serveur
→ QUARANTINED
→ SCANNING
→ résultat antivirus
   ├── CLEAN, puis libération explicite → CLEAN
   ├── INFECTED → INFECTED
   └── erreur/type non supporté → REJECTED
→ éventuelle DELETION_PENDING
→ DELETED avec conservation du tombstone de métadonnées
```

Un résultat propre ne libère jamais automatiquement le fichier. La libération exige une identité serveur ou humaine enregistrée, un type MIME détecté autorisé, les versions du moteur et des signatures, une date de fin de scan et une empreinte identique au binaire mis en quarantaine.

## Contrôles obligatoires

- aucune URL HTTP ou HTTPS n'est stockée comme référence de fichier ;
- aucune clé, aucun secret ni identifiant de fournisseur n'est stocké dans Git ou dans les métadonnées ;
- les noms d'origine ne sont pas utilisés dans les clés objet ;
- l'extension et le type déclaré par le navigateur ne sont jamais considérés comme fiables ;
- la taille maximale de la baseline est de 50 Mio ;
- les fichiers HTML, SVG, JavaScript, exécutables et archives ZIP sont refusés par défaut ;
- les formats autorisés sont PDF, DOCX, XLSX, PNG et JPEG après détection serveur ;
- les lectures exigent une autorisation tenant par tenant et utilisent `attachment` avec `private, no-store` ;
- un gel juridique interdit la suppression ;
- un objet lié à une preuve vérifiée ne peut plus perdre son état `CLEAN` ;
- les champs de contenu, de stockage, de chiffrement et de scan d'un objet libéré sont immuables.

## Implémentation locale

`createDevelopmentFilesystemEvidenceStore` applique la quarantaine, les empreintes, les permissions de fichiers, les types autorisés, la libération explicite, l'isolation logique du tenant et le gel juridique.

Cette implémentation déclare toujours :

```text
productionReady = false
encryptionAlgorithm = NONE_DEVELOPMENT_ONLY
```

Elle ne doit pas être sélectionnée en production.

## Dépendances avant production

La mise en production exige encore une décision d'architecture et une configuration réelle pour :

- un stockage objet privé avec chiffrement serveur ;
- un KMS et une politique de rotation ;
- un moteur antivirus ou CDR administré ;
- des URL de lecture signées de courte durée générées uniquement par le backend ;
- la sauvegarde, la restauration et la réplication ;
- les journaux de téléchargement ;
- la rétention légale et la purge contrôlée ;
- la supervision des échecs de scan et de stockage.

## Preuves automatisées

- `database/tests/0002_secure_evidence_storage_test.sql` teste les invariants PostgreSQL ;
- `evidence-object-store.integration.ts` teste la quarantaine applicative ;
- `.github/workflows/security-policy.yml` bloque les régressions de scan, d'accès public, de rétention et de déclaration trompeuse de disponibilité en production.
