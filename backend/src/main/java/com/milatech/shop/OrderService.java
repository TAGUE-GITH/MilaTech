package com.milatech.shop;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.catalog.Product;
import com.milatech.common.ApiException;
import com.milatech.customer.Customer;
import com.milatech.sale.Sale;
import com.milatech.sale.SaleLine;
import com.milatech.sale.SaleRepository;
import com.milatech.shop.OnlineOrder.DeliveryMode;
import com.milatech.shop.ShopDtos.OrderRequest;
import com.milatech.stock.MovementType;
import com.milatech.stock.StockLine;
import com.milatech.stock.StockService;
import com.milatech.user.User;
import com.milatech.user.UserRepository;

/**
 * Commandes en ligne. Les produits sont reserves (retires du stock) des la commande : la boutique ne vend pas
 * au comptoir un article deja promis a un client. Ils reviennent en stock si la commande est annulee.
 */
@Service
public class OrderService {

	private final OnlineOrderRepository orders;
	private final UserRepository users;
	private final SaleRepository sales;
	private final StockService stock;
	private final long deliveryFee;

	public OrderService(OnlineOrderRepository orders, UserRepository users, SaleRepository sales, StockService stock,
			@Value("${app.shop.delivery-fee}") long deliveryFee) {
		this.orders = orders;
		this.users = users;
		this.sales = sales;
		this.stock = stock;
		this.deliveryFee = deliveryFee;
	}

	public long deliveryFee() {
		return deliveryFee;
	}

	/** Tout ou rien : si un produit manque ou n'est plus en vente, rien n'est commande ni reserve. */
	@Transactional
	public OnlineOrder place(OrderRequest request, User principal) {
		User client = reload(principal);
		Customer customer = customerOf(client);
		boolean delivery = request.deliveryMode() == DeliveryMode.LIVRAISON;
		String address = request.address() == null ? "" : request.address().trim();
		if (delivery && address.isEmpty())
			throw ApiException.invalidField("address", "Indiquez votre quartier et un repère pour la livraison.");

		List<StockLine> lines = request.lines().stream().map(l -> new StockLine(l.productId(), l.quantity())).toList();
		Map<Long, Product> products = stock.lockAvailable(lines).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));
		for (Product product : products.values())
			if (!product.isActive())
				throw ApiException.badRequest("« " + product.getName() + " » n'est plus en vente.");

		String note = request.note() == null || request.note().isBlank() ? null : request.note().trim();
		OnlineOrder order = orders.save(new OnlineOrder(customer, request.deliveryMode(), delivery ? address : null,
				request.phone().trim(), note, delivery ? deliveryFee : 0));
		order.assignReference();
		for (StockLine line : lines)
			order.addLine(new OnlineOrderLine(order, products.get(line.productId()), line.quantity()));
		stock.remove(lines, MovementType.COMMANDE_EN_LIGNE, order.getReference(), client);
		return order;
	}

	@Transactional(readOnly = true)
	public List<OnlineOrder> mine(User principal) {
		return orders.findByCustomerIdOrderByCreatedAtDescIdDesc(customerOf(reload(principal)).getId());
	}

	/** Un client ne voit que ses commandes : celles des autres sont « introuvables ». */
	@Transactional(readOnly = true)
	public OnlineOrder mine(Long id, User principal) {
		Long customerId = customerOf(reload(principal)).getId();
		return orders.findById(id).filter(o -> o.getCustomer().getId().equals(customerId))
				.orElseThrow(() -> ApiException.notFound("Commande introuvable."));
	}

	/** Le client peut annuler tant que la boutique n'a pas commence a preparer sa commande. */
	@Transactional
	public OnlineOrder cancelByCustomer(Long id, User principal) {
		OnlineOrder order = mine(id, principal);
		if (order.getStatus() != OrderStatus.EN_ATTENTE)
			throw ApiException.badRequest(order.getStatus().canMoveTo(OrderStatus.ANNULEE)
					? "Cette commande est déjà en préparation : appelez la boutique pour l'annuler."
					: "Cette commande ne peut plus être annulée.");
		cancel(order, "Annulée par le client", reload(principal));
		return order;
	}

	/** Liste de la boutique : une etape precise, celles a traiter (open) ou toutes. */
	@Transactional(readOnly = true)
	public List<OnlineOrder> list(OrderStatus status, boolean open) {
		if (status != null) return orders.findByStatuses(List.of(status));
		return orders.findByStatuses(open ? OrderStatus.TO_PROCESS : Arrays.asList(OrderStatus.values()));
	}

	@Transactional(readOnly = true)
	public OnlineOrder get(Long id) {
		return orders.findById(id).orElseThrow(() -> ApiException.notFound("Commande introuvable."));
	}

	/** Etape suivante choisie par la boutique. A la remise, la commande devient une vente (stock deja retire). */
	@Transactional
	public OnlineOrder move(Long id, OrderStatus target, Sale.PaymentMethod paymentMethod, String note, User staff) {
		OnlineOrder order = get(id);
		if (!order.getStatus().canMoveTo(target))
			throw ApiException.badRequest(
					"Impossible de passer de « " + order.getStatus().label() + " » à « " + target.label() + " ».");
		if (target == OrderStatus.ANNULEE) {
			cancel(order, note == null || note.isBlank() ? "Annulée par la boutique" : note.trim(), staff);
			return order;
		}
		if (target == OrderStatus.REMISE) {
			if (paymentMethod == null) throw ApiException.badRequest("Indiquez comment le client a payé.");
			order.attachSale(recordSale(order, paymentMethod, staff));
		}
		order.moveTo(target, null);
		return order;
	}

	private Sale recordSale(OnlineOrder order, Sale.PaymentMethod paymentMethod, User staff) {
		Sale sale = sales.save(new Sale(order.getCustomer(), staff, paymentMethod));
		sale.assignReference();
		for (OnlineOrderLine line : order.getLines())
			sale.addLine(new SaleLine(sale, line.getProduct(), line.getQuantity(), line.getUnitPrice()));
		return sale;
	}

	private void cancel(OnlineOrder order, String reason, User author) {
		for (OnlineOrderLine line : order.getLines())
			stock.putBack(line.getProduct().getId(), line.getQuantity(), MovementType.ANNULATION_COMMANDE,
					order.getReference(), author);
		order.moveTo(OrderStatus.ANNULEE, reason);
	}

	private User reload(User principal) {
		return users.findById(principal.getId()).orElseThrow(() -> ApiException.notFound("Compte introuvable."));
	}

	private static Customer customerOf(User user) {
		if (user.getCustomer() == null) throw ApiException.badRequest("Seuls les comptes clients peuvent commander.");
		return user.getCustomer();
	}
}
