package com.milatech.shop;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;
import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** Sprint 6 : boutique en ligne (photos des produits, catalogue public, commandes des clients). */
class ShopTest extends IntegrationTest {

	private String manager;
	private long category;
	private long phone;
	private long charger;
	private int clients;

	@BeforeEach
	void setUp() throws Exception {
		manager = tokenFor(Role.GERANT);
		category = idOf(postAs(manager, "/api/categories", "{\"name\": \"Téléphones\"}"));
		phone = product("TEL-A15", "Samsung Galaxy A15", 70000, 95000, 3, true);
		charger = product("CHG-USBC", "Chargeur USB-C", 2500, 5000, 10, true);
	}

	private long product(String reference, String name, long cost, long price, int stock, boolean active) throws Exception {
		return idOf(postAs(manager, "/api/products", """
				{"reference": "%s", "name": "%s", "categoryId": %d, "purchasePrice": %d, "salePrice": %d,
				 "alertThreshold": 1, "initialQuantity": %d, "active": %s}"""
				.formatted(reference, name, category, cost, price, stock, active)));
	}

	/** Nouveau client inscrit depuis le site : renvoie son jeton. */
	private String client() throws Exception {
		clients++;
		String body = postAs(null, "/api/auth/register", """
				{"firstName": "Awa", "lastName": "Ngono", "email": "awa%d@client.test", "phone": "677 11 22 33",
				 "password": "%s"}""".formatted(clients, PASSWORD)).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.token");
	}

	private static String order(String mode, String address, long... productAndQuantity) {
		StringBuilder lines = new StringBuilder();
		for (int i = 0; i < productAndQuantity.length; i += 2)
			lines.append(i == 0 ? "" : ",").append("{\"productId\": %d, \"quantity\": %d}"
					.formatted(productAndQuantity[i], productAndQuantity[i + 1]));
		return """
				{"deliveryMode": "%s", "address": %s, "phone": "677112233", "note": "Appelez avant", "lines": [%s]}"""
				.formatted(mode, address == null ? "null" : "\"" + address + "\"", lines);
	}

	private static String photo() throws Exception {
		var out = new ByteArrayOutputStream();
		ImageIO.write(new BufferedImage(60, 40, BufferedImage.TYPE_INT_RGB), "jpg", out);
		return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
	}

	private void stockIs(long product, int quantity) throws Exception {
		getAs(manager, "/api/products/{id}", product).andExpect(jsonPath("$.quantity").value(quantity));
	}

	@Test
	void theManagerAddsAPhotoToAProduct() throws Exception {
		String url = JsonPath.read(putAs(manager, "/api/products/{id}/image", "{\"dataUrl\": \"%s\"}".formatted(photo()), phone)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.imageUrl", startsWith("/api/images/")))
				.andReturn().getResponse().getContentAsString(), "$.imageUrl");
		getAs(null, url).andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"));

		putAs(tokenFor(Role.VENDEUR), "/api/products/{id}/image", "{\"dataUrl\": \"%s\"}".formatted(photo()), phone)
				.andExpect(status().isForbidden());
		deleteAs(manager, "/api/products/{id}/image", phone)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.imageUrl").doesNotExist());
		getAs(null, url).andExpect(status().isNotFound());
	}

