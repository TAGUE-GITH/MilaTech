package com.milatech.sale;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.milatech.catalog.CatalogDtos.Named;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public final class SaleDtos {

	private SaleDtos() {
	}

	public record LineRequest(
			@NotNull(message = "Choisissez un produit.") Long productId,
			@NotNull(message = "Indiquez la quantité.") @Positive(message = "La quantité doit être d'au moins 1.") Integer quantity) {
	}

	public record SaleRequest(
			Long customerId,
			@NotNull(message = "Choisissez le moyen de paiement.") Sale.PaymentMethod paymentMethod,
			@NotEmpty(message = "Ajoutez au moins un produit.") List<@Valid LineRequest> lines) {
	}

	/** Le cout d'achat et la marge ne sont envoyes qu'au gerant (null donc absents pour les vendeurs). */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record LineResponse(Long productId, String productName, String productReference, int quantity,
			long unitPrice, long lineTotal, Long unitCost) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record SaleResponse(Long id, String reference, Named customer, String seller,
			Sale.PaymentMethod paymentMethod, long total, Long margin, Instant createdAt, List<LineResponse> lines) {

		public static SaleResponse of(Sale sale, boolean showMargin) {
			var customer = sale.getCustomer() == null ? null
					: new Named(sale.getCustomer().getId(), sale.getCustomer().getFullName());
			var lines = sale.getLines().stream()
					.map(line -> new LineResponse(line.getProduct().getId(), line.getProductName(), line.getProductReference(),
							line.getQuantity(), line.getUnitPrice(), line.getLineTotal(),
							showMargin ? line.getUnitCost() : null))
					.toList();
			return new SaleResponse(sale.getId(), sale.getReference(), customer, sale.getSeller().getFullName(),
					sale.getPaymentMethod(), sale.getTotal(), showMargin ? sale.getMargin() : null, sale.getCreatedAt(),
					lines);
		}
	}

	/** Version courte pour les listes (sans les lignes). */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record SaleSummary(Long id, String reference, String customer, String seller,
			Sale.PaymentMethod paymentMethod, long total, Long margin, Instant createdAt) {

		public static SaleSummary of(Sale sale, boolean showMargin) {
			return new SaleSummary(sale.getId(), sale.getReference(),
					sale.getCustomer() == null ? null : sale.getCustomer().getFullName(), sale.getSeller().getFullName(),
					sale.getPaymentMethod(), sale.getTotal(), showMargin ? sale.getMargin() : null, sale.getCreatedAt());
		}
	}

	public record PeriodTotals(long count, long total, long margin) {
	}
}
