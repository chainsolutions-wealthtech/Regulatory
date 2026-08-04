# RESTART_PROTOCOL — Protocole de reprise

> **Statut :** `APPLICABLE`

## Reprise après interruption

1. lire `00_START_HERE.md` ;
2. vérifier branche et dernier commit ;
3. lire `STATUS.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md`, `HANDOFF.md` et `NEXT_ACTION.md` ;
4. inspecter les diffs et commits depuis le point de départ ;
5. confirmer les tâches terminées, en cours et bloquées ;
6. exécuter un health check ;
7. reprendre uniquement l’action explicitement transmise.

## Règles

Ne pas demander au propriétaire de répéter ce qui est déjà dans Git. Ne pas supposer qu’une action annoncée a été terminée sans preuve. Ne pas créer ou changer de branche. Toute divergence est consignée avant continuation.

## Checklist

- [ ] état réconcilié ;
- [ ] artefacts et identifiants vérifiés ;
- [ ] risques et questions lus ;
- [ ] action bornée confirmée.
