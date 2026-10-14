import { addToCart, cartCount, cartTotal, setQuantity } from './cart'
import type { CartLine } from './cart'

const charger = { productId: 1, name: 'Chargeur USB-C', reference: 'CHG-USBC', unitPrice: 5000, available: 3 }
const earbuds = { productId: 2, name: 'Écouteurs', reference: 'BT-EAR', unitPrice: 15000, available: 1 }

describe('panier de la caisse', () => {
  it('ajoute un produit, puis augmente sa quantite s il est deja dans le panier', () => {
    let cart: CartLine[] = []
    cart = addToCart(cart, charger)
    cart = addToCart(cart, earbuds)
    cart = addToCart(cart, charger)

    expect(cart.map((line) => [line.name, line.quantity])).toEqual([
      ['Chargeur USB-C', 2],
      ['Écouteurs', 1],
    ])
    expect(cartTotal(cart)).toBe(25000)
    expect(cartCount(cart)).toBe(3)
  })

  it('ne depasse jamais le stock disponible (R1)', () => {
    let cart = addToCart([], earbuds)
    cart = addToCart(cart, earbuds)
    expect(cart[0].quantity).toBe(1)

    cart = setQuantity(addToCart([], charger), 1, 10)
    expect(cart[0].quantity).toBe(3)
  })

  it('retire la ligne quand la quantite tombe a zero', () => {
    const cart = setQuantity(addToCart([], charger), 1, 0)
    expect(cart).toEqual([])
  })
})
