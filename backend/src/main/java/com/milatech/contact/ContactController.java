package com.milatech.contact;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.common.ApiException;
import com.milatech.customer.Customer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Formulaire de contact du site (public) et lecture des messages par la boutique (gerant, vendeurs). */
@RestController
@Transactional
public class ContactController {

	public record ContactRequest(
			@NotBlank(message = "Indiquez votre nom.") @Size(max = 120) String name,
			@NotBlank(message = "Indiquez votre téléphone pour qu'on vous rappelle.") @Size(max = 30) String phone,
			@Email(message = "Email invalide.") @Size(max = 160) String email,
			@Size(max = 160) String subject,
			@NotBlank(message = "Écrivez votre message.") @Size(max = 2000, message = "2 000 caractères maximum.") String message,
			/** Champ invisible pour les humains : seuls les robots le remplissent. */
			String website) {
	}

	public record ContactResponse(Long id, String name, String phone, String email, String subject, String message,
			boolean handled, Instant createdAt) {

		static ContactResponse of(ContactMessage m) {
			return new ContactResponse(m.getId(), m.getName(), m.getPhone(), m.getEmail(), m.getSubject(), m.getMessage(),
					m.isHandled(), m.getCreatedAt());
		}
	}

	public record HandledRequest(boolean handled) {
	}

	private final ContactMessageRepository messages;

	public ContactController(ContactMessageRepository messages) {
		this.messages = messages;
	}

	@PostMapping("/api/contact")
	@ResponseStatus(HttpStatus.CREATED)
	public void send(@Valid @RequestBody ContactRequest request) {
		// Robot detecte : on repond comme si tout allait bien, sans rien enregistrer
		if (request.website() != null && !request.website().isBlank()) return;
		messages.save(new ContactMessage(request.name().trim(), Customer.normalizePhone(request.phone()),
				request.email() == null || request.email().isBlank() ? null : request.email().trim(),
				request.subject() == null || request.subject().isBlank() ? null : request.subject().trim(),
				request.message().trim()));
	}

	@GetMapping("/api/contact-messages")
	@PreAuthorize("hasAnyRole('GERANT', 'VENDEUR')")
	public List<ContactResponse> list() {
		return messages.findAllByOrderByHandledAscCreatedAtDesc().stream().map(ContactResponse::of).toList();
	}

	@PatchMapping("/api/contact-messages/{id}")
	@PreAuthorize("hasAnyRole('GERANT', 'VENDEUR')")
	public ContactResponse markHandled(@PathVariable Long id, @RequestBody HandledRequest request) {
		ContactMessage message = messages.findById(id).orElseThrow(() -> ApiException.notFound("Message introuvable."));
		message.setHandled(request.handled());
		return ContactResponse.of(message);
	}

}
