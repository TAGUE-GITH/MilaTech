import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { authApi } from '../api/client'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import ResetPasswordPage from '../features/auth/ResetPasswordPage'
import { renderPage } from './render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn() },
}))

beforeEach(() => vi.clearAllMocks())

describe('Mot de passe oublie', () => {
  it('demande un lien sans dire si le compte existe', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue({} as never)
    renderPage(<ForgotPasswordPage />)

    await userEvent.type(screen.getByLabelText('Email'), ' awa@client.test ')
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir le lien' }))

    expect(authApi.forgotPassword).toHaveBeenCalledWith('awa@client.test')
    expect(await screen.findByText(/Si un compte existe pour/)).toBeInTheDocument()
  })

  it('choisit un nouveau mot de passe avec le lien recu', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue({} as never)
    renderPage(<ResetPasswordPage />, { path: '/reinitialiser', route: '/reinitialiser?token=abc123' })

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'nouveau-mot-de-passe')
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'autre-chose')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByText('Les deux mots de passe ne sont pas identiques.')).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()

    await userEvent.clear(screen.getByLabelText('Confirmer le mot de passe'))
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'nouveau-mot-de-passe')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(authApi.resetPassword).toHaveBeenCalledWith('abc123', 'nouveau-mot-de-passe')
    expect(await screen.findByText('Mot de passe modifié')).toBeInTheDocument()
  })

  it('affiche le refus d un lien expire', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Ce lien n’est plus valable. Demandez-en un nouveau.' } },
    })
    renderPage(<ResetPasswordPage />, { path: '/reinitialiser', route: '/reinitialiser?token=vieux' })

    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'nouveau-mot-de-passe')
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'nouveau-mot-de-passe')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce lien n’est plus valable')
  })
})
