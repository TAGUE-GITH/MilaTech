package com.milatech.repair;

import java.time.Instant;

import com.milatech.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Etape franchie par une reparation : qui, quand, et une note facultative. */
@Entity
@Table(name = "repair_event")
public class RepairEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "repair_id")
	private Repair repair;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private RepairStatus status;

	private String note;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "author_id")
	private User author;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected RepairEvent() {
	}

	RepairEvent(Repair repair, RepairStatus status, String note, User author) {
		this.repair = repair;
		this.status = status;
		this.note = note == null || note.isBlank() ? null : note.trim();
		this.author = author;
	}

	public RepairStatus getStatus() {
		return status;
	}

	public String getNote() {
		return note;
	}

	public User getAuthor() {
		return author;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
