package com.milatech.customer;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

/** Client de MilaTech : il peut acheter, deposer un appareil ou suivre une formation. */
@Entity
public class Customer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "full_name", nullable = false)
	private String fullName;

	@Column(nullable = false)
	private String phone;

	private String email;
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected Customer() {
	}

	public Customer(String fullName, String phone, String email, String notes) {
		update(fullName, phone, email, notes);
	}

	/** Numero sans espaces ni tirets : « 677 11-22 33 » devient « 677112233 ». */
	public static String normalizePhone(String phone) {
		return phone == null ? "" : phone.replaceAll("[\\s.-]", "");
	}

	public void update(String fullName, String phone, String email, String notes) {
		this.fullName = fullName.trim();
		this.phone = normalizePhone(phone);
		this.email = email == null || email.isBlank() ? null : email.trim().toLowerCase();
		this.notes = notes == null || notes.isBlank() ? null : notes.trim();
	}

	public Long getId() {
		return id;
	}

	public String getFullName() {
		return fullName;
	}

	public String getPhone() {
		return phone;
	}

	public String getEmail() {
		return email;
	}

	public String getNotes() {
		return notes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
