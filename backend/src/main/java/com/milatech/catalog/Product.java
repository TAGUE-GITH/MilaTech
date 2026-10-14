package com.milatech.catalog;

import java.time.Instant;

import com.milatech.image.Image;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/**
 * Produit vendu ou utilise en reparation. La quantite ne change que par le service de stock,
 * qui enregistre un mouvement a chaque fois (regle R2) et refuse toute quantite negative (R1).
 */
@Entity
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String reference;

	@Column(nullable = false)
	private String name;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "category_id")
	private Category category;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "supplier_id")
	private Supplier supplier;

	private String description;

	/** Prix en francs CFA, sans centimes (R11). */
	@Column(name = "purchase_price", nullable = false)
	private long purchasePrice;

	@Column(name = "sale_price", nullable = false)
	private long salePrice;

	@Column(nullable = false)
	private int quantity;

	@Column(name = "alert_threshold", nullable = false)
	private int alertThreshold;

	@Column(nullable = false)
	private boolean active = true;

	/** Photo affichee dans la boutique en ligne. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	private Image image;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected Product() {
	}

	public Product(String reference, String name, Category category, long purchasePrice, long salePrice, int alertThreshold) {
		this.reference = normalize(reference);
		this.name = name;
		this.category = category;
		this.purchasePrice = purchasePrice;
		this.salePrice = salePrice;
		this.alertThreshold = alertThreshold;
	}

	/** References en majuscules, sans espaces autour : « tel-a15 » et « TEL-A15 » sont la meme. */
	public static String normalize(String reference) {
		return reference.trim().toUpperCase();
	}

	public boolean isLowStock() {
		return quantity <= alertThreshold;
	}

	/** Reserve au service de stock : ajoute (ou retire si negatif) des pieces. */
	public void addQuantity(int delta) {
		if (quantity + delta < 0) throw new IllegalStateException("Stock negatif interdit");
		quantity += delta;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getReference() {
		return reference;
	}

	public void setReference(String reference) {
		this.reference = normalize(reference);
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Category getCategory() {
		return category;
	}

	public void setCategory(Category category) {
		this.category = category;
	}

	public Supplier getSupplier() {
		return supplier;
	}

	public void setSupplier(Supplier supplier) {
		this.supplier = supplier;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public long getPurchasePrice() {
		return purchasePrice;
	}

	public void setPurchasePrice(long purchasePrice) {
		this.purchasePrice = purchasePrice;
	}

	public long getSalePrice() {
		return salePrice;
	}

	public void setSalePrice(long salePrice) {
		this.salePrice = salePrice;
	}

	public int getQuantity() {
		return quantity;
	}

	public int getAlertThreshold() {
		return alertThreshold;
	}

	public void setAlertThreshold(int alertThreshold) {
		this.alertThreshold = alertThreshold;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Image getImage() {
		return image;
	}

	public void setImage(Image image) {
		this.image = image;
	}
}
