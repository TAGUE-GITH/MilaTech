package com.milatech.repair;

import com.milatech.catalog.Product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Piece prise dans le stock pour une reparation, a son prix du moment (R4, R7). */
@Entity
@Table(name = "repair_part")
public class RepairPart {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "repair_id")
	private Repair repair;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id")
	private Product product;

	@Column(name = "product_name", nullable = false)
	private String productName;

	@Column(nullable = false)
	private int quantity;

	@Column(name = "unit_price", nullable = false)
	private long unitPrice;

	@Column(name = "unit_cost", nullable = false)
	private long unitCost;

	protected RepairPart() {
	}

	public RepairPart(Repair repair, Product product, int quantity) {
		this.repair = repair;
		this.product = product;
		this.productName = product.getName();
		this.quantity = quantity;
		this.unitPrice = product.getSalePrice();
		this.unitCost = product.getPurchasePrice();
	}

	public long getLineTotal() {
		return unitPrice * quantity;
	}

	public Long getId() {
		return id;
	}

	public Product getProduct() {
		return product;
	}

	public String getProductName() {
		return productName;
	}

	public int getQuantity() {
		return quantity;
	}

	public long getUnitPrice() {
		return unitPrice;
	}

	public long getUnitCost() {
		return unitCost;
	}
}
