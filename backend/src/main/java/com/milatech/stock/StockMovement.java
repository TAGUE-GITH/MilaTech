package com.milatech.stock;

import java.time.Instant;

import com.milatech.catalog.Product;
import com.milatech.catalog.Supplier;
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
import jakarta.persistence.Table;

/** Trace d'une variation de stock : jamais modifiee ni supprimee. */
@Entity
@Table(name = "stock_movement")
public class StockMovement {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id")
	private Product product;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private MovementType type;

	/** Positif pour une entree, negatif pour une sortie. */
	@Column(nullable = false)
	private int quantity;

	@Column(name = "quantity_after", nullable = false)
	private int quantityAfter;

	@Column(name = "unit_cost")
	private Long unitCost;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "supplier_id")
	private Supplier supplier;

	private String reason;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "author_id")
	private User author;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected StockMovement() {
	}

	public StockMovement(Product product, MovementType type, int quantity, Long unitCost, Supplier supplier,
			String reason, User author) {
		this.product = product;
		this.type = type;
		this.quantity = quantity;
		this.quantityAfter = product.getQuantity();
		this.unitCost = unitCost;
		this.supplier = supplier;
		this.reason = reason;
		this.author = author;
	}

	public Long getId() {
		return id;
	}

	public Product getProduct() {
		return product;
	}

	public MovementType getType() {
		return type;
	}

	public int getQuantity() {
		return quantity;
	}

	public int getQuantityAfter() {
		return quantityAfter;
	}

	public Long getUnitCost() {
		return unitCost;
	}

	public Supplier getSupplier() {
		return supplier;
	}

	public String getReason() {
		return reason;
	}

	public User getAuthor() {
		return author;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
