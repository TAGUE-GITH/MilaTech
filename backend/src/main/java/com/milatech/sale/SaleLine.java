package com.milatech.sale;

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

/** Ligne de vente : nom, prix de vente et prix d'achat figes au moment de la vente (R4). */
@Entity
@Table(name = "sale_line")
public class SaleLine {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "sale_id")
	private Sale sale;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id")
	private Product product;

	@Column(name = "product_name", nullable = false)
	private String productName;

	@Column(name = "product_reference", nullable = false)
	private String productReference;

	@Column(nullable = false)
	private int quantity;

	@Column(name = "unit_price", nullable = false)
	private long unitPrice;

	@Column(name = "unit_cost", nullable = false)
	private long unitCost;

	protected SaleLine() {
	}

	public SaleLine(Sale sale, Product product, int quantity) {
		this.sale = sale;
		this.product = product;
		this.productName = product.getName();
		this.productReference = product.getReference();
		this.quantity = quantity;
		this.unitPrice = product.getSalePrice();
		this.unitCost = product.getPurchasePrice();
	}

	public long getLineTotal() {
		return unitPrice * quantity;
	}

	/** R5 : marge theorique de la ligne (ce n'est pas le benefice, qui depend aussi des charges). */
	public long getLineMargin() {
		return (unitPrice - unitCost) * quantity;
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

	public String getProductReference() {
		return productReference;
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
