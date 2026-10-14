import { PHOTOS, photoSrcSet, photoUrl } from './photos'

describe('photos du site', () => {
  it('demande a Unsplash une image legere a la bonne taille', () => {
    const url = new URL(photoUrl(PHOTOS.hero, 1200, 800))
    expect(url.origin).toBe('https://images.unsplash.com')
    expect(url.searchParams.get('w')).toBe('1200')
    expect(url.searchParams.get('h')).toBe('800')
    expect(url.searchParams.get('fit')).toBe('crop')
    expect(url.searchParams.get('auto')).toBe('format')
  })

  it('propose plusieurs tailles : le telephone charge la plus petite', () => {
    const srcSet = photoSrcSet(PHOTOS.repair, [480, 960], 3 / 2)
    expect(srcSet.split(', ')).toHaveLength(2)
    expect(srcSet).toContain('w=480&h=320')
    expect(srcSet).toMatch(/ 960w$/)
  })

  it('decrit chaque photo pour les lecteurs d ecran', () => {
    for (const photo of Object.values(PHOTOS)) expect(photo.alt.length).toBeGreaterThan(10)
  })
})
