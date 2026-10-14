package com.milatech.shop;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.catalog.CatalogDtos.CategoryResponse;
import com.milatech.catalog.CatalogDtos.ShopProduct;
import com.milatech.catalog.ProductRepository;
import com.milatech.catalog.ProductService;
import com.milatech.shop.ShopDtos.ShopInfo;

/** Boutique en ligne publique (sans connexion) : produits en vente et en stock, avec leur photo. */
@RestController
@RequestMapping("/api/shop")
@Transactional(readOnly = true)
public class ShopController {

	private final ProductService products;
	private final ProductRepository productRepository;
	private final OrderService orders;

	public ShopController(ProductService products, ProductRepository productRepository, OrderService orders) {
		this.products = products;
		this.productRepository = productRepository;
		this.orders = orders;
	}

	@GetMapping("/products")
	public List<ShopProduct> products(@RequestParam(required = false) String q,
			@RequestParam(required = false) Long categoryId) {
		return products.shop(q, categoryId).stream().map(ShopProduct::of).toList();
	}

	@GetMapping("/products/{id}")
	public ShopProduct product(@PathVariable Long id) {
		return ShopProduct.of(products.shopProduct(id));
	}

	@GetMapping("/categories")
	public List<CategoryResponse> categories() {
		return productRepository.shopCategories().stream().map(CategoryResponse::of).toList();
	}

	@GetMapping("/info")
	public ShopInfo info() {
		return new ShopInfo(orders.deliveryFee(), "Yaoundé");
	}
}
