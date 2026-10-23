# Raccordement au serveur MCP — Regulatory

Statut : **préparé dans le dépôt ; admission et déploiement S1 non attestés**.

## Source et cible

- Dépôt : `chainsolutions-wealthtech/Regulatory`, branche canonique `main`.
- Déclaration machine : [mcp-target.json](mcp-target.json).
- Orchestrateur existant : `https://mcp.wealthtechinnovations.com/mcp` (MCP WealthTech / SSH Bridge).
- Serveur cible : S1, abonnement Plesk `wealthtechinnovations.com`.
- URL souhaitée : `https://regulatory.wealthtechinnovations.com/`.
- Le chemin applicatif réel et le port d'écoute doivent être attribués par le serveur après préflight, et ne sont pas présumés.

## Contrat d'exécution

Le serveur MCP conserve les identifiants GitHub et SSH **côté serveur**. Aucun jeton GitHub, secret SSH, jeton MCP, mot de passe, connexion PostgreSQL, clé S3 ou secret OIDC ne doit être ajouté à ce dépôt.

1. Vérifier les autorités MCP, l'allowlist S1, le propriétaire du vhost, les conflits de chemin et les symlinks.
2. Admettre le projet dans le registre du serveur, avec identité, claim, lock et preuve d'autorisation.
3. Résoudre un répertoire applicatif isolé, un port local et les dépendances PostgreSQL/S3/OIDC ; ne pas modifier les autres vhosts.
4. Récupérer un commit GitHub immuable, puis construire avec Node.js >=22, **sans** `REGULATORY_BASE_PATH=/regulatory` pour le sous-domaine dédié. Le `basePath` Next.js reste `/`.
5. Installer une configuration de reverse proxy pour la racine `/` du **seul vhost** `regulatory.wealthtechinnovations.com`, compatible avec Plesk ; ne pas réécrire les autres vhosts. Le chemin historique `/regulatory` est optionnel et n'est pas autorisé implicitement.
6. Tester les API, les assets Next.js, l'authentification, les redirections, la santé applicative et HTTPS.
7. Attester le SHA GitHub réellement déployé, journaliser les changements et conserver un rollback exploitable.

Le fichier `mcp-target.json` est **déclaratif** : il ne constitue pas un jeton d'accès, ne prouve pas l'admission dans le serveur MCP et ne doit pas déclencher automatiquement une écriture S1.

## Vérifications avant mise en production

- `npm run web:install`
- `npm run generate:web-catalog`
- `npm run web:typecheck`
- `npm run web:build` (sans `REGULATORY_BASE_PATH=/regulatory` pour la cible dédiée)
- `npm run web:test:api` dans un environnement de test adapté et isolé.

Les scripts et services externes doivent être contrôlés avant exécution sur S1. Ne jamais déclarer l'application conforme aux exigences réglementaires ni `ready_for_submission=true` par le seul fait d'un déploiement technique.

## Suivi

Mandat de raccordement : [MCP issue #349](https://github.com/Patricked-code/MCP/issues/349). La PR MCP #351 concerne GRT et ne doit pas être réutilisée sans vérification de périmètre.

**Blocage actuel :** le catalogue d'outils MCP exposé à cette conversation ne propose pas encore d'admission/provisionnement générique d'application pour cette cible. Il faut faire reconnaître le manifeste par le serveur et disposer de l'opération gouvernée correspondante avant toute création de répertoire ou déploiement.
