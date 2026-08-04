# TEST_MATRIX — Matrice de tests

> **Statut :** `APPLICABLE`

| Domaine | Cas nominal | Limites/erreurs | Non-régression | Preuve |
|---|---|---|---|---|
| Sources réglementaires | métadonnées valides | source absente/version inconnue | empreinte stable | manifeste |
| Exigences | identifiants uniques | doublons/références brisées | mapping complet | validation JSON |
| Questions | branche attendue | réponses incompatibles | graphe stable | snapshots |
| Règles | PASS attendu | BLOCKER/WARNING | messages et champs stables | résultats |
| Clauses | variables valides | clause non approuvée | version inchangée | manifeste génération |
| Document | ordre et tableaux | données manquantes | rendu déterministe | DOCX/PDF snapshot |
| Sécurité | accès autorisé | secret/accès refusé | journal stable | rapports |

Chaque ligne future doit préciser version, environnement, responsable, résultat et anomalie. Les commandes restent à définir.
