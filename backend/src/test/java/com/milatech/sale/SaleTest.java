package com.milatech.sale;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-11 (vente au comptoir), US-12 (recu), US-13 (historique et marge). */
class SaleTest extends IntegrationTest {

	private String manager;
	private long charger;
	private long earbuds;

	@BeforeEach
	void setUp() throws Exception {
		manager = tokenFor(Role.GERANT);
		long category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Accessoires\"}"));
		charger = product(category, "CHG-USBC", "Chargeur USB-C", 2500, 5000, 10);
		earbuds = product(category, "BT-EAR", "Écouteurs Bluetooth", 8000, 15000, 3);
	}

	private long product(long category, String reference, String name, long cost, long price, int stock) throws Exception {
		return idOf(postAs(manager, "/api/products", """
				{"reference": "%s", "name": "%s", "categoryId": %d, "purchasePrice": %d, "salePrice": %d,
				 "alertThreshold": 1, "initialQuantity": %d}""".formatted(reference, name, category, cost, price, stock)));
	}

	private String sale(String paymentMethod, long... productAndQuantity) {
		StringBuilder lines = new StringBuilder();
		for (int i = 0; i < productAndQuantity.length; i += 2)
			lines.append(i == 0 ? "" : ",").append("{\"productId\": %d, \"quantity\": %d}"
					.formatted(productAndQuantity[i], productAndQuantity[i + 1]));
		return "{\"paymentMethod\": \"%s\", \"lines\": [%s]}".formatted(paymentMethod, lines);
	}

	@Test
	void aSellerRecordsASaleOfSeveralProducts() throws Exception {
		String seller = tokenFor(Role.VENDEUR);

		postAs(seller, "/api/sales", sale("MOBILE_MONEY", charger, 2, earbuds, 1))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reference", matchesPattern("VTE-\\d{4}-\\d{5}")))
				.andExpect(jsonPath("$.total").value(25000))
				.andExpect(jsonPath("$.paymentMethod").value("MOBILE_MONEY"))
				.andExpect(jsonPath("$.lines", hasSize(2)))
				.andExpect(jsonPath("$.seller").value("Test VENDEUR"))
				// La marge n'est visible que par le gerant
				.andExpect(jsonPath("$.margin").doesNotExist());

		getAs(manager, "/api/products/{id}", charger).andExpect(jsonPath("$.quantity").value(8));
		getAs(manager, "/api/products/{id}/movements", earbuds)
				.andExpect(jsonPath("$[0].type").value("VENTE"))
				.andExpect(jsonPath("$[0].quantity").value(-1));
	}

	@Test
	void theMarginIsComputedWithTheFrozenPrices() throws Exception {
		long id = idOf(postAs(manager, "/api/sales", sale("ESPECES", charger, 2, earbuds, 1)));
		// Les prix changent ensuite : la vente ne bouge pas (R4)
		putAs(manager, "/api/products/{id}", """
				{"reference": "CHG-USBC", "name": "Chargeur USB-C", "categoryId": %d, "purchasePrice": 3000,
				 "salePrice": 6000, "alertThreshold": 1}""".formatted(categoryOf(charger)), charger);

		getAs(manager, "/api/sales/{id}", id)
				.andExpect(jsonPath("$.total").value(25000))
				// (5000 - 2500) x 2 + (15000 - 8000) x 1
				.andExpect(jsonPath("$.margin").value(12000))
				.andExpect(jsonPath("$.lines[0].unitPrice").value(5000));
	}

	private long categoryOf(long product) throws Exception {
		var body = getAs(manager, "/api/products/{id}", product).andReturn().getResponse().getContentAsString();
		return ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.category.id")).longValue();
	}

	@Test
	void aSaleIsRefusedWhenStockIsMissingAndNothingChanges() throws Exception {
		postAs(manager, "/api/sales", sale("ESPECES", charger, 1, earbuds, 4))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Stock insuffisant : Écouteurs Bluetooth (reste 3)."));

		getAs(manager, "/api/products/{id}", charger).andExpect(jsonPath("$.quantity").value(10));
		getAs(manager, "/api/sales").andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void aSaleNeedsAtLeastOneLineAndAPaymentMethod() throws Exception {
		postAs(manager, "/api/sales", "{\"lines\": []}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.lines").exists())
				.andExpect(jsonPath("$.errors.paymentMethod").exists());
	}

	@Test
	void anInactiveProductCannotBeSold() throws Exception {
		putAs(manager, "/api/products/{id}", """
				{"reference": "BT-EAR", "name": "Écouteurs Bluetooth", "categoryId": %d, "purchasePrice": 8000,
				 "salePrice": 15000, "alertThreshold": 1, "active": false}""".formatted(categoryOf(earbuds)), earbuds);

		postAs(manager, "/api/sales", sale("ESPECES", earbuds, 1))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("« Écouteurs Bluetooth » n'est plus en vente."));
	}

	@Test
	void onlyManagersAndSellersSell() throws Exception {
		postAs(tokenFor(Role.TECHNICIEN), "/api/sales", sale("ESPECES", charger, 1)).andExpect(status().isForbidden());
		postAs(tokenFor(Role.FORMATEUR), "/api/sales", sale("ESPECES", charger, 1)).andExpect(status().isForbidden());
	}

	@Test
	void sellersSeeTheirOwnSalesTheManagerSeesEverythingWithTotals() throws Exception {
		var awa = createUser(Role.VENDEUR);
		var paul = createUser(Role.VENDEUR);
		postAs(tokenFor(awa), "/api/sales", sale("ESPECES", charger, 1));
		postAs(tokenFor(paul), "/api/sales", sale("ESPECES", earbuds, 1));

		getAs(tokenFor(awa), "/api/sales").andExpect(jsonPath("$[*].total", contains(5000)));
		getAs(manager, "/api/sales").andExpect(jsonPath("$", hasSize(2)));
		getAs(manager, "/api/sales/summary")
				.andExpect(jsonPath("$.count").value(2))
				.andExpect(jsonPath("$.total").value(20000))
				.andExpect(jsonPath("$.margin").value(9500));
		getAs(tokenFor(awa), "/api/sales/summary").andExpect(status().isForbidden());
	}

	@Test
	void salesAreFilteredByPeriod() throws Exception {
		postAs(manager, "/api/sales", sale("ESPECES", charger, 1));

		getAs(manager, "/api/sales?from=2000-01-01&to=2000-12-31").andExpect(jsonPath("$", hasSize(0)));
		getAs(manager, "/api/sales?from=2000-01-01").andExpect(jsonPath("$", hasSize(1)));
	}

	@Test
	void theReceiptIsAPdf() throws Exception {
		long id = idOf(postAs(manager, "/api/sales", sale("ESPECES", charger, 2)));

		getAs(manager, "/api/sales/{id}/receipt", id)
				.andExpect(status().isOk())
				.andExpect(content().contentType("application/pdf"))
				.andExpect(header().string("Content-Disposition", matchesPattern("inline; filename=\"recu-VTE-\\d{4}-\\d{5}.pdf\"")));
	}
}
