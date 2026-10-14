package com.milatech.dashboard;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-24 : tableau de bord du gerant. */
class DashboardTest extends IntegrationTest {

	@Test
	void theManagerSeesTheDayAtAGlance() throws Exception {
		String manager = tokenFor(Role.GERANT);
		long category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Accessoires\"}"));
		long charger = idOf(postAs(manager, "/api/products", """
				{"reference": "CHG", "name": "Chargeur", "categoryId": %d, "purchasePrice": 2500, "salePrice": 5000,
				 "alertThreshold": 3, "initialQuantity": 4}""".formatted(category)));
		postAs(manager, "/api/sales", "{\"paymentMethod\": \"ESPECES\", \"lines\": [{\"productId\": %d, \"quantity\": 2}]}"
				.formatted(charger));
		long customer = idOf(postAs(manager, "/api/customers", "{\"fullName\": \"Awa Ngono\", \"phone\": \"677112233\"}"));

		// Une reparation en cours avec un reste a payer, une autre prete a rendre
		long inProgress = idOf(postAs(manager, "/api/repairs", repair(customer)));
		patchAs(manager, "/api/repairs/{id}/status", "{\"status\": \"EN_DIAGNOSTIC\"}", inProgress);
		patchAs(manager, "/api/repairs/{id}", "{\"laborCost\": 15000}", inProgress);
		long ready = idOf(postAs(manager, "/api/repairs", repair(customer)));
		for (String step : new String[] { "EN_DIAGNOSTIC", "EN_REPARATION", "REPARE" })
			patchAs(manager, "/api/repairs/{id}/status", "{\"status\": \"%s\"}".formatted(step), ready);

		// Une formation avec un solde a encaisser
		long training = idOf(postAs(manager, "/api/trainings", """
				{"title": "Électronique", "startDate": "2030-02-02", "endDate": "2030-02-27", "fee": 50000, "capacity": 10}"""));
		postAs(manager, "/api/trainings/{id}/enrollments", "{\"customerId\": %d, \"firstPayment\": 20000, \"paymentMethod\": \"ESPECES\"}"
				.formatted(customer), training);

		getAs(manager, "/api/dashboard")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.salesToday.count").value(1))
				.andExpect(jsonPath("$.salesToday.total").value(10000))
				.andExpect(jsonPath("$.salesMonth.total").value(10000))
				.andExpect(jsonPath("$.salesMonth.margin").value(5000))
				.andExpect(jsonPath("$.lowStock", hasSize(1)))
				.andExpect(jsonPath("$.lowStock[0].name").value("Chargeur"))
				.andExpect(jsonPath("$.repairsInProgress").value(1))
				.andExpect(jsonPath("$.repairsReady", hasSize(1)))
				.andExpect(jsonPath("$.repairsReady[0].id").value(ready))
				// 15 000 de reparation + 30 000 de formation
				.andExpect(jsonPath("$.amountsDue.repairs").value(15000))
				.andExpect(jsonPath("$.amountsDue.trainings").value(30000))
				.andExpect(jsonPath("$.dailySales", hasSize(7)))
				.andExpect(jsonPath("$.dailySales[6].total").value(10000))
				.andExpect(jsonPath("$.recent[0].type").exists());
	}

	private String repair(long customer) {
		return """
				{"customerId": %d, "deviceType": "TELEPHONE", "brand": "Tecno", "model": "Spark 10",
				 "reception": "BOUTIQUE", "reportedIssue": "Ne charge plus"}""".formatted(customer);
	}

	@Test
	void onlyTheManagerSeesTheDashboard() throws Exception {
		for (Role role : new Role[] { Role.VENDEUR, Role.TECHNICIEN, Role.FORMATEUR })
			getAs(tokenFor(role), "/api/dashboard").andExpect(status().isForbidden());
	}
}
