package com.milatech.stock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.milatech.catalog.Category;
import com.milatech.catalog.Product;
import com.milatech.catalog.ProductRepository;
import com.milatech.common.ApiException;
import com.milatech.user.Role;
import com.milatech.user.User;

/** Regles R1 et R2 du stock, testees sans base de donnees (Mockito). */
@ExtendWith(MockitoExtension.class)
class StockServiceTest {

	@Mock
	private ProductRepository products;

	@Mock
	private StockMovementRepository movements;

	@InjectMocks
	private StockService stock;

	private final User author = new User("gerant@milatech.test", "hash", "Mila", "Tech", null, Role.GERANT);
	private Product resistor;

	@BeforeEach
	void setUp() {
		resistor = new Product("RES-10K", "Résistance 10 kΩ", new Category("Composants"), 1500, 3000, 3);
		resistor.setId(7L);
	}

	@Test
	void aPurchaseAddsTheQuantityAndRecordsAMovement() {
		when(products.findByIdForUpdate(7L)).thenReturn(Optional.of(resistor));

		stock.purchase(7L, 10, 2000, null, "Facture 1245", author);

		assertThat(resistor.getQuantity()).isEqualTo(10);
		assertThat(resistor.getPurchasePrice()).isEqualTo(2000);
		ArgumentCaptor<StockMovement> saved = ArgumentCaptor.forClass(StockMovement.class);
		verify(movements).save(saved.capture());
		assertThat(saved.getValue().getType()).isEqualTo(MovementType.ACHAT);
		assertThat(saved.getValue().getQuantity()).isEqualTo(10);
		assertThat(saved.getValue().getQuantityAfter()).isEqualTo(10);
		assertThat(saved.getValue().getAuthor()).isSameAs(author);
	}

	@Test
	void anExitBiggerThanTheStockIsRefusedWithoutAnyChange() {
		resistor.addQuantity(2);
		when(products.findAllByIdForUpdate(List.of(7L))).thenReturn(List.of(resistor));

		assertThatThrownBy(() -> stock.remove(List.of(new StockLine(7L, 3)), MovementType.VENTE, "VTE-2026-00001", author))
				.isInstanceOf(ApiException.class)
				.hasMessage("Stock insuffisant : Résistance 10 kΩ (reste 2).");

		assertThat(resistor.getQuantity()).isEqualTo(2);
		verify(movements, never()).save(any());
	}

	@Test
	void anExitRemovesTheQuantityAndRecordsANegativeMovement() {
		resistor.addQuantity(5);
		when(products.findAllByIdForUpdate(List.of(7L))).thenReturn(List.of(resistor));

		stock.remove(List.of(new StockLine(7L, 2)), MovementType.VENTE, "VTE-2026-00001", author);

		assertThat(resistor.getQuantity()).isEqualTo(3);
		ArgumentCaptor<StockMovement> saved = ArgumentCaptor.forClass(StockMovement.class);
		verify(movements).save(saved.capture());
		assertThat(saved.getValue().getQuantity()).isEqualTo(-2);
		assertThat(saved.getValue().getReason()).isEqualTo("VTE-2026-00001");
	}

	@Test
	void aCorrectionToTheSameQuantityIsRefused() {
		resistor.addQuantity(5);
		when(products.findByIdForUpdate(7L)).thenReturn(Optional.of(resistor));

		assertThatThrownBy(() -> stock.adjust(7L, 5, "comptage", author))
				.isInstanceOf(ApiException.class)
				.hasMessage("La quantité en stock est déjà de 5.");
	}
}
