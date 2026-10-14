package com.milatech.training;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.milatech.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;

/** Session de formation en presentiel (US-20). */
@Entity
public class Training {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	private String description;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "end_date", nullable = false)
	private LocalDate endDate;

	@Column(nullable = false)
	private long fee;

	@Column(nullable = false)
	private int capacity;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "trainer_id")
	private User trainer;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	@OneToMany(mappedBy = "training")
	@OrderBy("id")
	private List<Enrollment> enrollments = new ArrayList<>();

	protected Training() {
	}

	public Training(String title, User trainer) {
		this.title = title;
		this.trainer = trainer;
	}

	/** R9 : les abandons liberent leur place. */
	public long getEnrolledCount() {
		return enrollments.stream().filter(e -> e.getStatus() != EnrollmentStatus.ABANDON).count();
	}

	public long getSeatsLeft() {
		return Math.max(0, capacity - getEnrolledCount());
	}

	public long getBalanceDue() {
		return enrollments.stream().filter(e -> e.getStatus() != EnrollmentStatus.ABANDON).mapToLong(Enrollment::getBalance).sum();
	}

	public Long getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	public void setStartDate(LocalDate startDate) {
		this.startDate = startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	public void setEndDate(LocalDate endDate) {
		this.endDate = endDate;
	}

	public long getFee() {
		return fee;
	}

	public void setFee(long fee) {
		this.fee = fee;
	}

	public int getCapacity() {
		return capacity;
	}

	public void setCapacity(int capacity) {
		this.capacity = capacity;
	}

	public User getTrainer() {
		return trainer;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public List<Enrollment> getEnrollments() {
		return enrollments;
	}
}
