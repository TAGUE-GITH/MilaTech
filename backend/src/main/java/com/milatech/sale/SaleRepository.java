package com.milatech.sale;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long> {

	/** Ventes d'une periode, les plus recentes d'abord ; sellerId < 0 pour tous les vendeurs. */
	@Query("""
			select s from Sale s join fetch s.seller left join fetch s.customer
			where s.createdAt >= :from and s.createdAt < :to
			  and (:sellerId < 0 or s.seller.id = :sellerId)
			order by s.createdAt desc, s.id desc""")
	List<Sale> findPeriod(@Param("from") Instant from, @Param("to") Instant to, @Param("sellerId") long sellerId);

	@Query("select s from Sale s join fetch s.seller where s.customer.id = :customerId order by s.createdAt desc, s.id desc")
	List<Sale> findByCustomer(@Param("customerId") Long customerId);
}
