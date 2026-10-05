# ADR-0010 — Continuité multi-session et watchdog repository-native

- Statut : ACCEPTED
- Date : 2026-10-05

## Contexte

Le projet dépasse régulièrement la durée ou le contexte d'une session d'agent. Git conserve le code, mais une reprise peut perdre l'intention, l'état des CI, la prochaine action ou la distinction entre blocage externe et travail sûr.

## Décision

Le dépôt adopte un checkpoint machine-readable, une politique de seuils, un watchdog GitHub Actions toutes les 30 minutes et un contrat d'agent externe compatible avec un runner ultérieur.

Le watchdog observe mais ne code pas. La continuité d'écriture passe par un agent gouverné qui lit le checkpoint, obtient un lease logique, réalise une mini-tâche et attend les CI.

## Sécurité

Aucune branche nouvelle, force-push, activation réglementaire, approbation humaine simulée ou soumission n'est autorisée. ready_for_submission=false reste obligatoire.

## Conséquence

Un fournisseur d'agent externe peut être raccordé sans changer les règles métier. Il doit implémenter ops/continuity/EXTERNAL_AGENT_CONTRACT.md et conserver les secrets hors dépôt.
