import type { Quote, QuoteStatus } from '../api/types'
import { formatFcfa } from './format'

type Tone = 'slate' | 'red' | 'amber' | 'green' | 'brand'

/** Ou en est la demande, dit avec les mots du client (ce qu'il doit faire ensuite). */
export function clientQuoteLabel(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    NOUVELLE: 'En attente du devis',
    DEVIS_ENVOYE: 'Devis reçu : à accepter',
    ACCEPTEE: 'Accepté : apportez l’appareil',
    REFUSEE: 'Devis refusé',
    ANNULEE: 'Demande annulée',
    DEPOSEE: 'Appareil déposé',
  }
  return labels[status]
}

export function quoteTone(status: QuoteStatus): Tone {
  const tones: Record<QuoteStatus, Tone> = {
    NOUVELLE: 'amber',
    DEVIS_ENVOYE: 'brand',
    ACCEPTEE: 'green',
    REFUSEE: 'slate',
    ANNULEE: 'slate',
    DEPOSEE: 'slate',
  }
  return tones[status]
}

/** Message WhatsApp pour prevenir le client que son devis est pret dans son espace. */
export function quoteWhatsappMessage(quote: Pick<Quote, 'reference' | 'device' | 'customer' | 'quotedPrice'>): string {
  const price = quote.quotedPrice ? formatFcfa(quote.quotedPrice).replace(/[  ]/g, ' ') : ''
  return (
    `Bonjour ${quote.customer.fullName}, le devis pour votre ${quote.device} (demande ${quote.reference}) est prêt : ${price}. ` +
    'Vous pouvez l’accepter dans « Mon espace » sur le site MilaTech, puis apporter l’appareil à la boutique.'
  )
}
