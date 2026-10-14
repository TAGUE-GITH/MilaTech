import { clientQuoteLabel, quoteTone, quoteWhatsappMessage } from './quotes'

describe('demandes de devis', () => {
  it('dit au client ce qu il doit faire a chaque etape', () => {
    expect(clientQuoteLabel('NOUVELLE')).toBe('En attente du devis')
    expect(clientQuoteLabel('DEVIS_ENVOYE')).toBe('Devis reçu : à accepter')
    expect(clientQuoteLabel('ACCEPTEE')).toBe('Accepté : apportez l’appareil')
    expect(clientQuoteLabel('DEPOSEE')).toBe('Appareil déposé')
  })

  it('met en avant ce qui demande une action', () => {
    expect(quoteTone('NOUVELLE')).toBe('amber')
    expect(quoteTone('DEVIS_ENVOYE')).toBe('brand')
    expect(quoteTone('ACCEPTEE')).toBe('green')
    expect(quoteTone('REFUSEE')).toBe('slate')
  })

  it('prepare le message WhatsApp qui annonce le prix au client', () => {
    const message = quoteWhatsappMessage({
      reference: 'DEV-2026-00003',
      device: 'Tecno Spark 10',
      customer: { id: 1, fullName: 'Awa Ngono', phone: '677112233' },
      quotedPrice: 15000,
    })
    expect(message).toContain('Bonjour Awa Ngono')
    expect(message).toContain('Tecno Spark 10')
    expect(message).toContain('DEV-2026-00003')
    expect(message).toContain('15 000 FCFA')
    expect(message).toContain('Mon espace')
  })
})
