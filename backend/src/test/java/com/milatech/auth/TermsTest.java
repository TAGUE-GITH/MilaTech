package com.milatech.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.jayway.jsonpath.JsonPath;
import com.milatech.IntegrationTest;
import com.milatech.common.Terms;
import com.milatech.user.Role;

import jakarta.persistence.EntityManager;

/** Conditions generales et politique de confidentialite : acceptation obligatoire et enregistree (preuve). */
class TermsTest extends IntegrationTest {

	@Autowired
	private JdbcTemplate jdbc;

	@Autowired
	private EntityManager entityManager;

	private static String register(String acceptTerms) {
		return """
				{"firstName": "Awa", "lastName": "Ngono", "email": "awa@client.test", "phone": "677112233",
				 "password": "%s"%s}""".formatted(PASSWORD, acceptTerms == null ? "" : ", \"acceptTerms\": " + acceptTerms);
	}

	@Test
	void aCustomerAccountRequiresAcceptingTheTerms() throws Exception {
		for (String refused : new String[] { null, "false" })
			postAs(null, "/api/auth/register", register(refused))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors.acceptTerms")
							.value("Vous devez accepter les conditions générales et la politique de confidentialité."));

		postAs(null, "/api/auth/register", register("true")).andExpect(status().isCreated());
		var row = jdbc.queryForMap("select terms_version, terms_accepted_at from app_user where email = 'awa@client.test'");
		assertThat(row.get("terms_version")).isEqualTo(Terms.VERSION);
		assertThat(row.get("terms_accepted_at")).isNotNull();
	}

	@Test
	void anOrderRequiresAcceptingTheTermsOfSale() throws Exception {
		String manager = tokenFor(Role.GERANT);
		long category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Accessoires\"}"));
		long charger = idOf(postAs(manager, "/api/products", """
				{"reference": "CHG", "name": "Chargeur", "categoryId": %d, "purchasePrice": 2500, "salePrice": 5000,
				 "alertThreshold": 1, "initialQuantity": 5}""".formatted(category)));
		String client = JsonPath.read(postAs(null, "/api/auth/register", register("true")).andReturn().getResponse()
				.getContentAsString(), "$.token");
		String order = """
				{"deliveryMode": "RETRAIT", "phone": "677112233", %s"lines": [{"productId": %d, "quantity": 1}]}""";

		postAs(client, "/api/me/orders", order.formatted("", charger))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.acceptTerms").value("Acceptez les conditions générales de vente pour commander."));
		long id = idOf(postAs(client, "/api/me/orders", order.formatted("\"acceptTerms\": true, ", charger))
				.andExpect(status().isCreated()));
		entityManager.flush();
		assertThat(jdbc.queryForObject("select terms_version from online_order where id = ?", String.class, id))
				.isEqualTo(Terms.VERSION);
	}
}
