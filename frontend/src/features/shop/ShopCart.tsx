import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { addToCart, cartCount, cartTotal, setQuantity } from '../../lib/cart'
import type { CartLine, CartProduct } from '../../lib/cart'
import { readStoredCart } from '../../lib/orders'

const STORAGE_KEY = 'milatech_cart'

type ShopCartValue = {
  lines: CartLine[]
  count: number
  total: number
  add: (product: CartProduct, quantity?: number) => void
  setLineQuantity: (productId: number, quantity: number) => void
  clear: () => void
}

const ShopCartContext = createContext<ShopCartValue | null>(null)

/** Le stockage du navigateur peut etre bloque (navigation privee) : le panier marche alors sans etre garde. */
function load(): CartLine[] {
  try {
    return readStoredCart(localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

/** Panier de la boutique en ligne, garde dans le navigateur pour ne pas le perdre en changeant de page. */
export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Stockage indisponible : le panier reste en memoire
    }
  }, [lines])

  const add = useCallback((product: CartProduct, quantity = 1) => setLines((current) => addToCart(current, product, quantity)), [])
  const setLineQuantity = useCallback(
    (productId: number, quantity: number) => setLines((current) => setQuantity(current, productId, quantity)),
    [],
  )
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo(
    () => ({ lines, count: cartCount(lines), total: cartTotal(lines), add, setLineQuantity, clear }),
    [lines, add, setLineQuantity, clear],
  )
  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShopCart(): ShopCartValue {
  const value = useContext(ShopCartContext)
  if (!value) throw new Error('useShopCart doit etre utilise dans ShopCartProvider')
  return value
}
