import { isoDay } from './dates'

describe('isoDay', () => {
  it('donne la date du jour, ou d il y a quelques jours, au format AAAA-MM-JJ', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 3, 10))
    expect(isoDay()).toBe('2026-01-03')
    expect(isoDay(6)).toBe('2025-12-28')
    vi.useRealTimers()
  })
})
