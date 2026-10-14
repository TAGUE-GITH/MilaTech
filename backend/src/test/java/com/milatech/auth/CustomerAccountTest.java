package com.milatech.auth;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
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

/** Comptes clients en ligne, espace personnel et photo de profil (sprint 5). */
class CustomerAccountTest extends IntegrationTest {

	private String register(String email) {
		return """
				{"firstName": "Awa", "lastName": "Ngono", "email": "%s", "phone": "677 11 22 33",
				 "password": "%s", "acceptTerms": true}""".formatted(email, PASSWORD);
	}

	private String tokenOf(String json) {
		return JsonPath.read(json, "$.token");
	}

	@Test
	void aVisitorCreatesACustomerAccountLinkedToACustomerSheet() throws Exception {
		String body = postAs(null, "/api/auth/register", register("awa@client.test"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.token", not(emptyString())))
				.andExpect(jsonPath("$.user.role").value("CLIENT"))
				.andReturn().getResponse().getContentAsString();

		// La boutique retrouve aussitot ce client (meme fiche pour les ventes, reparations, formations)
		getAs(tokenFor(Role.VENDEUR), "/api/customers?q=677112233")
				.andExpect(jsonPath("$[0].fullName").value("Awa Ngono"))
				.andExpect(jsonPath("$[0].email").value("awa@client.test"));
		getAs(tokenOf(body), "/api/auth/me").andExpect(jsonPath("$.customerId").isNumber());
	}

	@Test
	void theEmailIsUniqueAndThePasswordStrong() throws Exception {
		createUser(Role.VENDEUR, "awa@client.test");

		postAs(null, "/api/auth/register", register("AWA@client.test"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Un compte existe déjà avec cet email."));
		postAs(null, "/api/auth/register", register("new@client.test").replace(PASSWORD, "court"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.password").exists());
	}

	@Test
	void aCustomerNeverReachesTheShopTools() throws Exception {
		String client = tokenOf(postAs(null, "/api/auth/register", register("awa@client.test"))
				.andReturn().getResponse().getContentAsString());

		for (String url : new String[] { "/api/customers", "/api/products", "/api/categories", "/api/sales",
				"/api/repairs", "/api/trainings", "/api/users", "/api/dashboard", "/api/stock/alerts",
				"/api/contact-messages" })
			getAs(client, url).andExpect(status().isForbidden());
	}

	@Test
	void theTeamPageCannotCreateCustomerAccounts() throws Exception {
		postAs(tokenFor(Role.GERANT), "/api/users", """
				{"email": "x@milatech.test", "firstName": "X", "lastName": "Y", "role": "CLIENT", "password": "%s"}"""
				.formatted(PASSWORD))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Les comptes clients se créent depuis le site."));
		getAs(tokenFor(Role.GERANT), "/api/users").andExpect(jsonPath("$[?(@.role == 'CLIENT')]").isEmpty());
	}

	@Test
	void everyoneUpdatesTheirProfileAndPassword() throws Exception {
		var user = createUser(Role.TECHNICIEN, "paul@milatech.test");
		String token = tokenFor(user);

		patchAs(token, "/api/me", "{\"firstName\": \"Paul\", \"lastName\": \"Essomba\", \"phone\": \"690000001\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.fullName").value("Paul Essomba"));
		postAs(token, "/api/me/password", "{\"currentPassword\": \"faux\", \"newPassword\": \"nouveau-mot-de-passe\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Le mot de passe actuel est incorrect."));
		postAs(token, "/api/me/password", "{\"currentPassword\": \"%s\", \"newPassword\": \"nouveau-mot-de-passe\"}".formatted(PASSWORD))
				.andExpect(status().isNoContent());
		postAs(null, "/api/auth/login", "{\"email\": \"paul@milatech.test\", \"password\": \"nouveau-mot-de-passe\"}")
				.andExpect(status().isOk());
	}

	private static String photo(String format) throws Exception {
		var image = new BufferedImage(40, 40, BufferedImage.TYPE_INT_RGB);
		var out = new ByteArrayOutputStream();
		ImageIO.write(image, format, out);
		return "data:image/" + (format.equals("jpg") ? "jpeg" : format) + ";base64,"
				+ Base64.getEncoder().encodeToString(out.toByteArray());
	}

	@Test
	void everyoneHasAProfilePhotoServedPublicly() throws Exception {
		String token = tokenFor(Role.VENDEUR);

		String avatar = JsonPath.read(putAs(token, "/api/me/avatar", "{\"dataUrl\": \"%s\"}".formatted(photo("png")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.avatarUrl", startsWith("/api/images/")))
				.andReturn().getResponse().getContentAsString(), "$.avatarUrl");

		getAs(null, avatar).andExpect(status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType("image/png"));
		deleteAs(token, "/api/me/avatar").andExpect(status().isOk()).andExpect(jsonPath("$.avatarUrl").doesNotExist());
		getAs(null, avatar).andExpect(status().isNotFound());
	}

	@Test
	void onlyRealImagesAreAccepted() throws Exception {
		String token = tokenFor(Role.VENDEUR);
		String fake = "data:image/png;base64," + Base64.getEncoder().encodeToString("pas une image".getBytes());

		putAs(token, "/api/me/avatar", "{\"dataUrl\": \"%s\"}".formatted(fake))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Ce fichier n'est pas une image valide (JPEG ou PNG)."));
		putAs(token, "/api/me/avatar", "{\"dataUrl\": \"data:text/html;base64,PGgxPg==\"}")
				.andExpect(status().isBadRequest());
	}
}
