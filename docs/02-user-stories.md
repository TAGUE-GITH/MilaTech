# User stories et découpage en sprints

Priorités : **M** = indispensable, **S** = important, **C** = souhaitable. Les points estiment l'effort (suite de Fibonacci).

## Comptes et sécurité

**US-01 — Connexion** · M · 3 pts
En tant qu'employé, je veux me connecter avec mon email et mon mot de passe pour accéder à l'application.
- Mot de passe chiffré (BCrypt) ; jeton JWT ;
- Message clair si les identifiants sont faux ; compte désactivé refusé.

**US-02 — Comptes des employés** · M · 5 pts
En tant que gérant, je veux créer les comptes de mes employés et leur donner un rôle (vendeur, technicien, formateur).
- Je peux désactiver un compte ; je ne peux pas me désactiver moi-même ;
- Chaque employé ne voit que les menus de son rôle ; le serveur refuse les actions interdites (403).

**US-03 — Mot de passe oublié** · S · 3 pts
En tant qu'employé, je veux recevoir un lien pour choisir un nouveau mot de passe.

## Catalogue et stock

**US-04 — Catégories et fournisseurs** · M · 2 pts
En tant que gérant, je veux classer mes produits par catégorie (téléphones, accessoires, composants, pièces détachées…) et enregistrer mes fournisseurs.

**US-05 — Produits** · M · 5 pts
En tant que gérant, je veux enregistrer un produit avec sa référence unique, son nom, sa catégorie, sa description, son prix d'achat, son prix de vente, son seuil d'alerte et son fournisseur.
- Le prix de vente ne peut pas être inférieur ou égal à 0 ; la référence est unique ;
- Recherche par nom ou référence, filtre par catégorie ;
- Les vendeurs ne voient pas le prix d'achat.

**US-06 — Entrée de stock (achat)** · M · 3 pts
En tant que gérant, je veux enregistrer un achat fournisseur (produit, quantité, prix d'achat unitaire) pour augmenter le stock.
- Exemple : 10 composants achetés 2 000 FCFA l'unité → stock +10 ;
- Le prix d'achat du produit est mis à jour.

**US-07 — Correction d'inventaire** · M · 2 pts
En tant que gérant, je veux corriger une quantité après un comptage (casse, perte, erreur) en indiquant le motif.

**US-08 — Historique des mouvements** · M · 3 pts
En tant que gérant, je veux voir tous les mouvements d'un produit (date, type, quantité, auteur, vente ou réparation liée) (R2).

**US-09 — Alertes de stock bas** · M · 2 pts
En tant que gérant, je veux la liste des produits dont la quantité est au seuil d'alerte ou en dessous.

## Clients et ventes

**US-10 — Fiches clients** · M · 3 pts
En tant que vendeur, je veux enregistrer un client (nom, téléphone, email facultatif) et retrouver son historique (achats, réparations, formations).

**US-11 — Vente au comptoir** · M · 8 pts
En tant que vendeur, je veux enregistrer une vente de plusieurs produits, avec le moyen de paiement (espèces ou Mobile Money).
- Vente refusée si le stock manque (R1) ; deux ventes simultanées ne vendent pas la même pièce (R3) ;
- Prix figés dans la vente (R4) ; le stock diminue et un mouvement est créé (R2) ;
- Client facultatif.

**US-12 — Reçu de vente** · S · 3 pts
En tant que vendeur, je veux imprimer ou partager un reçu PDF de la vente.

**US-13 — Historique des ventes et marge** · S · 3 pts
En tant que gérant, je veux consulter les ventes par période, avec leur total et leur marge théorique (R5).

## Réparations

**US-14 — Dépôt d'un appareil** · M · 5 pts
En tant que technicien, je veux créer un dossier de réparation : client, type d'appareil, marque, modèle, numéro de série ou IMEI, accessoires laissés, problème signalé, réception en boutique ou à domicile.
- Référence `REP-2026-00001` ; statut « Reçu ».

**US-15 — Bon de dépôt** · S · 3 pts
En tant que technicien, je veux remettre au client un bon de dépôt PDF (référence, appareil, problème, acompte, date prévue).

**US-16 — Suivi de la réparation** · M · 5 pts
En tant que technicien, je veux faire avancer le statut (R6), saisir le diagnostic et le coût estimé, et voir l'historique des changements.

**US-17 — Pièces utilisées** · M · 5 pts
En tant que technicien, je veux ajouter les pièces utilisées depuis le stock (R7) ; le montant du dossier se met à jour (R8).

**US-18 — Paiement et restitution** · M · 3 pts
En tant que technicien, je veux enregistrer l'acompte et le paiement final, puis marquer l'appareil comme restitué.

**US-19 — Prévenir le client** · S · 2 pts
En tant que technicien, je veux prévenir le client sur WhatsApp que son appareil est prêt (message prérempli avec la référence et le montant restant).

## Formations

**US-20 — Sessions de formation** · S · 3 pts
En tant que formateur, je veux créer une session : intitulé, description, dates de début et de fin, frais, capacité.

**US-21 — Inscriptions et paiements** · S · 5 pts
En tant que formateur, je veux inscrire des apprenants et enregistrer leurs paiements en plusieurs fois (R9).
- Inscription refusée si la session est complète ; solde affiché pour chaque apprenant.

**US-22 — Liste des apprenants** · S · 2 pts
En tant que formateur, je veux la liste des apprenants d'une session avec leur solde, imprimable.

**US-23 — Présences** · C · 3 pts
En tant que formateur, je veux noter les présences à chaque séance.

## Pilotage

**US-24 — Tableau de bord** · S · 5 pts
En tant que gérant, je veux voir dès la connexion : ventes du jour, marge du mois, produits en stock bas, réparations en cours, appareils prêts à récupérer, soldes à encaisser (réparations et formations) et dernières opérations.

**US-25 — Données de démonstration** · S · 2 pts
En tant que recruteur, je veux tester l'application avec des données fictives sans créer de compte.

---

## Découpage en sprints (Scrum, sprints de 2 semaines)

| Sprint | Objectif | User stories |
|---|---|---|
| **0** | Conception, environnement, intégration continue | — |
| **1** | Comptes, catalogue et stock | US-01, US-02, US-04 à US-09 |
| **2** | Clients et ventes | US-10 à US-13 |
| **3** | Réparations | US-14 à US-19 |
| **4** | Formations et tableau de bord | US-20 à US-22, US-24 |
| **5** | Finitions, démonstration et mise en ligne | US-03, US-23, US-25 |

## Définition de « terminé » (Definition of Done)

Une user story est terminée quand :
1. ses critères d'acceptation sont couverts par des tests automatisés écrits **avant** le code (TDD) ;
2. tous les tests passent et l'intégration continue est verte ;
3. le code est relu (pull request) et fusionné dans `main` ;
4. l'interface fonctionne sur téléphone et sur ordinateur ;
5. la documentation est à jour.
