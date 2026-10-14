package com.milatech.contact;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

	/** Messages non traites d'abord, les plus recents en tete. */
	List<ContactMessage> findAllByOrderByHandledAscCreatedAtDesc();
}
