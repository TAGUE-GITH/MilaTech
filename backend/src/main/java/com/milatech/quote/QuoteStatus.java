package com.milatech.quote;

import java.util.List;

/**
 * Etapes d'une demande de devis : le client decrit la panne, la boutique envoie un prix, le client accepte
 * ou refuse, puis apporte l'appareil (la demande devient alors un dossier de reparation).
 */
public enum QuoteStatus {
	NOUVELLE("Nouvelle"),
	DEVIS_ENVOYE("Devis envoyé"),
	ACCEPTEE("Acceptée"),
	REFUSEE("Refusée"),
	ANNULEE("Annulée"),
	DEPOSEE("Appareil déposé");

	private final String label;

	QuoteStatus(String label) {
		this.label = label;
	}

	public String label() {
		return label;
	}

	/** Demandes qui attendent encore quelque chose de la boutique (un prix, ou l'appareil). */
	public static final List<QuoteStatus> OPEN = List.of(NOUVELLE, DEVIS_ENVOYE, ACCEPTEE);
}
