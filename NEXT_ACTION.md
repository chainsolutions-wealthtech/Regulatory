# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-DEV-001`

## Action

Remplacer les saisies génériques des données répétables du questionnaire par des composants structurés et typés, puis écrire directement leurs valeurs dans les collections canoniques consommées par le compositeur documentaire.

## Périmètre prioritaire

- classes de parts ;
- fourchettes d’allocation par classe d’actifs ;
- commissions et frais ;
- méthodes de valorisation ;
- membres de gouvernance et autres intervenants ;
- listes de pays, activités et documents justificatifs.

## Résultat attendu

- composants Atomic Design réutilisables pour les tableaux et collections ;
- validation de chaque ligne avant persistance ;
- identifiants stables pour les éléments répétables ;
- écriture directe dans les tableaux canoniques au lieu de `_repeating` ;
- reprise non destructive des anciennes réponses provisoires ;
- génération documentaire générique inchangée et sans régression ;
- tests unitaires, TypeScript, build et test HTTP de bout en bout ;
- documentation et preuves mises à jour ;
- `ready_for_submission = false` maintenu.

## Condition d’arrêt

Ne pas déployer, ne pas inventer d’authentification ou de données réglementaires et ne pas présenter le document généré comme conforme, visé, approuvé ou prêt pour soumission.
