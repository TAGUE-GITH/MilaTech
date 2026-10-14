package com.milatech.training;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.common.ApiException;
import com.milatech.customer.Customer;
import com.milatech.customer.CustomerRepository;
import com.milatech.payment.Payment;
import com.milatech.training.TrainingDtos.EnrollmentRequest;
import com.milatech.training.TrainingDtos.TrainingRequest;
import com.milatech.user.User;

/** US-20 a US-22 : sessions de formation, inscriptions et paiements (R9). */
@Service
public class TrainingService {

	private final TrainingRepository trainings;
	private final EnrollmentRepository enrollments;
	private final CustomerRepository customers;

	public TrainingService(TrainingRepository trainings, EnrollmentRepository enrollments, CustomerRepository customers) {
		this.trainings = trainings;
		this.enrollments = enrollments;
		this.customers = customers;
	}

	@Transactional(readOnly = true)
	public List<Training> list() {
		return trainings.findAllByOrderByStartDateDescIdDesc();
	}

	@Transactional(readOnly = true)
	public Training get(Long id) {
		return trainings.findById(id).orElseThrow(() -> ApiException.notFound("Formation introuvable."));
	}

	@Transactional
	public Training create(TrainingRequest request, User trainer) {
		Training training = new Training(request.title().trim(), trainer);
		apply(training, request);
		return trainings.save(training);
	}

	@Transactional
	public Training update(Long id, TrainingRequest request) {
		Training training = get(id);
		training.setTitle(request.title().trim());
		apply(training, request);
		if (training.getEnrolledCount() > training.getCapacity())
			throw ApiException.badRequest("Il y a déjà " + training.getEnrolledCount() + " apprenants inscrits.");
		return training;
	}

	private static void apply(Training training, TrainingRequest request) {
		if (request.endDate().isBefore(request.startDate()))
			throw ApiException.badRequest("La date de fin doit être après la date de début.");
		training.setDescription(request.description() == null || request.description().isBlank() ? null : request.description().trim());
		training.setStartDate(request.startDate());
		training.setEndDate(request.endDate());
		training.setFee(request.fee());
		training.setCapacity(request.capacity());
	}

	/** R9 : inscription refusee si la session est complete ou si l'apprenant y est deja inscrit. */
	@Transactional
	public Enrollment enroll(Long trainingId, EnrollmentRequest request, User author) {
		Training training = trainings.findByIdForUpdate(trainingId)
				.orElseThrow(() -> ApiException.notFound("Formation introuvable."));
		Customer customer = customers.findById(request.customerId())
				.orElseThrow(() -> ApiException.badRequest("Apprenant introuvable."));
		if (enrollments.existsByTrainingIdAndCustomerId(trainingId, customer.getId()))
			throw ApiException.conflict(customer.getFullName() + " est déjà inscrit(e) à cette session.");
		if (training.getSeatsLeft() == 0)
			throw ApiException.conflict("La session est complète (" + training.getCapacity()
					+ (training.getCapacity() > 1 ? " places)." : " place)."));
		long fee = request.agreedFee() == null ? training.getFee() : request.agreedFee();
		Enrollment enrollment = enrollments.save(new Enrollment(training, customer, fee));
		enrollment.assignReference();
		training.getEnrollments().add(enrollment);
		if (request.firstPayment() != null && request.firstPayment() > 0)
			enrollment.addPayment(request.firstPayment(),
					request.paymentMethod() == null ? Payment.Method.ESPECES : request.paymentMethod(), author);
		return enrollment;
	}

	@Transactional
	public Enrollment changeStatus(Long enrollmentId, EnrollmentStatus status) {
		Enrollment enrollment = enrollment(enrollmentId);
		enrollment.setStatus(status);
		return enrollment;
	}

	@Transactional
	public Enrollment pay(Long enrollmentId, long amount, Payment.Method method, User author) {
		Enrollment enrollment = enrollment(enrollmentId);
		enrollment.addPayment(amount, method, author);
		enrollments.flush();
		return enrollment;
	}

	private Enrollment enrollment(Long id) {
		return enrollments.findById(id).orElseThrow(() -> ApiException.notFound("Inscription introuvable."));
	}
}
