import { CircuitBoard } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors } from '../../api/client'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Button, Field } from '../../components/ui'

// US-01 : connexion des employes
export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  if (user) return <Navigate to={from} replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError('')
    setErrors({})
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      setError(errorMessage(err))
      setSending(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-700 text-white">
            <CircuitBoard className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">MilaTech Management</h1>
          <p className="mt-1 text-sm text-slate-600">Connectez-vous avec votre compte employé.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200" noValidate>
          <Alert>{error}</Alert>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            required
          />
          <Field
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            required
          />
          <Button type="submit" loading={sending} className="w-full">
            Se connecter
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Pas de compte ? Demandez au gérant de vous en créer un.
        </p>
      </div>
    </main>
  )
}
