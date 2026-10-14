package com.milatech.demo;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import com.milatech.catalog.CatalogDtos.ProductRequest;
import com.milatech.catalog.Category;
import com.milatech.catalog.CategoryRepository;
import com.milatech.catalog.Product;
import com.milatech.catalog.ProductService;
import com.milatech.catalog.Supplier;
import com.milatech.catalog.SupplierRepository;
import com.milatech.contact.ContactMessage;
import com.milatech.contact.ContactMessageRepository;
import com.milatech.customer.Customer;
import com.milatech.customer.CustomerRepository;
import com.milatech.mail.EmailService;
import com.milatech.payment.Payment;
import com.milatech.quote.QuoteDtos.DepositForm;
import com.milatech.quote.QuoteDtos.QuoteForm;
import com.milatech.quote.QuoteService;
import com.milatech.repair.Repair;
import com.milatech.repair.RepairDtos.NewRepair;
import com.milatech.repair.RepairDtos.RepairChanges;
import com.milatech.repair.RepairService;
import com.milatech.repair.RepairStatus;
import com.milatech.sale.Sale;
import com.milatech.sale.SaleService;
import com.milatech.shop.OnlineOrder;
import com.milatech.shop.OnlineOrder.DeliveryMode;
import com.milatech.shop.OrderService;
import com.milatech.shop.OrderStatus;
import com.milatech.shop.ShopDtos.OrderLineRequest;
import com.milatech.shop.ShopDtos.OrderRequest;
import com.milatech.stock.StockLine;
import com.milatech.training.EnrollmentStatus;
import com.milatech.training.Training;
import com.milatech.training.TrainingDtos.EnrollmentRequest;
import com.milatech.training.TrainingDtos.TrainingRequest;
import com.milatech.training.TrainingService;
import com.milatech.user.Role;
import com.milatech.user.User;
import com.milatech.user.UserRepository;

/**
 * Donnees de demonstration entierement fictives (noms, numeros, ventes...) pour presenter l'application
 * sans montrer les vraies donnees de MilaTech. Tout passe par les services : les regles metier restent respectees.
 */
@Service
public class DemoService {

	/** Mot de passe public des comptes de demonstration (affiche sur la page de connexion). */
	public static final String PASSWORD = "demo-milatech-2026";

	public record DemoAccount(String email, Role role, String firstName, String lastName) {
	}

	public static final List<DemoAccount> ACCOUNTS = List.of(
			new DemoAccount("gerant" + EmailService.DEMO_DOMAIN, Role.GERANT, "Paul", "Mbarga"),
			new DemoAccount("vendeur" + EmailService.DEMO_DOMAIN, Role.VENDEUR, "Aïcha", "Bello"),
			new DemoAccount("technicien" + EmailService.DEMO_DOMAIN, Role.TECHNICIEN, "Serge", "Nkou"),
			new DemoAccount("formateur" + EmailService.DEMO_DOMAIN, Role.FORMATEUR, "Grâce", "Tchoua"),
			new DemoAccount("client" + EmailService.DEMO_DOMAIN, Role.CLIENT, "Awa", "Ngono"));

	public static boolean isDemo(User user) {
		return user.getEmail().endsWith(EmailService.DEMO_DOMAIN);
	}

	/** Produit : reference, nom, categorie, prix d'achat, prix de vente, stock de depart, seuil, photo Unsplash. */
	private record DemoProduct(String reference, String name, String category, long cost, long price, int stock, int threshold,
			String photo, String description) {
	}

