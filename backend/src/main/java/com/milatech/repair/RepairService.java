package com.milatech.repair;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.catalog.Product;
import com.milatech.common.ApiException;
import com.milatech.customer.CustomerRepository;
import com.milatech.payment.Payment;
import com.milatech.repair.RepairDtos.NewRepair;
import com.milatech.repair.RepairDtos.RepairChanges;
import com.milatech.stock.MovementType;
import com.milatech.stock.StockLine;
import com.milatech.stock.StockService;
import com.milatech.user.User;

/** US-14 a US-18 : cycle de vie d'un dossier de reparation. */
@Service
public class RepairService {

	private final RepairRepository repairs;
	private final CustomerRepository customers;
	private final StockService stock;

	public RepairService(RepairRepository repairs, CustomerRepository customers, StockService stock) {
		this.repairs = repairs;
		this.customers = customers;
		this.stock = stock;
	}

	@Transactional
	public Repair receive(NewRepair request, User author) {
		var customer = customers.findById(request.customerId())
				.orElseThrow(() -> ApiException.badRequest("Client introuvable."));
		Repair repair = new Repair(customer, author, request.deviceType(), request.reception(), request.reportedIssue().trim());
		repair.setBrand(blankToNull(request.brand()));
		repair.setModel(blankToNull(request.model()));
		repair.setSerialNumber(blankToNull(request.serialNumber()));
		repair.setAccessories(blankToNull(request.accessories()));
		repair.setEstimatedCost(request.estimatedCost());
		repair.setPromisedOn(request.promisedOn());
		repairs.save(repair);
		repair.assignReference();
		if (request.deposit() != null && request.deposit() > 0)
			repair.addPayment(request.deposit(),
					request.depositMethod() == null ? Payment.Method.ESPECES : request.depositMethod(), author);
		return repair;
	}

	@Transactional(readOnly = true)
	public Repair get(Long id) {
		return repairs.findById(id).orElseThrow(() -> ApiException.notFound("Réparation introuvable."));
	}

	@Transactional(readOnly = true)
	public List<Repair> search(String q, RepairStatus status) {
		String pattern = "%" + (q == null ? "" : q.trim().toLowerCase()) + "%";
		return repairs.search(pattern, status == null, status == null ? RepairStatus.RECU : status);
	}

	/** Diagnostic, main-d'oeuvre, estimation, date promise : modifiables tant que l'appareil n'est pas rendu. */
	@Transactional
	public Repair update(Long id, RepairChanges changes) {
		Repair repair = lock(id);
		repair.ensureOpen();
		if (changes.diagnosis() != null) repair.setDiagnosis(blankToNull(changes.diagnosis()));
		if (changes.laborCost() != null) repair.setLaborCost(changes.laborCost());
		if (changes.estimatedCost() != null) repair.setEstimatedCost(changes.estimatedCost());
		if (changes.promisedOn() != null) repair.setPromisedOn(changes.promisedOn());
		if (changes.accessories() != null) repair.setAccessories(blankToNull(changes.accessories()));
		return repair;
	}

	@Transactional
	public Repair move(Long id, RepairStatus target, String note, User author) {
		Repair repair = lock(id);
		repair.moveTo(target, note, author);
		return repair;
	}

	/** R7 : la piece sort du stock (refus si elle manque) et s'ajoute au montant du dossier. */
	@Transactional
	public Repair addPart(Long id, Long productId, int quantity, User author) {
		Repair repair = lock(id);
		ensurePartsAllowed(repair);
		Product product = stock.remove(List.of(new StockLine(productId, quantity)), MovementType.PIECE_REPARATION,
				repair.getReference(), author).getFirst();
		repair.getParts().add(new RepairPart(repair, product, quantity));
		// Identifiant de la nouvelle ligne tout de suite disponible (pour pouvoir la retirer)
		repairs.flush();
		return repair;
	}

	/** R7 : une piece retiree du dossier revient dans le stock. */
	@Transactional
	public Repair removePart(Long id, Long partId, User author) {
		Repair repair = lock(id);
		ensurePartsAllowed(repair);
		RepairPart part = repair.getParts().stream().filter(p -> p.getId().equals(partId)).findFirst()
				.orElseThrow(() -> ApiException.notFound("Pièce introuvable dans ce dossier."));
		repair.getParts().remove(part);
		stock.putBack(part.getProduct().getId(), part.getQuantity(), MovementType.RETOUR_PIECE, repair.getReference(), author);
		return repair;
	}

	@Transactional
	public Repair pay(Long id, long amount, Payment.Method method, User author) {
		Repair repair = lock(id);
		repair.addPayment(amount, method, author);
		repairs.flush();
		return repair;
	}

	private static void ensurePartsAllowed(Repair repair) {
		if (!repair.getStatus().allowsParts())
			throw ApiException.badRequest("Les pièces s'ajoutent pendant le diagnostic ou la réparation.");
	}

	private Repair lock(Long id) {
		return repairs.findByIdForUpdate(id).orElseThrow(() -> ApiException.notFound("Réparation introuvable."));
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
