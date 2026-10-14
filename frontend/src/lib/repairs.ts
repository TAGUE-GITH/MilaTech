import type { Repair, RepairStatus } from '../api/types'
import { formatFcfa } from './format'

type Tone = 'slate' | 'red' | 'amber' | 'green' | 'brand'

/** Couleur du badge de chaque etape : vert quand c'est pret, rouge quand ce n'est pas reparable. */
export function statusTone(status: RepairStatus): Tone {
  const tones: Record<RepairStatus, Tone> = {
    RECU: 'amber',
    EN_DIAGNOSTIC: 'brand',
    EN_REPARATION: 'brand',
    REPARE: 'green',
    IRREPARABLE: 'red',
    ANNULE: 'slate',
    RESTITUE: 'slate',
  }
  return tones[status]
}

/** Etapes en cours (l'appareil est encore a la boutique). */
export const OPEN_STATUSES: RepairStatus[] = ['RECU', 'EN_DIAGNOSTIC', 'EN_REPARATION', 'REPARE', 'IRREPARABLE', 'ANNULE']

/** US-19 : message WhatsApp prerempli pour prevenir le client. */
export function customerMessage(repair: Pick<Repair, 'reference' | 'device' | 'customer' | 'balance' | 'status'>): string {
  const hello = `Bonjour ${repair.customer.fullName}, votre ${repair.device} (réparation ${repair.reference})`
  const pickup = 'Vous pouvez passer le récupérer à la boutique MilaTech avec votre bon de dépôt.'
  const due = repair.balance > 0 ? `Reste à payer : ${formatFcfa(repair.balance).replace(/ /g, ' ')}. ` : ''
  if (repair.status === 'IRREPARABLE')
    return `${hello} ne peut malheureusement pas être réparé. ${due}${pickup}`
  if (repair.status === 'REPARE') return `${hello} est prêt. ${due}${pickup}`
  return `${hello} : `
}