	private static final List<DemoProduct> PRODUCTS = List.of(
			new DemoProduct("TEL-A15", "Samsung Galaxy A15 128 Go", "Téléphones", 72000, 95000, 8, 2, "1612442443556-09b5b309e637",
					"Écran 6,5 pouces, 128 Go, double SIM. Garantie 6 mois."),
			new DemoProduct("TEL-SPARK20", "Tecno Spark 20", "Téléphones", 55000, 75000, 5, 2, "1598965402089-897ce52e8355",
					"Grande batterie 5000 mAh, double SIM. Garantie 6 mois."),
			new DemoProduct("TEL-REDMI13", "Xiaomi Redmi 13C", "Téléphones", 50000, 68000, 1, 2, "1480694313141-fce5e697ee25",
					"128 Go, appareil photo 50 Mpx. Garantie 6 mois."),
			new DemoProduct("CHG-25W", "Chargeur rapide 25 W USB-C", "Accessoires", 3500, 6000, 30, 5, "1770417999831-1c070eb628e6",
					"Charge rapide, compatible Samsung, Tecno, Infinix, Xiaomi."),
			new DemoProduct("CBL-USBC", "Câble USB-C renforcé 1 m", "Accessoires", 800, 2000, 45, 10, "1603539444875-76e7684265f6",
					"Câble tressé résistant, charge et transfert de données."),
			new DemoProduct("PWB-20K", "Batterie externe 20 000 mAh", "Accessoires", 9000, 15000, 10, 3, "1566554738544-d962991c3fee",
					"Recharge un téléphone 4 à 5 fois. Idéale pendant les coupures de courant."),
			new DemoProduct("MTR-SMART", "Montre connectée", "Accessoires", 12000, 20000, 4, 2, "1579586337278-3befd40fd17a",
					"Pas, sommeil, notifications d'appels et de messages."),
			new DemoProduct("EAR-TWS", "Écouteurs sans fil Bluetooth", "Audio Bluetooth", 6000, 12000, 16, 4, "1606220588913-b3aacb4d2f46",
					"Boîtier de charge, jusqu'à 20 h d'écoute."),
			new DemoProduct("SPK-BT20", "Enceinte Bluetooth portable", "Audio Bluetooth", 14000, 25000, 6, 2, "1608043152269-423dbba4e7e1",
					"Son puissant, résistante aux éclaboussures, 12 h d'autonomie."),
			new DemoProduct("SPK-LED", "Enceinte Bluetooth lumineuse", "Audio Bluetooth", 9000, 16000, 2, 2, "1589003077984-894e133dabab",
					"Lumières LED au rythme de la musique."),
			new DemoProduct("CSQ-BT", "Casque Bluetooth à réduction de bruit", "Audio Bluetooth", 18000, 30000, 5, 1,
					"1618366712010-f4ae9c647dcb", "Confortable, pliable, 30 h d'autonomie."),
			new DemoProduct("ARD-UNO", "Carte Arduino Uno (compatible)", "Composants", 5000, 9000, 12, 3, "1649959168260-2eb9702d7b69",
					"La carte idéale pour apprendre l'électronique et la programmation."),
			new DemoProduct("KIT-ELEC", "Kit d'initiation à l'électronique", "Composants", 12000, 20000, 6, 2, "1603732551658-5fabbafa84eb",
					"Carte, plaque d'essai, LED, résistances, capteurs et fils."),
			new DemoProduct("ECR-A15", "Écran Samsung A15 (pièce détachée)", "Pièces détachées", 18000, 30000, 3, 1, null,
					"Écran complet avec tactile."),
			new DemoProduct("CNX-USBC", "Connecteur de charge USB-C (pièce)", "Pièces détachées", 1000, 4000, 15, 5, null, null),
			new DemoProduct("BAT-SPARK", "Batterie Tecno Spark (pièce)", "Pièces détachées", 4000, 9000, 0, 2, null, null));

	private static final Logger log = LoggerFactory.getLogger(DemoService.class);

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final CategoryRepository categories;
	private final SupplierRepository suppliers;
	private final ProductService productService;
	private final CustomerRepository customers;
	private final SaleService saleService;
	private final RepairService repairService;
	private final TrainingService trainingService;
	private final OrderService orderService;
	private final QuoteService quoteService;
	private final ContactMessageRepository messages;

