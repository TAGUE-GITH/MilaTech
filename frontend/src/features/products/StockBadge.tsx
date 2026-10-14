import type { Product } from '../../api/types'
import { Badge } from '../../components/ui'

/** Quantite en stock : rouge si epuise, orange au seuil d'alerte ou en dessous, vert sinon. */
export function StockBadge({ product }: { product: Pick<Product, 'quantity' | 'lowStock'> }) {
  if (product.quantity === 0) return <Badge tone="red">Épuisé</Badge>
  return <Badge tone={product.lowStock ? 'amber' : 'green'}>{product.quantity} en stock</Badge>
}
