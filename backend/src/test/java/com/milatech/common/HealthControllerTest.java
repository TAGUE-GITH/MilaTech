package com.milatech.common;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;

class HealthControllerTest extends IntegrationTest {

	@Test
	void theHealthCheckIsPublicAndReachesTheDatabase() throws Exception {
		getAs(null, "/api/health")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ok"));
	}

	@Test
	void everythingElseRequiresAuthentication() throws Exception {
		getAs(null, "/api/products").andExpect(status().isUnauthorized());
	}
}
