// Photos de la vitrine. Ce sont des photos libres de droits (licence Unsplash : usage commercial gratuit,
// sans attribution obligatoire), servies par le CDN d'Unsplash a la taille demandee.
// A remplacer par de vraies photos de la boutique MilaTech des qu'elles seront disponibles :
// il suffit de changer les entrees ci-dessous (une adresse d'image complete fonctionne aussi).

export type Photo = { id: string; alt: string }

export const PHOTOS = {
  hero: { id: 'photo-1550041473-d296a3a8a18a', alt: 'Mains d’un technicien réparant la carte électronique d’un téléphone' },
  sale: { id: 'photo-1785741612674-965f99d5c38f', alt: 'Téléphones de toutes les couleurs exposés sur un mur en bois' },
  repair: { id: 'photo-1639776739297-f7e1f21526f4', alt: 'Technicien ganté remplaçant une pièce dans un smartphone ouvert' },
  training: { id: 'photo-1531482615713-2afd69097998', alt: 'Une apprenante et son formateur travaillant ensemble sur un ordinateur' },
  workshop: { id: 'photo-1745571479662-54a2ad1c747f', alt: 'Apprenant réalisant un montage électronique sur une plaque d’essai' },
  parts: { id: 'photo-1555664424-778a1e5e1b48', alt: 'Composants électroniques et carte de circuit imprimé vus de dessus' },
  multimeter: { id: 'photo-1565608438257-fac3c27beb36', alt: 'Mesure au multimètre sur un circuit électronique' },
  opened: { id: 'photo-1653548147626-d3ca2bd24cb6', alt: 'Téléphone démonté, pièces rangées pour la réparation' },
  disassembly: { id: 'photo-1746005718007-2cc042848478', alt: 'Smartphone en cours de démontage sur un tapis de réparation' },
  customer: { id: 'photo-1573496782432-8690d8148c46', alt: 'Cliente souriante utilisant son smartphone' },
} satisfies Record<string, Photo>

/** Adresse de la photo recadree a la taille voulue, compressee et au format le plus leger pour le navigateur. */
export function photoUrl(photo: Photo, width: number, height?: number): string {
  if (photo.id.startsWith('http')) return photo.id
  const params = new URLSearchParams({ w: String(width), ...(height ? { h: String(height) } : {}), fit: 'crop', auto: 'format', q: '70' })
  return `https://images.unsplash.com/${photo.id}?${params}`
}

/** Plusieurs largeurs : le navigateur choisit selon l'ecran (petite image sur un telephone). */
export function photoSrcSet(photo: Photo, widths: number[], ratio: number): string {
  return widths.map((width) => `${photoUrl(photo, width, Math.round(width / ratio))} ${width}w`).join(', ')
}
