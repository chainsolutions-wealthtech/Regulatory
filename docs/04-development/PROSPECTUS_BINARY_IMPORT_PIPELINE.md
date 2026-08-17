# Pipeline d’import prospectus PDF/DOCX

## Statut

Implémenté comme pipeline de pré-conformité. Aucune valeur extraite n’est automatiquement canonique et aucune extraction ne rend un dossier prêt à la soumission.

## Chaîne gouvernée

1. Un binaire de preuve est d’abord stocké dans le `EvidenceObjectStore`.
2. Une preuve brute reste `QUARANTINED` avec `scanStatus=PENDING`.
3. Seule une preuve libérée `CLEAN` et rattachée à la bonne organisation/version de projet peut être relue pour extraction.
4. `EVIDENCE_READ` est contrôlé avant la lecture du binaire.
5. Le binaire PDF ou DOCX est transformé en texte par un extracteur déterministe et conservateur.
6. Seuls des libellés explicitement reconnus produisent des propositions ; les ambiguïtés sont ignorées.
7. Les propositions sont créées en `EXTRACTED_UNVERIFIED`, avec ancre de provenance et confiance strictement inférieure à 1.
8. Le batch est persisté dans le staging PostgreSQL.
9. La revue humaine peut confirmer ou rejeter une proposition sans écrire dans le modèle canonique.
10. La promotion vers une réponse canonique reste une action distincte, explicite, RBAC-gated et versionnée.

## Extracteur texte

Les règles V1 couvrent volontairement un périmètre étroit :

- `fund.legal_name` ;
- `fund.legal_form` (`FCP` / `SICAV`) ;
- `fund.duration_type` ;
- `accounting.financial_year_end_display`.

Une valeur n’est proposée que si le document produit une valeur normalisée non ambiguë pour le champ. Le moteur ne tente pas de compléter le document par déduction libre.

## DOCX

Le DOCX est lu localement depuis `word/document.xml` sans dépendance npm supplémentaire. Le lecteur impose :

- taille source maximale ;
- nombre maximal d’entrées ZIP ;
- taille maximale du XML décompressé ;
- contrôles de bornes ;
- seulement les méthodes ZIP `stored` et `deflate` ;
- rejet explicite des archives invalides ou des méthodes inconnues.

Ces protections réduisent notamment le risque de ZIP bomb. Elles ne constituent pas un scanner antivirus.

## PDF

Le fournisseur PDF par défaut invoque `pdftotext` avec `execFile`, jamais via un shell. Il impose :

- timeout ;
- limite de taille du texte produit ;
- répertoire temporaire dédié ;
- suppression du répertoire en `finally` ;
- provenance par numéro de page lorsque disponible.

L’absence de `pdftotext` est un échec explicite ; aucun fallback OCR ou IA silencieux n’est utilisé.

## Runtime

Le endpoint d’extraction est `POST /api/projects/:projectId/imports`. Il reçoit uniquement :

- `projectVersion` ;
- `projectVersionId` ;
- `evidenceObjectId`.

Il n’accepte pas de fichier brut. Le service relit lui-même la preuve CLEAN via le store privé.

En `local-json`, l’extraction retourne `503`. En PostgreSQL hors production, le store filesystem de développement n’est utilisable que si `REGULATORY_EVIDENCE_DRIVER=filesystem-development` et `REGULATORY_EVIDENCE_ROOT` sont explicitement fournis. Ce driver est interdit lorsque `NODE_ENV=production`.

## Production encore bloquée

Un object store privé de production, le KMS réel et le scanner antivirus réel ne sont pas inventés par le repository. Tant qu’ils ne sont pas provisionnés et branchés, le pipeline de production reste volontairement incomplet.

## Invariants

- `canonicalWriteAllowed=false` après extraction et staging ;
- `readyForSubmission=false` ;
- aucune promotion automatique ;
- aucune preuve non CLEAN n’est lisible par le pipeline ;
- aucune extraction ne vaut validation juridique, conformité ou approbation réglementaire.
