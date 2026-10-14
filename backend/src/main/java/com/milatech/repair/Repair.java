package com.milatech.repair;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import com.milatech.common.ApiException;
import com.milatech.common.Money;
import com.milatech.customer.Customer;
import com.milatech.payment.Payment;
import com.milatech.user.User;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;

/** Dossier de reparation d'un appareil confie par un client (US-14 a US-18). */
@Entity
public class Repair {

	public enum DeviceType {
		TELEPHONE,
		ORDINATEUR,
		TABLETTE,
		BLUETOOTH,
		AUTRE
	}

	public enum Reception {
		BOUTIQUE,
		DOMICILE
	}

	private static final ZoneId ZONE = ZoneId.of("Africa/Douala");

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(unique = true)
	private String reference;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "customer_id")
	private Customer customer;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "received_by")
	private User receivedBy;

	@Enumerated(EnumType.STRING)
	@Column(name = "device_type", nullable = false)
	private DeviceType deviceType;

	private String brand;
	private String model;

	@Column(name = "serial_number")
	private String serialNumber;

	private String accessories;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Reception reception;

	@Column(name = "reported_issue", nullable = false)
	private String reportedIssue;

	private String diagnosis;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private RepairStatus status = RepairStatus.RECU;

	@Column(name = "labor_cost", nullable = false)
	private long laborCost;

	@Column(name = "estimated_cost")
	private Long estimatedCost;

	@Column(name = "promised_on")
	private LocalDate promisedOn;

	@Column(name = "received_at", nullable = false)
	private Instant receivedAt = Instant.now();

	@Column(name = "returned_at")
	private Instant returnedAt;

	@OneToMany(mappedBy = "repair", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	private List<RepairPart> parts = new ArrayList<>();

	@OneToMany(mappedBy = "repair", cascade = CascadeType.ALL)
	@OrderBy("id")
	private List<RepairEvent> events = new ArrayList<>();

	@OneToMany(mappedBy = "repair", cascade = CascadeType.ALL)
	@OrderBy("id")
	private List<Payment> payments = new ArrayList<>();

	protected Repair() {
	}

	public Repair(Customer customer, User receivedBy, DeviceType deviceType, Reception reception, String reportedIssue) {
		this.customer = customer;
		this.receivedBy = receivedBy;
		this.deviceType = deviceType;
		this.reception = reception;
		this.reportedIssue = reportedIssue;
		events.add(new RepairEvent(this, RepairStatus.RECU, null, receivedBy));
	}

	public void assignReference() {
		reference = "REP-%d-%05d".formatted(receivedAt.atZone(ZONE).getYear(), id);
	}

	/** R8 : montant du dossier = main-d'oeuvre + pieces. */
	public long getTotal() {
		return laborCost + parts.stream().mapToLong(RepairPart::getLineTotal).sum();
	}

	public long getPaid() {
		return payments.stream().mapToLong(Payment::getAmount).sum();
	}

	public long getBalance() {
		return getTotal() - getPaid();
	}

	/** Ce que le client peut encore verser : le montant du dossier, ou l'estimation tant qu'il n'est pas chiffre. */
	public long getRemainingToPay() {
		long due = getTotal() > 0 ? getTotal() : (estimatedCost == null ? 0 : estimatedCost);
		return Math.max(0, due - getPaid());
	}

	public String getDevice() {
		String name = String.join(" ", brand == null ? "" : brand, model == null ? "" : model).trim();
		return name.isEmpty() ? deviceType.name() : name;
	}

	public void ensureOpen() {
		if (status == RepairStatus.RESTITUE)
			throw ApiException.badRequest("Ce dossier est clos : l'appareil a été restitué.");
	}

	public void moveTo(RepairStatus target, String note, User author) {
		if (!status.canMoveTo(target))
			throw ApiException.badRequest("Impossible de passer de « " + status.label() + " » à « " + target.label() + " ».");
		if (target == RepairStatus.RESTITUE && getBalance() > 0)
			throw ApiException.badRequest("Reste à payer : " + Money.fcfa(getBalance())
					+ ". Enregistrez le paiement avant de restituer l'appareil.");
		status = target;
		if (target == RepairStatus.RESTITUE) returnedAt = Instant.now();
		events.add(new RepairEvent(this, target, note, author));
	}

	public void addPayment(long amount, Payment.Method method, User author) {
		ensureOpen();
		if (amount > getRemainingToPay())
			throw ApiException.badRequest("Le paiement dépasse le reste à payer (" + Money.fcfa(getRemainingToPay()) + ").");
		payments.add(new Payment(this, amount, method, author));
	}

	public Long getId() {
		return id;
	}

	public String getReference() {
		return reference;
	}

	public Customer getCustomer() {
		return customer;
	}

	public User getReceivedBy() {
		return receivedBy;
	}

	public DeviceType getDeviceType() {
		return deviceType;
	}

	public String getBrand() {
		return brand;
	}

	public void setBrand(String brand) {
		this.brand = brand;
	}

	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

	public String getSerialNumber() {
		return serialNumber;
	}

	public void setSerialNumber(String serialNumber) {
		this.serialNumber = serialNumber;
	}

	public String getAccessories() {
		return accessories;
	}

	public void setAccessories(String accessories) {
		this.accessories = accessories;
	}

	public Reception getReception() {
		return reception;
	}

	public String getReportedIssue() {
		return reportedIssue;
	}

	public String getDiagnosis() {
		return diagnosis;
	}

	public void setDiagnosis(String diagnosis) {
		this.diagnosis = diagnosis;
	}

	public RepairStatus getStatus() {
		return status;
	}

	public long getLaborCost() {
		return laborCost;
	}

	public void setLaborCost(long laborCost) {
		this.laborCost = laborCost;
	}

	public Long getEstimatedCost() {
		return estimatedCost;
	}

	public void setEstimatedCost(Long estimatedCost) {
		this.estimatedCost = estimatedCost;
	}

	public LocalDate getPromisedOn() {
		return promisedOn;
	}

	public void setPromisedOn(LocalDate promisedOn) {
		this.promisedOn = promisedOn;
	}

	public Instant getReceivedAt() {
		return receivedAt;
	}

	public Instant getReturnedAt() {
		return returnedAt;
	}

	public List<RepairPart> getParts() {
		return parts;
	}

	public List<RepairEvent> getEvents() {
		return events;
	}

	public List<Payment> getPayments() {
		return payments;
	}
}
