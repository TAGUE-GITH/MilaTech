package com.milatech.stock;

import java.time.Instant;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.catalog.CatalogDtos.ProductResponse;
import com.milatech.catalog.ProductRepository;
import com.milatech.catalog.SupplierRepository;
import com.milatech.common.ApiException;
import com.milatech.user.Role;
import com.milatech.user.User;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** US-06 a US-09 : achats, corrections d'inventaire, historique et alertes. */
@RestController
@RequestMapping("/api")
@Transactional
public class StockController {

	public record PurchaseRequest(
			@NotNull(message = "La quantité est obligatoire.") @Positive(message = "La quantité doit être d'au moins 1.") Integer quantity,
			@NotNull(message = "Le prix d'achat est obligatoire.") @PositiveOrZero(message = "Le prix d'achat ne peut pas être négatif.") Long unitCost,
			Long supplierId,
			@Size(max = 255) String note) {
	}

	public record AdjustmentRequest(
			@NotNull(message = "La quantité est obligatoire.") @PositiveOrZero(message = "La quantité ne peut pas être négative.") Integer quantity,
			@NotBlank(message = "Indiquez le motif de la correction.") @Size(max = 255) String reason) {
	}

	public record MovementResponse(Long id, MovementType type, int quantity, int quantityAfter, Long unitCost,
			String supplier, String reason, String author, Instant createdAt) {

		static MovementResponse of(StockMovement m) {
			return new MovementResponse(m.getId(), m.getType(), m.getQuantity(), m.getQuantityAfter(), m.getUnitCost(),
					m.getSupplier() == null ? null : m.getSupplier().getName(), m.getReason(),
					m.getAuthor().getFullName(), m.getCreatedAt());
		}
	}

	private final StockService stock;
	private final ProductRepository products;
	private final SupplierRepository suppliers;

	public StockController(StockService stock, ProductRepository products, SupplierRepository suppliers) {
		this.stock = stock;
		this.products = products;
		this.suppliers = suppliers;
	}

	@PostMapping("/products/{id}/purchases")
	@PreAuthorize("hasRole('GERANT')")
	public ProductResponse purchase(@PathVariable Long id, @Valid @RequestBody PurchaseRequest request,
			@AuthenticationPrincipal User user) {
		var supplier = request.supplierId() == null ? null
				: suppliers.findById(request.supplierId()).orElseThrow(() -> ApiException.badRequest("Fournisseur introuvable."));
		return ProductResponse.of(stock.purchase(id, request.quantity(), request.unitCost(), supplier, request.note(), user), true);
	}

	@PostMapping("/products/{id}/adjustments")
	@PreAuthorize("hasRole('GERANT')")
	public ProductResponse adjust(@PathVariable Long id, @Valid @RequestBody AdjustmentRequest request,
			@AuthenticationPrincipal User user) {
		return ProductResponse.of(stock.adjust(id, request.quantity(), request.reason(), user), true);
	}

	@GetMapping("/products/{id}/movements")
	@PreAuthorize("hasRole('GERANT')")
	public List<MovementResponse> movements(@PathVariable Long id) {
		return stock.history(id).stream().map(MovementResponse::of).toList();
	}

	/** US-09 : visible par le gerant et les vendeurs (qui previennent quand un article manque). */
	@GetMapping("/stock/alerts")
	@PreAuthorize("hasAnyRole('GERANT', 'VENDEUR')")
	public List<ProductResponse> alerts(@AuthenticationPrincipal User user) {
		return products.lowStock().stream().map(p -> ProductResponse.of(p, user.getRole() == Role.GERANT)).toList();
	}
}
