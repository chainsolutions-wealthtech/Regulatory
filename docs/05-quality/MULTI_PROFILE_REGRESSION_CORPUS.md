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

Le dépôt protège actuellement le déterminisme par comparaison répétée du même snapshot et par invariants sémantiques. Il ne fige pas encore de hashes multi-profils comme vérité durable tant qu'un run CI réussi n'a pas produit et attesté ces valeurs. Cette règle évite d'inventer des golden hashes sans exécution réelle.

Une future promotion vers des golden masters persistés devra :

- provenir d'un run CI réussi sur le HEAD exact ;
- conserver la fixture comme synthétique ;
- inclure le hash du snapshot d'entrée, le `generation_id`, le hash documentaire et la version du moteur/catalogue ;
- échouer sur toute dérive non explicitement approuvée ;
- ne jamais modifier `ready_for_submission=false`.

## Limites

Ce corpus ne vaut ni validation juridique, ni conformité réglementaire, ni recette de production. Il complète les tests CIRC005, PostgreSQL, API, navigateur, accessibilité et sécurité ; il ne remplace pas les sources officielles, les revues humaines ou l'acceptation d'infrastructure cible.
