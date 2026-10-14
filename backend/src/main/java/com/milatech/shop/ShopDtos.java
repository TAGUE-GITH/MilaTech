package com.milatech.shop;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.milatech.image.Image;
import com.milatech.sale.Sale;
import com.milatech.shop.OnlineOrder.DeliveryMode;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class ShopDtos {

	private ShopDtos() {
	}

	public record ShopInfo(long deliveryFee, String deliveryCity) {
	}

	public record OrderLineRequest(
			@NotNull(message = "Choisissez un produit.") Long productId,
			@NotNull(message = "Indiquez la quantité.") @Positive(message = "La quantité doit être d'au moins 1.") Integer quantity) {
	}

	public record OrderRequest(
			@NotNull(message = "Choisissez le retrait en boutique ou la livraison.") DeliveryMode deliveryMode,
			@Size(max = 255) String address,
			@NotBlank(message = "Indiquez un numéro pour vous joindre.") @Size(max = 30) String phone,
			@Size(max = 500, message = "500 caractères maximum.") String note,
			@NotEmpty(message = "Votre panier est vide.") List<@Valid OrderLineRequest> lines) {
	}

	/** Changement d'etape par la boutique ; le moyen de paiement est demande a la remise, le motif a l'annulation. */
	public record StatusRequest(
			@NotNull(message = "Choisissez la nouvelle étape.") OrderStatus status,
			Sale.PaymentMethod paymentMethod,
			@Size(max = 255) String note) {
	}

	public record CustomerInfo(Long id, String fullName, String phone) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record LineResponse(Long productId, String productName, String imageUrl, int quantity, long unitPrice,
			long lineTotal) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record OrderResponse(Long id, String reference, OrderStatus status, String statusLabel,
			List<OrderStatus> nextStatuses, DeliveryMode deliveryMode, String address, String phone, String note,
			long subtotal, long deliveryFee, long total, String cancelReason, Long saleId, String saleReference,
			CustomerInfo customer, Instant createdAt, Instant updatedAt, List<LineResponse> lines) {

		public static OrderResponse of(OnlineOrder o) {
			var customer = o.getCustomer();
			var sale = o.getSale();
			return new OrderResponse(o.getId(), o.getReference(), o.getStatus(), o.getStatus().label(),
					o.getStatus().next(), o.getDeliveryMode(), o.getAddress(), o.getPhone(), o.getNote(), o.getSubtotal(),
					o.getDeliveryFee(), o.getTotal(), o.getCancelReason(), sale == null ? null : sale.getId(),
					sale == null ? null : sale.getReference(),
					new CustomerInfo(customer.getId(), customer.getFullName(), customer.getPhone()), o.getCreatedAt(),
					o.getUpdatedAt(),
					o.getLines().stream()
							.map(l -> new LineResponse(l.getProduct().getId(), l.getProductName(),
									Image.url(l.getProduct().getImage()), l.getQuantity(), l.getUnitPrice(), l.getLineTotal()))
							.toList());
		}
	}

	/** Version courte pour les listes. */
	public record OrderSummary(Long id, String reference, String customer, String customerPhone, OrderStatus status,
			String statusLabel, DeliveryMode deliveryMode, long total, int itemCount, Instant createdAt) {

		public static OrderSummary of(OnlineOrder o) {
			return new OrderSummary(o.getId(), o.getReference(), o.getCustomer().getFullName(), o.getPhone(),
					o.getStatus(), o.getStatus().label(), o.getDeliveryMode(), o.getTotal(), o.getItemCount(),
					o.getCreatedAt());
		}
	}
}
