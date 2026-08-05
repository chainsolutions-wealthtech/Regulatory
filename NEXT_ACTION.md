# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-DEV-001`

## Action

Faire consommer le `canonical-snapshot.json` de chaque projet Next.js par le compositeur documentaire historique afin de produire, pour tout projet web, le modèle documentaire, le prospectus Markdown, la table de concordance, le rapport de contrôles et le DOCX déterministe.

## Résultat attendu

- contrat d’adaptation snapshot web → données du compositeur ;
- aucune logique propre au seul cas United Capital Diamond ;
- génération déterministe pour un même snapshot ;
- traçabilité question → champ → exigence → composant → document ;
- conservation des `PENDING_REVIEW` et des réponses historiques non mappées ;
- sorties versionnées dans le dossier de génération du projet ;
- tests de non-régression et d’intégration ;
- documentation et preuves mises à jour ;
- `ready_for_submission = false` maintenu.

## Condition d’arrêt

Ne pas déployer, ne pas créer d’authentification fictive et ne pas présenter les livrables comme conformes, visés, approuvés ou prêts pour soumission.
