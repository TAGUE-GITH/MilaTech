package com.milatech.shop;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.milatech.customer.Customer;
import com.milatech.sale.Sale;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/** Commande passee par un client sur le site : retrait en boutique ou livraison a Yaounde, paiement a la remise. */
@Entity
@Table(name = "online_order")
public class OnlineOrder {

	public enum DeliveryMode {
		RETRAIT,
		LIVRAISON
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String reference;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "customer_id")
	private Customer customer;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private OrderStatus status = OrderStatus.EN_ATTENTE;

	@Enumerated(EnumType.STRING)
	@Column(name = "delivery_mode", nullable = false)
	private DeliveryMode deliveryMode;

	/** Quartier et repere, seulement pour une livraison. */
	private String address;

	@Column(nullable = false)
	private String phone;

	private String note;

	@Column(nullable = false)
	private long subtotal;

	@Column(name = "delivery_fee", nullable = false)
	private long deliveryFee;

	@Column(name = "cancel_reason")
	private String cancelReason;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sale_id")
	private Sale sale;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = createdAt;

	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
	@OrderBy("id")
	private List<OnlineOrderLine> lines = new ArrayList<>();

	protected OnlineOrder() {
	}

	public OnlineOrder(Customer customer, DeliveryMode deliveryMode, String address, String phone, String note,
			long deliveryFee) {
		this.customer = customer;
		this.deliveryMode = deliveryMode;
		this.address = address;
		this.phone = phone;
		this.note = note;
		this.deliveryFee = deliveryFee;
	}

	public void addLine(OnlineOrderLine line) {
		lines.add(line);
		subtotal += line.getLineTotal();
	}

	/** Reference lisible attribuee apres l'enregistrement : CMD-2026-00042. */
	public void assignReference() {
		reference = "CMD-%d-%05d".formatted(createdAt.atZone(Sale.ZONE).getYear(), id);
	}

	/** Le service verifie l'etape (canMoveTo) et s'occupe du stock et de la vente avant d'appeler cette methode. */
	void moveTo(OrderStatus target, String reason) {
		status = target;
		updatedAt = Instant.now();
		if (target == OrderStatus.ANNULEE) cancelReason = reason;
	}

	void attachSale(Sale sale) {
		this.sale = sale;
	}

	public long getTotal() {
		return subtotal + deliveryFee;
	}

	public int getItemCount() {
		return lines.stream().mapToInt(OnlineOrderLine::getQuantity).sum();
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

	public OrderStatus getStatus() {
		return status;
	}

	public DeliveryMode getDeliveryMode() {
		return deliveryMode;
	}

	public String getAddress() {
		return address;
	}

	public String getPhone() {
		return phone;
	}

	public String getNote() {
		return note;
	}

	public long getSubtotal() {
		return subtotal;
	}

	public long getDeliveryFee() {
		return deliveryFee;
	}

	public String getCancelReason() {
		return cancelReason;
	}

	public Sale getSale() {
		return sale;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public List<OnlineOrderLine> getLines() {
		return lines;
	}
}
