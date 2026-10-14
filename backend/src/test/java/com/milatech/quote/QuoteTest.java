package com.milatech.quote;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;
import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** Sprint 7 : demandes de devis en ligne et suivi des reparations par le client. */
class QuoteTest extends IntegrationTest {

	private int clients;

	/** Nouveau client inscrit depuis le site : son jeton et l'identifiant de sa fiche client. */
	private record Client(String token, long customerId) {
	}

	private Client client() throws Exception {
		clients++;
		String body = postAs(null, "/api/auth/register", """
				{"firstName": "Awa", "lastName": "Ngono", "email": "awa%d@client.test", "phone": "677 11 22 33",
				 "password": "%s"}""".formatted(clients, PASSWORD)).andReturn().getResponse().getContentAsString();
		String token = JsonPath.read(body, "$.token");
		return new Client(token, ((Number) JsonPath.read(body, "$.user.customerId")).longValue());
	}

	private static String photo() throws Exception {
		var out = new ByteArrayOutputStream();
		ImageIO.write(new BufferedImage(60, 40, BufferedImage.TYPE_INT_RGB), "jpg", out);
		return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
	}

	private static final String REQUEST = """
			{"deviceType": "TELEPHONE", "brand": "Tecno", "model": "Spark 10", "issue": "L'écran est cassé, le tactile ne répond plus."}""";

	private long request(Client client) throws Exception {
		return idOf(postAs(client.token(), "/api/me/quotes", REQUEST));
	}

	private void answer(long id, long price) throws Exception {
		postAs(tokenFor(Role.TECHNICIEN), "/api/quotes/{id}/answer",
				"{\"price\": %d, \"message\": \"Écran d'origine, réparé en 24 h.\"}".formatted(price), id)
				.andExpect(status().isOk());
	}

