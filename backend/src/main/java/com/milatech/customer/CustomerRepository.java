package com.milatech.customer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

	/** Recherche par nom ou par numero de telephone (motifs construits en Java, jamais null). */
	@Query("""
			select c from Customer c
			where lower(c.fullName) like :namePattern or c.phone like :phonePattern
			order by c.fullName""")
	List<Customer> search(@Param("namePattern") String namePattern, @Param("phonePattern") String phonePattern);
}
