package com.milatech.catalog;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, Long> {

	boolean existsByReference(String reference);

	boolean existsByReferenceAndIdNot(String reference, Long id);

	boolean existsByCategoryId(Long categoryId);

	/**
	 * Recherche par nom ou reference, filtre facultatif par categorie et stock bas.
	 * Aucun parametre n'est jamais null : PostgreSQL doit pouvoir deviner le type de chaque parametre
	 * (« % » pour tout afficher, allCategories pour ignorer le filtre de categorie).
	 */
	@Query("""
			select p from Product p join fetch p.category left join fetch p.supplier
			where (lower(p.name) like :pattern or lower(p.reference) like :pattern)
			  and (:allCategories = true or p.category.id = :categoryId)
			  and (:lowStock = false or p.quantity <= p.alertThreshold)
			order by p.name""")
	List<Product> search(@Param("pattern") String pattern, @Param("allCategories") boolean allCategories,
			@Param("categoryId") long categoryId, @Param("lowStock") boolean lowStock);

	/** R3 : verrouille le produit jusqu'a la fin de la transaction (SELECT ... FOR UPDATE). */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select p from Product p where p.id = :id")
	Optional<Product> findByIdForUpdate(@Param("id") Long id);

	/** Toujours dans l'ordre des identifiants pour eviter les interblocages entre deux ventes. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select p from Product p where p.id in :ids order by p.id")
	List<Product> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);

	/** US-09 : produits actifs au seuil d'alerte ou en dessous, les plus urgents d'abord. */
	@Query("""
			select p from Product p join fetch p.category
			where p.active = true and p.quantity <= p.alertThreshold
			order by p.quantity, p.name""")
	List<Product> lowStock();

	/** Boutique en ligne : produits en vente et en stock (meme principe de parametres jamais nuls que search). */
	@Query("""
			select p from Product p join fetch p.category
			where p.active = true and p.quantity > 0
			  and (lower(p.name) like :pattern or lower(p.category.name) like :pattern)
			  and (:allCategories = true or p.category.id = :categoryId)
			order by p.name""")
	List<Product> shop(@Param("pattern") String pattern, @Param("allCategories") boolean allCategories,
			@Param("categoryId") long categoryId);

	/** Categories qui ont au moins un produit visible dans la boutique en ligne. */
	@Query("""
			select distinct c from Product p join p.category c
			where p.active = true and p.quantity > 0
			order by c.name""")
	List<Category> shopCategories();
}
