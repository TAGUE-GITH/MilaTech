import { addToCart } from './cart'
import { actionLabel, clientStepLabel, deliveryFeeFor, orderTone, orderWhatsappMessage, readStoredCart } from './orders'

describe('commandes en ligne', () => {
  it('explique au client ou en est sa commande selon le retrait ou la livraison', () => {
    expect(clientStepLabel('EN_ATTENTE', 'RETRAIT')).toBe('En attente de confirmation')
    expect(clientStepLabel('PRETE', 'RETRAIT')).toBe('Prête : passez la récupérer')
    expect(clientStepLabel('PRETE', 'LIVRAISON')).toBe('En cours de livraison')
    expect(clientStepLabel('REMISE', 'LIVRAISON')).toBe('Livrée')
    expect(clientStepLabel('REMISE', 'RETRAIT')).toBe('Retirée')
  })

  it('nomme les boutons de la boutique selon le mode de remise', () => {
    expect(actionLabel('CONFIRMEE', 'RETRAIT')).toBe('Confirmer la commande')
    expect(actionLabel('PRETE', 'LIVRAISON')).toBe('Partie en livraison')
    expect(actionLabel('REMISE', 'RETRAIT')).toBe('Retirée et payée')
    expect(orderTone('ANNULEE')).toBe('slate')
    expect(orderTone('PRETE')).toBe('green')
  })

  it('ne facture la livraison que pour une livraison', () => {
    expect(deliveryFeeFor('RETRAIT', 1000)).toBe(0)
    expect(deliveryFeeFor('LIVRAISON', 1000)).toBe(1000)
  })

  it('prepare un message WhatsApp pour le client', () => {
    const message = orderWhatsappMessage({
      reference: 'CMD-2026-00007',
      customer: { id: 1, fullName: 'Awa Ngono', phone: '677112233' },
      status: 'PRETE',
      deliveryMode: 'RETRAIT',
      total: 106000,
    })
    expect(message).toContain('Bonjour Awa Ngono')
    expect(message).toContain('CMD-2026-00007')
    expect(message).toContain('passer la récupérer')
    expect(message).toContain('106 000 FCFA')
  })

  it('relit un panier enregistre, et ignore un contenu abime', () => {
    const cart = addToCart([], { productId: 3, name: 'Chargeur', unitPrice: 5000, available: 4 }, 2)
    expect(cart[0].quantity).toBe(2)
    expect(readStoredCart(JSON.stringify(cart))).toEqual(cart)
    expect(readStoredCart('{pas du json')).toEqual([])
    expect(readStoredCart(null)).toEqual([])
    expect(readStoredCart('[{"productId": "x"}]')).toEqual([])
  })
})
