package com.milatech.catalog;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.milatech.catalog.CatalogDtos.ProductRequest;
import com.milatech.catalog.CatalogDtos.ProductResponse;
import com.milatech.user.Role;
import com.milatech.user.User;

import jakarta.validation.Valid;

/**
 * US-05 : catalogue (consultation par tous les employes, modification par le gerant).
 * La reponse est construite dans la transaction : la categorie et le fournisseur sont charges a la demande.
 */
@RestController
@RequestMapping("/api/products")
@Transactional
public class ProductController {

	private final ProductService products;

	public ProductController(ProductService products) {
		this.products = products;
	}

	private static boolean showCosts(User user) {
		return user.getRole() == Role.GERANT;
	}

	@GetMapping
	public List<ProductResponse> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) Long categoryId, @RequestParam(defaultValue = "false") boolean lowStock,
			@AuthenticationPrincipal User user) {
		return products.search(q, categoryId, lowStock).stream().map(p -> ProductResponse.of(p, showCosts(user))).toList();
	}

	@GetMapping("/{id}")
	public ProductResponse get(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return ProductResponse.of(products.get(id), showCosts(user));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('GERANT')")
	public ProductResponse create(@Valid @RequestBody ProductRequest request, @AuthenticationPrincipal User user) {
		return ProductResponse.of(products.create(request, user), true);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('GERANT')")
	public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
		return ProductResponse.of(products.update(id, request), true);
	}
}
