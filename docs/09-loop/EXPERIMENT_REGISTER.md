# EXPERIMENT_REGISTER — Registre des expérimentations

> **Statut :** `APPLICABLE`

| ID | Boucle | Hypothèse | Protocole | Données | Critère | Risque | Résultat | Décision |
|---|---|---|---|---|---|---|---|---|

## Règles

Une expérimentation est bornée, réversible et séparée d’une décision de production. Les données sont synthétiques ou autorisées. Les sources, versions et paramètres sont conservés. Aucun test ne modifie un artefact réglementaire actif, une donnée de production ou l’historique Git.

L’IA peut proposer un protocole mais ne valide pas seule une interprétation juridique. Les résultats négatifs ou inconclusifs sont conservés.

## Checklist

- [ ] hypothèse réfutable ;
- [ ] protocole et critères avant exécution ;
- [ ] risque et rollback ;
- [ ] preuve reproductible ;
- [ ] décision et leçon enregistrées.
