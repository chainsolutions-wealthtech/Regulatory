# Historique et comparaison des versions projet

## Statut

Implémenté le 2026-08-17 sur la branche canonique `main` comme capacité **strictement en lecture seule**.

Cette fonctionnalité expose les versions déjà persistées par les deux drivers du produit sans ajouter de mécanisme de restauration, d'activation ou d'approbation automatique. Elle complète le versionnement qui existait déjà dans le filesystem local et dans `regulatory.project_versions` côté PostgreSQL.

## Architecture

Le contrat de lecture est isolé dans `apps/web/src/server/storage/project-version-repository.ts` afin de ne pas élargir le port transactionnel `ProjectRepository` avec des opérations susceptibles d'être confondues avec une restauration.

Deux implémentations sont disponibles :

- `localProjectVersionRepository` lit les snapshots `versions/NNNNN.json` déjà persistés par le prototype local ;
- `createPostgresProjectVersionRepository` relit `project_versions`, `project_answers`, `canonical_snapshots` et les métadonnées de génération dans une transaction PostgreSQL `READ ONLY` après résolution de l'identité vérifiée et contrôle de l'appartenance au tenant.

Le calcul de différences est centralisé dans `apps/web/src/server/project-version-diff.ts`. Il compare uniquement les valeurs de réponses persistées. Les clés des objets sont triées avant sérialisation afin que le résultat ne dépende pas de l'ordre d'insertion JSON.

## API

### Liste des versions

`GET /api/projects/{projectId}/versions`

Retourne la version courante, les versions conservées, leur date, leur nombre de réponses et leur état de gel. La réponse porte explicitement `readOnly=true` et `readyForSubmission=false`.

### Snapshot historique

`GET /api/projects/{projectId}/versions/{version}`

Retourne une vue historique hydratée du projet. Une version invalide retourne `422`; un projet ou une version inexistante retourne `404`.

### Diff déterministe

`GET /api/projects/{projectId}/versions/diff?from={n}&to={m}`

Retourne :

- `changedAnswerIds[]` ;
- `addedAnswerIds[]` ;
- `removedAnswerIds[]` ;
- les compteurs correspondants ;
- `readOnly=true` ;
- `readyForSubmission=false`.

Aucun endpoint `POST`, `PUT`, `PATCH` ou `DELETE` n'est exposé pour l'historique.

## Interface

La navigation projet contient une section `Versions` desservie par `/projects/{projectId}/versions`.

La page est un Server Component : elle lit directement les repositories côté serveur, évite un second fetch navigateur et n'introduit aucun état client pour une fonctionnalité qui doit rester consultative. Elle permet de sélectionner deux versions et d'afficher les identifiants de réponses ajoutées, supprimées ou modifiées.

## Validation

Le test HTTP `scripts/test-web-versions-api.mjs` vérifie notamment :

- historique accessible ;
- tri décroissant ;
- lecture d'un snapshot historique ;
- diff déterministe ;
- rejet d'une version inexistante ;
- maintien de `readyForSubmission=false`.

Le test écrit `regulatory/validation/WEB_PROJECT_VERSION_HISTORY_VALIDATION.json` comme preuve de boucle.

Le backend initial a été développé en TDD : le test échouait d'abord sur l'absence de `/versions`, puis la Regulatory CI complète a validé l'implémentation sur le run `32057602211` avec PostgreSQL, TypeScript, build Next.js, API HTTP, moteur, DOCX, PDF et invariants tous au vert.

## Frontières de sécurité

Cette fonctionnalité ne signifie pas :

- qu'une version historique est juridiquement approuvée ;
- qu'une version peut être restaurée automatiquement ;
- qu'une version gelée peut être dégelée ;
- qu'un diff produit une décision de conformité ;
- que le projet est prêt pour soumission.

Toute future restauration devra être conçue comme une **nouvelle version dérivée**, auditable et explicitement autorisée, jamais comme une réécriture silencieuse de l'historique.
