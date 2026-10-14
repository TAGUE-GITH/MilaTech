package com.milatech.training;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.milatech.payment.Payment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class TrainingDtos {

	private TrainingDtos() {
	}

	public record TrainingRequest(
			@NotBlank(message = "L'intitulé est obligatoire.") @Size(max = 120) String title,
			@Size(max = 2000) String description,
			@NotNull(message = "La date de début est obligatoire.") LocalDate startDate,
			@NotNull(message = "La date de fin est obligatoire.") LocalDate endDate,
			@NotNull(message = "Les frais sont obligatoires.") @PositiveOrZero(message = "Les frais ne peuvent pas être négatifs.") Long fee,
			@NotNull(message = "Le nombre de places est obligatoire.") @Min(value = 1, message = "Au moins 1 place.") Integer capacity) {
	}

	public record EnrollmentRequest(
			@NotNull(message = "Choisissez l'apprenant.") Long customerId,
			@PositiveOrZero(message = "Le prix convenu ne peut pas être négatif.") Long agreedFee,
			@PositiveOrZero(message = "Le premier paiement ne peut pas être négatif.") Long firstPayment,
			Payment.Method paymentMethod) {
	}

	public record EnrollmentChange(@NotNull(message = "Choisissez le statut.") EnrollmentStatus status) {
	}

	public record PaymentRequest(
			@NotNull(message = "Indiquez le montant.") @Positive(message = "Le montant doit être supérieur à 0.") Long amount,
			@NotNull(message = "Choisissez le moyen de paiement.") Payment.Method method) {
	}

	public record PaymentResponse(Long id, long amount, Payment.Method method, String receivedBy, Instant paidAt) {
	}

	public record EnrollmentResponse(Long id, String reference, Long trainingId, String training, Long customerId,
			String customer, String phone, long agreedFee, long paid, long balance, EnrollmentStatus status,
			Instant enrolledAt, List<PaymentResponse> payments) {

		public static EnrollmentResponse of(Enrollment e) {
			return new EnrollmentResponse(e.getId(), e.getReference(), e.getTraining().getId(), e.getTraining().getTitle(),
					e.getCustomer().getId(), e.getCustomer().getFullName(), e.getCustomer().getPhone(), e.getAgreedFee(),
					e.getPaid(), e.getBalance(), e.getStatus(), e.getEnrolledAt(),
					e.getPayments().stream().map(p -> new PaymentResponse(p.getId(), p.getAmount(), p.getMethod(),
							p.getReceivedBy().getFullName(), p.getPaidAt())).toList());
		}
	}

	public record TrainingSummary(Long id, String title, LocalDate startDate, LocalDate endDate, long fee, int capacity,
			long enrolled, long seatsLeft, long balanceDue, String trainer) {

		public static TrainingSummary of(Training t) {
			return new TrainingSummary(t.getId(), t.getTitle(), t.getStartDate(), t.getEndDate(), t.getFee(),
					t.getCapacity(), t.getEnrolledCount(), t.getSeatsLeft(), t.getBalanceDue(),
					t.getTrainer() == null ? null : t.getTrainer().getFullName());
		}
	}

	public record TrainingResponse(Long id, String title, String description, LocalDate startDate, LocalDate endDate,
			long fee, int capacity, long enrolled, long seatsLeft, long balanceDue, String trainer,
			List<EnrollmentResponse> enrollments) {

		public static TrainingResponse of(Training t) {
			return new TrainingResponse(t.getId(), t.getTitle(), t.getDescription(), t.getStartDate(), t.getEndDate(),
					t.getFee(), t.getCapacity(), t.getEnrolledCount(), t.getSeatsLeft(), t.getBalanceDue(),
					t.getTrainer() == null ? null : t.getTrainer().getFullName(),
					t.getEnrollments().stream().map(EnrollmentResponse::of).toList());
		}
	}
}
