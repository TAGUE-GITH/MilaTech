package com.milatech.user;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.milatech.IntegrationTest;

/** US-02 : comptes des employes, geres par le gerant. */
class UserManagementTest extends IntegrationTest {

	private static final String USERS = "/api/users";

	private String employee(String email, String role) {
		return """
				{"email": "%s", "firstName": "Paul", "lastName": "Essomba", "phone": "677112233",
				 "role": "%s", "password": "%s"}""".formatted(email, role, PASSWORD);
	}

	@Test
	void theManagerCreatesAnEmployeeWhoCanThenLogIn() throws Exception {
		String manager = tokenFor(Role.GERANT);

		postAs(manager, USERS, employee("paul@milatech.test", "TECHNICIEN"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.role").value("TECHNICIEN"))
				.andExpect(jsonPath("$.active").value(true));

		postAs(null, "/api/auth/login", """
				{"email": "paul@milatech.test", "password": "%s"}""".formatted(PASSWORD))
				.andExpect(status().isOk());
	}

	@Test
	void onlyTheManagerManagesAccounts() throws Exception {
		for (Role role : new Role[] { Role.VENDEUR, Role.TECHNICIEN, Role.FORMATEUR }) {
			String token = tokenFor(role);
			getAs(token, USERS).andExpect(status().isForbidden());
			postAs(token, USERS, employee("x@milatech.test", "VENDEUR")).andExpect(status().isForbidden());
		}
		getAs(null, USERS).andExpect(status().isUnauthorized());
	}

	@Test
	void theEmailIsUniqueAndThePasswordStrongEnough() throws Exception {
		String manager = tokenFor(Role.GERANT);
		createUser(Role.VENDEUR, "awa@milatech.test");

		postAs(manager, USERS, employee("AWA@milatech.test", "VENDEUR"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Un compte existe déjà avec cet email."));
		postAs(manager, USERS, employee("new@milatech.test", "VENDEUR").replace(PASSWORD, "court"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.password").exists());
	}

	@Test
	void theManagerChangesARoleAndDeactivatesAnAccount() throws Exception {
		String manager = tokenFor(Role.GERANT);
		User seller = createUser(Role.VENDEUR);

		patchAs(manager, USERS + "/{id}", "{\"role\": \"TECHNICIEN\", \"active\": false}", seller.getId())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.role").value("TECHNICIEN"))
				.andExpect(jsonPath("$.active").value(false));
	}

	@Test
	void theManagerCannotDeactivateOrDemoteThemselves() throws Exception {
		User manager = createUser(Role.GERANT);
		String token = tokenFor(manager);

		patchAs(token, USERS + "/{id}", "{\"active\": false}", manager.getId())
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Vous ne pouvez pas désactiver votre propre compte ni retirer votre rôle de gérant."));
		patchAs(token, USERS + "/{id}", "{\"role\": \"VENDEUR\"}", manager.getId())
				.andExpect(status().isBadRequest());
	}

	@Test
	void theManagerListsTheTeam() throws Exception {
		String manager = tokenFor(Role.GERANT);
		createUser(Role.VENDEUR);
		createUser(Role.TECHNICIEN);

		getAs(manager, USERS).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
	}
}
