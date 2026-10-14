package com.milatech.stock;

/** Origine d'une variation de stock (regle R2). */
public enum MovementType {
	STOCK_INITIAL,
	ACHAT,
	CORRECTION,
	VENTE,
	PIECE_REPARATION,
	RETOUR_PIECE
}
