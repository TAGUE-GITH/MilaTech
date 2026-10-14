package com.milatech.dashboard;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.milatech.catalog.ProductRepository;
import com.milatech.common.Money;
import com.milatech.repair.Repair;
import com.milatech.repair.RepairDtos.RepairSummary;
import com.milatech.repair.RepairRepository;
import com.milatech.repair.RepairStatus;
import com.milatech.sale.Sale;
import com.milatech.sale.SaleRepository;
import com.milatech.sale.SaleService;
import com.milatech.training.Enrollment;
import com.milatech.training.EnrollmentRepository;
import com.milatech.training.EnrollmentStatus;
import com.milatech.user.User;

/** US-24 : vue d'ensemble de l'activite pour le gerant, des la connexion. */
@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('GERANT')")
@Transactional(readOnly = true)
public class DashboardController {

	private static final List<RepairStatus> IN_PROGRESS = List.of(RepairStatus.RECU, RepairStatus.EN_DIAGNOSTIC,
			RepairStatus.EN_REPARATION);
	/** Appareils termines (repares ou non) qui attendent leur proprietaire. */
	private static final List<RepairStatus> WAITING_PICKUP = List.of(RepairStatus.REPARE, RepairStatus.IRREPARABLE,
			RepairStatus.ANNULE);

	public record Totals(long count, long total, long margin) {
	}

	public record DaySales(LocalDate date, long total) {
	}

	public record LowStock(Long id, String name, int quantity, int alertThreshold) {
	}

	public record AmountsDue(long repairs, long trainings) {
	}

	/** Une operation recente : vente, etape de reparation ou inscription. */
	public record Operation(String type, String label, String detail, Long targetId, Instant at) {
	}

	public record Dashboard(Totals salesToday, Totals salesMonth, List<DaySales> dailySales, List<LowStock> lowStock,
			long lowStockCount, long repairsInProgress, List<RepairSummary> repairsReady, AmountsDue amountsDue,
			List<Operation> recent) {
	}

	private final SaleService saleService;
	private final SaleRepository sales;
	private final ProductRepository products;
	private final RepairRepository repairs;
	private final EnrollmentRepository enrollments;

	public DashboardController(SaleService saleService, SaleRepository sales, ProductRepository products,
			RepairRepository repairs, EnrollmentRepository enrollments) {
		this.saleService = saleService;
		this.sales = sales;
		this.products = products;
		this.repairs = repairs;
		this.enrollments = enrollments;
	}

	@GetMapping
	public Dashboard dashboard(@AuthenticationPrincipal User manager) {
		LocalDate today = LocalDate.now(Sale.ZONE);
		List<Sale> week = saleService.list(today.minusDays(6), today, manager);
		List<Sale> month = saleService.list(today.withDayOfMonth(1), today, manager);
		List<Sale> ofToday = week.stream().filter(s -> day(s).equals(today)).toList();

		List<DaySales> daily = new ArrayList<>();
		for (int offset = 6; offset >= 0; offset--) {
			LocalDate date = today.minusDays(offset);
			daily.add(new DaySales(date, week.stream().filter(s -> day(s).equals(date)).mapToLong(Sale::getTotal).sum()));
		}

		var low = products.lowStock();
		List<Repair> waiting = repairs.findOpen(WAITING_PICKUP);
		long repairsDue = repairs.findOpen(List.of(RepairStatus.RECU, RepairStatus.EN_DIAGNOSTIC, RepairStatus.EN_REPARATION,
				RepairStatus.REPARE, RepairStatus.IRREPARABLE, RepairStatus.ANNULE)).stream()
				.mapToLong(r -> Math.max(0, r.getBalance())).sum();
		long trainingsDue = enrollments.findByStatusNot(EnrollmentStatus.ABANDON).stream()
				.mapToLong(e -> Math.max(0, e.getBalance())).sum();

		return new Dashboard(totals(ofToday), totals(month), daily,
				low.stream().limit(5).map(p -> new LowStock(p.getId(), p.getName(), p.getQuantity(), p.getAlertThreshold()))
						.toList(),
				low.size(), repairs.countByStatusIn(IN_PROGRESS), waiting.stream().map(RepairSummary::of).toList(),
				new AmountsDue(repairsDue, trainingsDue), recent());
	}

	private static LocalDate day(Sale sale) {
		return sale.getCreatedAt().atZone(Sale.ZONE).toLocalDate();
	}

	private static Totals totals(List<Sale> list) {
		return new Totals(list.size(), list.stream().mapToLong(Sale::getTotal).sum(),
				list.stream().mapToLong(Sale::getMargin).sum());
	}

	/** Les 8 dernieres operations, tous modules confondus, les plus recentes d'abord. */
	private List<Operation> recent() {
		List<Operation> operations = new ArrayList<>();
		for (Sale s : sales.findTop8ByOrderByCreatedAtDescIdDesc())
			operations.add(new Operation("VENTE", "Vente " + s.getReference(),
					Money.fcfa(s.getTotal()) + " · " + s.getSeller().getFullName(), s.getId(), s.getCreatedAt()));
		for (var e : repairs.recentEvents(PageRequest.of(0, 8)))
			operations.add(new Operation("REPARATION", e.getRepair().getDevice() + " : " + e.getStatus().label(),
					e.getRepair().getCustomer().getFullName() + " · " + e.getAuthor().getFullName(), e.getRepair().getId(),
					e.getCreatedAt()));
		for (Enrollment e : enrollments.findTop8ByOrderByEnrolledAtDescIdDesc())
			operations.add(new Operation("INSCRIPTION", "Inscription : " + e.getCustomer().getFullName(),
					e.getTraining().getTitle(), e.getTraining().getId(), e.getEnrolledAt()));
		return operations.stream().sorted(Comparator.comparing(Operation::at).reversed()).limit(8).toList();
	}
}
