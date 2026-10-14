package com.milatech.sale;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

import com.milatech.sale.SaleDtos.PeriodTotals;
import com.milatech.sale.SaleDtos.SaleRequest;
import com.milatech.sale.SaleDtos.SaleResponse;
import com.milatech.sale.SaleDtos.SaleSummary;
import com.milatech.stock.StockLine;
import com.milatech.user.Role;
import com.milatech.user.User;

import jakarta.validation.Valid;

/** US-11 a US-13 : caisse, recus et historique des ventes (gerant et vendeurs). */
@RestController
@RequestMapping("/api/sales")
@PreAuthorize("hasAnyRole('GERANT', 'VENDEUR')")
@Transactional
public class SaleController {

	private final SaleService sales;

	public SaleController(SaleService sales) {
		this.sales = sales;
	}

	private static boolean isManager(User user) {
		return user.getRole() == Role.GERANT;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public SaleResponse sell(@Valid @RequestBody SaleRequest request, @AuthenticationPrincipal User user) {
		var lines = request.lines().stream().map(line -> new StockLine(line.productId(), line.quantity())).toList();
		return SaleResponse.of(sales.sell(request.customerId(), request.paymentMethod(), lines, user), isManager(user));
	}

	@GetMapping
	public List<SaleSummary> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@AuthenticationPrincipal User user) {
		return sales.list(from, to, user).stream().map(sale -> SaleSummary.of(sale, isManager(user))).toList();
	}

	/** Totaux de la periode, avec la marge theorique : reserve au gerant. */
	@GetMapping("/summary")
	@PreAuthorize("hasRole('GERANT')")
	public PeriodTotals summary(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@AuthenticationPrincipal User user) {
		var list = sales.list(from, to, user);
		return new PeriodTotals(list.size(), list.stream().mapToLong(Sale::getTotal).sum(),
				list.stream().mapToLong(Sale::getMargin).sum());
	}

	@GetMapping("/{id}")
	public SaleResponse get(@PathVariable Long id, @AuthenticationPrincipal User user) {
		return SaleResponse.of(sales.get(id, user), isManager(user));
	}

	@GetMapping("/{id}/receipt")
	public ResponseEntity<byte[]> receipt(@PathVariable Long id, @AuthenticationPrincipal User user) {
		Sale sale = sales.get(id, user);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"recu-" + sale.getReference() + ".pdf\"")
				.body(ReceiptPdf.render(sale));
	}
}
