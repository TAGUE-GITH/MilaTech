package com.milatech.catalog;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** US-04 (categories, fournisseurs) et US-05 (produits). */
class CatalogTest extends IntegrationTest {

	private String manager;
	private long phones;
	private long components;

	@BeforeEach
	void setUp() throws Exception {
		manager = tokenFor(Role.GERANT);
		phones = idOf(postAs(manager, "/api/categories", "{\"name\": \"Téléphones\"}").andExpect(status().isCreated()));
		components = idOf(postAs(manager, "/api/categories", "{\"name\": \"Composants électroniques\"}"));
	}

	private String product(String reference, String name, long categoryId, long salePrice) {
		return """
				{"reference": "%s", "name": "%s", "categoryId": %d, "description": "Neuf, garanti 3 mois",
				 "purchasePrice": 2000, "salePrice": %d, "alertThreshold": 3}""".formatted(reference, name, categoryId, salePrice);
	}

	@Test
	void theManagerCreatesAProductWithItsPrices() throws Exception {
		long supplier = idOf(postAs(manager, "/api/suppliers", """
				{"name": "ElectroPlus Douala", "phone": "699887766", "address": "Marché Central"}""")
				.andExpect(status().isCreated()));

		postAs(manager, "/api/products", product("RES-10K", "Résistance 10 kΩ", components, 3000)
				.replace("\"alertThreshold\"", "\"supplierId\": " + supplier + ", \"alertThreshold\""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reference").value("RES-10K"))
				.andExpect(jsonPath("$.category.name").value("Composants électroniques"))
				.andExpect(jsonPath("$.supplier.name").value("ElectroPlus Douala"))
				.andExpect(jsonPath("$.purchasePrice").value(2000))
				.andExpect(jsonPath("$.salePrice").value(3000))
				.andExpect(jsonPath("$.quantity").value(0))
				.andExpect(jsonPath("$.lowStock").value(true));
	}

	@Test
	void theReferenceIsUniqueAndThePricePositive() throws Exception {
		postAs(manager, "/api/products", product("TEL-A15", "Samsung A15", phones, 95000));

		postAs(manager, "/api/products", product("tel-a15", "Autre", phones, 95000))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Un produit existe déjà avec la référence TEL-A15."));
		postAs(manager, "/api/products", product("TEL-X", "Gratuit", phones, 0))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.salePrice").exists());
	}

	@Test
	void employeesSeeTheCatalogButNotThePurchasePrice() throws Exception {
		postAs(manager, "/api/products", product("TEL-A15", "Samsung A15", phones, 95000));

		getAs(tokenFor(Role.VENDEUR), "/api/products")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].salePrice").value(95000))
				.andExpect(jsonPath("$[0].purchasePrice").doesNotExist());
		getAs(manager, "/api/products").andExpect(jsonPath("$[0].purchasePrice").value(2000));
	}

	@Test
	void onlyTheManagerChangesTheCatalog() throws Exception {
		String seller = tokenFor(Role.VENDEUR);

		postAs(seller, "/api/products", product("TEL-A15", "Samsung A15", phones, 95000)).andExpect(status().isForbidden());
		postAs(seller, "/api/categories", "{\"name\": \"Divers\"}").andExpect(status().isForbidden());
		getAs(seller, "/api/suppliers").andExpect(status().isForbidden());
		getAs(seller, "/api/categories").andExpect(status().isOk());
	}

	@Test
	void searchByNameOrReferenceAndFilterByCategory() throws Exception {
		postAs(manager, "/api/products", product("TEL-A15", "Samsung A15", phones, 95000));
		postAs(manager, "/api/products", product("TEL-IP11", "iPhone 11", phones, 180000));
		postAs(manager, "/api/products", product("RES-10K", "Résistance 10 kΩ", components, 100));

		getAs(manager, "/api/products?q=samsung").andExpect(jsonPath("$[*].reference", contains("TEL-A15")));
		getAs(manager, "/api/products?q=res-10").andExpect(jsonPath("$[*].reference", contains("RES-10K")));
		getAs(manager, "/api/products?categoryId=" + phones).andExpect(jsonPath("$", hasSize(2)));
	}

	@Test
	void theManagerUpdatesAProductButNotItsQuantityDirectly() throws Exception {
		long id = idOf(postAs(manager, "/api/products", product("TEL-A15", "Samsung A15", phones, 95000)));

		putAs(manager, "/api/products/{id}", product("TEL-A15", "Samsung Galaxy A15", phones, 99000)
				.replace("}", ", \"quantity\": 50}"), id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Samsung Galaxy A15"))
				.andExpect(jsonPath("$.salePrice").value(99000))
				.andExpect(jsonPath("$.quantity").value(0));
	}

	@Test
	void aCategoryWithProductsCannotBeDeleted() throws Exception {
		postAs(manager, "/api/products", product("TEL-A15", "Samsung A15", phones, 95000));

		deleteAs(manager, "/api/categories/{id}", phones)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Cette catégorie contient des produits : elle ne peut pas être supprimée."));
		deleteAs(manager, "/api/categories/{id}", components).andExpect(status().isNoContent());
	}

	@Test
	void anUnknownProductIsNotFound() throws Exception {
		getAs(manager, "/api/products/{id}", 999_999).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Produit introuvable."));
	}
}
