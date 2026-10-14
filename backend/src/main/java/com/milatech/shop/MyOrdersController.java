package com.milatech.shop;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.shop.ShopDtos.OrderRequest;
import com.milatech.shop.ShopDtos.OrderResponse;
import com.milatech.shop.ShopDtos.OrderSummary;
import com.milatech.user.User;

import jakarta.validation.Valid;

/** Commandes du client connecte : passer commande, suivre, annuler tant qu'elle est en attente. */
@RestController
@RequestMapping("/api/me/orders")
@PreAuthorize("hasRole('CLIENT')")
@Transactional
public class MyOrdersController {

	private final OrderService orders;

	public MyOrdersController(OrderService orders) {
		this.orders = orders;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public OrderResponse place(@Valid @RequestBody OrderRequest request, @AuthenticationPrincipal User user) {
		return OrderResponse.of(orders.place(request, user));
	}

	@GetMapping
	public List<OrderSummary> list(@AuthenticationPrincipal User user) {
		return orders.mine(user).stream().map(OrderSummary::of).toList();
	}

	@GetMapping("/{id}")
	public OrderResponse get(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return OrderResponse.of(orders.mine(id, user));
	}

	@PostMapping("/{id}/cancel")
	public OrderResponse cancel(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return OrderResponse.of(orders.cancelByCustomer(id, user));
	}
}
