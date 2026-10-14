// Lien WhatsApp avec un message prerempli : wa.me/<numero international>?text=...
// Un numero camerounais a 9 chiffres (6XX XX XX XX) recoit l'indicatif 237.
export function internationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '')
  return digits.length === 9 ? `237${digits}` : digits
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${internationalPhone(phone)}?text=${encodeURIComponent(message)}`
}
