package com.milatech.stock;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-06 (achats), US-07 (corrections d'inventaire), US-08 (historique), US-09 (alertes). */
class StockTest extends IntegrationTest {

	private String manager;
	private long category;

	@BeforeEach
	void setUp() throws Exception {
		manager = tokenFor(Role.GERANT);
		category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Composants électroniques\"}"));
	}

	private long product(String reference, int alertThreshold) throws Exception {
		return idOf(postAs(manager, "/api/products", """
				{"reference": "%s", "name": "Produit %s", "categoryId": %d, "purchasePrice": 1500, "salePrice": 3000,
				 "alertThreshold": %d}""".formatted(reference, reference, category, alertThreshold)));
	}

	private String purchase(int quantity, long unitCost) {
		return "{\"quantity\": %d, \"unitCost\": %d, \"note\": \"Facture 1245\"}".formatted(quantity, unitCost);
	}

	@Test
	void aPurchaseIncreasesTheStockAndUpdatesThePurchasePrice() throws Exception {
		long id = product("RES-10K", 3);

		// Exemple du cahier des charges : 10 composants achetes 2 000 FCFA l'unite
		postAs(manager, "/api/products/{id}/purchases", purchase(10, 2000), id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(10))
				.andExpect(jsonPath("$.purchasePrice").value(2000));
	}

	@Test
	void everyChangeIsKeptInTheHistoryWithItsAuthor() throws Exception {
		long id = product("RES-10K", 3);
		postAs(manager, "/api/products/{id}/purchases", purchase(10, 2000), id);
		postAs(manager, "/api/products/{id}/adjustments", "{\"quantity\": 8, \"reason\": \"2 pièces cassées\"}", id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(8));

		getAs(manager, "/api/products/{id}/movements", id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(2)))
				// Le plus recent en premier
				.andExpect(jsonPath("$[*].type", contains("CORRECTION", "ACHAT")))
				.andExpect(jsonPath("$[*].quantity", contains(-2, 10)))
				.andExpect(jsonPath("$[*].quantityAfter", contains(8, 10)))
				.andExpect(jsonPath("$[0].reason").value("2 pièces cassées"))
				.andExpect(jsonPath("$[1].unitCost").value(2000))
				.andExpect(jsonPath("$[0].author").value("Test GERANT"));
	}

	@Test
	void aProductCanBeCreatedWithItsInitialStock() throws Exception {
		postAs(manager, "/api/products", """
				{"reference": "BT-JBL", "name": "Enceinte JBL Go", "categoryId": %d, "purchasePrice": 15000,
				 "salePrice": 25000, "alertThreshold": 2, "initialQuantity": 6}""".formatted(category))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.quantity").value(6));
	}

	@Test
	void theStockCanNeverBecomeNegative() throws Exception {
		long id = product("RES-10K", 3);

		postAs(manager, "/api/products/{id}/purchases", purchase(0, 2000), id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.quantity").exists());
		postAs(manager, "/api/products/{id}/adjustments", "{\"quantity\": -1, \"reason\": \"erreur\"}", id)
				.andExpect(status().isBadRequest());
	}

	@Test
	void aCorrectionNeedsAReasonAndAChange() throws Exception {
		long id = product("RES-10K", 3);
		postAs(manager, "/api/products/{id}/purchases", purchase(5, 2000), id);

		postAs(manager, "/api/products/{id}/adjustments", "{\"quantity\": 4, \"reason\": \" \"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.reason").exists());
		postAs(manager, "/api/products/{id}/adjustments", "{\"quantity\": 5, \"reason\": \"comptage\"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("La quantité en stock est déjà de 5."));
	}

	@Test
	void lowStockAlertsListTheMostUrgentFirst() throws Exception {
		long empty = product("A-VIDE", 2);
		long low = product("B-BAS", 5);
		long fine = product("C-OK", 2);
		postAs(manager, "/api/products/{id}/purchases", purchase(4, 1500), low);
		postAs(manager, "/api/products/{id}/purchases", purchase(20, 1500), fine);

		getAs(tokenFor(Role.VENDEUR), "/api/stock/alerts")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].reference", contains("A-VIDE", "B-BAS")))
				.andExpect(jsonPath("$[0].quantity").value(0));
		getAs(manager, "/api/products?lowStock=true").andExpect(jsonPath("$", hasSize(2)));
	}

	@Test
	void onlyTheManagerReceivesGoodsAndCorrectsTheStock() throws Exception {
		long id = product("RES-10K", 3);
		String seller = tokenFor(Role.VENDEUR);

		postAs(seller, "/api/products/{id}/purchases", purchase(10, 2000), id).andExpect(status().isForbidden());
		postAs(seller, "/api/products/{id}/adjustments", "{\"quantity\": 3, \"reason\": \"x\"}", id)
				.andExpect(status().isForbidden());
		getAs(seller, "/api/products/{id}/movements", id).andExpect(status().isForbidden());
	}
}
