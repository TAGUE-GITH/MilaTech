package com.milatech.catalog;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.milatech.image.Image;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class CatalogDtos {

	private CatalogDtos() {
	}

	public record CategoryRequest(@NotBlank(message = "Le nom est obligatoire.") @Size(max = 80) String name) {
	}

	public record CategoryResponse(Long id, String name) {

		public static CategoryResponse of(Category category) {
			return new CategoryResponse(category.getId(), category.getName());
		}
	}

	public record SupplierRequest(
			@NotBlank(message = "Le nom est obligatoire.") @Size(max = 120) String name,
			@Size(max = 30) String phone,
			@Email(message = "Email invalide.") String email,
			@Size(max = 255) String address) {
	}

	public record SupplierResponse(Long id, String name, String phone, String email, String address) {

		public static SupplierResponse of(Supplier supplier) {
			return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getPhone(), supplier.getEmail(),
					supplier.getAddress());
		}
	}

	public record ProductRequest(
			@NotBlank(message = "La référence est obligatoire.") @Size(max = 40) String reference,
			@NotBlank(message = "Le nom est obligatoire.") @Size(max = 160) String name,
			@NotNull(message = "Choisissez une catégorie.") Long categoryId,
			Long supplierId,
			@Size(max = 2000) String description,
			@NotNull(message = "Le prix d'achat est obligatoire.") @PositiveOrZero(message = "Le prix d'achat ne peut pas être négatif.") Long purchasePrice,
			@NotNull(message = "Le prix de vente est obligatoire.") @Positive(message = "Le prix de vente doit être supérieur à 0.") Long salePrice,
			@NotNull(message = "Le seuil d'alerte est obligatoire.") @Min(value = 0, message = "Le seuil d'alerte ne peut pas être négatif.") Integer alertThreshold,
			@PositiveOrZero(message = "Le stock initial ne peut pas être négatif.") Integer initialQuantity,
			Boolean active) {
	}

	public record Named(Long id, String name) {
	}

	/**
	 * Le prix d'achat n'est envoye qu'au gerant (null pour les autres roles, donc absent du JSON) :
	 * les employes ne voient pas les marges.
	 */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record ProductResponse(Long id, String reference, String name, Named category, Named supplier,
			String description, Long purchasePrice, long salePrice, int quantity, int alertThreshold, boolean lowStock,
			boolean active, String imageUrl) {

		public static ProductResponse of(Product p, boolean showCosts) {
			Named supplier = p.getSupplier() == null ? null : new Named(p.getSupplier().getId(), p.getSupplier().getName());
			return new ProductResponse(p.getId(), p.getReference(), p.getName(),
					new Named(p.getCategory().getId(), p.getCategory().getName()), supplier, p.getDescription(),
					showCosts ? p.getPurchasePrice() : null, p.getSalePrice(), p.getQuantity(), p.getAlertThreshold(),
					p.isLowStock(), p.isActive(), Image.url(p.getImage()));
		}
	}

	public record ImageRequest(@NotBlank(message = "Choisissez une photo.") String dataUrl) {
	}

	/** Produit tel que les visiteurs le voient dans la boutique en ligne : ni reference interne, ni prix d'achat. */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record ShopProduct(Long id, String name, String description, Named category, long price, int stock,
			String imageUrl) {

		public static ShopProduct of(Product p) {
			return new ShopProduct(p.getId(), p.getName(), p.getDescription(),
					new Named(p.getCategory().getId(), p.getCategory().getName()), p.getSalePrice(), p.getQuantity(),
					Image.url(p.getImage()));
		}
	}
}
