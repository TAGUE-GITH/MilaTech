package com.milatech.repair;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-14 a US-18 : depot, suivi, pieces, paiements et restitution d'un appareil. */
class RepairTest extends IntegrationTest {

	private static final String REPAIRS = "/api/repairs";

	private String manager;
	private String technician;
	private long customer;
	private long screen;

	@BeforeEach
	void setUp() throws Exception {
		manager = tokenFor(Role.GERANT);
		technician = tokenFor(Role.TECHNICIEN);
		customer = idOf(postAs(manager, "/api/customers", "{\"fullName\": \"Awa Ngono\", \"phone\": \"677112233\"}"));
		long category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Pièces détachées\"}"));
		screen = idOf(postAs(manager, "/api/products", """
				{"reference": "ECR-A15", "name": "Écran Samsung A15", "categoryId": %d, "purchasePrice": 12000,
				 "salePrice": 20000, "alertThreshold": 1, "initialQuantity": 3}""".formatted(category)));
	}

	private long deposit(String token) throws Exception {
		return idOf(postAs(token, REPAIRS, """
				{"customerId": %d, "deviceType": "TELEPHONE", "brand": "Samsung", "model": "Galaxy A15",
				 "serialNumber": "356789012345678", "accessories": "Coque, sans chargeur", "reception": "BOUTIQUE",
				 "reportedIssue": "Écran cassé, tactile ne répond plus", "estimatedCost": 30000,
				 "promisedOn": "2030-01-15", "deposit": 10000, "depositMethod": "MOBILE_MONEY"}""".formatted(customer))
				.andExpect(status().isCreated()));
	}

	private void move(long id, String status) throws Exception {
		patchAs(technician, REPAIRS + "/{id}/status", "{\"status\": \"%s\", \"note\": \"\"}".formatted(status), id)
				.andExpect(status().isOk());
	}

	@Test
	void aDeviceIsReceivedWithAReferenceAndADeposit() throws Exception {
		long id = deposit(tokenFor(Role.VENDEUR));

		getAs(technician, REPAIRS + "/{id}", id)
				.andExpect(jsonPath("$.reference", matchesPattern("REP-\\d{4}-\\d{5}")))
				.andExpect(jsonPath("$.status").value("RECU"))
				.andExpect(jsonPath("$.customer.fullName").value("Awa Ngono"))
				.andExpect(jsonPath("$.device").value("Samsung Galaxy A15"))
				.andExpect(jsonPath("$.paid").value(10000))
				.andExpect(jsonPath("$.payments", hasSize(1)))
				.andExpect(jsonPath("$.events[0].status").value("RECU"));
	}

	@Test
	void theDepositSlipIsAPdf() throws Exception {
		long id = deposit(technician);

		getAs(technician, REPAIRS + "/{id}/slip", id)
				.andExpect(status().isOk())
				.andExpect(content().contentType("application/pdf"));
	}

	@Test
	void theSlipShowsTheDepositEvenAfterLaterPayments() throws Exception {
		long id = deposit(technician);
		move(id, "EN_DIAGNOSTIC");
		patchAs(technician, REPAIRS + "/{id}", "{\"laborCost\": 25000}", id);
		postAs(technician, REPAIRS + "/{id}/payments", "{\"amount\": 15000, \"method\": \"ESPECES\"}", id);

		byte[] pdf = getAs(technician, REPAIRS + "/{id}/slip", id).andReturn().getResponse().getContentAsByteArray();
		String text = new com.lowagie.text.pdf.parser.PdfTextExtractor(new com.lowagie.text.pdf.PdfReader(pdf)).getTextFromPage(1);

		org.assertj.core.api.Assertions.assertThat(text)
				.contains("Samsung Galaxy A15", "356789012345678", "Coque, sans chargeur")
				// L'extraction du texte colle les deux colonnes du tableau : on compare ligne par ligne sans espaces
				.containsIgnoringWhitespaces("Acompte versé 10 000 FCFA (Mobile Money)")
				.containsIgnoringWhitespaces("Total déjà payé 25 000 FCFA");
	}

	@Test
	void theCustomerAndTheIssueAreRequired() throws Exception {
		postAs(technician, REPAIRS, "{\"deviceType\": \"TELEPHONE\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.customerId").exists())
				.andExpect(jsonPath("$.errors.reportedIssue").exists())
				.andExpect(jsonPath("$.errors.reception").exists());
	}

	@Test
	void theRepairFollowsItsStepsAndKeepsAnHistory() throws Exception {
		long id = deposit(technician);

		patchAs(technician, REPAIRS + "/{id}/status", "{\"status\": \"REPARE\"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Impossible de passer de « Reçu » à « Réparé »."));
		move(id, "EN_DIAGNOSTIC");
		patchAs(technician, REPAIRS + "/{id}/status", "{\"status\": \"EN_REPARATION\", \"note\": \"Devis accepté par téléphone\"}", id);

		getAs(technician, REPAIRS + "/{id}", id)
				.andExpect(jsonPath("$.status").value("EN_REPARATION"))
				.andExpect(jsonPath("$.events[*].status", contains("RECU", "EN_DIAGNOSTIC", "EN_REPARATION")))
				.andExpect(jsonPath("$.events[2].note").value("Devis accepté par téléphone"))
				.andExpect(jsonPath("$.events[2].author").value("Test TECHNICIEN"))
				.andExpect(jsonPath("$.nextStatuses", contains("REPARE", "IRREPARABLE")));
	}

	@Test
	void partsComeFromTheStockAndGoBackWhenRemoved() throws Exception {
		long id = deposit(technician);
		move(id, "EN_DIAGNOSTIC");
		patchAs(technician, REPAIRS + "/{id}", "{\"diagnosis\": \"Écran HS, nappe OK\", \"laborCost\": 8000}", id)
				.andExpect(status().isOk());

		postAs(technician, REPAIRS + "/{id}/parts", "{\"productId\": %d, \"quantity\": 1}".formatted(screen), id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.parts[0].productName").value("Écran Samsung A15"))
				.andExpect(jsonPath("$.parts[0].unitPrice").value(20000))
				// Main-d'oeuvre 8 000 + ecran 20 000 ; acompte 10 000
				.andExpect(jsonPath("$.total").value(28000))
				.andExpect(jsonPath("$.balance").value(18000));
		getAs(manager, "/api/products/{id}", screen).andExpect(jsonPath("$.quantity").value(2));
		getAs(manager, "/api/products/{id}/movements", screen).andExpect(jsonPath("$[0].type").value("PIECE_REPARATION"));

		long part = ((Number) com.jayway.jsonpath.JsonPath.read(getAs(technician, REPAIRS + "/{id}", id).andReturn()
				.getResponse().getContentAsString(), "$.parts[0].id")).longValue();
		deleteAs(technician, REPAIRS + "/{id}/parts/{part}", id, part)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.parts", hasSize(0)))
				.andExpect(jsonPath("$.total").value(8000));
		getAs(manager, "/api/products/{id}", screen).andExpect(jsonPath("$.quantity").value(3));
	}

	@Test
	void partsAreRefusedWithoutStockOrBeforeTheDiagnosis() throws Exception {
		long id = deposit(technician);

		postAs(technician, REPAIRS + "/{id}/parts", "{\"productId\": %d, \"quantity\": 1}".formatted(screen), id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Les pièces s'ajoutent pendant le diagnostic ou la réparation."));
		move(id, "EN_DIAGNOSTIC");
		postAs(technician, REPAIRS + "/{id}/parts", "{\"productId\": %d, \"quantity\": 5}".formatted(screen), id)
				.andExpect(status().isConflict());
	}

	@Test
	void theDeviceIsReturnedOnlyWhenEverythingIsPaid() throws Exception {
		long id = deposit(technician);
		move(id, "EN_DIAGNOSTIC");
		patchAs(technician, REPAIRS + "/{id}", "{\"laborCost\": 25000}", id);
		move(id, "EN_REPARATION");
		move(id, "REPARE");

		patchAs(technician, REPAIRS + "/{id}/status", "{\"status\": \"RESTITUE\"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Reste à payer : 15 000 FCFA. Enregistrez le paiement avant de restituer l'appareil."));
		postAs(technician, REPAIRS + "/{id}/payments", "{\"amount\": 20000, \"method\": \"ESPECES\"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Le paiement dépasse le reste à payer (15 000 FCFA)."));
		postAs(technician, REPAIRS + "/{id}/payments", "{\"amount\": 15000, \"method\": \"ESPECES\"}", id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.balance").value(0));
		move(id, "RESTITUE");

		getAs(technician, REPAIRS + "/{id}", id)
				.andExpect(jsonPath("$.status").value("RESTITUE"))
				.andExpect(jsonPath("$.returnedAt").exists());
		patchAs(technician, REPAIRS + "/{id}", "{\"laborCost\": 1}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Ce dossier est clos : l'appareil a été restitué."));
	}

	@Test
	void repairsAreListedAndSearchedOpenOnesFirst() throws Exception {
		long first = deposit(technician);
		deposit(technician);
		move(first, "EN_DIAGNOSTIC");

		getAs(technician, REPAIRS).andExpect(jsonPath("$", hasSize(2)));
		getAs(technician, REPAIRS + "?status=EN_DIAGNOSTIC").andExpect(jsonPath("$", hasSize(1)));
		getAs(technician, REPAIRS + "?q=ngono").andExpect(jsonPath("$", hasSize(2)));
		getAs(technician, REPAIRS + "?q=galaxy").andExpect(jsonPath("$", hasSize(2)));
		getAs(technician, REPAIRS + "?q=iphone").andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void trainersHaveNoAccessToRepairs() throws Exception {
		getAs(tokenFor(Role.FORMATEUR), REPAIRS).andExpect(status().isForbidden());
	}

	@Test
	void theCustomerSheetListsTheirRepairs() throws Exception {
		deposit(technician);

		getAs(manager, "/api/customers/{id}", customer)
				.andExpect(jsonPath("$.repairs", hasSize(1)))
				.andExpect(jsonPath("$.repairs[0].device").value("Samsung Galaxy A15"));
	}
}
