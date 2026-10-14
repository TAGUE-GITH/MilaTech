package com.milatech.repair;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.repair.RepairDtos.NewRepair;
import com.milatech.repair.RepairDtos.PartRequest;
import com.milatech.repair.RepairDtos.PaymentRequest;
import com.milatech.repair.RepairDtos.RepairChanges;
import com.milatech.repair.RepairDtos.RepairResponse;
import com.milatech.repair.RepairDtos.RepairSummary;
import com.milatech.repair.RepairDtos.StatusChange;
import com.milatech.user.User;

import jakarta.validation.Valid;

/**
 * US-14 a US-19 : reparations. Le comptoir (gerant, vendeurs) recoit les appareils et encaisse,
 * les techniciens diagnostiquent et reparent ; les formateurs n'y ont pas acces.
 */
@RestController
@RequestMapping("/api/repairs")
@PreAuthorize("hasAnyRole('GERANT', 'TECHNICIEN', 'VENDEUR')")
@Transactional
public class RepairController {

	private final RepairService repairs;

	public RepairController(RepairService repairs) {
		this.repairs = repairs;
	}

	@GetMapping
	public List<RepairSummary> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) RepairStatus status) {
		return repairs.search(q, status).stream().map(RepairSummary::of).toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public RepairResponse receive(@Valid @RequestBody NewRepair request, @AuthenticationPrincipal User user) {
		return RepairResponse.of(repairs.receive(request, user));
	}

	@GetMapping("/{id}")
	public RepairResponse get(@PathVariable Long id) {
		return RepairResponse.of(repairs.get(id));
	}

	@PatchMapping("/{id}")
	public RepairResponse update(@PathVariable Long id, @Valid @RequestBody RepairChanges changes) {
		return RepairResponse.of(repairs.update(id, changes));
	}

	@PatchMapping("/{id}/status")
	public RepairResponse move(@PathVariable Long id, @Valid @RequestBody StatusChange change,
			@AuthenticationPrincipal User user) {
		return RepairResponse.of(repairs.move(id, change.status(), change.note(), user));
	}

	@PostMapping("/{id}/parts")
	public RepairResponse addPart(@PathVariable Long id, @Valid @RequestBody PartRequest request,
			@AuthenticationPrincipal User user) {
		return RepairResponse.of(repairs.addPart(id, request.productId(), request.quantity(), user));
	}

	@DeleteMapping("/{id}/parts/{partId}")
	public RepairResponse removePart(@PathVariable Long id, @PathVariable Long partId, @AuthenticationPrincipal User user) {
		return RepairResponse.of(repairs.removePart(id, partId, user));
	}

	@PostMapping("/{id}/payments")
	public RepairResponse pay(@PathVariable Long id, @Valid @RequestBody PaymentRequest request,
			@AuthenticationPrincipal User user) {
		return RepairResponse.of(repairs.pay(id, request.amount(), request.method(), user));
	}

	/** US-15 : bon de depot remis au client. */
	@GetMapping("/{id}/slip")
	public ResponseEntity<byte[]> slip(@PathVariable Long id) {
		Repair repair = repairs.get(id);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"bon-depot-" + repair.getReference() + ".pdf\"")
				.body(DepositSlipPdf.render(repair));
	}
}
