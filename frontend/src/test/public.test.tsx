import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { authApi, contactApi, shopApi } from '../api/client'
import type { User } from '../api/types'
import { AuthProvider } from '../auth/AuthProvider'
import ContactPage from '../features/public/ContactPage'
import PublicHomePage from '../features/public/PublicHomePage'
import PublicLayout from '../features/public/PublicLayout'
import RegisterPage from '../features/public/RegisterPage'
import { ShopCartProvider } from '../features/shop/ShopCart'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
  contactApi: { send: vi.fn() },
  shopApi: { products: vi.fn(), categories: vi.fn(), info: vi.fn(), product: vi.fn() },
}))

const renderSite = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <AuthProvider>
        <ShopCartProvider>
          <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<PublicHomePage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="inscription" element={<RegisterPage />} />
              <Route path="mon-espace" element={<p>Espace client</p>} />
            </Route>
          </Routes>
          </MemoryRouter>
        </ShopCartProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )

describe('Site public', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(shopApi.products).mockResolvedValue([])
  })

  it('presente les services et les coordonnees de la boutique a Yaounde', () => {
    renderSite('/')

    expect(screen.getByRole('heading', { name: /spécialiste de l’électronique à Yaoundé/ })).toBeInTheDocument()
    for (const service of ['Vente', 'Réparation', 'Formation'])
      expect(screen.getAllByRole('heading', { name: service }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/à côté de Sergy Coiffure/).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: '698 98 49 79' })[0]).toHaveAttribute('href', 'tel:+237698984979')
    expect(screen.getAllByRole('link', { name: '673 36 62 08' }).length).toBeGreaterThan(0)
  })

  it('envoie un message de contact', async () => {
    vi.mocked(contactApi.send).mockResolvedValue({} as never)
    renderSite('/contact')

    await userEvent.type(screen.getByLabelText('Votre nom'), 'Jean Fotso')
    await userEvent.type(screen.getByLabelText('Téléphone'), '699001122')
    await userEvent.type(screen.getByLabelText('Votre message'), 'Combien coûte un écran ?')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le message' }))

    expect(contactApi.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jean Fotso', phone: '699001122', message: 'Combien coûte un écran ?', website: '' }),
    )
    expect(await screen.findByText('Message envoyé, merci !')).toBeInTheDocument()
  })

  it('cree un compte client et ouvre son espace', async () => {
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
    vi.mocked(authApi.register).mockResolvedValue({ token: 'jeton', user: awa })
    renderSite('/inscription')

    await userEvent.type(screen.getByLabelText('Prénom'), 'Awa')
    await userEvent.type(screen.getByLabelText('Nom'), 'Ngono')
    await userEvent.type(screen.getByLabelText('Email'), 'awa@client.test')
    await userEvent.type(screen.getByLabelText('Téléphone'), '677112233')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'motdepasse-solide')
    await userEvent.click(screen.getByRole('checkbox', { name: /J’ai lu et j’accepte les conditions générales/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(authApi.register).toHaveBeenCalledWith({
      firstName: 'Awa',
      lastName: 'Ngono',
      email: 'awa@client.test',
      phone: '677112233',
      password: 'motdepasse-solide',
      acceptTerms: true,
    })
    expect(await screen.findByText('Espace client')).toBeInTheDocument()
    expect(localStorage.getItem('milatech_token')).toBe('jeton')
  })
})
