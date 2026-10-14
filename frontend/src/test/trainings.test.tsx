import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { customersApi, dashboardApi, trainingsApi } from '../api/client'
import type { Dashboard, Training } from '../api/types'
import DashboardPage from '../features/dashboard/DashboardPage'
import TrainingDetailPage from '../features/trainings/TrainingDetailPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  trainingsApi: { get: vi.fn(), enroll: vi.fn(), pay: vi.fn(), setStatus: vi.fn() },
  customersApi: { search: vi.fn(), save: vi.fn() },
  dashboardApi: { get: vi.fn() },
}))

const training = (overrides: Partial<Training> = {}): Training => ({
  id: 3,
  title: 'Réparation de téléphones',
  description: null,
  startDate: '2030-02-02',
  endDate: '2030-02-27',
  fee: 75000,
  capacity: 12,
  enrolled: 1,
  seatsLeft: 11,
  balanceDue: 50000,
  trainer: 'Eric Mbia',
  enrollments: [
    {
      id: 8,
      reference: 'INS-2030-00008',
      trainingId: 3,
      training: 'Réparation de téléphones',
      customerId: 1,
      customer: 'Awa Ngono',
      phone: '677112233',
      agreedFee: 75000,
      paid: 25000,
      balance: 50000,
      status: 'INSCRIT',
      enrolledAt: '2026-10-14T10:00:00Z',
      payments: [],
    },
  ],
  ...overrides,
})

describe('Formations (US-21)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inscrit un nouvel apprenant avec un prix negocie et un premier paiement', async () => {
    vi.mocked(trainingsApi.get).mockResolvedValue(training())
    vi.mocked(customersApi.search).mockResolvedValue([
      { id: 2, fullName: 'Paul Essomba', phone: '690000001', email: null, notes: null, createdAt: '' },
    ])
    vi.mocked(trainingsApi.enroll).mockResolvedValue({ ...training().enrollments[0], id: 9, customer: 'Paul Essomba', reference: 'INS-2030-00009' })
    renderPage(<TrainingDetailPage />, { path: '/formations/:id', route: '/formations/3' })

    await userEvent.type(await screen.findByLabelText('Rechercher un client'), 'paul')
    await userEvent.click(await screen.findByRole('button', { name: /Paul Essomba/ }))
    await userEvent.type(screen.getByLabelText('Prix convenu (FCFA)'), '60000')
    await userEvent.type(screen.getByLabelText('Premier paiement'), '20000')
    await userEvent.click(screen.getByRole('button', { name: 'Inscrire' }))

    expect(trainingsApi.enroll).toHaveBeenCalledWith(3, { customerId: 2, agreedFee: 60000, firstPayment: 20000, paymentMethod: 'ESPECES' })
    expect(await screen.findByText('Paul Essomba est inscrit(e) (INS-2030-00009).')).toBeInTheDocument()
  })

  it('encaisse un paiement sur le solde d un apprenant', async () => {
    vi.mocked(trainingsApi.get).mockResolvedValue(training())
    vi.mocked(trainingsApi.pay).mockResolvedValue(training().enrollments[0])
    renderPage(<TrainingDetailPage />, { path: '/formations/:id', route: '/formations/3' })

    await userEvent.type(await screen.findByLabelText('Paiement de Awa Ngono'), '30000')
    await userEvent.click(screen.getByRole('button', { name: 'Encaisser' }))

    expect(trainingsApi.pay).toHaveBeenCalledWith(8, 30000, 'ESPECES')
  })

  it('n affiche plus le formulaire quand la session est complete', async () => {
    vi.mocked(trainingsApi.get).mockResolvedValue(training({ seatsLeft: 0 }))
    renderPage(<TrainingDetailPage />, { path: '/formations/:id', route: '/formations/3' })

    expect(await screen.findByText('La session est complète.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inscrire' })).not.toBeInTheDocument()
  })
})

describe('Tableau de bord (US-24)', () => {
  it('resume la journee du gerant', async () => {
    const dashboard: Dashboard = {
      salesToday: { count: 3, total: 45000, margin: 15000 },
      salesMonth: { count: 40, total: 980000, margin: 310000 },
      dailySales: ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'].map((date, i) => ({ date, total: i * 5000 })),
      lowStock: [{ id: 1, name: 'Chargeur USB-C', quantity: 0, alertThreshold: 3 }],
      lowStockCount: 1,
      repairsInProgress: 4,
      repairsReady: [],
      amountsDue: { repairs: 15000, trainings: 30000 },
      recent: [{ type: 'VENTE', label: 'Vente VTE-2026-00012', detail: '15 000 FCFA · Awa Ngono', targetId: 12, at: '2026-10-14T10:00:00Z' }],
      ordersToProcess: 2,
      quotesToAnswer: 1,
    }
    vi.mocked(dashboardApi.get).mockResolvedValue(dashboard)
    renderPage(<DashboardPage />)

    const today = (await screen.findByText('Ventes du jour')).closest('a')!
    expect(within(today).getByText('45 000 FCFA')).toBeInTheDocument()
    expect(screen.getByText('Réparations en cours').closest('a')).toHaveTextContent('4')
    expect(screen.getByText('À encaisser').closest('a')).toHaveTextContent('45 000 FCFA')
    expect(screen.getByText('Commandes en ligne').closest('a')).toHaveAttribute('href', '/commandes')
    expect(screen.getByText('Commandes en ligne').closest('a')).toHaveTextContent('2')
    expect(screen.getByText('Demandes de devis').closest('a')).toHaveAttribute('href', '/devis')
    expect(screen.getByRole('list', { name: 'Chiffre d’affaires par jour' }).children).toHaveLength(7)
    expect(screen.getByText('Épuisé')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Vente VTE-2026-00012/ })).toHaveAttribute('href', '/ventes/12')
  })
})
