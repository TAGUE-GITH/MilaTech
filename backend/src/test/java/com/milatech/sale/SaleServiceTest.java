package com.milatech.sale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.milatech.catalog.Category;
import com.milatech.catalog.Product;
import com.milatech.common.ApiException;
import com.milatech.customer.CustomerRepository;
import com.milatech.stock.MovementType;
import com.milatech.stock.StockLine;
import com.milatech.stock.StockService;
import com.milatech.user.Role;
import com.milatech.user.User;

/** Regles d'une vente (R1, R4, R5), testees sans base de donnees grace a Mockito. */
@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

	@Mock
	private SaleRepository sales;

	@Mock
	private CustomerRepository customers;

	@Mock
	private StockService stock;

	@InjectMocks
	private SaleService service;

	private final User seller = new User("awa@milatech.test", "hash", "Awa", "Ngono", null, Role.VENDEUR);
	private Product charger;
	private final List<StockLine> lines = List.of(new StockLine(7L, 2));

	@BeforeEach
	void setUp() {
		charger = new Product("CHG-USBC", "Chargeur USB-C", new Category("Accessoires"), 2500, 5000, 1);
		charger.setId(7L);
	}

	@Test
	void theSaleFreezesPricesComputesTheMarginAndRemovesTheStock() {
		when(stock.lockAvailable(lines)).thenReturn(List.of(charger));
		when(sales.save(any(Sale.class))).thenAnswer(call -> call.getArgument(0));

		Sale sale = service.sell(null, Sale.PaymentMethod.ESPECES, lines, seller);

		assertThat(sale.getTotal()).isEqualTo(10_000);
		assertThat(sale.getMargin()).isEqualTo(5_000);
		assertThat(sale.getLines()).singleElement().satisfies(line -> {
			assertThat(line.getUnitPrice()).isEqualTo(5000);
			assertThat(line.getUnitCost()).isEqualTo(2500);
		});
		verify(stock).remove(eq(lines), eq(MovementType.VENTE), any(), eq(seller));
	}

	@Test
	void anInactiveProductIsRefusedBeforeAnythingIsSaved() {
		charger.setActive(false);
		when(stock.lockAvailable(lines)).thenReturn(List.of(charger));

		assertThatThrownBy(() -> service.sell(null, Sale.PaymentMethod.ESPECES, lines, seller))
				.isInstanceOf(ApiException.class)
				.hasMessage("« Chargeur USB-C » n'est plus en vente.");
		verify(sales, never()).save(any());
		verify(stock, never()).remove(any(), any(), any(), any());
	}
}
