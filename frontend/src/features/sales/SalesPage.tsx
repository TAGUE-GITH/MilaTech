import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, salesApi } from '../../api/client'
import type { Period } from '../../api/client'
import { PAYMENT_LABELS } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { buttonClasses } from '../../components/buttonClasses'
import { Alert, Card, Loader, PageHeader } from '../../components/ui'
import { isoDay } from '../../lib/dates'
import { formatFcfa } from '../../lib/format'

const firstOfMonth = () => `${isoDay().slice(0, 8)}01`

const PERIODS: { key: string; label: string; period: () => Period }[] = [
  { key: 'today', label: 'Aujourd’hui', period: () => ({ from: isoDay(), to: isoDay() }) },
  { key: 'week', label: '7 derniers jours', period: () => ({ from: isoDay(6), to: isoDay() }) },
  { key: 'month', label: 'Ce mois-ci', period: () => ({ from: firstOfMonth(), to: isoDay() }) },
  { key: 'all', label: 'Tout', period: () => ({}) },
]

const time = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// US-13 : historique des ventes ; le gerant voit tout, avec les totaux et la marge
export default function SalesPage() {
  const { hasRole } = useAuth()
  const manager = hasRole('GERANT')
  const [key, setKey] = useState('today')
  const period = PERIODS.find((p) => p.key === key)!.period()
  const sales = useQuery({ queryKey: ['sales', key], queryFn: () => salesApi.list(period) })
  const totals = useQuery({ queryKey: ['sales', 'summary', key], queryFn: () => salesApi.summary(period), enabled: manager })

  return (
    <>
      <PageHeader
        title="Ventes"
        subtitle={manager ? 'Toutes les ventes de la boutique' : 'Vos ventes'}
        actions={
          <Link to="/caisse" className={buttonClasses('primary')}>
            <Plus className="size-4" aria-hidden />
            Nouvelle vente
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Période">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={key === p.key}
            onClick={() => setKey(p.key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 ${key === p.key ? 'bg-ink text-white ring-ink' : 'bg-white ring-slate-300'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {manager && totals.data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Chiffre d’affaires</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatFcfa(totals.data.total)}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Marge théorique</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{formatFcfa(totals.data.margin)}</p>
            <p className="mt-1 text-xs text-slate-500">Hors charges (loyer, salaires, électricité…)</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Nombre de ventes</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{totals.data.count}</p>
          </Card>
        </div>
      )}

      {sales.isPending && <Loader />}
      {sales.isError && <Alert>{errorMessage(sales.error)}</Alert>}
      {sales.data && sales.data.length === 0 && <p className="py-10 text-center text-slate-500">Aucune vente sur cette période.</p>}
      {sales.data && sales.data.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {sales.data.map((sale) => (
            <li key={sale.id}>
              <Link to={`/ventes/${sale.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{sale.reference}</p>
                  <p className="text-xs text-slate-500">
                    {time(sale.createdAt)} · {sale.customer ?? 'Client de passage'} · {sale.seller} · {PAYMENT_LABELS[sale.paymentMethod]}
                  </p>
                </div>
                {sale.margin !== undefined && <span className="text-xs text-slate-500">marge {formatFcfa(sale.margin)}</span>}
                <span className="w-32 text-right font-bold tabular-nums">{formatFcfa(sale.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
