import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { repairsApi } from '../api/client'
import type { Repair } from '../api/types'
import RepairDetailPage from '../features/repairs/RepairDetailPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  repairsApi: { get: vi.fn(), move: vi.fn(), update: vi.fn(), addPart: vi.fn(), removePart: vi.fn(), pay: vi.fn(), openSlip: vi.fn() },
  productsApi: { list: vi.fn().mockResolvedValue([]) },
}))

const repair = (overrides: Partial<Repair> = {}): Repair => ({
  id: 4,
  reference: 'REP-2026-00004',
  customer: { id: 1, fullName: 'Awa Ngono', phone: '677112233' },
  deviceType: 'TELEPHONE',
  brand: 'Samsung',
  model: 'Galaxy A15',
  device: 'Samsung Galaxy A15',
  serialNumber: null,
  accessories: null,
  reception: 'BOUTIQUE',
  reportedIssue: 'Écran cassé',
  diagnosis: null,
  status: 'REPARE',
  statusLabel: 'Réparé',
  nextStatuses: ['RESTITUE'],
  laborCost: 8000,
  estimatedCost: 30000,
  promisedOn: null,
  total: 28000,
  paid: 10000,
  balance: 18000,
  remainingToPay: 18000,
  receivedBy: 'Paul Essomba',
  receivedAt: '2026-10-14T10:00:00Z',
  returnedAt: null,
  parts: [{ id: 1, productId: 3, productName: 'Écran Samsung A15', quantity: 1, unitPrice: 20000, lineTotal: 20000 }],
  events: [{ status: 'RECU', label: 'Reçu', note: null, author: 'Paul Essomba', createdAt: '2026-10-14T10:00:00Z' }],
  payments: [],
  ...overrides,
})

const show = () => renderPage(<RepairDetailPage />, { path: '/reparations/:id', route: '/reparations/4' })

describe('Dossier de reparation (US-16 a US-19)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prepare le message WhatsApp quand l appareil est repare', async () => {
    vi.mocked(repairsApi.get).mockResolvedValue(repair())
    show()

    const link = await screen.findByRole('link', { name: /Prévenir le client/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/237677112233?text='))
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Reste à payer : 18 000 FCFA')
  })

  it('rappelle le reste a payer avant la restitution puis encaisse le solde', async () => {
    vi.mocked(repairsApi.get).mockResolvedValue(repair())
    vi.mocked(repairsApi.pay).mockResolvedValue(repair({ paid: 28000, balance: 0, remainingToPay: 0 }))
    show()

    expect(await screen.findByText(/avant de restituer l’appareil/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Paiement (FCFA)'), '18000')
    await userEvent.click(screen.getByRole('button', { name: 'Encaisser' }))

    expect(repairsApi.pay).toHaveBeenCalledWith(4, 18000, 'ESPECES')
    expect(await screen.findByRole('button', { name: 'Restituer au client' })).toBeInTheDocument()
    expect(screen.queryByText(/avant de restituer l’appareil/)).not.toBeInTheDocument()
  })

  it('fait avancer l etape avec une note', async () => {
    vi.mocked(repairsApi.get).mockResolvedValue(repair({ status: 'EN_DIAGNOSTIC', statusLabel: 'En diagnostic', nextStatuses: ['EN_REPARATION', 'IRREPARABLE', 'ANNULE'] }))
    vi.mocked(repairsApi.move).mockResolvedValue(repair({ status: 'EN_REPARATION', statusLabel: 'En réparation', nextStatuses: ['REPARE', 'IRREPARABLE'] }))
    show()

    await userEvent.type(await screen.findByLabelText('Note (facultatif)'), 'Devis accepté')
    await userEvent.click(screen.getByRole('button', { name: 'Passer à « En réparation »' }))

    expect(repairsApi.move).toHaveBeenCalledWith(4, 'EN_REPARATION', 'Devis accepté')
    expect(await screen.findByRole('button', { name: 'Passer à « Réparé »' })).toBeInTheDocument()
  })
})