	public DemoService(UserRepository users, PasswordEncoder passwordEncoder, CategoryRepository categories,
			SupplierRepository suppliers, ProductService productService, CustomerRepository customers,
			SaleService saleService, RepairService repairService, TrainingService trainingService,
			OrderService orderService, QuoteService quoteService, ContactMessageRepository messages) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.categories = categories;
		this.suppliers = suppliers;
		this.productService = productService;
		this.customers = customers;
		this.saleService = saleService;
		this.repairService = repairService;
		this.trainingService = trainingService;
		this.orderService = orderService;
		this.quoteService = quoteService;
		this.messages = messages;
	}

	/** Charge la demonstration si elle n'existe pas encore ; renvoie false si elle etait deja la. */
	@Transactional
	public boolean seed(boolean withPhotos) {
		if (users.existsByEmailIgnoreCase(ACCOUNTS.get(0).email())) return false;

		Map<Role, User> staff = new HashMap<>();
		User client = null;
		String hash = passwordEncoder.encode(PASSWORD);
		for (DemoAccount account : ACCOUNTS) {
			User user = new User(account.email(), hash, account.firstName(), account.lastName(), "690000000", account.role());
			if (account.role() == Role.CLIENT) {
				user.setPhone("677112233");
				user.acceptTerms(com.milatech.common.Terms.VERSION);
				user.setCustomer(customers.save(new Customer(account.firstName() + " " + account.lastName(), "677112233",
						account.email(), null)));
				client = users.save(user);
			} else {
				staff.put(account.role(), users.save(user));
			}
		}
		User manager = staff.get(Role.GERANT);
		User seller = staff.get(Role.VENDEUR);
		User technician = staff.get(Role.TECHNICIEN);

		Map<String, Long> categoryIds = new HashMap<>();
		Long supplier = suppliers.save(new Supplier("Douala Phones Distribution", "699000001", null, "Akwa, Douala")).getId();
		Map<String, Long> products = new HashMap<>();
		RestClient http = RestClient.create();
		for (DemoProduct p : PRODUCTS) {
			Long categoryId = categoryIds.computeIfAbsent(p.category(), name -> categories.save(new Category(name)).getId());
			Product product = productService.create(new ProductRequest(p.reference(), p.name(), categoryId,
					p.category().equals("Téléphones") ? supplier : null, p.description(), p.cost(), p.price(), p.threshold(),
					p.stock(), true), manager);
			products.put(p.reference(), product.getId());
			if (withPhotos && p.photo() != null) addPhoto(http, product, p.photo());
		}

		Customer jeanPaul = customer("Jean-Paul Essomba", "677451289");
		Customer mireille = customer("Mireille Ngo Bassa", "699234567");
		Customer ibrahim = customer("Ibrahim Moussa", "655789012");
		Customer carine = customer("Carine Fotso", "690112233");
		Customer junior = customer("Junior Ndzana", "681445566");
		Customer brice = customer("Brice Atangana", "676987654");

		// Ventes des 7 derniers jours : jours, client, moyen de paiement, puis (reference, quantite)
		sale(6, null, Sale.PaymentMethod.ESPECES, seller, products, "CBL-USBC", 2, "CHG-25W", 1);
		sale(6, carine, Sale.PaymentMethod.MOBILE_MONEY, seller, products, "EAR-TWS", 1);
		sale(5, jeanPaul, Sale.PaymentMethod.MOBILE_MONEY, manager, products, "TEL-A15", 1, "CBL-USBC", 1);
		sale(5, null, Sale.PaymentMethod.ESPECES, seller, products, "PWB-20K", 1);
		sale(4, ibrahim, Sale.PaymentMethod.MOBILE_MONEY, seller, products, "SPK-BT20", 1);
		sale(3, null, Sale.PaymentMethod.ESPECES, seller, products, "CHG-25W", 2);
		sale(3, junior, Sale.PaymentMethod.ESPECES, manager, products, "ARD-UNO", 2);
		sale(2, mireille, Sale.PaymentMethod.MOBILE_MONEY, seller, products, "TEL-SPARK20", 1);
		sale(2, null, Sale.PaymentMethod.ESPECES, seller, products, "EAR-TWS", 2, "CBL-USBC", 2);
		sale(1, brice, Sale.PaymentMethod.MOBILE_MONEY, manager, products, "MTR-SMART", 1);
		sale(1, null, Sale.PaymentMethod.MOBILE_MONEY, seller, products, "CSQ-BT", 1);
		sale(0, null, Sale.PaymentMethod.ESPECES, seller, products, "CHG-25W", 1, "CBL-USBC", 1);
		sale(0, carine, Sale.PaymentMethod.MOBILE_MONEY, seller, products, "TEL-A15", 1);

		// Reparations a differentes etapes
		Repair screen = repairService.receive(new NewRepair(jeanPaul.getId(), Repair.DeviceType.TELEPHONE, "Samsung", "Galaxy A15",
				"R58T20XYZ", "Coque", Repair.Reception.BOUTIQUE, "Écran cassé après une chute, le tactile ne répond plus.", 35000L,
				LocalDate.now().plusDays(1), 10000L, Payment.Method.MOBILE_MONEY), seller);
		repairService.move(screen.getId(), RepairStatus.EN_DIAGNOSTIC, null, technician);
		repairService.update(screen.getId(), new RepairChanges("Écran LCD à remplacer, carte mère intacte.", 5000L, null, null, null));
		repairService.move(screen.getId(), RepairStatus.EN_REPARATION, null, technician);
		repairService.addPart(screen.getId(), products.get("ECR-A15"), 1, technician);
		repairService.move(screen.getId(), RepairStatus.REPARE, "Testé : écran et tactile OK.", technician);

		Repair laptop = repairService.receive(new NewRepair(mireille.getId(), Repair.DeviceType.ORDINATEUR, "HP", "ProBook 450",
				null, "Chargeur", Repair.Reception.BOUTIQUE, "Ne s'allume plus après une coupure de courant.", 40000L,
				LocalDate.now().plusDays(3), null, null), seller);
		repairService.move(laptop.getId(), RepairStatus.EN_DIAGNOSTIC, null, technician);

		repairService.receive(new NewRepair(ibrahim.getId(), Repair.DeviceType.BLUETOOTH, "JBL", "Flip 5", null, null,
				Repair.Reception.BOUTIQUE, "Ne charge plus.", null, null, null, null), seller);

		Repair connector = repairService.receive(new NewRepair(brice.getId(), Repair.DeviceType.TELEPHONE, "Tecno", "Camon 20",
				null, null, Repair.Reception.BOUTIQUE, "Le téléphone ne charge que si on tient le câble.", 8000L, null, null, null),
				seller);
		repairService.move(connector.getId(), RepairStatus.EN_DIAGNOSTIC, null, technician);
		repairService.update(connector.getId(), new RepairChanges("Connecteur de charge usé.", 4000L, null, null, null));
		repairService.move(connector.getId(), RepairStatus.EN_REPARATION, null, technician);
		repairService.addPart(connector.getId(), products.get("CNX-USBC"), 1, technician);
		repairService.move(connector.getId(), RepairStatus.REPARE, null, technician);
		repairService.pay(connector.getId(), 8000, Payment.Method.ESPECES, seller);
		repairService.move(connector.getId(), RepairStatus.RESTITUE, null, seller);

		// Formations : une session passee, une a venir
		Training arduino = trainingService.create(new TrainingRequest("Initiation à l'électronique et Arduino",
				"Bases de l'électronique, montages sur plaque d'essai et premiers programmes Arduino.",
				LocalDate.now().minusDays(40), LocalDate.now().minusDays(12), 50000L, 10), staff.get(Role.FORMATEUR));
		var done = trainingService.enroll(arduino.getId(), new EnrollmentRequest(junior.getId(), null, 50000L, Payment.Method.ESPECES), seller);
		trainingService.changeStatus(done.getId(), EnrollmentStatus.TERMINE);
		trainingService.enroll(arduino.getId(), new EnrollmentRequest(brice.getId(), null, 30000L, Payment.Method.MOBILE_MONEY), seller);
		Training phones = trainingService.create(new TrainingRequest("Réparation de smartphones — niveau 1",
				"Démontage, diagnostic, remplacement d'écran, de batterie et de connecteur de charge.",
				LocalDate.now().plusDays(10), LocalDate.now().plusDays(31), 75000L, 8), staff.get(Role.FORMATEUR));
		trainingService.enroll(phones.getId(), new EnrollmentRequest(junior.getId(), null, 25000L, Payment.Method.MOBILE_MONEY), seller);
		trainingService.enroll(phones.getId(), new EnrollmentRequest(carine.getId(), null, 75000L, Payment.Method.ESPECES), seller);
		trainingService.enroll(phones.getId(), new EnrollmentRequest(ibrahim.getId(), 60000L, 20000L, Payment.Method.MOBILE_MONEY), seller);

		// Le client de demonstration : une commande remise, une en attente, trois demandes de devis
		OnlineOrder pickedUp = orderService.place(new OrderRequest(DeliveryMode.RETRAIT, null, "677112233", null,
				List.of(new OrderLineRequest(products.get("PWB-20K"), 1)), true), client);
		orderService.move(pickedUp.getId(), OrderStatus.CONFIRMEE, null, null, seller);
		orderService.move(pickedUp.getId(), OrderStatus.PRETE, null, null, seller);
		orderService.move(pickedUp.getId(), OrderStatus.REMISE, Sale.PaymentMethod.ESPECES, null, seller);
		orderService.place(new OrderRequest(DeliveryMode.LIVRAISON, "Mvog-Ada, près du carrefour", "677112233",
				"Appelez-moi avant de venir.", List.of(new OrderLineRequest(products.get("EAR-TWS"), 1),
						new OrderLineRequest(products.get("CBL-USBC"), 2)), true), client);

		var tablet = quoteService.request(new QuoteForm(Repair.DeviceType.TABLETTE, "Samsung", "Galaxy Tab A8",
				"La batterie se vide en deux heures.", null), client);
		quoteService.quote(tablet.getId(), 15000, "Batterie à remplacer, réparée en 48 h.", technician);
		quoteService.answer(tablet.getId(), true, client);
		Repair tabletRepair = quoteService.deposit(tablet.getId(), new DepositForm(null, null, LocalDate.now().plusDays(2), 5000L,
				Payment.Method.MOBILE_MONEY), seller);
		repairService.move(tabletRepair.getId(), RepairStatus.EN_DIAGNOSTIC, null, technician);
		var headset = quoteService.request(new QuoteForm(Repair.DeviceType.BLUETOOTH, null, "Casque Bluetooth",
				"Le côté gauche ne fait plus de son.", null), client);
		quoteService.quote(headset.getId(), 6000, "Soudure à refaire sur l'écouteur gauche.", technician);
		quoteService.request(new QuoteForm(Repair.DeviceType.TELEPHONE, "Tecno", "Spark 10",
				"Écran fissuré dans le coin, l'affichage fonctionne encore.", null), client);

		messages.save(new ContactMessage("Patrice Owona", "698765432", null, "Formation",
				"Bonjour, quand commence la prochaine formation en réparation de téléphones ? Merci."));
		log.info("Démonstration chargée : {} produits, comptes « {} » (mot de passe {})", PRODUCTS.size(),
				ACCOUNTS.get(0).email(), PASSWORD);
		return true;
	}

	private Customer customer(String name, String phone) {
		return customers.save(new Customer(name, phone, null, null));
	}

	private void sale(int daysAgo, Customer customer, Sale.PaymentMethod method, User seller, Map<String, Long> products,
			Object... referenceAndQuantity) {
		List<StockLine> lines = new java.util.ArrayList<>();
		for (int i = 0; i < referenceAndQuantity.length; i += 2)
			lines.add(new StockLine(products.get((String) referenceAndQuantity[i]), (Integer) referenceAndQuantity[i + 1]));
		Sale sale = saleService.sell(customer == null ? null : customer.getId(), method, lines, seller);
		// Heure d'ouverture plausible, repartie sur les jours precedents
		sale.backdate(Instant.now().minus(Duration.ofDays(daysAgo)).minus(Duration.ofMinutes(37L * lines.size())));
	}

	/** Photo libre de droits (Unsplash) telechargee au format JPEG ; sans connexion, le produit reste sans photo. */
	private void addPhoto(RestClient http, Product product, String photoId) {
		try {
			byte[] bytes = http.get().uri("https://images.unsplash.com/photo-" + photoId + "?w=600&h=600&fit=crop&q=70&fm=jpg")
					.retrieve().body(byte[].class);
			if (bytes != null)
				productService.setImage(product.getId(), "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes));
		} catch (RuntimeException e) {
			log.warn("Photo de démonstration indisponible pour {} : {}", product.getName(), e.getMessage());
		}
	}
}
