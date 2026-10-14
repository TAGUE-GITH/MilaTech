package com.milatech.catalog;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.catalog.CatalogDtos.CategoryRequest;
import com.milatech.catalog.CatalogDtos.CategoryResponse;
import com.milatech.common.ApiException;

import jakarta.validation.Valid;

/** US-04 : categories de produits (lecture pour tous les employes, modification par le gerant). */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

	private final CategoryRepository categories;
	private final ProductRepository products;

	public CategoryController(CategoryRepository categories, ProductRepository products) {
		this.categories = categories;
		this.products = products;
	}

	@GetMapping
	public List<CategoryResponse> list() {
		return categories.findAllByOrderByNameAsc().stream().map(CategoryResponse::of).toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('GERANT')")
	@Transactional
	public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
		String name = request.name().trim();
		if (categories.existsByNameIgnoreCase(name))
			throw ApiException.conflict("La catégorie « " + name + " » existe déjà.");
		return CategoryResponse.of(categories.save(new Category(name)));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('GERANT')")
	@Transactional
	public CategoryResponse rename(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
		Category category = categories.findById(id).orElseThrow(() -> ApiException.notFound("Catégorie introuvable."));
		category.setName(request.name().trim());
		return CategoryResponse.of(category);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('GERANT')")
	@Transactional
	public void delete(@PathVariable Long id) {
		if (products.existsByCategoryId(id))
			throw ApiException.conflict("Cette catégorie contient des produits : elle ne peut pas être supprimée.");
		categories.deleteById(id);
	}
}
