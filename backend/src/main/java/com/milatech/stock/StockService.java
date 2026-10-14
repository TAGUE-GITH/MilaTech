package com.milatech.stock;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.catalog.Product;
import com.milatech.catalog.ProductRepository;
import com.milatech.catalog.Supplier;
import com.milatech.common.ApiException;
import com.milatech.user.User;

/**
 * Seul point d'entree pour modifier une quantite en stock :
 * R1 jamais de stock negatif, R2 un mouvement par variation, R3 produits verrouilles pendant l'operation.
 */
@Service
public class StockService {

	private final ProductRepository products;
	private final StockMovementRepository movements;

	public StockService(ProductRepository products, StockMovementRepository movements) {
		this.products = products;
		this.movements = movements;
	}

	/** Stock de depart saisi a la creation du produit. */
	@Transactional
	public void initial(Product product, int quantity, User author) {
		product.addQuantity(quantity);
		movements.save(new StockMovement(product, MovementType.STOCK_INITIAL, quantity, product.getPurchasePrice(), null,
				"Stock initial", author));
	}

	/** US-06 : achat fournisseur ; le prix d'achat du produit devient celui de ce dernier achat. */
	@Transactional
	public Product purchase(Long productId, int quantity, long unitCost, Supplier supplier, String note, User author) {
		Product product = lock(productId);
		product.addQuantity(quantity);
		product.setPurchasePrice(unitCost);
		if (supplier != null) product.setSupplier(supplier);
		movements.save(new StockMovement(product, MovementType.ACHAT, quantity, unitCost, supplier, note, author));
		return product;
	}

	/** US-07 : correction apres un comptage (casse, perte, erreur), avec un motif obligatoire. */
	@Transactional
	public Product adjust(Long productId, int newQuantity, String reason, User author) {
		Product product = lock(productId);
		int delta = newQuantity - product.getQuantity();
		if (delta == 0)
			throw ApiException.badRequest("La quantité en stock est déjà de " + newQuantity + ".");
		product.addQuantity(delta);
		movements.save(new StockMovement(product, MovementType.CORRECTION, delta, null, null, reason.trim(), author));
		return product;
	}

	/**
	 * Sortie de stock (vente, piece de reparation) : tout ou rien. Si une seule ligne manque de stock,
	 * rien n'est retire et le message nomme le produit concerne.
	 */
	@Transactional
	public List<Product> remove(List<StockLine> lines, MovementType type, String reason, User author) {
		Map<Long, Integer> wanted = lines.stream()
				.collect(Collectors.toMap(StockLine::productId, StockLine::quantity, Integer::sum));
		Map<Long, Product> locked = products.findAllByIdForUpdate(List.copyOf(wanted.keySet())).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));
		for (var entry : wanted.entrySet()) {
			Product product = locked.get(entry.getKey());
			if (product == null) throw ApiException.notFound("Produit introuvable.");
			if (entry.getValue() > product.getQuantity())
				throw ApiException.conflict(
						"Stock insuffisant : " + product.getName() + " (reste " + product.getQuantity() + ").");
		}
		for (var entry : wanted.entrySet()) {
			Product product = locked.get(entry.getKey());
			product.addQuantity(-entry.getValue());
			movements.save(new StockMovement(product, type, -entry.getValue(), product.getPurchasePrice(), null, reason, author));
		}
		return List.copyOf(locked.values());
	}

	/** Remise en stock (piece retiree d'une reparation, annulation). */
	@Transactional
	public void putBack(Long productId, int quantity, MovementType type, String reason, User author) {
		Product product = lock(productId);
		product.addQuantity(quantity);
		movements.save(new StockMovement(product, type, quantity, product.getPurchasePrice(), null, reason, author));
	}

	@Transactional(readOnly = true)
	public List<StockMovement> history(Long productId) {
		if (!products.existsById(productId)) throw ApiException.notFound("Produit introuvable.");
		return movements.history(productId);
	}

	private Product lock(Long productId) {
		return products.findByIdForUpdate(productId).orElseThrow(() -> ApiException.notFound("Produit introuvable."));
	}
}
