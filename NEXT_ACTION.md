# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-DEV-001`

## Action

Créer le composant structuré des fourchettes d’allocation par classe d’actifs et écrire ses lignes directement dans `investment_policy.asset_class_ranges[]`.

## Résultat attendu

- lignes répétables avec identifiant stable ;
- classe d’actifs normalisée ;
- minimum, cible et maximum exprimés en pourcentage ;
- contrôle `0 ≤ minimum ≤ cible ≤ maximum ≤ 100` ;
- détection des classes d’actifs dupliquées ;
- reprise non destructive des anciennes réponses provisoires ;
- aucune écriture dans `_repeating` pour cette collection ;
- restitution dans la politique d’investissement et le DOCX ;
- tests unitaires, TypeScript, build et test HTTP de bout en bout ;
- documentation et preuves mises à jour ;
- `ready_for_submission = false` maintenu.

## Condition d’arrêt

Ne pas déployer, ne pas inventer de limites réglementaires et ne pas présenter les fourchettes saisies ou le document généré comme validés juridiquement, approuvés ou prêts pour soumission.
