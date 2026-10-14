import { HOURS, openingStatus } from './hours'

// Heures exprimees a Yaounde (UTC+1, sans heure d'ete) : 08:00 a Yaounde = 07:00 UTC
const at = (iso: string) => new Date(iso)

describe('horaires de la boutique', () => {
  it('liste les horaires de la semaine', () => {
    expect(HOURS.map((line) => `${line.days} : ${line.hours}`)).toEqual(['Lundi – samedi : 8 h – 19 h', 'Dimanche : 11 h – 17 h'])
  })

  it('dit si la boutique est ouverte, selon l heure de Yaounde', () => {
    // Mercredi 14 octobre 2026
    expect(openingStatus(at('2026-10-14T09:30:00Z'))).toEqual({ open: true, label: 'Ouvert · ferme à 19 h' })
    expect(openingStatus(at('2026-10-14T06:30:00Z'))).toEqual({ open: false, label: 'Fermé · ouvre à 8 h' })
    expect(openingStatus(at('2026-10-14T18:00:00Z'))).toEqual({ open: false, label: 'Fermé · ouvre demain à 8 h' })
  })

  it('applique les horaires du dimanche', () => {
    // Samedi 17 octobre 2026 a 20 h : le lendemain est un dimanche
    expect(openingStatus(at('2026-10-17T19:00:00Z'))).toEqual({ open: false, label: 'Fermé · ouvre demain à 11 h' })
    // Dimanche 18 octobre 2026
    expect(openingStatus(at('2026-10-18T09:00:00Z'))).toEqual({ open: false, label: 'Fermé · ouvre à 11 h' })
    expect(openingStatus(at('2026-10-18T15:59:00Z'))).toEqual({ open: true, label: 'Ouvert · ferme à 17 h' })
  })
})
