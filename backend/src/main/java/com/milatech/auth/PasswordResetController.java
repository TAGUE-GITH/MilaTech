package com.milatech.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.common.ApiException;
import com.milatech.mail.EmailService;
import com.milatech.user.UserRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Mot de passe oublie : un lien a usage unique est envoye par email, puis le nouveau mot de passe est choisi. */
@RestController
@RequestMapping("/api/auth")
@Transactional
public class PasswordResetController {

	public record ForgotRequest(@NotBlank(message = "Indiquez votre email.") String email) {
	}

	public record ResetRequest(@NotBlank String token,
			@NotBlank(message = "Choisissez un mot de passe.")
			@Size(min = 8, max = 100, message = "Le mot de passe doit contenir au moins 8 caractères.") String password) {
	}

	private static final SecureRandom RANDOM = new SecureRandom();

	private final UserRepository users;
	private final PasswordResetTokenRepository tokens;
	private final PasswordEncoder passwordEncoder;
	private final EmailService emails;
	private final String frontendUrl;
	private final long validMinutes;

	public PasswordResetController(UserRepository users, PasswordResetTokenRepository tokens,
			PasswordEncoder passwordEncoder, EmailService emails, @Value("${app.frontend-url}") String frontendUrl,
			@Value("${app.password-reset.minutes}") long validMinutes) {
		this.users = users;
		this.tokens = tokens;
		this.passwordEncoder = passwordEncoder;
		this.emails = emails;
		this.frontendUrl = frontendUrl;
		this.validMinutes = validMinutes;
	}

	/** Meme reponse que le compte existe ou non : on ne revele pas quelles adresses ont un compte. */
	@PostMapping("/forgot-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void forgot(@Valid @RequestBody ForgotRequest request) {
		users.findByEmailIgnoreCase(request.email().trim()).filter(user -> user.isActive()).ifPresent(user -> {
			// Un nouveau lien annule les precedents encore valables
			tokens.findByUserIdAndUsedAtIsNull(user.getId()).forEach(PasswordResetToken::markUsed);
			byte[] bytes = new byte[32];
			RANDOM.nextBytes(bytes);
			String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
			tokens.save(new PasswordResetToken(hash(token), user, Instant.now().plus(Duration.ofMinutes(validMinutes))));
			emails.sendPasswordReset(user.getEmail(), user.getFirstName(), frontendUrl + "/reinitialiser?token=" + token,
					validMinutes);
		});
	}

	@PostMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void reset(@Valid @RequestBody ResetRequest request) {
		PasswordResetToken token = tokens.findByTokenHash(hash(request.token())).filter(PasswordResetToken::isUsable)
				.orElseThrow(() -> ApiException.badRequest("Ce lien n'est plus valable. Demandez-en un nouveau."));
		token.markUsed();
		token.getUser().setPasswordHash(passwordEncoder.encode(request.password()));
	}

	static String hash(String token) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}
}
