# Organisation du travail

## Méthode : Scrum + Kanban

- **Sprints de 2 semaines** avec un objectif clair (voir [user stories](02-user-stories.md)).
- **Tableau Kanban** (GitHub Projects) : `À faire → En cours → En revue → Terminé`, avec une limite de 2 cartes « En cours » par personne.
- **Rituels** :
  - planification en début de sprint (choix des user stories, estimation en points) ;
  - point quotidien court (fait hier, prévu aujourd'hui, blocages) ;
  - revue de sprint avec le gérant de MilaTech (démonstration, retours) ;
  - rétrospective (ce qui marche, ce qu'on améliore).

## Git et GitHub

- Branche `main` toujours stable et déployable.
- Une branche par user story : `feature/US-11-vente-comptoir`.
- **Pull request** obligatoire : intégration continue verte et relecture avant la fusion.
- Messages de commit clairs, en français, qui disent ce qui change pour l'utilisateur.

## Qualité

- **TDD** : le test est écrit à partir du critère d'acceptation, il échoue, puis le code le fait passer.
- Tests du backend : JUnit 5, Mockito pour les services, MockMvc pour l'API.
- Tests du frontend : Vitest et Testing Library.
- Intégration continue (GitHub Actions) à chaque envoi : compilation, tests, construction de l'interface.

## Retours du gérant

Les hypothèses du [cahier des charges](01-cahier-des-charges.md#2-hypothèses-de-départ-à-confirmer-avec-le-gérant) sont validées avec le gérant de MilaTech pendant la revue du sprint 1. Les besoins réels priment : les sprints suivants sont réordonnés si nécessaire.
