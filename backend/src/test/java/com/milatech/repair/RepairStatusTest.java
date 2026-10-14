package com.milatech.repair;

import static com.milatech.repair.RepairStatus.ANNULE;
import static com.milatech.repair.RepairStatus.EN_DIAGNOSTIC;
import static com.milatech.repair.RepairStatus.EN_REPARATION;
import static com.milatech.repair.RepairStatus.IRREPARABLE;
import static com.milatech.repair.RepairStatus.RECU;
import static com.milatech.repair.RepairStatus.REPARE;
import static com.milatech.repair.RepairStatus.RESTITUE;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** R6 : etapes autorisees d'une reparation (test unitaire pur, sans Spring). */
class RepairStatusTest {

	@Test
	void theNormalPath() {
		assertThat(RECU.next()).containsExactly(EN_DIAGNOSTIC, ANNULE);
		assertThat(EN_DIAGNOSTIC.next()).containsExactly(EN_REPARATION, IRREPARABLE, ANNULE);
		assertThat(EN_REPARATION.next()).containsExactly(REPARE, IRREPARABLE);
		assertThat(REPARE.next()).containsExactly(RESTITUE);
	}

	@Test
	void unrepairedDevicesAreReturnedToo() {
		assertThat(IRREPARABLE.next()).containsExactly(RESTITUE);
		assertThat(ANNULE.next()).containsExactly(RESTITUE);
		assertThat(RESTITUE.next()).isEmpty();
	}

	@Test
	void stepsCannotBeSkipped() {
		assertThat(RECU.canMoveTo(REPARE)).isFalse();
		assertThat(EN_REPARATION.canMoveTo(ANNULE)).isFalse();
		assertThat(RESTITUE.canMoveTo(RECU)).isFalse();
	}

	@Test
	void partsCanOnlyBeChangedWhileWorkingOnTheDevice() {
		assertThat(EN_DIAGNOSTIC.allowsParts()).isTrue();
		assertThat(EN_REPARATION.allowsParts()).isTrue();
		assertThat(RECU.allowsParts()).isFalse();
		assertThat(REPARE.allowsParts()).isFalse();
	}
}
