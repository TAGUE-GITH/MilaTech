package com.milatech.training;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-20 (sessions), US-21 (inscriptions et paiements), US-22 (liste des apprenants). */
class TrainingTest extends IntegrationTest {

	private static final String TRAININGS = "/api/trainings";

	private String trainer;
	private long awa;
	private long paul;

	@BeforeEach
	void setUp() throws Exception {
		trainer = tokenFor(Role.FORMATEUR);
		awa = idOf(postAs(trainer, "/api/customers", "{\"fullName\": \"Awa Ngono\", \"phone\": \"677112233\"}"));
		paul = idOf(postAs(trainer, "/api/customers", "{\"fullName\": \"Paul Essomba\", \"phone\": \"690000001\"}"));
	}

	private long session(int capacity, long fee) throws Exception {
		return idOf(postAs(trainer, TRAININGS, """
				{"title": "Réparation de téléphones", "description": "Niveau débutant, 4 semaines",
				 "startDate": "2030-02-02", "endDate": "2030-02-27", "fee": %d, "capacity": %d}""".formatted(fee, capacity))
				.andExpect(status().isCreated()));
	}

	private long enroll(long training, long customer, String extra) throws Exception {
		return idOf(postAs(trainer, TRAININGS + "/{id}/enrollments", "{\"customerId\": %d%s}".formatted(customer, extra), training)
				.andExpect(status().isCreated()));
	}

	@Test
	void aTrainerCreatesASessionWithDatesFeeAndCapacity() throws Exception {
		long id = session(12, 75000);

		getAs(trainer, TRAININGS + "/{id}", id)
				.andExpect(jsonPath("$.title").value("Réparation de téléphones"))
				.andExpect(jsonPath("$.fee").value(75000))
				.andExpect(jsonPath("$.capacity").value(12))
				.andExpect(jsonPath("$.seatsLeft").value(12))
				.andExpect(jsonPath("$.trainer").value("Test FORMATEUR"));
	}

	@Test
	void theEndCannotBeBeforeTheStart() throws Exception {
		postAs(trainer, TRAININGS, """
				{"title": "Électronique", "startDate": "2030-03-10", "endDate": "2030-03-01", "fee": 50000, "capacity": 10}""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("La date de fin doit être après la date de début."));
	}

	@Test
	void learnersAreEnrolledWithAReferenceAndCanPayInSeveralTimes() throws Exception {
		long training = session(12, 75000);
		long enrollment = enroll(training, awa, ", \"firstPayment\": 25000, \"paymentMethod\": \"MOBILE_MONEY\"");

		postAs(trainer, "/api/enrollments/{id}/payments", "{\"amount\": 30000, \"method\": \"ESPECES\"}", enrollment)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reference", matchesPattern("INS-\\d{4}-\\d{5}")))
				.andExpect(jsonPath("$.paid").value(55000))
				.andExpect(jsonPath("$.balance").value(20000));
		postAs(trainer, "/api/enrollments/{id}/payments", "{\"amount\": 25000, \"method\": \"ESPECES\"}", enrollment)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Le paiement dépasse le solde (20 000 FCFA)."));
	}

	@Test
	void aDiscountedFeeCanBeAgreed() throws Exception {
		long training = session(12, 75000);
		long enrollment = enroll(training, awa, ", \"agreedFee\": 60000");

		getAs(trainer, TRAININGS + "/{id}", training)
				.andExpect(jsonPath("$.enrollments[0].id").value(enrollment))
				.andExpect(jsonPath("$.enrollments[0].agreedFee").value(60000))
				.andExpect(jsonPath("$.enrollments[0].balance").value(60000));
	}

	@Test
	void aFullSessionRefusesNewLearnersAndNobodyIsEnrolledTwice() throws Exception {
		long training = session(1, 75000);
		enroll(training, awa, "");

		postAs(trainer, TRAININGS + "/{id}/enrollments", "{\"customerId\": %d}".formatted(awa), training)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Awa Ngono est déjà inscrit(e) à cette session."));
		postAs(trainer, TRAININGS + "/{id}/enrollments", "{\"customerId\": %d}".formatted(paul), training)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("La session est complète (1 place)."));
	}

	@Test
	void aDropoutFreesItsSeat() throws Exception {
		long training = session(1, 75000);
		long enrollment = enroll(training, awa, "");

		patchAs(trainer, "/api/enrollments/{id}", "{\"status\": \"ABANDON\"}", enrollment)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ABANDON"));
		enroll(training, paul, "");
		getAs(trainer, TRAININGS + "/{id}", training)
				.andExpect(jsonPath("$.seatsLeft").value(0))
				.andExpect(jsonPath("$.enrollments[*].customer", contains("Awa Ngono", "Paul Essomba")));
	}

	@Test
	void sessionsAreListedWithTheirFilling() throws Exception {
		long training = session(12, 75000);
		enroll(training, awa, ", \"firstPayment\": 75000, \"paymentMethod\": \"ESPECES\"");
		enroll(training, paul, "");

		getAs(trainer, TRAININGS)
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].enrolled").value(2))
				.andExpect(jsonPath("$[0].seatsLeft").value(10))
				.andExpect(jsonPath("$[0].balanceDue").value(75000));
	}

	@Test
	void sellersEnrollAndCollectTechniciansHaveNoAccess() throws Exception {
		long training = session(12, 75000);
		String seller = tokenFor(Role.VENDEUR);

		postAs(seller, TRAININGS + "/{id}/enrollments", "{\"customerId\": %d}".formatted(awa), training)
				.andExpect(status().isCreated());
		postAs(seller, TRAININGS, "{\"title\": \"x\", \"startDate\": \"2030-01-01\", \"endDate\": \"2030-01-02\", \"fee\": 1, \"capacity\": 1}")
				.andExpect(status().isForbidden());
		getAs(tokenFor(Role.TECHNICIEN), TRAININGS).andExpect(status().isForbidden());
	}

	@Test
	void theCustomerSheetListsTheirTrainings() throws Exception {
		long training = session(12, 75000);
		enroll(training, awa, "");

		getAs(trainer, "/api/customers/{id}", awa)
				.andExpect(jsonPath("$.enrollments", hasSize(1)))
				.andExpect(jsonPath("$.enrollments[0].training").value("Réparation de téléphones"));
	}
}
