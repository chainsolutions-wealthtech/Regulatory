# Corpus de régression multi-profils

## Objet

Ce corpus protège le moteur de composition contre les régressions transversales sans introduire de nouvelle vérité réglementaire.

Les profils sont **strictement synthétiques**. Les noms, classifications de test, objectifs et fourchettes utilisés dans `test/multi-profile-corpus.test.js` servent uniquement à exercer le code. Ils ne doivent jamais être repris comme paramètres réglementaires, commerciaux ou produits réels.

## Profils exercés

- `bond-active` : profil obligataire actif dérivé de la fixture historique ;
- `balanced` : combinaison synthétique actions/dette destinée à exercer plusieurs risques dérivés ;
- `conservative-debt` : profil synthétique dette/monétaire sans exposition actions ;
- `no-redemption-edge` : cas limite synthétique avec rachat désactivé.

## Invariants obligatoires

Pour chaque profil :

1. deux exécutions sur le même snapshot doivent produire le même `generation_id` ;
2. le hash Markdown doit être identique entre deux exécutions ;
3. le Markdown lui-même doit être identique ;
4. les 62 exigences CIRC005 doivent rester présentes dans la concordance ;
5. `ready_for_submission` doit rester `false` ;
6. des profils distincts ne doivent pas s'effondrer vers le même identifiant ou le même hash documentaire.

Le fichier `test/submission-invariant-mutations.test.js` ajoute des mutations négatives : faux flag de readiness, faux statut d'approbation, fausses revues et réponses manquantes. Aucune de ces mutations ne peut activer implicitement la soumission ni supprimer silencieusement des exigences de la concordance.

## Golden masters

Les golden masters sont désormais persistés dans `test/fixtures/MULTI_PROFILE_GOLDEN_MASTERS_V1.json`.

Ils proviennent exclusivement du run Regulatory CI `34631652716`, conclu `success` sur le HEAD source `0ef950c1cf446c78bf902672631fda8b7c8ed384`. Le commit de preuve généré `32693f802fe3bb598ed53ebe3b209247805d99f7` est un enfant direct de ce HEAD. Le SHA Git source lie cryptographiquement le code, les fixtures et les entrées ayant produit les valeurs figées.

Pour chaque profil, la recette compare désormais le `generation_id` et le SHA-256 Markdown aux valeurs attestées. Elle conserve aussi `requirement_count=62` et `ready_for_submission=false`.

Une mise à jour de golden master est interdite comme mécanisme automatique de réparation. Elle n'est recevable qu'après un changement intentionnel, une nouvelle exécution CI réussie du HEAD exact et une mise à jour gouvernée de la preuve. Les golden masters restent strictement synthétiques et ne deviennent jamais une vérité réglementaire.

## Limites

Ce corpus ne vaut ni validation juridique, ni conformité réglementaire, ni recette de production. Il complète les tests CIRC005, PostgreSQL, API, navigateur, accessibilité et sécurité ; il ne remplace pas les sources officielles, les revues humaines ou l'acceptation d'infrastructure cible.
