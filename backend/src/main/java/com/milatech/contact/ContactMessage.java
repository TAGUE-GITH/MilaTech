package com.milatech.contact;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Message envoye depuis le formulaire de contact du site public. */
@Entity
@Table(name = "contact_message")
public class ContactMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String phone;

	private String email;
	private String subject;

	@Column(nullable = false)
	private String message;

	@Column(nullable = false)
	private boolean handled;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected ContactMessage() {
	}

	public ContactMessage(String name, String phone, String email, String subject, String message) {
		this.name = name;
		this.phone = phone;
		this.email = email;
		this.subject = subject;
		this.message = message;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getPhone() {
		return phone;
	}

	public String getEmail() {
		return email;
	}

	public String getSubject() {
		return subject;
	}

	public String getMessage() {
		return message;
	}

	public boolean isHandled() {
		return handled;
	}

	public void setHandled(boolean handled) {
		this.handled = handled;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
