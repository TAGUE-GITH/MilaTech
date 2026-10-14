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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.quote.QuoteDtos.DepositForm;
import com.milatech.quote.QuoteDtos.QuoteAnswer;
import com.milatech.quote.QuoteDtos.QuoteResponse;
import com.milatech.quote.QuoteDtos.QuoteSummary;
import com.milatech.repair.RepairDtos.RepairResponse;
import com.milatech.user.User;

import jakarta.validation.Valid;

/** Demandes de devis cote boutique : memes personnes que les reparations (pas les formateurs). */
@RestController
@RequestMapping("/api/quotes")
@PreAuthorize("hasAnyRole('GERANT', 'TECHNICIEN', 'VENDEUR')")
@Transactional
public class QuoteController {

	private final QuoteService quotes;

	public QuoteController(QuoteService quotes) {
		this.quotes = quotes;
	}

	@GetMapping
	public List<QuoteSummary> list(@RequestParam(defaultValue = "false") boolean open) {
		return quotes.list(open).stream().map(QuoteSummary::of).toList();
	}

	@GetMapping("/{id}")
	public QuoteResponse get(@PathVariable Long id) {
		return QuoteResponse.of(quotes.get(id), true);
	}

	@PostMapping("/{id}/answer")
	public QuoteResponse answer(@PathVariable Long id, @Valid @RequestBody QuoteAnswer answer,
			@AuthenticationPrincipal User user) {
		return QuoteResponse.of(quotes.quote(id, answer.price(), answer.message(), user), true);
	}

	@PostMapping("/{id}/repair")
	@ResponseStatus(HttpStatus.CREATED)
	public RepairResponse deposit(@PathVariable Long id, @Valid @RequestBody DepositForm form,
			@AuthenticationPrincipal User user) {
		return RepairResponse.of(quotes.deposit(id, form, user));
	}
}
