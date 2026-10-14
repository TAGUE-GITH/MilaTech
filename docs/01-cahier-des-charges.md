# Cahier des charges — MilaTech Management

## 1. Contexte

**MilaTech** est une petite entreprise camerounaise d'électronique. Elle a quatre activités :

| Activité | Exemples |
|---|---|
| 🛒 Vente | Téléphones, accessoires, appareils Bluetooth, composants électroniques |
| 📦 Stock | Appareils neufs, composants, pièces détachées |
| 🔧 Réparation | Téléphones, ordinateurs, tablettes, enceintes et écouteurs Bluetooth |
| 🎓 Formation | Formations en présentiel (électronique, réparation de téléphones, informatique) |

Aujourd'hui, la gestion se fait **au cahier et sur WhatsApp**. Cela pose plusieurs problèmes :

- on ne sait pas exactement ce qui reste en stock ;
- les ventes et les paiements sont difficiles à suivre ;
- on perd la trace des appareils en réparation et de ce qui a été payé ;
- il n'existe pas de liste fiable des apprenants ni de leurs paiements.

**MilaTech Management** centralise ces activités dans une application web utilisable sur ordinateur et sur téléphone.

## 2. Hypothèses de départ (à confirmer avec le gérant)

| # | Question | Hypothèse retenue |
|---|---|---|
| 1 | Effectif | Le gérant et quelques employés (vente, réparation, formation) |
| 2 | Gestion actuelle | Cahier et WhatsApp |
| 3 | Canaux de vente | Boutique et réseaux sociaux (pas de boutique en ligne) |
| 4 | Achats et dépenses | Achats fournisseurs et stock en V1, dépenses en V2 |
| 5 | Réception des réparations | En boutique et à domicile |
| 6 | Historique des clients | Oui |
| 7 | Utilisateurs | Le gérant et ses employés, chacun avec son compte |
| 8 | Support | Ordinateur et téléphone |
| 9 | Connexion Internet | Parfois instable |
| 10 | Problème principal | Plusieurs difficultés : besoin de tout centraliser |

## 3. Acteurs et rôles

| Rôle | Peut faire |
|---|---|
| **Gérant** | Tout : produits, prix, stock, ventes, réparations, formations, employés, tableau de bord et marges |
| **Vendeur** | Ventes, clients, consultation du stock |
| **Technicien** | Réparations : diagnostic, pièces utilisées, statuts |
| **Formateur** | Formations, apprenants, présences |

Un employé n'a qu'un rôle. Le gérant est le seul à voir les **prix d'achat** et les **marges**.

## 4. Fonctionnalités

| N° | Fonctionnalité | Priorité |
|---|---|---|
| F1 | Connexion sécurisée, comptes des employés et rôles | Indispensable |
| F2 | Catalogue : catégories, fournisseurs, produits (référence, prix d'achat, prix de vente, seuil d'alerte) | Indispensable |
| F3 | Stock : entrées (achats fournisseurs), sorties, corrections d'inventaire, historique des mouvements, alertes de stock bas | Indispensable |
| F4 | Clients : coordonnées et historique (achats, réparations, formations) | Indispensable |
| F5 | Ventes : panier de caisse, paiement (espèces, Mobile Money), reçu PDF, historique | Indispensable |
| F6 | Réparations : dossier de dépôt avec bon PDF, diagnostic, pièces utilisées, statuts, devis, paiements, historique | Indispensable |
| F7 | Prévenir le client sur WhatsApp quand son appareil est prêt (message prérempli) | Important |
| F8 | Formations : sessions, inscriptions, frais, paiements en plusieurs fois, liste des apprenants | Important |
| F9 | Tableau de bord : ventes du jour, stock bas, réparations en cours et prêtes, soldes à encaisser, dernières opérations | Important |
| F10 | Présences des apprenants | Souhaitable |
| F11 | Dépenses de l'entreprise (loyer, électricité, transport…) | Souhaitable (V2) |
| F12 | Fonctionnement hors ligne (application installable, synchronisation) | Souhaitable (V3) |

## 5. Règles métier

- **R1.** Le stock ne peut jamais devenir négatif : une vente ou une pièce utilisée est refusée si la quantité manque.
- **R2.** Toute variation de stock crée un **mouvement** : achat, vente, pièce de réparation, correction d'inventaire ou retour. La quantité d'un produit est toujours expliquée par son historique.
- **R3.** Deux ventes simultanées ne peuvent pas vendre la même pièce : les produits concernés sont verrouillés pendant l'enregistrement.
- **R4.** Les prix sont **figés** dans chaque ligne de vente ou de réparation : changer un prix ne modifie pas le passé.
- **R5.** La **marge théorique** d'une vente est la somme de (prix de vente − prix d'achat) × quantité. Ce n'est pas le bénéfice réel, qui dépend aussi des charges (loyer, salaires, électricité).
- **R6.** Statuts d'une réparation :
  `Reçu → En diagnostic → En réparation → Réparé → Restitué`.
  Depuis le diagnostic, une réparation peut devenir **Irréparable**. Tant qu'elle n'est pas réparée, elle peut être **Annulée** (le client refuse le devis). Un appareil irréparable ou annulé est ensuite **Restitué** au client.
- **R7.** Une pièce ajoutée à une réparation sort du stock ; si elle est retirée du dossier, elle y revient.
- **R8.** Le montant d'une réparation = main-d'œuvre + pièces. Le client peut verser un **acompte** ; le **reste à payer** est affiché sur le dossier et à la restitution.
- **R9.** Une formation a une capacité maximale. Les frais d'inscription peuvent être payés en plusieurs fois ; le solde de chaque apprenant est suivi.
- **R10.** Références lisibles : `VTE-2026-00001` (vente), `REP-2026-00001` (réparation), `INS-2026-00001` (inscription).
- **R11.** Montants en francs CFA, sans centimes.

## 6. Exigences non fonctionnelles

- **Responsive** : utilisable sur téléphone (vendeur au comptoir, technicien à l'atelier) et sur ordinateur.
- **Léger** : pages rapides sur une connexion mobile lente.
- **Sécurité** : mots de passe chiffrés (BCrypt), jetons JWT, droits vérifiés côté serveur pour chaque action.
- **Qualité** : tests automatisés (JUnit, Mockito, Vitest) lancés à chaque envoi sur GitHub (intégration continue).
- **Traçabilité** : chaque opération enregistre son auteur et sa date.
- **Français** par défaut.

## 7. Hors périmètre de la V1

Boutique en ligne pour les clients, comptabilité complète, paie des employés, fonctionnement hors ligne.

## 8. Livrables

1. Le code source sur GitHub, avec l'historique des sprints ;
2. Les documents de conception (ce dossier `docs/`) ;
3. Les tests automatisés et l'intégration continue ;
4. L'application en ligne, avec des **données fictives** de démonstration (les vraies données de MilaTech restent privées).
