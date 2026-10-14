package com.milatech.training;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface TrainingRepository extends JpaRepository<Training, Long> {

	/** Les sessions les plus recentes (ou a venir) d'abord. */
	List<Training> findAllByOrderByStartDateDescIdDesc();

	/** Deux inscriptions simultanees ne peuvent pas prendre la derniere place. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select t from Training t where t.id = :id")
	Optional<Training> findByIdForUpdate(@Param("id") Long id);
}
