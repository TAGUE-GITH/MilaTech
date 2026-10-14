package com.milatech.customer;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-10 : fiches clients. */
class CustomerTest extends IntegrationTest {

	private String customer(String name, String phone) {
		return """
				{"fullName": "%s", "phone": "%s", "email": "", "notes": "Client fidèle"}""".formatted(name, phone);
	}

	@Test
	void everyEmployeeRecordsAndFindsCustomers() throws Exception {
		String seller = tokenFor(Role.VENDEUR);
		postAs(seller, "/api/customers", customer("Awa Ngono", "677 11 22 33"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.fullName").value("Awa Ngono"))
				.andExpect(jsonPath("$.phone").value("677112233"));
		postAs(tokenFor(Role.TECHNICIEN), "/api/customers", customer("Paul Essomba", "690000001"));

		getAs(seller, "/api/customers?q=ngono").andExpect(jsonPath("$[*].fullName", contains("Awa Ngono")));
		getAs(seller, "/api/customers?q=677 11").andExpect(jsonPath("$[*].fullName", contains("Awa Ngono")));
		getAs(seller, "/api/customers").andExpect(jsonPath("$", hasSize(2)));
	}

	@Test
	void theNameAndPhoneAreRequired() throws Exception {
		postAs(tokenFor(Role.VENDEUR), "/api/customers", customer("", ""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.fullName").exists())
				.andExpect(jsonPath("$.errors.phone").exists());
	}

	@Test
	void aCustomerCanBeUpdated() throws Exception {
		String seller = tokenFor(Role.VENDEUR);
		long id = idOf(postAs(seller, "/api/customers", customer("Awa Ngono", "677112233")));

		putAs(seller, "/api/customers/{id}", customer("Awa Ngono Mballa", "677112233"), id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.fullName").value("Awa Ngono Mballa"));
	}

	@Test
	void theCustomerSheetShowsTheirPurchases() throws Exception {
		String manager = tokenFor(Role.GERANT);
		long category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Accessoires\"}"));
		long product = idOf(postAs(manager, "/api/products", """
				{"reference": "CHG-USBC", "name": "Chargeur USB-C", "categoryId": %d, "purchasePrice": 2500,
				 "salePrice": 5000, "alertThreshold": 2, "initialQuantity": 10}""".formatted(category)));
		long customer = idOf(postAs(manager, "/api/customers", customer("Awa Ngono", "677112233")));
		postAs(manager, "/api/sales", """
				{"customerId": %d, "paymentMethod": "ESPECES", "lines": [{"productId": %d, "quantity": 2}]}"""
				.formatted(customer, product));

		getAs(manager, "/api/customers/{id}", customer)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sales", hasSize(1)))
				.andExpect(jsonPath("$.sales[0].total").value(10000))
				.andExpect(jsonPath("$.totalSpent").value(10000));
	}
}
