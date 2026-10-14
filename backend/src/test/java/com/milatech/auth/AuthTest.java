package com.milatech.auth;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;
import com.milatech.user.User;

/** US-01 : connexion des employes. */
class AuthTest extends IntegrationTest {

	private static final String LOGIN = "/api/auth/login";

	private String credentials(String email, String password) {
		return """
				{"email": "%s", "password": "%s"}""".formatted(email, password);
	}

	@Test
	void anEmployeeLogsInAndReceivesAToken() throws Exception {
		createUser(Role.VENDEUR, "awa@milatech.test");

		postAs(null, LOGIN, credentials("Awa@MilaTech.test", PASSWORD))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token", not(emptyString())))
				.andExpect(jsonPath("$.user.email").value("awa@milatech.test"))
				.andExpect(jsonPath("$.user.role").value("VENDEUR"))
				.andExpect(jsonPath("$.user.passwordHash").doesNotExist());
	}

	@Test
	void wrongCredentialsAreRefusedWithAClearMessage() throws Exception {
		createUser(Role.VENDEUR, "awa@milatech.test");

		postAs(null, LOGIN, credentials("awa@milatech.test", "mauvais-mot-de-passe"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Email ou mot de passe incorrect."));
		postAs(null, LOGIN, credentials("inconnu@milatech.test", PASSWORD))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void aDeactivatedAccountCannotLogInNorUseItsToken() throws Exception {
		User user = createUser(Role.TECHNICIEN, "paul@milatech.test");
		String token = tokenFor(user);
		user.setActive(false);
		users.save(user);

		postAs(null, LOGIN, credentials("paul@milatech.test", PASSWORD))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Ce compte a été désactivé. Contactez le gérant."));
		getAs(token, "/api/auth/me").andExpect(status().isUnauthorized());
	}

	@Test
	void theConnectedEmployeeSeesTheirProfile() throws Exception {
		User user = createUser(Role.FORMATEUR, "eric@milatech.test");

		getAs(tokenFor(user), "/api/auth/me")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("eric@milatech.test"))
				.andExpect(jsonPath("$.role").value("FORMATEUR"));
		getAs(null, "/api/auth/me").andExpect(status().isUnauthorized());
		getAs("jeton-invalide", "/api/auth/me").andExpect(status().isUnauthorized());
	}

	@Test
	void emailAndPasswordAreRequired() throws Exception {
		postAs(null, LOGIN, "{\"email\": \"\", \"password\": \"\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.email").exists())
				.andExpect(jsonPath("$.errors.password").exists());
	}
}
