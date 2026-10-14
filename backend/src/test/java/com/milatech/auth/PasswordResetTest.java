package com.milatech.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.milatech.IntegrationTest;
import com.milatech.mail.Mailer;
import com.milatech.user.Role;

import jakarta.persistence.EntityManager;

/** Sprint 8 : mot de passe oublie, lien envoye par email (Brevo). */
class PasswordResetTest extends IntegrationTest {

	private static final Pattern LINK = Pattern.compile("http://localhost:5173/reinitialiser\\?token=([A-Za-z0-9_-]+)");

	@MockitoBean
	private Mailer mailer;

	@Autowired
	private JdbcTemplate jdbc;

	@Autowired
	private EntityManager entityManager;

	/** Demande un lien pour cet email et renvoie le jeton recu dans l'email. */
	private String requestLink(String email) throws Exception {
		postAs(null, "/api/auth/forgot-password", "{\"email\": \"%s\"}".formatted(email)).andExpect(status().isNoContent());
		ArgumentCaptor<String> text = ArgumentCaptor.forClass(String.class);
		verify(mailer, org.mockito.Mockito.atLeastOnce()).send(eq(email.toLowerCase()), anyString(), anyString(), text.capture());
		Matcher matcher = LINK.matcher(text.getValue());
		assertThat(matcher.find()).as("lien dans l'email").isTrue();
		return matcher.group(1);
	}

	private String reset(String token, String password) {
		return "{\"token\": \"%s\", \"password\": \"%s\"}".formatted(token, password);
	}

	@Test
	void aCustomerResetsTheirPasswordWithTheEmailedLink() throws Exception {
		createUser(Role.CLIENT, "awa@client.test");
		String token = requestLink("AWA@client.test");

		postAs(null, "/api/auth/reset-password", reset(token, "nouveau-mot-de-passe")).andExpect(status().isNoContent());
		postAs(null, "/api/auth/login", "{\"email\": \"awa@client.test\", \"password\": \"nouveau-mot-de-passe\"}")
				.andExpect(status().isOk());
		// Le lien ne sert qu'une fois
		postAs(null, "/api/auth/reset-password", reset(token, "encore-un-autre-mdp"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Ce lien n'est plus valable. Demandez-en un nouveau."));
		// Seule une empreinte du jeton est gardee en base : le jeton lui-meme n'y figure pas
		assertThat(jdbc.queryForObject("select count(*) from password_reset_token where token_hash = ?", Long.class, token))
				.isZero();
	}

	@Test
	void theAnswerIsTheSameForAnUnknownEmail() throws Exception {
		postAs(null, "/api/auth/forgot-password", "{\"email\": \"personne@nulle-part.test\"}").andExpect(status().isNoContent());
		verify(mailer, never()).send(anyString(), anyString(), anyString(), anyString());

		var user = createUser(Role.VENDEUR, "ancien@milatech.test");
		user.setActive(false);
		postAs(null, "/api/auth/forgot-password", "{\"email\": \"ancien@milatech.test\"}").andExpect(status().isNoContent());
		verify(mailer, never()).send(anyString(), anyString(), anyString(), anyString());
	}

	@Test
	void anExpiredOrReplacedLinkNoLongerWorks() throws Exception {
		createUser(Role.CLIENT, "awa@client.test");
		String first = requestLink("awa@client.test");
		String second = requestLink("awa@client.test");

		// Un nouveau lien annule le precedent
		postAs(null, "/api/auth/reset-password", reset(first, "nouveau-mot-de-passe")).andExpect(status().isBadRequest());

		entityManager.flush();
		jdbc.update("update password_reset_token set expires_at = expires_at - interval '2' hour");
		entityManager.clear();
		postAs(null, "/api/auth/reset-password", reset(second, "nouveau-mot-de-passe"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Ce lien n'est plus valable. Demandez-en un nouveau."));
	}

	@Test
	void theNewPasswordMustBeStrong() throws Exception {
		createUser(Role.CLIENT, "awa@client.test");
		String token = requestLink("awa@client.test");

		postAs(null, "/api/auth/reset-password", reset(token, "court"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.password").value("Le mot de passe doit contenir au moins 8 caractères."));
		postAs(null, "/api/auth/reset-password", reset("faux-jeton", "nouveau-mot-de-passe")).andExpect(status().isBadRequest());
	}
}
