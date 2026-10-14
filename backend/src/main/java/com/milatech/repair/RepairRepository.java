package com.milatech.repair;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface RepairRepository extends JpaRepository<Repair, Long> {

	/**
	 * Recherche par reference, client (nom ou telephone), marque, modele ou numero de serie,
	 * filtre facultatif par statut ; les depots les plus recents d'abord. Aucun parametre n'est null.
	 */
	@Query("""
			select r from Repair r join fetch r.customer c
			where (:allStatuses = true or r.status = :status)
			  and (lower(r.reference) like :pattern or lower(c.fullName) like :pattern or c.phone like :pattern
			       or lower(coalesce(r.brand, '')) like :pattern or lower(coalesce(r.model, '')) like :pattern
			       or lower(coalesce(r.serialNumber, '')) like :pattern)
			order by r.receivedAt desc, r.id desc""")
	List<Repair> search(@Param("pattern") String pattern, @Param("allStatuses") boolean allStatuses,
			@Param("status") RepairStatus status);

	@Query("select r from Repair r where r.customer.id = :customerId order by r.receivedAt desc, r.id desc")
	List<Repair> findByCustomer(@Param("customerId") Long customerId);

	/** Un seul employe a la fois modifie un dossier (paiement, etape, pieces). */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select r from Repair r where r.id = :id")
	Optional<Repair> findByIdForUpdate(@Param("id") Long id);

	long countByStatusIn(Collection<RepairStatus> statuses);

	@Query("select r from Repair r join fetch r.customer where r.status in :statuses order by r.receivedAt")
	List<Repair> findOpen(@Param("statuses") Collection<RepairStatus> statuses);

	/** Dernieres etapes franchies, toutes reparations confondues (tableau de bord). */
	@Query("select e from RepairEvent e join fetch e.repair r join fetch r.customer join fetch e.author order by e.createdAt desc, e.id desc")
	List<RepairEvent> recentEvents(Pageable page);
}
