import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { catalogApi, ordersApi, productsApi, quotesApi } from '../api/client'
import type { Product, Role } from '../api/types'
import { useAuth } from '../auth/AuthProvider'
import Layout from '../components/Layout'
import ProductDetailPage from '../features/products/ProductDetailPage'
import ProductsPage from '../features/products/ProductsPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  catalogApi: { categories: vi.fn(), suppliers: vi.fn() },
  productsApi: { list: vi.fn(), get: vi.fn(), purchase: vi.fn(), adjust: vi.fn(), movements: vi.fn(), alerts: vi.fn(), setImage: vi.fn(), removeImage: vi.fn() },
  ordersApi: { list: vi.fn() },
  quotesApi: { list: vi.fn() },
}))
vi.mock('../auth/AuthProvider', () => ({ useAuth: vi.fn() }))

const loggedAs = (role: Role) =>
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 1, email: 'x@milatech.test', firstName: 'Mila', lastName: 'Tech', fullName: 'Mila Tech', phone: null, role, active: true, createdAt: '' },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    hasRole: (...roles: Role[]) => roles.includes(role),
    isStaff: role !== 'CLIENT',
  })

const resistor: Product = {
  id: 7,
  reference: 'RES-10K',
  name: 'Résistance 10 kΩ',
  category: { id: 1, name: 'Composants' },
  purchasePrice: 2000,
  salePrice: 3000,
  quantity: 2,
  alertThreshold: 3,
  lowStock: true,
  active: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(catalogApi.categories).mockResolvedValue([{ id: 1, name: 'Composants' }])
  vi.mocked(catalogApi.suppliers).mockResolvedValue([])
  vi.mocked(productsApi.movements).mockResolvedValue([])
  vi.mocked(ordersApi.list).mockResolvedValue([])
  vi.mocked(quotesApi.list).mockResolvedValue([])
})

describe('Menu selon le role (US-02)', () => {
  const menu = () => within(screen.getAllByRole('navigation', { name: 'Menu principal' })[0]).getAllByRole('link').map((l) => l.textContent)

  it('montre tout au gerant', () => {
    loggedAs('GERANT')
    renderPage(<Layout />)
    expect(menu()).toEqual(['Accueil', 'Caisse', 'Ventes', 'Commandes en ligne', 'Réparations', 'Demandes de devis', 'Formations', 'Clients', 'Produits et stock', 'Stock bas', 'Catégories et fournisseurs', 'Messages', 'Employés', 'Voir le site'])
  })

  it('cache la gestion au technicien', () => {
    loggedAs('TECHNICIEN')
    renderPage(<Layout />)
    expect(menu()).toEqual(['Accueil', 'Réparations', 'Demandes de devis', 'Clients', 'Produits et stock', 'Voir le site'])
  })
})

describe('Catalogue (US-05)', () => {
  it('le vendeur ne voit ni les prix d achat ni le bouton de creation', async () => {
    loggedAs('VENDEUR')
    vi.mocked(productsApi.list).mockResolvedValue([{ ...resistor, purchasePrice: undefined }])
    renderPage(<ProductsPage />)

    expect((await screen.findAllByText('Résistance 10 kΩ')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Prix d’achat')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Nouveau produit/ })).not.toBeInTheDocument()
  })

  it('le gerant recherche un produit par nom ou reference', async () => {
    loggedAs('GERANT')
    vi.mocked(productsApi.list).mockResolvedValue([resistor])
    renderPage(<ProductsPage />)

    await userEvent.type(screen.getByLabelText('Rechercher un produit'), 'res-10{Enter}')

    expect(productsApi.list).toHaveBeenLastCalledWith({ q: 'res-10', categoryId: '', lowStock: false })
    expect(screen.getByRole('link', { name: /Nouveau produit/ })).toBeInTheDocument()
  })
})

describe('Achat fournisseur (US-06)', () => {
  it('ajoute les pieces recues au stock', async () => {
    loggedAs('GERANT')
    vi.mocked(productsApi.get).mockResolvedValue(resistor)
    vi.mocked(productsApi.purchase).mockResolvedValue({ ...resistor, quantity: 12, lowStock: false })
    renderPage(<ProductDetailPage />, { path: '/produits/:id', route: '/produits/7' })

    await userEvent.type(await screen.findByLabelText('Quantité reçue'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter au stock' }))

    expect(productsApi.purchase).toHaveBeenCalledWith(7, { quantity: 10, unitCost: 2000, supplierId: null, note: undefined })
    expect(await screen.findByText('10 pièce(s) ajoutée(s). Stock : 12.')).toBeInTheDocument()
  })

  it('le vendeur consulte la fiche sans pouvoir modifier le stock', async () => {
    loggedAs('VENDEUR')
    vi.mocked(productsApi.get).mockResolvedValue({ ...resistor, purchasePrice: undefined })
    renderPage(<ProductDetailPage />, { path: '/produits/:id', route: '/produits/7' })

    expect(await screen.findByRole('heading', { name: 'Résistance 10 kΩ' })).toBeInTheDocument()
    expect(screen.queryByText('Enregistrer un achat')).not.toBeInTheDocument()
    expect(screen.queryByText('Prix d’achat')).not.toBeInTheDocument()
  })
})
