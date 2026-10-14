package com.milatech.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.milatech.user.Role;
import com.milatech.user.User;
import com.milatech.user.UserRepository;

/**
 * Premier compte gerant, cree au demarrage si la base ne contient encore aucun employe.
 * En production, l'email et le mot de passe sont saisis par le gerant dans les variables d'environnement
 * de l'hebergeur (BOOTSTRAP_EMAIL, BOOTSTRAP_PASSWORD) : ils n'apparaissent jamais dans le code.
 */
@Component
public class ManagerBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ManagerBootstrap.class);

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final String email;
	private final String password;

	public ManagerBootstrap(UserRepository users, PasswordEncoder passwordEncoder,
			@Value("${app.bootstrap.email:}") String email, @Value("${app.bootstrap.password:}") String password) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.email = email;
		this.password = password;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (email.isBlank() || password.isBlank() || users.count() > 0) return;
		users.save(new User(email, passwordEncoder.encode(password), "Gérant", "MilaTech", null, Role.GERANT));
		log.info("Premier compte gérant créé : {}", email);
	}
}
