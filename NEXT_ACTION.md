# NEXT_ACTION — Action unique immédiatement exécutable

> **Statut :** `READY`  
> **Boucle :** `LOOP-DEV-001`

## Action

Créer la première API locale du questionnaire dynamique et du projet de prospectus, afin de charger le catalogue CIRC005, retourner les groupes et questions applicables, enregistrer les réponses structurées, recalculer le modèle canonique et générer l’aperçu Markdown/DOCX.

## Entrées obligatoires

- `src/core/questionnaire-engine.js` ;
- `src/core/generation-service.js` ;
- `regulatory/matrices/CIRC005_FCP_MATRIX_*.csv` ;
- `examples/united-capital-diamond/` ;
- `scripts/generate_docx.py`.

## Résultat attendu

- serveur HTTP local sans dépendance ou avec choix technique documenté ;
- endpoint de création d’un projet ;
- endpoint de lecture des questions applicables ;
- endpoint d’enregistrement contrôlé d’une réponse ;
- endpoint de génération de l’aperçu ;
- persistance locale versionnée et isolée de la production ;
- tests d’intégration ;
- aucune authentification fictive présentée comme sécurisée ;
- aucune soumission au régulateur.

## Condition d’arrêt

L’API reste un prototype local. Elle ne doit ni exposer des données sensibles, ni être déployée, ni être présentée comme prête pour la production.
