package com.milatech.catalog;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.catalog.CatalogDtos.SupplierRequest;
import com.milatech.catalog.CatalogDtos.SupplierResponse;
import com.milatech.common.ApiException;

import jakarta.validation.Valid;

/** US-04 : fournisseurs (gerant uniquement). */
@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasRole('GERANT')")
public class SupplierController {

	private final SupplierRepository suppliers;

	public SupplierController(SupplierRepository suppliers) {
		this.suppliers = suppliers;
	}

	@GetMapping
	public List<SupplierResponse> list() {
		return suppliers.findAllByOrderByNameAsc().stream().map(SupplierResponse::of).toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Transactional
	public SupplierResponse create(@Valid @RequestBody SupplierRequest r) {
		return SupplierResponse.of(suppliers.save(new Supplier(r.name(), r.phone(), r.email(), r.address())));
	}

	@PutMapping("/{id}")
	@Transactional
	public SupplierResponse update(@PathVariable Long id, @Valid @RequestBody SupplierRequest r) {
		Supplier supplier = suppliers.findById(id).orElseThrow(() -> ApiException.notFound("Fournisseur introuvable."));
		supplier.update(r.name(), r.phone(), r.email(), r.address());
		return SupplierResponse.of(supplier);
	}
}
