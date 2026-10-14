import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { productsApi, salesApi } from '../api/client'
import type { Product } from '../api/types'
import CashRegisterPage from '../features/sales/CashRegisterPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  productsApi: { list: vi.fn() },
  salesApi: { sell: vi.fn(), openReceipt: vi.fn() },
  customersApi: { search: vi.fn(), save: vi.fn() },
}))

const product = (id: number, name: string, salePrice: number, quantity: number): Product => ({
  id,
  reference: `REF-${id}`,
  name,
  category: { id: 1, name: 'Accessoires' },
  salePrice,
  quantity,
  alertThreshold: 1,
  lowStock: false,
  active: true,
})

describe('Caisse (US-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(productsApi.list).mockResolvedValue([
      product(1, 'Chargeur USB-C', 5000, 10),
      product(2, 'Écouteurs Bluetooth', 15000, 1),
      product(3, 'Câble HDMI', 4000, 0),
    ])
  })

  it('encaisse plusieurs produits en Mobile Money et propose le recu', async () => {
    vi.mocked(salesApi.sell).mockResolvedValue({
      id: 9,
      reference: 'VTE-2026-00009',
      seller: 'Awa Ngono',
      paymentMethod: 'MOBILE_MONEY',
      total: 25000,
      createdAt: '2026-10-14T10:00:00Z',
      lines: [],
    })
    renderPage(<CashRegisterPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter Chargeur USB-C' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter Chargeur USB-C' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter Écouteurs Bluetooth' }))
    expect(screen.getByText('25 000 FCFA')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Mobile Money'))
    await userEvent.click(screen.getByRole('button', { name: 'Encaisser' }))

    expect(salesApi.sell).toHaveBeenCalledWith({
      customerId: null,
      paymentMethod: 'MOBILE_MONEY',
      lines: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    })
    expect(await screen.findByText('Vente enregistrée')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Reçu/ }))
    expect(salesApi.openReceipt).toHaveBeenCalledWith(9)
  })

  it('n ajoute pas un produit epuise et bloque au stock disponible', async () => {
    renderPage(<CashRegisterPage />)

    expect(await screen.findByRole('button', { name: 'Ajouter Câble HDMI' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter Écouteurs Bluetooth' }))
    expect(screen.getByRole('button', { name: 'Une pièce de plus : Écouteurs Bluetooth' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Encaisser' })).toBeEnabled()
  })
})
