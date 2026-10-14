// Montants en francs CFA, sans centimes (regle R11) : « 3 000 FCFA »
export function formatFcfa(amount: number | string): string {
  const value = Math.round(Number(amount) || 0)
  return `${new Intl.NumberFormat('fr-FR').format(value).replace(/\s/g, ' ')} FCFA`
}

// Date courte en francais : « 14 oct. 2026 »
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
