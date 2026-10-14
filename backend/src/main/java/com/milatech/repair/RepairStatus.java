package com.milatech.repair;

import java.util.List;

/**
 * R6 : etapes d'une reparation.
 * Recu -> En diagnostic -> En reparation -> Repare -> Restitue ; Irreparable depuis le diagnostic ou la reparation ;
 * Annule tant que la reparation n'a pas commence ; un appareil irreparable ou annule est ensuite restitue.
 */
public enum RepairStatus {
	RECU("Reçu"),
	EN_DIAGNOSTIC("En diagnostic"),
	EN_REPARATION("En réparation"),
	REPARE("Réparé"),
	IRREPARABLE("Irréparable"),
	ANNULE("Annulé"),
	RESTITUE("Restitué");

	private final String label;

	RepairStatus(String label) {
		this.label = label;
	}

	public String label() {
		return label;
	}

	public List<RepairStatus> next() {
		return switch (this) {
			case RECU -> List.of(EN_DIAGNOSTIC, ANNULE);
			case EN_DIAGNOSTIC -> List.of(EN_REPARATION, IRREPARABLE, ANNULE);
			case EN_REPARATION -> List.of(REPARE, IRREPARABLE);
			case REPARE, IRREPARABLE, ANNULE -> List.of(RESTITUE);
			case RESTITUE -> List.of();
		};
	}

	public boolean canMoveTo(RepairStatus target) {
		return next().contains(target);
	}

	/** R7 : les pieces s'ajoutent ou se retirent seulement pendant que le technicien travaille sur l'appareil. */
	public boolean allowsParts() {
		return this == EN_DIAGNOSTIC || this == EN_REPARATION;
	}
}
