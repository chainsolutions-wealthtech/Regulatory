# AUDIT_TRAIL — Registre d’audit documentaire

> **Statut :** `APPLICABLE`

## Finalité

Conserver la chronologie des actions significatives, leurs auteurs, objets, anciennes et nouvelles valeurs, raisons, versions, preuves et identifiants de corrélation. Git reste la preuve primaire des modifications de fichiers; ce registre décrit les événements métier ou de gouvernance qui dépassent un simple commit.

## Propriétaire et lecteurs

Propriétaire : `À DÉFINIR — information non fournie ou non vérifiée à ce stade du projet.` Lecteurs obligatoires : audit, conformité, juridique, sécurité et mainteneurs selon le sujet.

## Modèle

| Date | Événement | Acteur | Objet | Avant | Après | Raison | Preuve |
|---|---|---|---|---|---|---|---|

## Règles

- aucune entrée supprimée ou réécrite ;
- correction par nouvelle entrée ;
- aucun secret ou donnée personnelle inutile ;
- relier tâches, boucles, commits, décisions et sources ;
- l’IA peut préparer une entrée mais ne peut inventer l’acteur ou la validation.

## Checklist

- [ ] événement daté ;
- [ ] provenance vérifiable ;
- [ ] changements et raison explicites ;
- [ ] preuve non sensible ;
- [ ] liens cohérents.
