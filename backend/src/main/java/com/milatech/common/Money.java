package com.milatech.common;

import java.text.NumberFormat;
import java.util.Locale;

/** Montants en francs CFA, sans centimes (R11) : « 15 000 FCFA ». */
public final class Money {

	private Money() {
	}

	public static String fcfa(long amount) {
		return NumberFormat.getIntegerInstance(Locale.FRANCE).format(amount).replace(' ', ' ').replace(' ', ' ')
				+ " FCFA";
	}
}
