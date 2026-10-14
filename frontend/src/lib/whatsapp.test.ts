import { internationalPhone, whatsappLink } from './whatsapp'

describe('lien WhatsApp', () => {
  it('ajoute l indicatif du Cameroun aux numeros a 9 chiffres', () => {
    expect(internationalPhone('677 11 22 33')).toBe('237677112233')
    expect(internationalPhone('+237 677112233')).toBe('237677112233')
    expect(internationalPhone('00241 07 12 34 56')).toBe('24107123456')
  })

  it('prepare le message', () => {
    expect(whatsappLink('677112233', 'Bonjour Awa, votre téléphone est prêt'))
      .toBe('https://wa.me/237677112233?text=Bonjour%20Awa%2C%20votre%20t%C3%A9l%C3%A9phone%20est%20pr%C3%AAt')
  })
})
