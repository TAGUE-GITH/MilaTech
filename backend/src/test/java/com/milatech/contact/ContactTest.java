package com.milatech.contact;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;
import com.milatech.user.Role;

/** Formulaire de contact du site public et messages recus par la boutique. */
class ContactTest extends IntegrationTest {

	private static final String MESSAGE = """
			{"name": "Jean Fotso", "phone": "699 00 11 22", "email": "", "subject": "Prix d'un écran",
			 "message": "Bonjour, combien coûte un écran pour Tecno Spark 10 ?", "website": ""}""";

	@Test
	void aVisitorSendsAMessageThatTheShopReads() throws Exception {
		postAs(null, "/api/contact", MESSAGE).andExpect(status().isCreated());

		long id = ((Number) com.jayway.jsonpath.JsonPath.read(getAs(tokenFor(Role.VENDEUR), "/api/contact-messages")
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].name").value("Jean Fotso"))
				.andExpect(jsonPath("$[0].handled").value(false))
				.andReturn().getResponse().getContentAsString(), "$[0].id")).longValue();
		patchAs(tokenFor(Role.GERANT), "/api/contact-messages/{id}", "{\"handled\": true}", id)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.handled").value(true));
	}

	@Test
	void theNameAPhoneAndTheMessageAreRequired() throws Exception {
		postAs(null, "/api/contact", "{\"name\": \"\", \"phone\": \"\", \"message\": \"\"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.name").exists())
				.andExpect(jsonPath("$.errors.phone").exists())
				.andExpect(jsonPath("$.errors.message").exists());
	}

	@Test
	void robotsFillingTheHiddenFieldAreIgnoredSilently() throws Exception {
		postAs(null, "/api/contact", MESSAGE.replace("\"website\": \"\"", "\"website\": \"http://spam.example\""))
				.andExpect(status().isCreated());

		getAs(tokenFor(Role.GERANT), "/api/contact-messages").andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void techniciansAndTrainersDoNotReadTheMessages() throws Exception {
		getAs(tokenFor(Role.TECHNICIEN), "/api/contact-messages").andExpect(status().isForbidden());
		getAs(tokenFor(Role.FORMATEUR), "/api/contact-messages").andExpect(status().isForbidden());
	}
}
