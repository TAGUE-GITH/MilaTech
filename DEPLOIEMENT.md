# Mise en ligne de MilaTech Management

Tout est gratuit : **Neon** (base PostgreSQL), **Render** (API Spring Boot), **Vercel** (site React) et **Brevo** (emails).
Aucun mot de passe ni aucune clé n'est écrit dans le code : on les saisit uniquement dans les tableaux de bord des hébergeurs.

```
Navigateur ──► Vercel (site React) ──► Render (API Spring Boot, Docker) ──► Neon (PostgreSQL)
                                                 └──► Brevo (emails « mot de passe oublié »)
```

Cette mise en ligne est une **démonstration** (`APP_DEMO=true`) : produits, clients et chiffres sont fictifs. La connexion des
clients (`/connexion`) propose « Essayer en tant que client », l'espace boutique (`/espace-boutique`) propose un compte par rôle
du personnel. Les vraies données de MilaTech iront dans une installation séparée, avec `APP_DEMO=false`.

## 1. Base de données — Neon

1. Sur [console.neon.tech](https://console.neon.tech), créer un projet `milatech` (région **Europe, Frankfurt**).
2. Cliquer sur **Connect**, décocher **Connection pooling**, puis choisir l'affichage **Parameters only**. On obtient :
   - `PGHOST` (par exemple `ep-xxxx.eu-central-1.aws.neon.tech`)
   - `PGDATABASE` (`neondb`), `PGUSER` et `PGPASSWORD`.
3. Les valeurs pour Render :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://PGHOST/neondb?sslmode=require` (remplacer `PGHOST`) |
| `DATABASE_USERNAME` | `PGUSER` |
| `DATABASE_PASSWORD` | `PGPASSWORD` |

Les tables sont créées automatiquement par Flyway au premier démarrage.

## 2. API — Render

1. Sur [dashboard.render.com](https://dashboard.render.com) : **New** → **Blueprint**, choisir le dépôt `MilaTech`.
   Render lit [`render.yaml`](render.yaml) et prépare le service `milatech-api` (Docker, région Frankfurt).
2. Saisir les valeurs demandées : les trois valeurs de Neon, `FRONTEND_URL` (adresse Vercel de l'étape 3, par exemple
   `https://milatech.vercel.app`, sans `/` final), puis `BREVO_API_KEY` et `MAIL_SENDER_EMAIL` (étape 4).
   `JWT_SECRET` est généré automatiquement par Render.
3. **Apply** : Render construit l'image Docker (5 à 10 minutes la première fois) puis démarre l'API.
   Vérification : `https://milatech-api.onrender.com/api/health` répond `{"status":"ok"}`.

Au premier démarrage, la démonstration est chargée : 16 produits (photos libres de droits téléchargées depuis Unsplash),
ventes, réparations, formations, commandes et devis, et 5 comptes (mot de passe `demo-milatech-2026`).

> Offre gratuite : le service s'endort après 15 minutes sans visite et met environ une minute à se réveiller.

## 3. Site — Vercel

1. Sur [vercel.com/new](https://vercel.com/new), importer le dépôt `MilaTech`.
2. **Root Directory** : `frontend` (Vercel détecte Vite).
3. **Environment Variables** : `VITE_API_URL` = `https://milatech-api.onrender.com` (sans `/` final).
4. **Deploy**. Le fichier [`frontend/vercel.json`](frontend/vercel.json) renvoie toutes les adresses vers l'application React.
5. Reporter l'adresse obtenue dans `FRONTEND_URL` sur Render (le service redémarre) : c'est la seule adresse autorisée
   à appeler l'API (CORS), et celle des liens envoyés par email.

## 4. Emails — Brevo

1. Sur [app.brevo.com](https://app.brevo.com) : **Senders, Domains & Dedicated IPs** → vérifier l'adresse d'expédition.
   C'est `MAIL_SENDER_EMAIL`.
2. **SMTP & API** → **API Keys** → **Generate a new API key** : c'est `BREVO_API_KEY`.

Les emails partent par l'API web de Brevo : Render bloque les ports SMTP sur l'offre gratuite.
Aucun email n'est jamais envoyé aux comptes de démonstration (adresses en `@demo.milatech.cm`).

## 5. Compte du propriétaire (gérant privé)

Les comptes de démonstration sont publics. Pour avoir son propre compte gérant :

1. Sur Render, **Environment** : ajouter `BOOTSTRAP_EMAIL` (son email) et `BOOTSTRAP_PASSWORD` (un mot de passe provisoire),
   puis **Save Changes** (le service redémarre).
2. Au démarrage, ce compte gérant est créé s'il n'existe pas encore. Un compte existant n'est jamais modifié.
3. Se connecter avec ce compte, puis changer le mot de passe dans **Mon profil**.
4. Supprimer ensuite `BOOTSTRAP_PASSWORD` sur Render : il ne sert plus.

Ce compte reçoit les emails « mot de passe oublié » et peut créer les comptes des employés (menu **Employés**).

## Pour la vraie boutique (plus tard)

Une installation séparée (nouveau projet Neon, nouveau service Render) avec :
- `APP_DEMO` = `false` : aucune donnée fictive, pas de comptes publics ;
- `BOOTSTRAP_EMAIL` et `BOOTSTRAP_PASSWORD` : le premier compte gérant, créé au démarrage si la base est vide
  (le gérant change ensuite son mot de passe dans son profil).

## Mises à jour

Chaque `git push` sur `main` lance les tests (GitHub Actions), puis Render et Vercel redéploient automatiquement.
