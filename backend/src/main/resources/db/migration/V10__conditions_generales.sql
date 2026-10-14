-- Conditions generales et politique de confidentialite : date et version acceptees (preuve de l'acceptation)

ALTER TABLE app_user ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE app_user ADD COLUMN terms_version VARCHAR(20);

-- Conditions generales de vente acceptees au moment de la commande
ALTER TABLE online_order ADD COLUMN terms_version VARCHAR(20);
