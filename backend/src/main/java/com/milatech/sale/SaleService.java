package com.milatech.sale;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.catalog.Product;
import com.milatech.common.ApiException;
import com.milatech.customer.Customer;
import com.milatech.customer.CustomerRepository;
import com.milatech.stock.MovementType;
import com.milatech.stock.StockLine;
import com.milatech.stock.StockService;
import com.milatech.user.Role;
import com.milatech.user.User;

/** US-11 : vente au comptoir. Tout ou rien : si une ligne manque de stock, rien n'est enregistre. */
@Service
public class SaleService {

	private final SaleRepository sales;
	private final CustomerRepository customers;
	private final StockService stock;

	public SaleService(SaleRepository sales, CustomerRepository customers, StockService stock) {
		this.sales = sales;
		this.customers = customers;
		this.stock = stock;
	}

	@Transactional
	public Sale sell(Long customerId, Sale.PaymentMethod paymentMethod, List<StockLine> lines, User seller) {
		Customer customer = customerId == null ? null
				: customers.findById(customerId).orElseThrow(() -> ApiException.badRequest("Client introuvable."));

		// R1 et R3 : produits verrouilles et stock verifie pour toutes les lignes AVANT d'enregistrer la vente
		Map<Long, Product> products = stock.lockAvailable(lines).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));
		for (Product product : products.values())
			if (!product.isActive())
				throw ApiException.badRequest("« " + product.getName() + " » n'est plus en vente.");

		Sale sale = sales.save(new Sale(customer, seller, paymentMethod));
		sale.assignReference();
		for (StockLine line : lines)
			sale.addLine(new SaleLine(sale, products.get(line.productId()), line.quantity()));
		stock.remove(lines, MovementType.VENTE, sale.getReference(), seller);
		return sale;
	}

	@Transactional(readOnly = true)
	public Sale get(Long id, User user) {
		Sale sale = sales.findById(id).orElseThrow(() -> ApiException.notFound("Vente introuvable."));
		if (user.getRole() != Role.GERANT && !sale.getSeller().getId().equals(user.getId()))
			throw ApiException.notFound("Vente introuvable.");
		return sale;
	}

	/** US-13 : ventes d'une periode (dates incluses, heure du Cameroun). Un vendeur ne voit que les siennes. */
	@Transactional(readOnly = true)
	public List<Sale> list(LocalDate from, LocalDate to, User user) {
		Instant start = (from == null ? LocalDate.of(2000, 1, 1) : from).atStartOfDay(Sale.ZONE).toInstant();
		Instant end = (to == null ? LocalDate.now(Sale.ZONE) : to).plusDays(1).atStartOfDay(Sale.ZONE).toInstant();
		long sellerId = user.getRole() == Role.GERANT ? -1 : user.getId();
		return sales.findPeriod(start, end, sellerId);
	}
}
