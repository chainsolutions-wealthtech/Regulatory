# SECURITY — Politique de sécurité documentaire

> **Statut :** `APPLICABLE`

## Règles obligatoires

- aucun secret, jeton, mot de passe, clé privée ou donnée sensible dans Git ;
- moindre privilège et accès limités aux besoins ;
- provenance et empreinte des preuves ;
- séparation entre faits publics, documents privés et données personnelles ;
- aucune donnée de production modifiée dans une mission documentaire ;
- aucune commande ou configuration inventée ;
- revue humaine avant toute décision de sécurité ou de production.

## Signalement

Un secret détecté impose l’arrêt, la non-réplication, l’escalade et la rotation par un humain autorisé. Le secret ne doit pas être recopié dans un issue, un log ou un rapport.

## Documents liés

`docs/08-security/`, `docs/10-ai/TOOL_POLICY.md`, `RISKS.md`, `OPEN_QUESTIONS.md`.

## Checklist

- [ ] aucun secret ;
- [ ] données personnelles minimisées ;
- [ ] accès et preuves contrôlés ;
- [ ] risques documentés ;
- [ ] approbations requises identifiées.
