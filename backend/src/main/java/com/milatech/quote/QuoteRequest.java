package com.milatech.quote;

import java.time.Instant;

import com.milatech.common.ApiException;
import com.milatech.customer.Customer;
import com.milatech.image.Image;
import com.milatech.repair.Repair;
import com.milatech.sale.Sale;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Demande de devis de reparation envoyee par un client depuis le site. */
@Entity
@Table(name = "quote_request")
public class QuoteRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String reference;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "customer_id")
	private Customer customer;

	@Enumerated(EnumType.STRING)
	@Column(name = "device_type", nullable = false)
	private Repair.DeviceType deviceType;

	private String brand;
	private String model;

	@Column(nullable = false)
	private String issue;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private Image image;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private QuoteStatus status = QuoteStatus.NOUVELLE;

	@Column(name = "quoted_price")
	private Long quotedPrice;

	@Column(name = "quote_message")
	private String quoteMessage;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "quoted_by")
	private User quotedBy;

	@Column(name = "quoted_at")
	private Instant quotedAt;

	@Column(name = "answered_at")
	private Instant answeredAt;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "repair_id")
	private Repair repair;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected QuoteRequest() {
	}

	public QuoteRequest(Customer customer, Repair.DeviceType deviceType, String brand, String model, String issue,
			Image image) {
		this.customer = customer;
		this.deviceType = deviceType;
		this.brand = brand;
		this.model = model;
		this.issue = issue;
		this.image = image;
	}

	public void assignReference() {
		reference = "DEV-%d-%05d".formatted(createdAt.atZone(Sale.ZONE).getYear(), id);
	}

	/** La boutique envoie (ou corrige) son prix tant que le client n'a pas repondu. */
	public void quote(long price, String message, User author) {
		if (status != QuoteStatus.NOUVELLE && status != QuoteStatus.DEVIS_ENVOYE)
			throw ApiException.badRequest("Le client a déjà répondu à ce devis : le prix ne peut plus changer.");
		quotedPrice = price;
		quoteMessage = message;
		quotedBy = author;
		quotedAt = Instant.now();
		status = QuoteStatus.DEVIS_ENVOYE;
	}

	/** Reponse du client : accepte ou refuse le prix propose. */
	public void answer(boolean accepted) {
		if (status == QuoteStatus.NOUVELLE) throw ApiException.badRequest("La boutique n'a pas encore envoyé de devis.");
		if (status != QuoteStatus.DEVIS_ENVOYE) throw ApiException.badRequest("Ce devis a déjà reçu une réponse.");
		status = accepted ? QuoteStatus.ACCEPTEE : QuoteStatus.REFUSEE;
		answeredAt = Instant.now();
	}

	/** Le client retire sa demande tant que la boutique n'a pas envoye de prix. */
	public void cancel() {
		if (status == QuoteStatus.DEVIS_ENVOYE)
			throw ApiException.badRequest("Le devis est arrivé : acceptez-le ou refusez-le.");
		if (status != QuoteStatus.NOUVELLE) throw ApiException.badRequest("Cette demande ne peut plus être annulée.");
		status = QuoteStatus.ANNULEE;
	}

	/** L'appareil est apporte a la boutique : la demande devient un dossier de reparation. */
	public void deposited(Repair repair) {
		this.repair = repair;
		status = QuoteStatus.DEPOSEE;
	}

	public String getDevice() {
		String name = String.join(" ", brand == null ? "" : brand, model == null ? "" : model).trim();
		return name.isEmpty() ? deviceType.name() : name;
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

	public Repair.DeviceType getDeviceType() {
		return deviceType;
	}

	public String getBrand() {
		return brand;
	}

	public String getModel() {
		return model;
	}

	public String getIssue() {
		return issue;
	}

	public Image getImage() {
		return image;
	}

	public QuoteStatus getStatus() {
		return status;
	}

	public Long getQuotedPrice() {
		return quotedPrice;
	}

	public String getQuoteMessage() {
		return quoteMessage;
	}

	public User getQuotedBy() {
		return quotedBy;
	}

	public Instant getQuotedAt() {
		return quotedAt;
	}

	public Instant getAnsweredAt() {
		return answeredAt;
	}

	public Repair getRepair() {
		return repair;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
