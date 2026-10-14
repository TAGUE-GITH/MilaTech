import type { DeliveryMode, Order, OrderStatus } from '../api/types'
import type { CartLine } from './cart'
import { formatFcfa } from './format'

type Tone = 'slate' | 'red' | 'amber' | 'green' | 'brand'

/** Ou en est la commande, dit avec les mots du client (retrait en boutique ou livraison). */
export function clientStepLabel(status: OrderStatus, mode: DeliveryMode): string {
  const pickup = mode === 'RETRAIT'
  const labels: Record<OrderStatus, string> = {
    EN_ATTENTE: 'En attente de confirmation',
    CONFIRMEE: 'Confirmée, en préparation',
    PRETE: pickup ? 'Prête : passez la récupérer' : 'En cours de livraison',
    REMISE: pickup ? 'Retirée' : 'Livrée',
    ANNULEE: 'Annulée',
  }
  return labels[status]
}

/** Texte du bouton de la boutique pour passer a l'etape suivante. */
export function actionLabel(next: OrderStatus, mode: DeliveryMode): string {
  const pickup = mode === 'RETRAIT'
  const labels: Record<OrderStatus, string> = {
    EN_ATTENTE: 'En attente',
    CONFIRMEE: 'Confirmer la commande',
    PRETE: pickup ? 'Prête au retrait' : 'Partie en livraison',
    REMISE: pickup ? 'Retirée et payée' : 'Livrée et payée',
    ANNULEE: 'Annuler la commande',
  }
  return labels[next]
}

export function orderTone(status: OrderStatus): Tone {
  const tones: Record<OrderStatus, Tone> = {
    EN_ATTENTE: 'amber',
    CONFIRMEE: 'brand',
    PRETE: 'green',
    REMISE: 'slate',
    ANNULEE: 'slate',
  }
  return tones[status]
}

export const deliveryFeeFor = (mode: DeliveryMode, fee: number) => (mode === 'LIVRAISON' ? fee : 0)

/** Message WhatsApp prerempli pour tenir le client au courant de sa commande. */
export function orderWhatsappMessage(order: Pick<Order, 'reference' | 'customer' | 'status' | 'deliveryMode' | 'total'>): string {
  const hello = `Bonjour ${order.customer.fullName}, votre commande ${order.reference} chez MilaTech`
  const amount = `Montant à payer : ${formatFcfa(order.total).replace(/[  ]/g, ' ')}.`
  if (order.status === 'CONFIRMEE') return `${hello} est confirmée, nous la préparons. ${amount}`
  if (order.status === 'PRETE')
    return order.deliveryMode === 'RETRAIT'
      ? `${hello} est prête. Vous pouvez passer la récupérer à la boutique. ${amount}`
      : `${hello} est en route, le livreur va vous appeler. ${amount}`
  return `${hello} : `
}

/** Panier garde dans le navigateur : un contenu abime ou ancien est simplement ignore. */
export function readStoredCart(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    const valid = value.every(
      (line) =>
        typeof line?.productId === 'number' &&
        typeof line?.name === 'string' &&
        typeof line?.unitPrice === 'number' &&
        typeof line?.available === 'number' &&
        typeof line?.quantity === 'number',
    )
    return valid ? (value as CartLine[]) : []
  } catch {
    return []
  }
}
