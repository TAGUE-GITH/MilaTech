package com.milatech.repair;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.milatech.payment.Payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class RepairDtos {

	private RepairDtos() {
	}

	public record NewRepair(
			@NotNull(message = "Choisissez le client.") Long customerId,
			@NotNull(message = "Choisissez le type d'appareil.") Repair.DeviceType deviceType,
			@Size(max = 60) String brand,
			@Size(max = 80) String model,
			@Size(max = 60) String serialNumber,
			@Size(max = 255) String accessories,
			@NotNull(message = "Indiquez où l'appareil a été récupéré.") Repair.Reception reception,
			@NotBlank(message = "Décrivez le problème signalé par le client.") @Size(max = 1000) String reportedIssue,
			@PositiveOrZero(message = "Le coût estimé ne peut pas être négatif.") Long estimatedCost,
			LocalDate promisedOn,
			@PositiveOrZero(message = "L'acompte ne peut pas être négatif.") Long deposit,
			Payment.Method depositMethod) {
	}

	/** Modification partielle : seuls les champs envoyes changent. */
	public record RepairChanges(
			@Size(max = 2000) String diagnosis,
			@PositiveOrZero(message = "La main-d'œuvre ne peut pas être négative.") Long laborCost,
			@PositiveOrZero(message = "Le coût estimé ne peut pas être négatif.") Long estimatedCost,
			LocalDate promisedOn,
			@Size(max = 255) String accessories) {
	}

	public record StatusChange(@NotNull(message = "Choisissez l'étape.") RepairStatus status, @Size(max = 500) String note) {
	}

	public record PartRequest(
			@NotNull(message = "Choisissez la pièce.") Long productId,
			@NotNull(message = "Indiquez la quantité.") @Positive(message = "La quantité doit être d'au moins 1.") Integer quantity) {
	}

	public record PaymentRequest(
			@NotNull(message = "Indiquez le montant.") @Positive(message = "Le montant doit être supérieur à 0.") Long amount,
			@NotNull(message = "Choisissez le moyen de paiement.") Payment.Method method) {
	}

	public record CustomerRef(Long id, String fullName, String phone) {
	}

	public record PartResponse(Long id, Long productId, String productName, int quantity, long unitPrice, long lineTotal) {
	}

	public record EventResponse(RepairStatus status, String label, String note, String author, Instant createdAt) {
	}

	public record PaymentResponse(Long id, long amount, Payment.Method method, String receivedBy, Instant paidAt) {
	}

	public record RepairResponse(Long id, String reference, CustomerRef customer, Repair.DeviceType deviceType,
			String brand, String model, String device, String serialNumber, String accessories,
			Repair.Reception reception, String reportedIssue, String diagnosis, RepairStatus status, String statusLabel,
			List<RepairStatus> nextStatuses, long laborCost, Long estimatedCost, LocalDate promisedOn, long total,
			long paid, long balance, long remainingToPay, String receivedBy, Instant receivedAt, Instant returnedAt,
			List<PartResponse> parts, List<EventResponse> events, List<PaymentResponse> payments) {

		public static RepairResponse of(Repair r) {
			var c = r.getCustomer();
			return new RepairResponse(r.getId(), r.getReference(), new CustomerRef(c.getId(), c.getFullName(), c.getPhone()),
					r.getDeviceType(), r.getBrand(), r.getModel(), r.getDevice(), r.getSerialNumber(), r.getAccessories(),
					r.getReception(), r.getReportedIssue(), r.getDiagnosis(), r.getStatus(), r.getStatus().label(),
					r.getStatus().next(), r.getLaborCost(), r.getEstimatedCost(), r.getPromisedOn(), r.getTotal(),
					r.getPaid(), r.getBalance(), r.getRemainingToPay(), r.getReceivedBy().getFullName(), r.getReceivedAt(),
					r.getReturnedAt(),
					r.getParts().stream().map(p -> new PartResponse(p.getId(), p.getProduct().getId(), p.getProductName(),
							p.getQuantity(), p.getUnitPrice(), p.getLineTotal())).toList(),
					r.getEvents().stream().map(e -> new EventResponse(e.getStatus(), e.getStatus().label(), e.getNote(),
							e.getAuthor().getFullName(), e.getCreatedAt())).toList(),
					r.getPayments().stream().map(p -> new PaymentResponse(p.getId(), p.getAmount(), p.getMethod(),
							p.getReceivedBy().getFullName(), p.getPaidAt())).toList());
		}
	}

	/** Version courte pour les listes. */
	public record RepairSummary(Long id, String reference, String customer, String customerPhone, String device,
			Repair.DeviceType deviceType, RepairStatus status, String statusLabel, LocalDate promisedOn, long total,
			long balance, Instant receivedAt) {

		public static RepairSummary of(Repair r) {
			return new RepairSummary(r.getId(), r.getReference(), r.getCustomer().getFullName(), r.getCustomer().getPhone(),
					r.getDevice(), r.getDeviceType(), r.getStatus(), r.getStatus().label(), r.getPromisedOn(), r.getTotal(),
					r.getBalance(), r.getReceivedAt());
		}
	}
}
