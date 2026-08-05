# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`  
> **Boucle :** `LOOP-DEV-001`

## Action

Connecter l’application Next.js au catalogue réglementaire exécutable du dépôt afin que les groupes, questions, conditions, champs, exigences et statuts de couverture soient générés depuis les matrices et registres canoniques plutôt que maintenus dans un catalogue TypeScript provisoire.

## Résultat attendu

- adaptateur matrice → catalogue web ;
- aucun identifiant CIRC005 dupliqué ;
- questions regroupées et ordonnées depuis les données canoniques ;
- conditions et effets testés ;
- invalidation des réponses devenues inapplicables ;
- tests d’intégration API ;
- génération d’un snapshot exploitable par le moteur DOCX ;
- documentation mise à jour ;
- `ready_for_submission = false` maintenu.

## Condition d’arrêt

L’application reste locale et non déployée. Ne pas ajouter d’authentification fictive, ne pas utiliser la persistance JSON comme base de production et ne pas déclarer le prospectus conforme ou prêt pour soumission.
