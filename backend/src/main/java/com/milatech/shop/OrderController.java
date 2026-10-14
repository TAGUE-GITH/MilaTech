package com.milatech.shop;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.shop.ShopDtos.OrderResponse;
import com.milatech.shop.ShopDtos.OrderSummary;
import com.milatech.shop.ShopDtos.StatusRequest;
import com.milatech.user.User;

import jakarta.validation.Valid;

/** Traitement des commandes en ligne par la boutique (gerant et vendeurs). */
@RestController
@RequestMapping("/api/orders")
@PreAuthorize("hasAnyRole('GERANT', 'VENDEUR')")
@Transactional
public class OrderController {

	private final OrderService orders;

	public OrderController(OrderService orders) {
		this.orders = orders;
	}

	@GetMapping
	public List<OrderSummary> list(@RequestParam(required = false) OrderStatus status,
			@RequestParam(defaultValue = "false") boolean open) {
		return orders.list(status, open).stream().map(OrderSummary::of).toList();
	}

	@GetMapping("/{id}")
	public OrderResponse get(@PathVariable Long id) {
		return OrderResponse.of(orders.get(id));
	}

	@PostMapping("/{id}/status")
	public OrderResponse move(@PathVariable Long id, @Valid @RequestBody StatusRequest request,
			@AuthenticationPrincipal User user) {
		return OrderResponse.of(orders.move(id, request.status(), request.paymentMethod(), request.note(), user));
	}
}
