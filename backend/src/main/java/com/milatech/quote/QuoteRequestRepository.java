package com.milatech.quote;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuoteRequestRepository extends JpaRepository<QuoteRequest, Long> {

	/** Demandes de certaines etapes (jamais une liste vide), les plus recentes d'abord. */
	@Query("""
			select q from QuoteRequest q join fetch q.customer
			where q.status in :statuses
			order by q.createdAt desc, q.id desc""")
	List<QuoteRequest> findByStatuses(@Param("statuses") Collection<QuoteStatus> statuses);

	List<QuoteRequest> findByCustomerIdOrderByCreatedAtDescIdDesc(Long customerId);

	long countByStatus(QuoteStatus status);
}
