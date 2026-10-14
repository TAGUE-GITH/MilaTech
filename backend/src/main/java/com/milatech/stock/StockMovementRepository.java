package com.milatech.stock;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

	@Query("""
			select m from StockMovement m join fetch m.author left join fetch m.supplier
			where m.product.id = :productId order by m.createdAt desc, m.id desc""")
	List<StockMovement> history(@Param("productId") Long productId);
}
