import { formatDate, formatFcfa } from './format'

describe('formatFcfa', () => {
  it('affiche les francs CFA sans centimes, avec des espaces entre les milliers', () => {
    expect(formatFcfa(3000)).toBe('3 000 FCFA')
    expect(formatFcfa('1250000')).toBe('1 250 000 FCFA')
    expect(formatFcfa(2999.6)).toBe('3 000 FCFA')
  })

  it('affiche 0 FCFA pour une valeur absente', () => {
    expect(formatFcfa('')).toBe('0 FCFA')
  })
})

describe('formatDate', () => {
  it('affiche une date courte en francais', () => {
    expect(formatDate('2026-10-14T10:00:00')).toBe('14 oct. 2026')
  })
})
