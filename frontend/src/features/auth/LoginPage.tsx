import { useQuery } from '@tanstack/react-query'
import { CircuitBoard, PlayCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { demoApi, errorMessage, fieldErrors } from '../../api/client'
import { ROLE_LABELS } from '../../api/types'
import { homeOf, useAuth } from '../../auth/AuthProvider'
import { Alert, Button, Field } from '../../components/ui'

// US-01 : connexion des employes
export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  // Page demandee avant la connexion ; sinon l'espace de chacun (gestion pour le personnel, « Mon espace » pour les clients)
  const from = (useLocation().state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  if (user) return <Navigate to={from ?? homeOf(user)} replace />

  const connect = async (withEmail: string, withPassword: string) => {
    setSending(true)
    setError('')
    setErrors({})
    try {
      const connected = await login(withEmail, withPassword)
      navigate(from ?? homeOf(connected), { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      setError(errorMessage(err))
      setSending(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    connect(email, password)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-700 text-white">
            <CircuitBoard className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">MilaTech Management</h1>
          <p className="mt-1 text-sm text-slate-600">Connectez-vous à votre compte.</p>
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
          <p className="text-center text-sm">
            <Link to="/mot-de-passe-oublie" className="font-semibold text-brand-700">
              Mot de passe oublié ?
            </Link>
          </p>
        </form>
        <DemoAccounts onPick={connect} disabled={sending} />
        <p className="mt-6 text-center text-sm text-slate-600">
          Client sans compte ?{' '}
          <Link to="/inscription" state={from ? { from } : undefined} className="font-semibold text-brand-700">
            Créer un compte
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">Employé : votre compte est créé par le gérant.</p>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="font-semibold text-slate-600 hover:text-brand-700">
            ← Retour au site
          </Link>
        </p>
      </div>
    </main>
  )
}

/** Mode demonstration : un clic pour visiter l'application avec chaque role. */
function DemoAccounts({ onPick, disabled }: { onPick: (email: string, password: string) => void; disabled: boolean }) {
  const { data } = useQuery({ queryKey: ['demo'], queryFn: demoApi.info, staleTime: Infinity })
  if (!data?.enabled || !data.password) return null
  const password = data.password
  return (
    <div className="mt-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <PlayCircle className="size-4" aria-hidden />
        Démonstration : essayez chaque rôle
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={disabled}
            onClick={() => onPick(account.email, password)}
            className="rounded-xl bg-white px-3 py-2 text-left text-sm ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-60"
          >
            <span className="block font-semibold">{ROLE_LABELS[account.role]}</span>
            <span className="block text-xs text-slate-500">{account.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-amber-900">Mot de passe : {password}</p>
    </div>
  )
}
