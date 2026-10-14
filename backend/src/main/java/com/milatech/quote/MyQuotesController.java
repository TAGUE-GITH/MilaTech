package com.milatech.quote;

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

import com.milatech.quote.QuoteDtos.ClientRepair;
import com.milatech.quote.QuoteDtos.ClientRepairSummary;
import com.milatech.quote.QuoteDtos.QuoteForm;
import com.milatech.quote.QuoteDtos.QuoteResponse;
import com.milatech.user.User;

import jakarta.validation.Valid;

/** Espace du client : ses demandes de devis et le suivi de ses reparations. */
@RestController
@RequestMapping("/api/me")
@PreAuthorize("hasRole('CLIENT')")
@Transactional
public class MyQuotesController {

	private final QuoteService quotes;

	public MyQuotesController(QuoteService quotes) {
		this.quotes = quotes;
	}

	@PostMapping("/quotes")
	@ResponseStatus(HttpStatus.CREATED)
	public QuoteResponse request(@Valid @RequestBody QuoteForm form, @AuthenticationPrincipal User user) {
		return QuoteResponse.of(quotes.request(form, user), false);
	}

	@GetMapping("/quotes")
	public List<QuoteResponse> list(@AuthenticationPrincipal User user) {
		return quotes.mine(user).stream().map(q -> QuoteResponse.of(q, false)).toList();
	}

	@GetMapping("/quotes/{id}")
	public QuoteResponse get(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return QuoteResponse.of(quotes.mine(id, user), false);
	}

	@PostMapping("/quotes/{id}/accept")
	public QuoteResponse accept(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return QuoteResponse.of(quotes.answer(id, true, user), false);
	}

	@PostMapping("/quotes/{id}/refuse")
	public QuoteResponse refuse(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return QuoteResponse.of(quotes.answer(id, false, user), false);
	}

	@PostMapping("/quotes/{id}/cancel")
	public QuoteResponse cancel(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return QuoteResponse.of(quotes.cancel(id, user), false);
	}

	@GetMapping("/repairs")
	public List<ClientRepairSummary> repairs(@AuthenticationPrincipal User user) {
		return quotes.myRepairs(user).stream().map(ClientRepairSummary::of).toList();
	}

	@GetMapping("/repairs/{id}")
	public ClientRepair repair(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return ClientRepair.of(quotes.myRepair(id, user));
	}
}
