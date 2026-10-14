package com.milatech.training;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import com.milatech.common.ApiException;
import com.milatech.common.Money;
import com.milatech.customer.Customer;
import com.milatech.payment.Payment;
import com.milatech.user.User;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;

/** Inscription d'un apprenant a une session, avec ses paiements en plusieurs fois (R9). */
@Entity
public class Enrollment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String reference;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "training_id")
	private Training training;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "customer_id")
	private Customer customer;

	@Column(name = "agreed_fee", nullable = false)
	private long agreedFee;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private EnrollmentStatus status = EnrollmentStatus.INSCRIT;

	@Column(name = "enrolled_at", nullable = false)
	private Instant enrolledAt = Instant.now();

	@OneToMany(mappedBy = "enrollment", cascade = CascadeType.ALL)
	@OrderBy("id")
	private List<Payment> payments = new ArrayList<>();

	protected Enrollment() {
	}

	public Enrollment(Training training, Customer customer, long agreedFee) {
		this.training = training;
		this.customer = customer;
		this.agreedFee = agreedFee;
	}

	public void assignReference() {
		reference = "INS-%d-%05d".formatted(enrolledAt.atZone(ZoneId.of("Africa/Douala")).getYear(), id);
	}

	public long getPaid() {
		return payments.stream().mapToLong(Payment::getAmount).sum();
	}

	public long getBalance() {
		return agreedFee - getPaid();
	}

	public void addPayment(long amount, Payment.Method method, User author) {
		if (amount > getBalance())
			throw ApiException.badRequest("Le paiement dépasse le solde (" + Money.fcfa(getBalance()) + ").");
		payments.add(new Payment(this, amount, method, author));
	}

	public Long getId() {
		return id;
	}

	public String getReference() {
		return reference;
	}

	public Training getTraining() {
		return training;
	}

	public Customer getCustomer() {
		return customer;
	}

	public long getAgreedFee() {
		return agreedFee;
	}

	public EnrollmentStatus getStatus() {
		return status;
	}

	public void setStatus(EnrollmentStatus status) {
		this.status = status;
	}

	public Instant getEnrolledAt() {
		return enrolledAt;
	}

	public List<Payment> getPayments() {
		return payments;
	}
}
