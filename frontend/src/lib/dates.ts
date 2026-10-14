// Dates des filtres de periode (format attendu par l'API : AAAA-MM-JJ)

/** Date du jour (ou d'il y a n jours) au format AAAA-MM-JJ, a l'heure locale. */
export function isoDay(daysAgo = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
