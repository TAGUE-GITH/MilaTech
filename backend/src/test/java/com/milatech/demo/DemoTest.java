package com.milatech.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.jayway.jsonpath.JsonPath;
import com.milatech.IntegrationTest;

/**
 * Sprint 8 : donnees de demonstration fictives. Le chargement est appele dans la transaction du test
 * (annulee a la fin) : les autres tests ne voient jamais ces donnees.
 */
class DemoTest extends IntegrationTest {

	@Autowired
	private DemoService demo;

	private String login(String email) throws Exception {
		String body = postAs(null, "/api/auth/login", "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, DemoService.PASSWORD))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.token");
	}

	@Test
	void theDemoFillsEveryModuleWithFictitiousData() throws Exception {
		assertThat(demo.seed(false)).isTrue();

		String manager = login("gerant@demo.milatech.cm");
		getAs(manager, "/api/dashboard")
				.andExpect(jsonPath("$.salesToday.count", greaterThan(1)))
				.andExpect(jsonPath("$.repairsInProgress", greaterThan(0)))
				.andExpect(jsonPath("$.repairsReady.length()", greaterThan(0)))
				.andExpect(jsonPath("$.lowStockCount", greaterThan(0)))
				.andExpect(jsonPath("$.ordersToProcess").value(1))
				.andExpect(jsonPath("$.quotesToAnswer").value(1));
		getAs(manager, "/api/trainings").andExpect(jsonPath("$.length()", greaterThanOrEqualTo(2)));
		getAs(null, "/api/shop/products").andExpect(jsonPath("$.length()", greaterThanOrEqualTo(10)));

		// Le client de demonstration a deja une commande, des devis et une reparation a suivre
		String client = login("client@demo.milatech.cm");
		getAs(client, "/api/me/orders").andExpect(jsonPath("$.length()").value(2));
		getAs(client, "/api/me/quotes").andExpect(jsonPath("$.length()").value(3));
		getAs(client, "/api/me/repairs").andExpect(jsonPath("$.length()").value(1));
		for (String role : new String[] { "vendeur", "technicien", "formateur" })
			login(role + "@demo.milatech.cm");
	}

	@Test
	void theDemoIsLoadedOnlyOnce() {
		assertThat(demo.seed(false)).isTrue();
		assertThat(demo.seed(false)).isFalse();
	}

	@Test
	void visitorsCannotLockOthersOutOfTheDemoAccounts() throws Exception {
		demo.seed(false);
		String manager = login("gerant@demo.milatech.cm");

		postAs(manager, "/api/me/password", "{\"currentPassword\": \"%s\", \"newPassword\": \"mot-de-passe-pirate\"}"
				.formatted(DemoService.PASSWORD))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Le mot de passe d'un compte de démonstration ne peut pas être changé."));
		java.util.List<Number> ids = JsonPath.read(getAs(manager, "/api/users").andReturn().getResponse().getContentAsString(),
				"$[?(@.email == 'vendeur@demo.milatech.cm')].id");
		long seller = ids.get(0).longValue();
		patchAs(manager, "/api/users/{id}", "{\"active\": false}", seller)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Les comptes de démonstration ne peuvent pas être modifiés."));
	}

	@Test
	void theLoginPageKnowsWhetherTheDemoIsOn() throws Exception {
		// Mode demo desactive dans les tests : aucun compte n'est affiche
		getAs(null, "/api/demo").andExpect(status().isOk()).andExpect(jsonPath("$.enabled").value(false))
				.andExpect(jsonPath("$.accounts").isEmpty());
	}
}
