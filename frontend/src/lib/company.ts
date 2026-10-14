// Informations publiques de MilaTech, affichees sur le site (accueil, contact, pied de page)
export const COMPANY = {
  name: 'MilaTech',
  tagline: 'Vente · Réparation · Formation',
  city: 'Yaoundé',
  district: 'Bonas',
  directions: 'À la descente du carrefour dit « Condom », à environ 200 m, juste à côté de Sergy Coiffure',
  phones: ['698984979', '673366208'],
  /** Numero utilise pour les boutons WhatsApp (a confirmer avec le gerant) */
  whatsapp: '698984979',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bonas%2C+Yaound%C3%A9%2C+Cameroun',
} as const

/** « 698984979 » devient « 698 98 49 79 » pour l'affichage. */
export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 9 ? digits.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') : phone
}
