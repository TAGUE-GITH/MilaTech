package com.milatech.mail;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** Un faux serveur remplace l'API Brevo : aucun email n'est reellement envoye. */
class BrevoMailerTest {

	private MockRestServiceServer server;
	private BrevoMailer mailer;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		mailer = new BrevoMailer(builder, "cle-test", "contact@milatech.cm", "MilaTech");
	}

	@Test
	void sendsTheEmailThroughTheBrevoApi() {
		server.expect(requestTo(BrevoMailer.API_URL))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("api-key", "cle-test"))
				.andExpect(jsonPath("$.sender.email").value("contact@milatech.cm"))
				.andExpect(jsonPath("$.to[0].email").value("awa@client.test"))
				.andExpect(jsonPath("$.subject").value("Sujet"))
				.andRespond(withStatus(HttpStatus.CREATED));

		mailer.send("awa@client.test", "Sujet", "<p>HTML</p>", "Texte");

		server.verify();
	}

	@Test
	void aBrevoErrorDoesNotBreakTheRequest() {
		server.expect(requestTo(BrevoMailer.API_URL)).andRespond(withServerError());

		assertThatCode(() -> mailer.send("awa@client.test", "Sujet", "<p>HTML</p>", "Texte")).doesNotThrowAnyException();
	}
}
