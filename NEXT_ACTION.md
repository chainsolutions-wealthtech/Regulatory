# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`
> **Boucle :** `LOOP-DEV-001`

## Action

Construire le socle d’authentification, de RBAC et de workflow de revue sans choisir fictivement un fournisseur d’identité : définir les politiques machine-readable, les autorisations par action, les transitions d’état, les décisions et les tests, puis conserver l’intégration fournisseur derrière un port explicitement non configuré.

## Résultat attendu

- modèle des rôles Administrateur, Produit, Risques, Conformité, Juridique, Fiscal, Opérations, Audit et Lecteur ;
- matrice action × rôle × ressource ;
- vérification serveur de chaque action sensible ;
- transitions de workflow déterministes ;
- demandes de revue, commentaires, changements demandés, approbations et rejets ;
- aucune auto-approbation ;
- séparation entre gel interne, approbation interne et décision du régulateur ;
- tests positifs et négatifs multi-rôles ;
- port du fournisseur d’identité non configuré en production ;
- `ready_for_submission=false` maintenu.

## Condition d’arrêt

Ne pas simuler une connexion, un SSO ou une signature. L’activation d’un fournisseur d’identité et des sessions nécessite des paramètres réels, des secrets hors dépôt et une revue de sécurité.
