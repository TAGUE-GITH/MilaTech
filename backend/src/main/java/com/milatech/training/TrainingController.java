package com.milatech.training;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.training.TrainingDtos.EnrollmentChange;
import com.milatech.training.TrainingDtos.EnrollmentRequest;
import com.milatech.training.TrainingDtos.EnrollmentResponse;
import com.milatech.training.TrainingDtos.PaymentRequest;
import com.milatech.training.TrainingDtos.TrainingRequest;
import com.milatech.training.TrainingDtos.TrainingResponse;
import com.milatech.training.TrainingDtos.TrainingSummary;
import com.milatech.user.User;

import jakarta.validation.Valid;

/**
 * US-20 a US-22 : le gerant et les formateurs organisent les sessions ; les vendeurs inscrivent et encaissent
 * au comptoir ; les techniciens n'y ont pas acces.
 */
@RestController
@PreAuthorize("hasAnyRole('GERANT', 'FORMATEUR', 'VENDEUR')")
@Transactional
public class TrainingController {

	private final TrainingService trainings;

	public TrainingController(TrainingService trainings) {
		this.trainings = trainings;
	}

	@GetMapping("/api/trainings")
	public List<TrainingSummary> list() {
		return trainings.list().stream().map(TrainingSummary::of).toList();
	}

	@GetMapping("/api/trainings/{id}")
	public TrainingResponse get(@PathVariable Long id) {
		return TrainingResponse.of(trainings.get(id));
	}

	@PostMapping("/api/trainings")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('GERANT', 'FORMATEUR')")
	public TrainingResponse create(@Valid @RequestBody TrainingRequest request, @AuthenticationPrincipal User user) {
		return TrainingResponse.of(trainings.create(request, user));
	}

	@PutMapping("/api/trainings/{id}")
	@PreAuthorize("hasAnyRole('GERANT', 'FORMATEUR')")
	public TrainingResponse update(@PathVariable Long id, @Valid @RequestBody TrainingRequest request) {
		return TrainingResponse.of(trainings.update(id, request));
	}

	@PostMapping("/api/trainings/{id}/enrollments")
	@ResponseStatus(HttpStatus.CREATED)
	public EnrollmentResponse enroll(@PathVariable Long id, @Valid @RequestBody EnrollmentRequest request,
			@AuthenticationPrincipal User user) {
		return EnrollmentResponse.of(trainings.enroll(id, request, user));
	}

	@PatchMapping("/api/enrollments/{id}")
	public EnrollmentResponse changeStatus(@PathVariable Long id, @Valid @RequestBody EnrollmentChange change) {
		return EnrollmentResponse.of(trainings.changeStatus(id, change.status()));
	}

	@PostMapping("/api/enrollments/{id}/payments")
	public EnrollmentResponse pay(@PathVariable Long id, @Valid @RequestBody PaymentRequest request,
			@AuthenticationPrincipal User user) {
		return EnrollmentResponse.of(trainings.pay(id, request.amount(), request.method(), user));
	}
}
