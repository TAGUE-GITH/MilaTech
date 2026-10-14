package com.milatech.quote;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.milatech.common.ApiException;
import com.milatech.customer.Customer;
import com.milatech.image.ImageService;
import com.milatech.quote.QuoteDtos.DepositForm;
import com.milatech.quote.QuoteDtos.QuoteForm;
import com.milatech.repair.Repair;
import com.milatech.repair.RepairDtos.NewRepair;
import com.milatech.repair.RepairRepository;
import com.milatech.repair.RepairService;
import com.milatech.user.User;
import com.milatech.user.UserRepository;

/** Demandes de devis en ligne et suivi des reparations par le client. */
@Service
public class QuoteService {

	private final QuoteRequestRepository quotes;
	private final UserRepository users;
	private final ImageService images;
	private final RepairService repairService;
	private final RepairRepository repairs;

	public QuoteService(QuoteRequestRepository quotes, UserRepository users, ImageService images,
			RepairService repairService, RepairRepository repairs) {
		this.quotes = quotes;
		this.users = users;
		this.images = images;
		this.repairService = repairService;
		this.repairs = repairs;
	}

	@Transactional
	public QuoteRequest request(QuoteForm form, User principal) {
		Customer customer = customerOf(principal);
		var photo = form.photo() == null || form.photo().isBlank() ? null : images.save(form.photo());
		QuoteRequest quote = quotes.save(new QuoteRequest(customer, form.deviceType(), blankToNull(form.brand()),
				blankToNull(form.model()), form.issue().trim(), photo));
		quote.assignReference();
		return quote;
	}

	@Transactional(readOnly = true)
	public List<QuoteRequest> mine(User principal) {
		return quotes.findByCustomerIdOrderByCreatedAtDescIdDesc(customerOf(principal).getId());
	}

	/** Un client ne voit que ses demandes : celles des autres sont « introuvables ». */
	@Transactional(readOnly = true)
	public QuoteRequest mine(Long id, User principal) {
		Long customerId = customerOf(principal).getId();
		return quotes.findById(id).filter(q -> q.getCustomer().getId().equals(customerId))
				.orElseThrow(() -> ApiException.notFound("Demande introuvable."));
	}

	@Transactional
	public QuoteRequest answer(Long id, boolean accepted, User principal) {
		QuoteRequest quote = mine(id, principal);
		quote.answer(accepted);
		return quote;
	}

	@Transactional
	public QuoteRequest cancel(Long id, User principal) {
		QuoteRequest quote = mine(id, principal);
		quote.cancel();
		return quote;
	}

	/** Liste de la boutique : celles en cours (open) ou toutes. */
	@Transactional(readOnly = true)
	public List<QuoteRequest> list(boolean open) {
		return quotes.findByStatuses(open ? QuoteStatus.OPEN : Arrays.asList(QuoteStatus.values()));
	}

	@Transactional(readOnly = true)
	public QuoteRequest get(Long id) {
		return quotes.findById(id).orElseThrow(() -> ApiException.notFound("Demande introuvable."));
	}

	@Transactional
	public QuoteRequest quote(Long id, long price, String message, User author) {
		QuoteRequest quote = get(id);
		quote.quote(price, blankToNull(message), author);
		return quote;
	}

	/** Le client apporte l'appareil : un dossier de reparation est ouvert avec le prix accepte comme estimation. */
	@Transactional
	public Repair deposit(Long id, DepositForm form, User author) {
		QuoteRequest quote = get(id);
		if (quote.getStatus() != QuoteStatus.ACCEPTEE)
			throw ApiException.badRequest("Seul un devis accepté par le client peut devenir une réparation.");
		Repair repair = repairService.receive(new NewRepair(quote.getCustomer().getId(), quote.getDeviceType(),
				quote.getBrand(), quote.getModel(), form.serialNumber(), form.accessories(), Repair.Reception.BOUTIQUE,
				quote.getIssue(), quote.getQuotedPrice(), form.promisedOn(), form.deposit(), form.depositMethod()), author);
		quote.deposited(repair);
		return repair;
	}

	@Transactional(readOnly = true)
	public List<Repair> myRepairs(User principal) {
		return repairs.findByCustomer(customerOf(principal).getId());
	}

	@Transactional(readOnly = true)
	public Repair myRepair(Long id, User principal) {
		Long customerId = customerOf(principal).getId();
		return repairs.findById(id).filter(r -> r.getCustomer().getId().equals(customerId))
				.orElseThrow(() -> ApiException.notFound("Réparation introuvable."));
	}

	private Customer customerOf(User principal) {
		User user = users.findById(principal.getId()).orElseThrow(() -> ApiException.notFound("Compte introuvable."));
		if (user.getCustomer() == null) throw ApiException.badRequest("Réservé aux comptes clients.");
		return user.getCustomer();
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
