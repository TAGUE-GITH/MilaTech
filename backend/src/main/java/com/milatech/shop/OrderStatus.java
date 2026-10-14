package com.milatech.shop;

import java.util.List;

/**
 * Etapes d'une commande en ligne. Le stock est reserve des la commande ; il revient en stock si elle est annulee,
 * et la commande devient une vente quand elle est remise au client (retrait ou livraison) et payee.
 */
public enum OrderStatus {
	EN_ATTENTE("En attente"),
	CONFIRMEE("Confirmée"),
	PRETE("Prête"),
	REMISE("Remise"),
	ANNULEE("Annulée");

	private final String label;

	OrderStatus(String label) {
		this.label = label;
	}

	public String label() {
		return label;
	}

	/** Etapes possibles ensuite : on avance d'une etape, ou on annule tant que la commande n'est pas remise. */
	public List<OrderStatus> next() {
		return switch (this) {
			case EN_ATTENTE -> List.of(CONFIRMEE, ANNULEE);
			case CONFIRMEE -> List.of(PRETE, ANNULEE);
			case PRETE -> List.of(REMISE, ANNULEE);
			case REMISE, ANNULEE -> List.of();
		};
	}

	public boolean canMoveTo(OrderStatus target) {
		return next().contains(target);
	}

	/** Commandes que la boutique doit encore traiter. */
	public static final List<OrderStatus> TO_PROCESS = List.of(EN_ATTENTE, CONFIRMEE, PRETE);
}