	@Test
	void visitorsSeeOnlyProductsOnSaleAndInStockWithoutTheCost() throws Exception {
		product("TEL-OLD", "Ancien modèle", 10000, 20000, 4, false);
		product("ECR-A15", "Écran A15", 9000, 18000, 0, true);
		putAs(manager, "/api/products/{id}/image", "{\"dataUrl\": \"%s\"}".formatted(photo()), phone);

		getAs(null, "/api/shop/products")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].name").value("Chargeur USB-C"))
				.andExpect(jsonPath("$[1].name").value("Samsung Galaxy A15"))
				.andExpect(jsonPath("$[1].price").value(95000))
				.andExpect(jsonPath("$[1].stock").value(3))
				.andExpect(jsonPath("$[1].category.name").value("Téléphones"))
				.andExpect(jsonPath("$[1].imageUrl", startsWith("/api/images/")))
				.andExpect(jsonPath("$[1].purchasePrice").doesNotExist());
		getAs(null, "/api/shop/products?q=galaxy").andExpect(jsonPath("$", hasSize(1)));
		getAs(null, "/api/shop/products?categoryId={id}", category + 999).andExpect(jsonPath("$", hasSize(0)));
		getAs(null, "/api/shop/products/{id}", phone).andExpect(jsonPath("$.name").value("Samsung Galaxy A15"));
		getAs(null, "/api/shop/categories").andExpect(jsonPath("$[0].name").value("Téléphones"));
		getAs(null, "/api/shop/info").andExpect(jsonPath("$.deliveryFee").value(1000));
	}

	@Test
	void aProductOutOfStockOrWithdrawnIsNotShown() throws Exception {
		long old = product("TEL-OLD", "Ancien modèle", 10000, 20000, 4, false);
		long empty = product("ECR-A15", "Écran A15", 9000, 18000, 0, true);

		getAs(null, "/api/shop/products/{id}", old).andExpect(status().isNotFound());
		getAs(null, "/api/shop/products/{id}", empty).andExpect(status().isNotFound());
	}

	@Test
	void aCustomerOrdersForDeliveryAndTheStockIsReserved() throws Exception {
		String client = client();

		long id = idOf(postAs(client, "/api/me/orders", order("LIVRAISON", "Bonas, près de la pharmacie", phone, 1, charger, 2))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reference", matchesPattern("CMD-\\d{4}-\\d{5}")))
				.andExpect(jsonPath("$.status").value("EN_ATTENTE"))
				.andExpect(jsonPath("$.subtotal").value(105000))
				.andExpect(jsonPath("$.deliveryFee").value(1000))
				.andExpect(jsonPath("$.total").value(106000))
				.andExpect(jsonPath("$.lines", hasSize(2)))
				.andExpect(jsonPath("$.customer.fullName").value("Awa Ngono")));

		stockIs(phone, 2);
		stockIs(charger, 8);
		getAs(manager, "/api/products/{id}/movements", phone)
				.andExpect(jsonPath("$[0].type").value("COMMANDE_EN_LIGNE"))
				.andExpect(jsonPath("$[0].quantity").value(-1));
		getAs(client, "/api/me/orders").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(id));
		getAs(client, "/api/me/orders/{id}", id).andExpect(jsonPath("$.address").value("Bonas, près de la pharmacie"));
	}

	@Test
	void aPickupIsFreeButADeliveryNeedsAnAddress() throws Exception {
		String client = client();

		postAs(client, "/api/me/orders", order("RETRAIT", null, charger, 1))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.deliveryFee").value(0))
				.andExpect(jsonPath("$.total").value(5000));
		postAs(client, "/api/me/orders", order("LIVRAISON", "  ", charger, 1))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.address").value("Indiquez votre quartier et un repère pour la livraison."));
		postAs(client, "/api/me/orders", order("RETRAIT", null))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.lines").exists());
	}

	@Test
	void anOrderIsRefusedWhenTheStockIsShortAndNothingIsReserved() throws Exception {
		String client = client();

		postAs(client, "/api/me/orders", order("RETRAIT", null, charger, 2, phone, 4))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Stock insuffisant : Samsung Galaxy A15 (reste 3)."));
		stockIs(charger, 10);
		getAs(client, "/api/me/orders").andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void aWithdrawnProductCannotBeOrdered() throws Exception {
		long old = product("TEL-OLD", "Ancien modèle", 10000, 20000, 4, false);

		postAs(client(), "/api/me/orders", order("RETRAIT", null, old, 1))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("« Ancien modèle » n'est plus en vente."));
	}

	@Test
	void onlyCustomersOrderAndEachSeesOnlyTheirOwnOrders() throws Exception {
		String awa = client();
		long id = idOf(postAs(awa, "/api/me/orders", order("RETRAIT", null, charger, 1)));

		postAs(null, "/api/me/orders", order("RETRAIT", null, charger, 1)).andExpect(status().isUnauthorized());
		postAs(tokenFor(Role.VENDEUR), "/api/me/orders", order("RETRAIT", null, charger, 1)).andExpect(status().isForbidden());
		getAs(awa, "/api/orders").andExpect(status().isForbidden());
		getAs(client(), "/api/me/orders/{id}", id).andExpect(status().isNotFound());
		getAs(tokenFor(Role.TECHNICIEN), "/api/orders").andExpect(status().isForbidden());
	}

	@Test
	void theShopConfirmsPreparesAndHandsOverTheOrderWhichBecomesASale() throws Exception {
		long id = idOf(postAs(client(), "/api/me/orders", order("LIVRAISON", "Bonas", phone, 1, charger, 2)));
		String seller = tokenFor(Role.VENDEUR);

		getAs(seller, "/api/orders").andExpect(jsonPath("$[0].reference", startsWith("CMD-")))
				.andExpect(jsonPath("$[0].customer").value("Awa Ngono"));
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"REMISE\", \"paymentMethod\": \"ESPECES\"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Impossible de passer de « En attente » à « Remise »."));
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"CONFIRMEE\"}", id)
				.andExpect(jsonPath("$.status").value("CONFIRMEE"))
				.andExpect(jsonPath("$.nextStatuses[0]").value("PRETE"));
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"PRETE\"}", id).andExpect(status().isOk());
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"REMISE\"}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Indiquez comment le client a payé."));
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"REMISE\", \"paymentMethod\": \"MOBILE_MONEY\"}", id)
				.andExpect(jsonPath("$.status").value("REMISE"))
				.andExpect(jsonPath("$.saleReference", startsWith("VTE-")))
				.andExpect(jsonPath("$.nextStatuses", hasSize(0)));

		// La vente apparait dans l'historique, sans retirer le stock une seconde fois
		getAs(manager, "/api/sales")
				.andExpect(jsonPath("$[0].total").value(105000))
				.andExpect(jsonPath("$[0].paymentMethod").value("MOBILE_MONEY"))
				.andExpect(jsonPath("$[0].customer").value("Awa Ngono"));
		stockIs(phone, 2);
		stockIs(charger, 8);
	}

	@Test
	void aCancelledOrderPutsTheProductsBackInStock() throws Exception {
		String client = client();
		long first = idOf(postAs(client, "/api/me/orders", order("RETRAIT", null, charger, 3)));
		long second = idOf(postAs(client, "/api/me/orders", order("RETRAIT", null, charger, 2)));
		stockIs(charger, 5);

		postAs(client, "/api/me/orders/{id}/cancel", "{}", first).andExpect(jsonPath("$.status").value("ANNULEE"));
		stockIs(charger, 8);
		getAs(manager, "/api/products/{id}/movements", charger).andExpect(jsonPath("$[0].type").value("ANNULATION_COMMANDE"));

		// Une fois confirmee, seule la boutique peut annuler (avec un motif)
		String seller = tokenFor(Role.VENDEUR);
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"CONFIRMEE\"}", second);
		postAs(client, "/api/me/orders/{id}/cancel", "{}", second)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Cette commande est déjà en préparation : appelez la boutique pour l'annuler."));
		postAs(seller, "/api/orders/{id}/status", "{\"status\": \"ANNULEE\", \"note\": \"Client injoignable\"}", second)
				.andExpect(jsonPath("$.status").value("ANNULEE"))
				.andExpect(jsonPath("$.cancelReason").value("Client injoignable"));
		stockIs(charger, 10);
	}

	@Test
	void theDashboardCountsTheOrdersToProcess() throws Exception {
		postAs(client(), "/api/me/orders", order("RETRAIT", null, charger, 1));

		getAs(manager, "/api/dashboard").andExpect(jsonPath("$.ordersToProcess").value(1));
	}
}
