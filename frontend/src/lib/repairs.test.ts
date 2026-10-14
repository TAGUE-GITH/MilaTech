import { customerMessage, statusTone } from './repairs'

const repair = {
  reference: 'REP-2026-00042',
  device: 'Samsung Galaxy A15',
  customer: { id: 1, fullName: 'Awa Ngono', phone: '677112233' },
  balance: 18000,
}

describe('reparations : message WhatsApp au client (US-19)', () => {
  it('annonce que l appareil est pret avec le reste a payer', () => {
    expect(customerMessage({ ...repair, status: 'REPARE' as const })).toBe(
      'Bonjour Awa Ngono, votre Samsung Galaxy A15 (réparation REP-2026-00042) est prêt. ' +
        'Reste à payer : 18 000 FCFA. Vous pouvez passer le récupérer à la boutique MilaTech avec votre bon de dépôt.',
    )
  })

  it('sans reste a payer, ne parle pas d argent', () => {
    expect(customerMessage({ ...repair, balance: 0, status: 'REPARE' as const })).not.toContain('Reste à payer')
  })

  it('previent quand l appareil ne peut pas etre repare', () => {
    expect(customerMessage({ ...repair, balance: 0, status: 'IRREPARABLE' as const })).toContain(
      'ne peut malheureusement pas être réparé',
    )
  })

  it('donne une couleur a chaque etape', () => {
    expect(statusTone('REPARE')).toBe('green')
    expect(statusTone('IRREPARABLE')).toBe('red')
    expect(statusTone('EN_REPARATION')).toBe('brand')
  })
})
