package com.milatech.stock;

/** Origine d'une variation de stock (regle R2). */
public enum MovementType {
	STOCK_INITIAL,
	ACHAT,
	CORRECTION,
	VENTE,
	PIECE_REPARATION,
	RETOUR_PIECE,
	/** Produits reserves par une commande en ligne */
	COMMANDE_EN_LIGNE,
	/** Produits rendus au stock quand une commande en ligne est annulee */
	ANNULATION_COMMANDE
}
