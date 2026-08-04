# SECRETS_MANAGEMENT — Gestion des secrets

> **Statut :** `À DÉTERMINER`

## Règles permanentes

- aucun secret dans Git, Markdown, issues, logs, captures ou données de test ;
- utilisation future d’un coffre et d’identités au moindre privilège ;
- séparation par environnement ;
- rotation, expiration, révocation et audit ;
- jamais de valeur réelle dans les exemples ;
- arrêt et escalade en cas de détection.

## Incident

Ne pas recopier le secret. Identifier l’emplacement, prévenir un humain autorisé, révoquer/faire tourner, analyser l’exposition et documenter sans valeur sensible.

Outils, propriétaires et périodicité : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.`

## Checklist

- [ ] aucune valeur réelle ;
- [ ] accès minimal ;
- [ ] rotation définie ;
- [ ] scans prévus ;
- [ ] procédure d’incident connue.
