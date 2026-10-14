package com.milatech.training;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

	boolean existsByTrainingIdAndCustomerId(Long trainingId, Long customerId);

	List<Enrollment> findByCustomerIdOrderByEnrolledAtDesc(Long customerId);

	/** Inscriptions en cours ou terminees (pas les abandons) dont il reste quelque chose a payer. */
	List<Enrollment> findByStatusNot(EnrollmentStatus status);

	List<Enrollment> findTop8ByOrderByEnrolledAtDescIdDesc();
}
