<h1 align="center">MilaTech Management</h1>

**Application web de gestion interne pour MilaTech**, une entreprise camerounaise d'électronique : ventes, stock d'appareils et de composants, réparations (téléphones, ordinateurs, appareils Bluetooth) et formations en présentiel, dans un seul outil utilisable sur ordinateur et sur téléphone.

![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)
![CI](https://github.com/TAGUE-GITH/MilaTech/actions/workflows/ci.yml/badge.svg)

> **État du projet :** les 8 sprints sont terminés (mot de passe oublié, démonstration avec données fictives). Mise en ligne : voir [DEPLOIEMENT.md](DEPLOIEMENT.md).

## Le besoin

MilaTech gère aujourd'hui ses activités au cahier et sur WhatsApp : stock incertain, ventes et paiements difficiles à suivre, appareils en réparation perdus de vue, apprenants sans liste fiable. MilaTech Management **centralise** ces informations et applique les règles métier (stock jamais négatif, prix figés, suivi des acomptes).

## Fonctionnalités

| Module | Contenu |
|---|---|
| 📦 Stock | Produits (référence, prix d'achat et de vente, seuil d'alerte), fournisseurs, achats, inventaire, historique des mouvements, alertes |
| 🛒 Ventes | Caisse, paiement espèces ou Mobile Money, reçu PDF, historique, marge théorique |
| 🔧 Réparations | Dossier de dépôt et bon PDF, diagnostic, pièces prises dans le stock, statuts, acomptes, message WhatsApp quand l'appareil est prêt |
| 🎓 Formations | Sessions, inscriptions, paiements en plusieurs fois, liste des apprenants |
| 📊 Tableau de bord | Ventes du jour, stock bas, réparations en cours et prêtes, soldes à encaisser |
| 👥 Comptes | Gérant, vendeurs, techniciens, formateurs : chacun ne voit que ce qui le concerne ; photo de profil pour tous |
| 🌐 Site public | Vitrine de la boutique (Bonas, Yaoundé), formulaire de contact, comptes clients et « Mon espace » |
| 🛍️ Boutique en ligne | Produits disponibles avec photo, panier, commande avec retrait en boutique ou livraison à Yaoundé, paiement à la remise ; articles réservés dans le stock ; suivi par le client, traitement par la boutique (la commande remise devient une vente) |
| 🔧 Devis en ligne | Le client décrit la panne (avec photo), la boutique répond avec un prix, le client accepte puis dépose l'appareil (la réparation est ouverte avec ce prix) ; le client suit ses réparations dans son espace, sans les notes internes |

## Conception (Sprint 0)

| Document | Contenu |
|---|---|
| [Cahier des charges](docs/01-cahier-des-charges.md) | Contexte, rôles, fonctionnalités, règles métier, exigences |
| [User stories](docs/02-user-stories.md) | 25 user stories, critères d'acceptation, sprints, définition de « terminé » |
| [Modèle de données](docs/03-modele-de-donnees.md) | Schéma entité-relation (Mermaid) et choix de conception |
| [Architecture](docs/04-architecture.md) | Technologies, organisation du code, environnements |
| [Organisation](docs/05-organisation.md) | Scrum, Kanban, Git, qualité |

## Avancement

| Sprint | Contenu | État |
|---|---|---|
| 0 | Conception, environnement, intégration continue | ✅ |
| 1 | Comptes et rôles, catalogue, stock | ✅ |
| 2 | Clients et ventes | ✅ |
| 3 | Réparations | ✅ |
| 4 | Formations et tableau de bord | ✅ |
| 5 | Site public (vitrine, contact), comptes clients, espace personnel et photo de profil | ✅ |
| 6 | Boutique en ligne : catalogue avec photos, panier, commandes (retrait ou livraison), traitement par la boutique | ✅ |
| 7 | Devis de réparation en ligne (avec photo), réponse de la boutique, suivi des réparations par le client | ✅ |
| 8 | Mot de passe oublié (Brevo), démonstration (données fictives, un compte par rôle), guide de mise en ligne | ✅ |

## Lancer le projet en local

Prérequis : Java 21 et Node.js 22. Aucune base à installer : en développement, l'API utilise H2 en mémoire et crée un compte gérant local : `gerant@milatech.test` / `milatech-dev-2026` (développement uniquement).

```bash
cd backend && ./mvnw spring-boot:run     # API sur http://localhost:8080
cd frontend && npm install && npm run dev  # interface sur http://localhost:5173
```

Avec Docker (API + PostgreSQL) : `docker compose up --build`.

## Tests

```bash
cd backend && ./mvnw test    # 113 tests : JUnit 5, Mockito, MockMvc
cd frontend && npm test      # 66 tests : Vitest, Testing Library
```

Les tests sont écrits avant le code (TDD) à partir des critères d'acceptation. GitHub Actions les exécute à chaque envoi, avec une vraie base PostgreSQL.

## Données

La version publique utilise des **données fictives**. Les données réelles de MilaTech restent privées.
