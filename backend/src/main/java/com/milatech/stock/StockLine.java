package com.milatech.stock;

/** Une ligne a retirer du stock : produit et quantite (vente, piece de reparation). */
public record StockLine(Long productId, int quantity) {
}
