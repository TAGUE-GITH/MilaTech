import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { authApi, demoApi } from '../api/client'
import type { User } from '../api/types'
import { AuthProvider } from '../auth/AuthProvider'
import LoginPage from '../features/auth/LoginPage'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  authApi: { login: vi.fn(), me: vi.fn() },
  demoApi: { info: vi.fn() },
}))

const awa: User = {
  id: 1,
  email: 'awa@milatech.test',
  firstName: 'Awa',
  lastName: 'Ngono',
  fullName: 'Awa Ngono',
  phone: null,
  role: 'VENDEUR',
  active: true,
  createdAt: '2026-10-14T10:00:00Z',
}

const renderLogin = (space: 'client' | 'staff' = 'client') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/connexion']}>
          <Routes>
            <Route path="/connexion" element={<LoginPage space={space} />} />
            <Route path="/accueil" element={<p>Accueil</p>} />
            <Route path="/mon-espace" element={<p>Mon espace</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )

describe('Connexion (US-01)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(demoApi.info).mockResolvedValue({ enabled: false, accounts: [] })
  })

  it('connecte l employe, garde son jeton et ouvre l accueil', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'jeton', user: awa })
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'awa@milatech.test')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'motdepasse-solide')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(authApi.login).toHaveBeenCalledWith('awa@milatech.test', 'motdepasse-solide')
    expect(await screen.findByText('Accueil')).toBeInTheDocument()
    expect(localStorage.getItem('milatech_token')).toBe('jeton')
  })

  it('affiche le message du serveur si les identifiants sont faux', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Email ou mot de passe incorrect.' } },
    })
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'awa@milatech.test')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'faux')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.')
    expect(localStorage.getItem('milatech_token')).toBeNull()
  })

  const demo = () =>
    vi.mocked(demoApi.info).mockResolvedValue({
      enabled: true,
      password: 'demo-milatech-2026',
      accounts: [
        { email: 'gerant@demo.milatech.cm', role: 'GERANT', name: 'Paul Mbarga' },
        { email: 'client@demo.milatech.cm', role: 'CLIENT', name: 'Awa Ngono' },
      ],
    })

  it('en demonstration, l espace boutique propose les roles du personnel', async () => {
    demo()
    vi.mocked(authApi.login).mockResolvedValue({ token: 'jeton', user: { ...awa, role: 'GERANT' } })
    renderLogin('staff')

    expect(screen.getByRole('heading', { name: 'Espace boutique' })).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('button', { name: /Gérant/ }))
    expect(screen.queryByRole('button', { name: /client/i })).not.toBeInTheDocument()

    expect(authApi.login).toHaveBeenCalledWith('gerant@demo.milatech.cm', 'demo-milatech-2026')
    expect(await screen.findByText('Accueil')).toBeInTheDocument()
  })

  it('en demonstration, la connexion des clients ne propose que le compte client', async () => {
    demo()
    vi.mocked(authApi.login).mockResolvedValue({ token: 'jeton', user: { ...awa, role: 'CLIENT' } })
    renderLogin()

    await userEvent.click(await screen.findByRole('button', { name: 'Essayer en tant que client (démo)' }))
    expect(screen.queryByRole('button', { name: /Gérant/ })).not.toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith('client@demo.milatech.cm', 'demo-milatech-2026')
    expect(await screen.findByText('Mon espace')).toBeInTheDocument()
  })
})
