import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { authApi, myOrdersApi, ordersApi, shopApi } from '../api/client'
import type { Order, ShopProduct, User } from '../api/types'
import { AuthProvider } from '../auth/AuthProvider'
import PublicLayout from '../features/public/PublicLayout'
import CartPage from '../features/shop/CartPage'
import OrderDetailPage from '../features/shop/OrderDetailPage'
import { ShopCartProvider } from '../features/shop/ShopCart'
import ShopPage from '../features/shop/ShopPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
  shopApi: { products: vi.fn(), product: vi.fn(), categories: vi.fn(), info: vi.fn() },
  myOrdersApi: { place: vi.fn(), list: vi.fn(), get: vi.fn(), cancel: vi.fn() },
  ordersApi: { list: vi.fn(), get: vi.fn(), move: vi.fn() },
}))

const phone: ShopProduct = { id: 1, name: 'Samsung Galaxy A15', category: { id: 1, name: 'Téléphones' }, price: 95000, stock: 2 }
const charger: ShopProduct = { id: 2, name: 'Chargeur USB-C', category: { id: 2, name: 'Accessoires' }, price: 5000, stock: 10 }

const awa: User = {
  id: 5,
  email: 'awa@client.test',
  firstName: 'Awa',
  lastName: 'Ngono',
  fullName: 'Awa Ngono',
  phone: '677112233',
  role: 'CLIENT',
  active: true,
  createdAt: '2026-10-14T10:00:00Z',
  customerId: 9,
}

const renderSite = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <AuthProvider>
        <ShopCartProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="boutique" element={<ShopPage />} />
                <Route path="panier" element={<CartPage />} />
                <Route path="mon-espace/commandes/:id" element={<p>Suivi de la commande</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ShopCartProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )

/** Panier deja rempli (garde dans le navigateur). */
const storeCart = () =>
  localStorage.setItem(
    'milatech_cart',
    JSON.stringify([
      { productId: 1, name: 'Samsung Galaxy A15', unitPrice: 95000, available: 2, quantity: 1 },
      { productId: 2, name: 'Chargeur USB-C', unitPrice: 5000, available: 10, quantity: 2 },
    ]),
  )

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(shopApi.products).mockResolvedValue([phone, charger])
  vi.mocked(shopApi.categories).mockResolvedValue([phone.category, charger.category])
  vi.mocked(shopApi.info).mockResolvedValue({ deliveryFee: 1000, deliveryCity: 'Yaoundé' })
})

describe('Boutique en ligne', () => {
  it('montre les produits disponibles et remplit le panier', async () => {
    renderSite('/boutique')

    expect(await screen.findByText('Samsung Galaxy A15')).toBeInTheDocument()
    expect(screen.getByText('95 000 FCFA')).toBeInTheDocument()
    expect(screen.getByText('Plus que 2 en stock')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter au panier : Samsung Galaxy A15' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter au panier : Samsung Galaxy A15' }))
    expect(screen.getByRole('link', { name: 'Panier : 2 article(s)' })).toBeInTheDocument()
    // Jamais plus que le stock disponible
    expect(screen.getByRole('button', { name: 'Ajouter au panier : Samsung Galaxy A15' })).toBeDisabled()
  })

  it('ajoute les frais de livraison et demande au visiteur de se connecter pour commander', async () => {
    storeCart()
    renderSite('/panier')

    const total = () => screen.getByText('Total à payer').parentElement
    expect(await screen.findByText('Total à payer')).toBeInTheDocument()
    expect(total()).toHaveTextContent('105 000 FCFA')
    await userEvent.click(await screen.findByText('Livraison à Yaoundé'))
    expect(total()).toHaveTextContent('106 000 FCFA')
    expect(screen.getByRole('link', { name: 'Se connecter pour commander' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Commander' })).not.toBeInTheDocument()
  })

  it('le client commande en livraison, puis suit sa commande', async () => {
    localStorage.setItem('milatech_token', 'jeton')
    vi.mocked(authApi.me).mockResolvedValue(awa)
    vi.mocked(myOrdersApi.place).mockResolvedValue({ id: 31 } as Order)
    storeCart()
    renderSite('/panier')

    await userEvent.click(await screen.findByText('Livraison à Yaoundé'))
    await userEvent.type(screen.getByLabelText('Quartier et repère'), 'Bonas, près de la pharmacie')
    expect(screen.getByLabelText('Téléphone pour vous joindre')).toHaveValue('677112233')
    await userEvent.click(await screen.findByRole('button', { name: 'Commander' }))

    expect(myOrdersApi.place).toHaveBeenCalledWith({
      deliveryMode: 'LIVRAISON',
      address: 'Bonas, près de la pharmacie',
      phone: '677112233',
      note: '',
      lines: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 2 },
      ],
    })
    expect(await screen.findByText('Suivi de la commande')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('milatech_cart')!)).toEqual([])
  })

  it('affiche le refus du serveur sous le champ concerne', async () => {
    localStorage.setItem('milatech_token', 'jeton')
    vi.mocked(authApi.me).mockResolvedValue(awa)
    vi.mocked(myOrdersApi.place).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Certaines informations sont invalides.', errors: { address: 'Indiquez votre quartier et un repère pour la livraison.' } } },
    })
    storeCart()
    renderSite('/panier')

    await userEvent.click(await screen.findByText('Livraison à Yaoundé'))
    await userEvent.click(await screen.findByRole('button', { name: 'Commander' }))

    expect(await screen.findByText('Indiquez votre quartier et un repère pour la livraison.')).toBeInTheDocument()
  })
})

describe('Commandes en ligne cote boutique', () => {
  const order: Order = {
    id: 31,
    reference: 'CMD-2026-00031',
    status: 'PRETE',
    statusLabel: 'Prête',
    nextStatuses: ['REMISE', 'ANNULEE'],
    deliveryMode: 'RETRAIT',
    phone: '677112233',
    subtotal: 105000,
    deliveryFee: 0,
    total: 105000,
    customer: { id: 9, fullName: 'Awa Ngono', phone: '677112233' },
    createdAt: '2026-10-14T10:00:00Z',
    updatedAt: '2026-10-14T11:00:00Z',
    lines: [{ productId: 1, productName: 'Samsung Galaxy A15', quantity: 1, unitPrice: 95000, lineTotal: 95000 }],
  }

  it('remet la commande en notant le moyen de paiement', async () => {
    vi.mocked(ordersApi.get).mockResolvedValue(order)
    vi.mocked(ordersApi.move).mockResolvedValue({ ...order, status: 'REMISE', statusLabel: 'Remise', nextStatuses: [], saleId: 4, saleReference: 'VTE-2026-00004' })
    renderPage(<OrderDetailPage />, { path: '/commandes/:id', route: '/commandes/31' })

    await userEvent.selectOptions(await screen.findByLabelText('Le client a payé par'), 'MOBILE_MONEY')
    await userEvent.click(screen.getByRole('button', { name: 'Retirée et payée' }))

    expect(ordersApi.move).toHaveBeenCalledWith(31, { status: 'REMISE', paymentMethod: 'MOBILE_MONEY', note: undefined })
    expect(await screen.findByRole('link', { name: 'VTE-2026-00004' })).toHaveAttribute('href', '/ventes/4')
    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toContain('wa.me/237677112233')
  })
})
