package com.milatech.payment;

import java.time.Instant;

import com.milatech.repair.Repair;
import com.milatech.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/** Paiement (acompte ou solde) d'une reparation ; les formations s'y ajouteront au sprint 4. */
@Entity
public class Payment {

	public enum Method {
		ESPECES,
		MOBILE_MONEY
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "repair_id")
	private Repair repair;

	@Column(nullable = false)
	private long amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Method method;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "received_by")
	private User receivedBy;

	@Column(name = "paid_at", nullable = false)
	private Instant paidAt = Instant.now();

	protected Payment() {
	}

	public Payment(Repair repair, long amount, Method method, User receivedBy) {
		this.repair = repair;
		this.amount = amount;
		this.method = method;
		this.receivedBy = receivedBy;
	}

	public Long getId() {
		return id;
	}

	public long getAmount() {
		return amount;
	}

	public Method getMethod() {
		return method;
	}

	public User getReceivedBy() {
		return receivedBy;
	}

	public Instant getPaidAt() {
		return paidAt;
	}
}