	@Test
	void aCustomerAsksForAQuoteWithAPhoto() throws Exception {
		Client awa = client();

		long id = idOf(postAs(awa.token(), "/api/me/quotes", """
				{"deviceType": "TELEPHONE", "brand": "Tecno", "model": "Spark 10", "issue": "Écran cassé",
				 "photo": "%s"}""".formatted(photo()))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reference", matchesPattern("DEV-\\d{4}-\\d{5}")))
				.andExpect(jsonPath("$.status").value("NOUVELLE"))
				.andExpect(jsonPath("$.device").value("Tecno Spark 10"))
				.andExpect(jsonPath("$.imageUrl", startsWith("/api/images/"))));

		getAs(awa.token(), "/api/me/quotes").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(id));
		postAs(awa.token(), "/api/me/quotes", "{\"deviceType\": \"TELEPHONE\", \"issue\": \" \"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.issue").value("Décrivez la panne."));
	}

	@Test
	void theShopAnswersAndTheCustomerAccepts() throws Exception {
		Client awa = client();
		long id = request(awa);

		postAs(awa.token(), "/api/me/quotes/{id}/accept", "{}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("La boutique n'a pas encore envoyé de devis."));
		getAs(tokenFor(Role.GERANT), "/api/dashboard").andExpect(jsonPath("$.quotesToAnswer").value(1));

		String seller = tokenFor(Role.VENDEUR);
		getAs(seller, "/api/quotes?open=true").andExpect(jsonPath("$[0].customer").value("Awa Ngono"));
		postAs(seller, "/api/quotes/{id}/answer", "{\"price\": 0}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.price").exists());
		answer(id, 15000);

		getAs(awa.token(), "/api/me/quotes/{id}", id)
				.andExpect(jsonPath("$.status").value("DEVIS_ENVOYE"))
				.andExpect(jsonPath("$.quotedPrice").value(15000))
				.andExpect(jsonPath("$.quoteMessage").value("Écran d'origine, réparé en 24 h."));
		postAs(awa.token(), "/api/me/quotes/{id}/accept", "{}", id).andExpect(jsonPath("$.status").value("ACCEPTEE"));
		postAs(awa.token(), "/api/me/quotes/{id}/accept", "{}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Ce devis a déjà reçu une réponse."));
		// Une fois accepte, la boutique ne change plus le prix
		postAs(seller, "/api/quotes/{id}/answer", "{\"price\": 20000}", id).andExpect(status().isBadRequest());
		getAs(tokenFor(Role.GERANT), "/api/dashboard").andExpect(jsonPath("$.quotesToAnswer").value(0));
	}

	@Test
	void theDeviceIsReceivedFromAnAcceptedQuote() throws Exception {
		Client awa = client();
		long id = request(awa);
		answer(id, 15000);
		postAs(awa.token(), "/api/me/quotes/{id}/accept", "{}", id);
		String seller = tokenFor(Role.VENDEUR);

		long repair = idOf(postAs(seller, "/api/quotes/{id}/repair", """
				{"accessories": "Coque", "deposit": 5000, "depositMethod": "MOBILE_MONEY"}""", id)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.reference", startsWith("REP-")))
				.andExpect(jsonPath("$.customer.id").value(awa.customerId()))
				.andExpect(jsonPath("$.device").value("Tecno Spark 10"))
				.andExpect(jsonPath("$.estimatedCost").value(15000))
				.andExpect(jsonPath("$.paid").value(5000))
				.andExpect(jsonPath("$.reportedIssue").value("L'écran est cassé, le tactile ne répond plus.")));

		getAs(seller, "/api/quotes/{id}", id)
				.andExpect(jsonPath("$.status").value("DEPOSEE"))
				.andExpect(jsonPath("$.repairId").value(repair));
		postAs(seller, "/api/quotes/{id}/repair", "{}", id)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Seul un devis accepté par le client peut devenir une réparation."));
	}

	@Test
	void aCustomerRefusesOrCancels() throws Exception {
		Client awa = client();
		long refused = request(awa);
		answer(refused, 40000);
		postAs(awa.token(), "/api/me/quotes/{id}/refuse", "{}", refused).andExpect(jsonPath("$.status").value("REFUSEE"));
		postAs(tokenFor(Role.VENDEUR), "/api/quotes/{id}/repair", "{}", refused).andExpect(status().isBadRequest());

		long cancelled = request(awa);
		postAs(awa.token(), "/api/me/quotes/{id}/cancel", "{}", cancelled).andExpect(jsonPath("$.status").value("ANNULEE"));
		answer(request(awa), 10000);
		long quoted = request(awa);
		answer(quoted, 10000);
		postAs(awa.token(), "/api/me/quotes/{id}/cancel", "{}", quoted)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Le devis est arrivé : acceptez-le ou refusez-le."));
	}

	@Test
	void eachOneSeesOnlyWhatConcernsThem() throws Exception {
		Client awa = client();
		long id = request(awa);

		postAs(null, "/api/me/quotes", REQUEST).andExpect(status().isUnauthorized());
		postAs(tokenFor(Role.VENDEUR), "/api/me/quotes", REQUEST).andExpect(status().isForbidden());
		getAs(awa.token(), "/api/quotes").andExpect(status().isForbidden());
		getAs(tokenFor(Role.FORMATEUR), "/api/quotes").andExpect(status().isForbidden());
		getAs(client().token(), "/api/me/quotes/{id}", id).andExpect(status().isNotFound());
	}

	@Test
	void aCustomerFollowsTheRepairOfTheirDevices() throws Exception {
		Client awa = client();
		String seller = tokenFor(Role.VENDEUR);
		long repair = idOf(postAs(seller, "/api/repairs", """
				{"customerId": %d, "deviceType": "ORDINATEUR", "brand": "HP", "model": "ProBook", "reception": "BOUTIQUE",
				 "reportedIssue": "Ne s'allume plus", "estimatedCost": 25000}""".formatted(awa.customerId())));
		patchAs(seller, "/api/repairs/{id}/status", "{\"status\": \"EN_DIAGNOSTIC\", \"note\": \"Note interne\"}", repair);

		getAs(awa.token(), "/api/me/repairs")
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].device").value("HP ProBook"))
				.andExpect(jsonPath("$[0].statusLabel").value("En diagnostic"));
		getAs(awa.token(), "/api/me/repairs/{id}", repair)
				.andExpect(jsonPath("$.estimatedCost").value(25000))
				.andExpect(jsonPath("$.steps", hasSize(2)))
				.andExpect(jsonPath("$.steps[1].label").value("En diagnostic"))
				// Les notes internes et les noms des employes restent dans la boutique
				.andExpect(jsonPath("$.steps[1].note").doesNotExist())
				.andExpect(jsonPath("$.steps[1].author").doesNotExist());
		getAs(client().token(), "/api/me/repairs/{id}", repair).andExpect(status().isNotFound());
		getAs(seller, "/api/me/repairs").andExpect(status().isForbidden());
	}
}
