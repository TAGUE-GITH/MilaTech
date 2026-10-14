package com.milatech.user;

/** Un employe a un seul role ; le gerant peut tout faire. Les clients du site ont le role CLIENT. */
public enum Role {
	GERANT,
	VENDEUR,
	TECHNICIEN,
	FORMATEUR,
	CLIENT;

	/** Expression de securite des pages reservees au personnel de la boutique (jamais aux clients). */
	public static final String STAFF = "hasAnyRole('GERANT', 'VENDEUR', 'TECHNICIEN', 'FORMATEUR')";
}
