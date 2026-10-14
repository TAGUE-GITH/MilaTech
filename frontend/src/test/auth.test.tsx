import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { authApi } from '../api/client'
import type { User } from '../api/types'
import { AuthProvider } from '../auth/AuthProvider'
import LoginPage from '../features/auth/LoginPage'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  authApi: { login: vi.fn(), me: vi.fn() },
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

const renderLogin = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/connexion']}>
          <Routes>
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/" element={<p>Accueil</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )

describe('Connexion (US-01)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
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
})
