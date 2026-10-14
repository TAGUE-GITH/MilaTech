package com.milatech.shop;

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

/** Ligne de commande : nom et prix figes au moment de la commande. */
@Entity
@Table(name = "online_order_line")
public class OnlineOrderLine {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id")
	private OnlineOrder order;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id")
	private Product product;

	@Column(name = "product_name", nullable = false)
	private String productName;

	@Column(nullable = false)
	private int quantity;

	@Column(name = "unit_price", nullable = false)
	private long unitPrice;

	protected OnlineOrderLine() {
	}

	public OnlineOrderLine(OnlineOrder order, Product product, int quantity) {
		this.order = order;
		this.product = product;
		this.productName = product.getName();
		this.quantity = quantity;
		this.unitPrice = product.getSalePrice();
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
}
