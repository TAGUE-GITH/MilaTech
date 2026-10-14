package com.milatech.sale;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import com.milatech.customer.Customer;
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

/** Vente au comptoir : total et marge calcules a partir des prix figes dans les lignes (R4, R5). */
@Entity
public class Sale {

	public enum PaymentMethod {
		ESPECES,
		MOBILE_MONEY
	}

	/** Les dates s'affichent et se filtrent a l'heure du Cameroun. */
	public static final ZoneId ZONE = ZoneId.of("Africa/Douala");

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String reference;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id")
	private Customer customer;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "seller_id")
	private User seller;

	@Enumerated(EnumType.STRING)
	@Column(name = "payment_method", nullable = false)
	private PaymentMethod paymentMethod;

	@Column(nullable = false)
	private long total;

	@Column(nullable = false)
	private long margin;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	@OneToMany(mappedBy = "sale", cascade = CascadeType.ALL)
	@OrderBy("id")
	private List<SaleLine> lines = new ArrayList<>();

	protected Sale() {
	}

	public Sale(Customer customer, User seller, PaymentMethod paymentMethod) {
		this.customer = customer;
		this.seller = seller;
		this.paymentMethod = paymentMethod;
	}

	public void addLine(SaleLine line) {
		lines.add(line);
		total += line.getLineTotal();
		margin += line.getLineMargin();
	}

	/** Reference lisible attribuee apres l'enregistrement : VTE-2026-00042 (R10). */
	public void assignReference() {
		reference = "VTE-%d-%05d".formatted(createdAt.atZone(ZONE).getYear(), id);
	}

	public Long getId() {
		return id;
	}

	public String getReference() {
		return reference;
	}

	public Customer getCustomer() {
		return customer;
	}

	public User getSeller() {
		return seller;
	}

	public PaymentMethod getPaymentMethod() {
		return paymentMethod;
	}

	public long getTotal() {
		return total;
	}

	public long getMargin() {
		return margin;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public List<SaleLine> getLines() {
		return lines;
	}
}
