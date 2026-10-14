package com.milatech.shop;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OnlineOrderRepository extends JpaRepository<OnlineOrder, Long> {

	/** Commandes de certaines etapes (jamais une liste vide), les plus recentes d'abord. */
	@Query("""
			select o from OnlineOrder o join fetch o.customer
			where o.status in :statuses
			order by o.createdAt desc, o.id desc""")
	List<OnlineOrder> findByStatuses(@Param("statuses") Collection<OrderStatus> statuses);

	List<OnlineOrder> findByCustomerIdOrderByCreatedAtDescIdDesc(Long customerId);

	long countByStatusIn(Collection<OrderStatus> statuses);
}
