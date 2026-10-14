import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { myQuotesApi, quotesApi } from '../api/client'
import type { ClientRepair, Quote } from '../api/types'
import ClientQuotePage from '../features/quotes/ClientQuotePage'
import ClientRepairPage from '../features/quotes/ClientRepairPage'
import NewQuotePage from '../features/quotes/NewQuotePage'
import QuoteDetailPage from '../features/quotes/QuoteDetailPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  myQuotesApi: { request: vi.fn(), list: vi.fn(), get: vi.fn(), accept: vi.fn(), refuse: vi.fn(), cancel: vi.fn(), repairs: vi.fn(), repair: vi.fn() },
  quotesApi: { list: vi.fn(), get: vi.fn(), answer: vi.fn(), deposit: vi.fn() },
}))

const quote: Quote = {
  id: 3,
  reference: 'DEV-2026-00003',
  status: 'NOUVELLE',
  statusLabel: 'Nouvelle',
  deviceType: 'TELEPHONE',
  brand: 'Tecno',
  model: 'Spark 10',
  device: 'Tecno Spark 10',
  issue: 'Écran cassé',
  customer: { id: 9, fullName: 'Awa Ngono', phone: '677112233' },
  createdAt: '2026-10-14T10:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('Devis en ligne cote client', () => {
  it('envoie une demande de devis et ouvre son suivi', async () => {
    vi.mocked(myQuotesApi.request).mockResolvedValue(quote)
    renderPage(<NewQuotePage />, { path: '/mon-espace/devis/nouveau', route: '/mon-espace/devis/nouveau' })

    await userEvent.selectOptions(screen.getByLabelText('Type d’appareil'), 'TELEPHONE')
    await userEvent.type(screen.getByLabelText('Marque'), 'Tecno')
    await userEvent.type(screen.getByLabelText('Modèle'), 'Spark 10')
    await userEvent.type(screen.getByLabelText('La panne'), 'Écran cassé')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer ma demande' }))

    expect(myQuotesApi.request).toHaveBeenCalledWith({ deviceType: 'TELEPHONE', brand: 'Tecno', model: 'Spark 10', issue: 'Écran cassé', photo: '' })
    expect(await screen.findByText('Autre page')).toBeInTheDocument()
  })

  it('montre le prix propose et permet de l accepter', async () => {
    const quoted: Quote = { ...quote, status: 'DEVIS_ENVOYE', statusLabel: 'Devis envoyé', quotedPrice: 15000, quoteMessage: 'Écran d’origine.' }
    vi.mocked(myQuotesApi.get).mockResolvedValue(quoted)
    vi.mocked(myQuotesApi.accept).mockResolvedValue({ ...quoted, status: 'ACCEPTEE', statusLabel: 'Acceptée' })
    renderPage(<ClientQuotePage />, { path: '/mon-espace/devis/:id', route: '/mon-espace/devis/3' })

    expect(await screen.findByText('15 000 FCFA')).toBeInTheDocument()
    expect(screen.getByText('Écran d’origine.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Accepter le devis' }))

    expect(myQuotesApi.accept).toHaveBeenCalledWith(3)
    expect(await screen.findByText(/Devis accepté. Apportez votre appareil/)).toBeInTheDocument()
  })

  it('suit la reparation sans les notes internes', async () => {
    const repair: ClientRepair = {
      id: 8,
      reference: 'REP-2026-00008',
      device: 'HP ProBook',
      deviceType: 'ORDINATEUR',
      status: 'REPARE',
      statusLabel: 'Réparé',
      total: 30000,
      balance: 10000,
      paid: 20000,
      laborCost: 10000,
      promisedOn: null,
      receivedAt: '2026-10-10T09:00:00Z',
      reportedIssue: 'Ne s’allume plus',
      diagnosis: 'Carte d’alimentation',
      parts: [{ productName: 'Connecteur de charge', quantity: 1, lineTotal: 20000 }],
      steps: [
        { status: 'RECU', label: 'Reçu', at: '2026-10-10T09:00:00Z' },
        { status: 'REPARE', label: 'Réparé', at: '2026-10-12T15:00:00Z' },
      ],
    }
    vi.mocked(myQuotesApi.repair).mockResolvedValue(repair)
    renderPage(<ClientRepairPage />, { path: '/mon-espace/reparations/:id', route: '/mon-espace/reparations/8' })

    expect(await screen.findByText(/Votre appareil vous attend à la boutique. Reste à payer : 10 000 FCFA/)).toBeInTheDocument()
    expect(screen.getByText('Carte d’alimentation')).toBeInTheDocument()
    expect(screen.getByText('Connecteur de charge × 1')).toBeInTheDocument()
  })
})

describe('Devis en ligne cote boutique', () => {
  it('envoie un prix au client', async () => {
    vi.mocked(quotesApi.get).mockResolvedValue(quote)
    vi.mocked(quotesApi.answer).mockResolvedValue({ ...quote, status: 'DEVIS_ENVOYE', statusLabel: 'Devis envoyé', quotedPrice: 15000 })
    renderPage(<QuoteDetailPage />, { path: '/devis/:id', route: '/devis/3' })

    await userEvent.type(await screen.findByLabelText('Prix estimé (FCFA)'), '15000')
    await userEvent.type(screen.getByLabelText('Explication pour le client'), 'Réparé en 24 h')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le devis' }))

    expect(quotesApi.answer).toHaveBeenCalledWith(3, 15000, 'Réparé en 24 h')
    expect(await screen.findByText(/Devis envoyé : le client le voit dans son espace/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toContain('15%20000%20FCFA')
  })

  it('ouvre la reparation quand le client apporte l appareil', async () => {
    vi.mocked(quotesApi.get).mockResolvedValue({ ...quote, status: 'ACCEPTEE', statusLabel: 'Acceptée', quotedPrice: 15000 })
    vi.mocked(quotesApi.deposit).mockResolvedValue({ id: 12 } as never)
    renderPage(<QuoteDetailPage />, { path: '/devis/:id', route: '/devis/3' })

    await userEvent.type(await screen.findByLabelText('Acompte (FCFA)'), '5000')
    await userEvent.selectOptions(screen.getByLabelText('Acompte payé par'), 'MOBILE_MONEY')
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir la réparation' }))

    expect(quotesApi.deposit).toHaveBeenCalledWith(3, { serialNumber: '', accessories: '', promisedOn: '', deposit: 5000, depositMethod: 'MOBILE_MONEY' })
    expect(await screen.findByText('Autre page')).toBeInTheDocument()
  })
})
