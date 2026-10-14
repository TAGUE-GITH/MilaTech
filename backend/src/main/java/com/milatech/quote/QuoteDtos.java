package com.milatech.quote;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.milatech.image.Image;
import com.milatech.payment.Payment;
import com.milatech.repair.Repair;
import com.milatech.repair.RepairStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class QuoteDtos {

	private QuoteDtos() {
	}

	public record QuoteForm(
			@NotNull(message = "Choisissez le type d'appareil.") Repair.DeviceType deviceType,
			@Size(max = 60) String brand,
			@Size(max = 80) String model,
			@NotBlank(message = "Décrivez la panne.") @Size(max = 1000, message = "1000 caractères maximum.") String issue,
			/** Photo facultative, deja reduite par le navigateur (data URL JPEG ou PNG). */
			String photo) {
	}

	public record QuoteAnswer(
			@NotNull(message = "Indiquez le prix.") @Positive(message = "Le prix doit être supérieur à 0.") Long price,
			@Size(max = 500, message = "500 caractères maximum.") String message) {
	}

	/** Reception de l'appareil a la boutique : les informations notees au comptoir, comme pour un depot classique. */
	public record DepositForm(
			@Size(max = 60) String serialNumber,
			@Size(max = 255) String accessories,
			LocalDate promisedOn,
			@PositiveOrZero(message = "L'acompte ne peut pas être négatif.") Long deposit,
			Payment.Method depositMethod) {
	}

	public record CustomerRef(Long id, String fullName, String phone) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record QuoteResponse(Long id, String reference, QuoteStatus status, String statusLabel,
			Repair.DeviceType deviceType, String brand, String model, String device, String issue, String imageUrl,
			Long quotedPrice, String quoteMessage, String quotedBy, Instant quotedAt, Instant answeredAt, Long repairId,
			String repairReference, CustomerRef customer, Instant createdAt) {

		/** Le nom de l'employe qui a chiffre n'est montre qu'a la boutique. */
		public static QuoteResponse of(QuoteRequest q, boolean forStaff) {
			var c = q.getCustomer();
			var repair = q.getRepair();
			return new QuoteResponse(q.getId(), q.getReference(), q.getStatus(), q.getStatus().label(), q.getDeviceType(),
					q.getBrand(), q.getModel(), q.getDevice(), q.getIssue(), Image.url(q.getImage()), q.getQuotedPrice(),
					q.getQuoteMessage(), forStaff && q.getQuotedBy() != null ? q.getQuotedBy().getFullName() : null,
					q.getQuotedAt(), q.getAnsweredAt(), repair == null ? null : repair.getId(),
					repair == null ? null : repair.getReference(), new CustomerRef(c.getId(), c.getFullName(), c.getPhone()),
					q.getCreatedAt());
		}
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record QuoteSummary(Long id, String reference, String customer, String customerPhone, String device,
			Repair.DeviceType deviceType, QuoteStatus status, String statusLabel, Long quotedPrice, Instant createdAt) {

		public static QuoteSummary of(QuoteRequest q) {
			return new QuoteSummary(q.getId(), q.getReference(), q.getCustomer().getFullName(), q.getCustomer().getPhone(),
					q.getDevice(), q.getDeviceType(), q.getStatus(), q.getStatus().label(), q.getQuotedPrice(),
					q.getCreatedAt());
		}
	}

	/** Reparation vue par le client : ni notes internes, ni noms des employes, ni prix d'achat. */
	public record ClientRepairSummary(Long id, String reference, String device, Repair.DeviceType deviceType,
			RepairStatus status, String statusLabel, long total, long balance, LocalDate promisedOn, Instant receivedAt) {

		public static ClientRepairSummary of(Repair r) {
			return new ClientRepairSummary(r.getId(), r.getReference(), r.getDevice(), r.getDeviceType(), r.getStatus(),
					r.getStatus().label(), r.getTotal(), r.getBalance(), r.getPromisedOn(), r.getReceivedAt());
		}
	}

	public record Step(RepairStatus status, String label, Instant at) {
	}

	public record ClientPart(String productName, int quantity, long lineTotal) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	public record ClientRepair(Long id, String reference, String device, Repair.DeviceType deviceType,
			RepairStatus status, String statusLabel, String reportedIssue, String diagnosis, Long estimatedCost,
			long laborCost, long total, long paid, long balance, LocalDate promisedOn, Instant receivedAt,
			Instant returnedAt, List<ClientPart> parts, List<Step> steps) {

		public static ClientRepair of(Repair r) {
			return new ClientRepair(r.getId(), r.getReference(), r.getDevice(), r.getDeviceType(), r.getStatus(),
					r.getStatus().label(), r.getReportedIssue(), r.getDiagnosis(), r.getEstimatedCost(), r.getLaborCost(),
					r.getTotal(), r.getPaid(), r.getBalance(), r.getPromisedOn(), r.getReceivedAt(), r.getReturnedAt(),
					r.getParts().stream().map(p -> new ClientPart(p.getProductName(), p.getQuantity(), p.getLineTotal()))
							.toList(),
					r.getEvents().stream().map(e -> new Step(e.getStatus(), e.getStatus().label(), e.getCreatedAt())).toList());
		}
	}
}
