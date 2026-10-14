# Modèle de données

Base **PostgreSQL**, schéma versionné avec **Flyway** (`backend/src/main/resources/db/migration`). Montants en francs CFA entiers (`BIGINT`).

```mermaid
erDiagram
    APP_USER ||--o{ STOCK_MOVEMENT : "enregistre"
    APP_USER ||--o{ SALE : "vend"
    APP_USER ||--o{ REPAIR : "repare"
    APP_USER ||--o{ TRAINING : "anime"

    CATEGORY ||--o{ PRODUCT : "classe"
    SUPPLIER |o--o{ PRODUCT : "fournit"
    PRODUCT ||--o{ STOCK_MOVEMENT : "historique"

    CUSTOMER |o--o{ SALE : "achete"
    SALE ||--|{ SALE_LINE : "contient"
    PRODUCT ||--o{ SALE_LINE : "vendu"

    CUSTOMER ||--o{ REPAIR : "depose"
    REPAIR ||--o{ REPAIR_PART : "utilise"
    PRODUCT ||--o{ REPAIR_PART : "piece"
    REPAIR ||--o{ REPAIR_EVENT : "historique"

    TRAINING ||--o{ ENROLLMENT : "accueille"
    CUSTOMER ||--o{ ENROLLMENT : "s'inscrit"

    REPAIR |o--o{ PAYMENT : "paye"
    ENROLLMENT |o--o{ PAYMENT : "paye"

    APP_USER {
        bigint id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        string role "GERANT, VENDEUR, TECHNICIEN, FORMATEUR"
        boolean active
    }
    CATEGORY {
        bigint id PK
        string name UK
    }
    SUPPLIER {
        bigint id PK
        string name
        string phone
        string email
        string address
    }
    PRODUCT {
        bigint id PK
        string reference UK
        string name
        bigint category_id FK
        bigint supplier_id FK
        text description
        bigint purchase_price
        bigint sale_price
        int quantity "toujours >= 0 (R1)"
        int alert_threshold
        boolean active
    }
    STOCK_MOVEMENT {
        bigint id PK
        bigint product_id FK
        string type "ACHAT, VENTE, PIECE_REPARATION, RETOUR_PIECE, CORRECTION"
        int quantity "positif = entree, negatif = sortie"
        int quantity_after
        bigint unit_cost
        string reason
        bigint sale_id FK
        bigint repair_id FK
        bigint author_id FK
        timestamp created_at
    }
    CUSTOMER {
        bigint id PK
        string full_name
        string phone
        string email
        text notes
    }
    SALE {
        bigint id PK
        string reference UK "VTE-2026-00001"
        bigint customer_id FK
        bigint seller_id FK
        string payment_method "ESPECES, MOBILE_MONEY"
        bigint total
        bigint margin "marge theorique (R5)"
        timestamp created_at
    }
    SALE_LINE {
        bigint id PK
        bigint sale_id FK
        bigint product_id FK
        string product_name "fige (R4)"
        int quantity
        bigint unit_price "fige"
        bigint unit_cost "fige"
    }
    REPAIR {
        bigint id PK
        string reference UK "REP-2026-00001"
        bigint customer_id FK
        bigint technician_id FK
        string device_type "TELEPHONE, ORDINATEUR, TABLETTE, BLUETOOTH, AUTRE"
        string brand
        string model
        string serial_number "numero de serie ou IMEI"
        string accessories
        string reception "BOUTIQUE, DOMICILE"
        text reported_issue
        text diagnosis
        string status "RECU ... RESTITUE (R6)"
        bigint labor_cost "main-d'oeuvre"
        bigint estimated_cost
        date promised_on
        timestamp received_at
        timestamp returned_at
    }
    REPAIR_PART {
        bigint id PK
        bigint repair_id FK
        bigint product_id FK
        int quantity
        bigint unit_price "fige"
    }
    REPAIR_EVENT {
        bigint id PK
        bigint repair_id FK
        string status
        text note
        bigint author_id FK
        timestamp created_at
    }
    TRAINING {
        bigint id PK
        string title
        text description
        date start_date
        date end_date
        bigint fee
        int capacity
        bigint trainer_id FK
    }
    ENROLLMENT {
        bigint id PK
        string reference UK "INS-2026-00001"
        bigint training_id FK
        bigint customer_id FK
        bigint agreed_fee
        string status "INSCRIT, TERMINE, ABANDON"
        timestamp enrolled_at
    }
    PAYMENT {
        bigint id PK
        bigint repair_id FK "l'un ou l'autre"
        bigint enrollment_id FK "l'un ou l'autre"
        bigint amount
        string method "ESPECES, MOBILE_MONEY"
        bigint received_by FK
        timestamp paid_at
    }
```

## Choix de conception

- **Quantité dénormalisée + mouvements** : `product.quantity` permet d'afficher le stock instantanément ; chaque modification passe par un service qui crée le `STOCK_MOVEMENT` dans la même transaction (R2). Une contrainte `CHECK (quantity >= 0)` protège la base même en cas de bug (R1).
- **Verrouillage pessimiste** (`SELECT … FOR UPDATE`) des produits pendant une vente ou l'ajout d'une pièce (R3), toujours dans l'ordre des identifiants pour éviter les interblocages.
- **Prix figés** dans `SALE_LINE` et `REPAIR_PART` (R4) ; `unit_cost` permet de calculer la marge même si le prix d'achat change ensuite.
- **Paiements partagés** : une seule table `PAYMENT` pour les acomptes de réparation et les paiements de formation, avec une contrainte qui impose exactement l'un des deux liens.
- **Clients uniques** : un même client peut acheter, déposer un appareil et suivre une formation ; son historique est complet.
