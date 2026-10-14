package com.milatech.customer;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.common.ApiException;
import com.milatech.repair.RepairDtos.RepairSummary;
import com.milatech.repair.RepairRepository;
import com.milatech.sale.SaleDtos.SaleSummary;
import com.milatech.sale.SaleRepository;
import com.milatech.user.Role;
import com.milatech.user.User;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** US-10 : fiches clients, utilisees par tous les employes (ventes, reparations, formations). */
@RestController
@RequestMapping("/api/customers")
@Transactional
public class CustomerController {

	public record CustomerRequest(
			@NotBlank(message = "Le nom est obligatoire.") @Size(max = 120) String fullName,
			@NotBlank(message = "Le téléphone est obligatoire.") @Size(max = 30) String phone,
			@Email(message = "Email invalide.") String email,
			@Size(max = 1000) String notes) {
	}

	public record CustomerResponse(Long id, String fullName, String phone, String email, String notes, Instant createdAt) {

		static CustomerResponse of(Customer c) {
			return new CustomerResponse(c.getId(), c.getFullName(), c.getPhone(), c.getEmail(), c.getNotes(), c.getCreatedAt());
		}
	}

	/** Fiche complete : coordonnees et historique (achats, reparations ; formations au sprint 4). */
	public record CustomerDetail(CustomerResponse customer, List<SaleSummary> sales, long totalSpent,
			List<RepairSummary> repairs) {
	}

	private final CustomerRepository customers;
	private final SaleRepository sales;
	private final RepairRepository repairs;

	public CustomerController(CustomerRepository customers, SaleRepository sales, RepairRepository repairs) {
		this.customers = customers;
		this.sales = sales;
		this.repairs = repairs;
	}

	@GetMapping
	public List<CustomerResponse> search(@RequestParam(required = false) String q) {
		String query = q == null ? "" : q.trim().toLowerCase();
		String phone = Customer.normalizePhone(query);
		return customers.search("%" + query + "%", "%" + (phone.isEmpty() ? query : phone) + "%").stream()
				.map(CustomerResponse::of).toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CustomerResponse create(@Valid @RequestBody CustomerRequest r) {
		return CustomerResponse.of(customers.save(new Customer(r.fullName(), r.phone(), r.email(), r.notes())));
	}

	@PutMapping("/{id}")
	public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerRequest r) {
		Customer customer = find(id);
		customer.update(r.fullName(), r.phone(), r.email(), r.notes());
		return CustomerResponse.of(customer);
	}

	@GetMapping("/{id}")
	public CustomerDetail get(@PathVariable Long id, @AuthenticationPrincipal User user) {
		Customer customer = find(id);
		boolean manager = user.getRole() == Role.GERANT;
		var history = sales.findByCustomer(id);
		return new CustomerDetail(CustomerResponse.of(customer),
				history.stream().map(sale -> SaleSummary.of(sale, manager)).toList(),
				history.stream().mapToLong(sale -> sale.getTotal()).sum(),
				repairs.findByCustomer(id).stream().map(RepairSummary::of).toList());
	}

	private Customer find(Long id) {
		return customers.findById(id).orElseThrow(() -> ApiException.notFound("Client introuvable."));
	}
}
