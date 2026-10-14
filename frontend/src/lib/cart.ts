// Panier de la caisse : fonctions pures (testees seules), le serveur reverifie le stock et les prix

export type CartLine = {
  productId: number
  name: string
  reference: string
  unitPrice: number
  /** Stock disponible au moment de l'ajout */
  available: number
  quantity: number
}

export type CartProduct = Omit<CartLine, 'quantity'>

const clamp = (quantity: number, available: number) => Math.max(0, Math.min(quantity, available))

/** Ajoute une piece (ou une ligne) sans jamais depasser le stock disponible. */
export function addToCart(cart: CartLine[], product: CartProduct): CartLine[] {
  const existing = cart.find((line) => line.productId === product.productId)
  if (!existing) return product.available > 0 ? [...cart, { ...product, quantity: 1 }] : cart
  return setQuantity(cart, product.productId, existing.quantity + 1)
}

/** Change la quantite d'une ligne ; a zero, la ligne disparait. */
export function setQuantity(cart: CartLine[], productId: number, quantity: number): CartLine[] {
  return cart
    .map((line) => (line.productId === productId ? { ...line, quantity: clamp(quantity, line.available) } : line))
    .filter((line) => line.quantity > 0)
}

export const cartTotal = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)

export const cartCount = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.quantity, 0)
