import { screen } from '@testing-library/react'
import PrivacyPage from '../features/legal/PrivacyPage'
import TermsPage from '../features/legal/TermsPage'
import { renderPage } from './render'

describe('Textes juridiques', () => {
  it('presente les conditions generales avec un sommaire et la date de version', () => {
    renderPage(<TermsPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Conditions générales' })).toBeInTheDocument()
    expect(screen.getByText('Version du 14 octobre 2026')).toBeInTheDocument()
    for (const section of ['Commande en ligne', 'Devis et réparation', 'Formations'])
      expect(screen.getByRole('heading', { level: 2, name: new RegExp(section) })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'politique de confidentialité' })).toHaveAttribute('href', '/confidentialite')
  })

  it('explique la protection des donnees et les droits du client', () => {
    renderPage(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Politique de confidentialité' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Vos droits/ })).toBeInTheDocument()
    expect(screen.getByText(/ni cookie publicitaire ni outil de suivi/)).toBeInTheDocument()
  })
})
