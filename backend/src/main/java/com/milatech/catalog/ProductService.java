package com.milatech.catalog;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.catalog.CatalogDtos.ProductRequest;
import com.milatech.common.ApiException;
import com.milatech.image.Image;
import com.milatech.image.ImageService;
import com.milatech.stock.StockService;
import com.milatech.user.User;

/** US-05 : produits du catalogue. La quantite ne se modifie jamais ici, seulement par des mouvements de stock. */
@Service
public class ProductService {

	private final ProductRepository products;
	private final CategoryRepository categories;
	private final SupplierRepository suppliers;
	private final StockService stock;
	private final ImageService images;

	public ProductService(ProductRepository products, CategoryRepository categories, SupplierRepository suppliers,
			StockService stock, ImageService images) {
		this.products = products;
		this.categories = categories;
		this.suppliers = suppliers;
		this.stock = stock;
		this.images = images;
	}

	@Transactional(readOnly = true)
	public List<Product> search(String q, Long categoryId, boolean lowStock) {
		String pattern = q == null || q.isBlank() ? "%" : "%" + q.trim().toLowerCase() + "%";
		return products.search(pattern, categoryId == null, categoryId == null ? 0 : categoryId, lowStock);
	}

	@Transactional(readOnly = true)
	public Product get(Long id) {
		return products.findById(id).orElseThrow(() -> ApiException.notFound("Produit introuvable."));
	}

	@Transactional
	public Product create(ProductRequest request, User author) {
		String reference = Product.normalize(request.reference());
		if (products.existsByReference(reference))
			throw ApiException.conflict("Un produit existe déjà avec la référence " + reference + ".");
		Product product = new Product(reference, request.name().trim(), category(request.categoryId()),
				request.purchasePrice(), request.salePrice(), request.alertThreshold());
		apply(product, request);
		products.save(product);
		if (request.initialQuantity() != null && request.initialQuantity() > 0)
			stock.initial(product, request.initialQuantity(), author);
		return product;
	}

	@Transactional
	public Product update(Long id, ProductRequest request) {
		Product product = get(id);
		String reference = Product.normalize(request.reference());
		if (products.existsByReferenceAndIdNot(reference, id))
			throw ApiException.conflict("Un produit existe déjà avec la référence " + reference + ".");
		product.setReference(reference);
		product.setName(request.name().trim());
		product.setCategory(category(request.categoryId()));
		product.setPurchasePrice(request.purchasePrice());
		product.setSalePrice(request.salePrice());
		product.setAlertThreshold(request.alertThreshold());
		apply(product, request);
		return product;
	}

	/** Photo de la boutique en ligne : la nouvelle remplace l'ancienne, qui est supprimee. */
	@Transactional
	public Product setImage(Long id, String dataUrl) {
		Product product = get(id);
		replaceImage(product, images.save(dataUrl));
		return product;
	}

	@Transactional
	public Product removeImage(Long id) {
		Product product = get(id);
		replaceImage(product, null);
		return product;
	}

	private void replaceImage(Product product, Image image) {
		Image previous = product.getImage();
		product.setImage(image);
		products.flush();
		images.delete(previous);
	}

	/** Boutique en ligne : produits en vente et disponibles, par nom. */
	@Transactional(readOnly = true)
	public List<Product> shop(String q, Long categoryId) {
		String pattern = q == null || q.isBlank() ? "%" : "%" + q.trim().toLowerCase() + "%";
		return products.shop(pattern, categoryId == null, categoryId == null ? 0 : categoryId);
	}

	@Transactional(readOnly = true)
	public Product shopProduct(Long id) {
		return products.findById(id).filter(p -> p.isActive() && p.getQuantity() > 0)
				.orElseThrow(() -> ApiException.notFound("Ce produit n'est plus disponible."));
	}

	private void apply(Product product, ProductRequest request) {
		product.setDescription(request.description());
		product.setSupplier(request.supplierId() == null ? null
				: suppliers.findById(request.supplierId()).orElseThrow(() -> ApiException.badRequest("Fournisseur introuvable.")));
		if (request.active() != null) product.setActive(request.active());
	}

	private Category category(Long id) {
		return categories.findById(id).orElseThrow(() -> ApiException.badRequest("Catégorie introuvable."));
	}
}
