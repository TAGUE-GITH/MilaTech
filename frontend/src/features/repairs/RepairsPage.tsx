import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, repairsApi } from '../../api/client'
import { REPAIR_STATUS_LABELS } from '../../api/types'
import type { RepairStatus } from '../../api/types'
import { buttonClasses } from '../../components/buttonClasses'
import { Alert, Badge, Loader, PageHeader } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'
import { statusTone } from '../../lib/repairs'

const FILTERS: (RepairStatus | '')[] = ['', 'RECU', 'EN_DIAGNOSTIC', 'EN_REPARATION', 'REPARE', 'IRREPARABLE', 'ANNULE', 'RESTITUE']

// US-16 : suivi des appareils confies
export default function RepairsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<RepairStatus | ''>('')
  const repairs = useQuery({ queryKey: ['repairs', { query, status }], queryFn: () => repairsApi.list({ q: query, status }) })

  return (
    <>
      <PageHeader
        title="Réparations"
        subtitle="Téléphones, ordinateurs, tablettes et appareils Bluetooth confiés par les clients"
        actions={
          <Link to="/reparations/nouvelle" className={buttonClasses('primary')}>
            <Plus className="size-4" aria-hidden />
            Nouveau dépôt
          </Link>
        }
      />
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Référence, client, téléphone, marque, modèle ou IMEI"
          aria-label="Rechercher une réparation"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par étape">
        {FILTERS.map((value) => (
          <button
            key={value || 'all'}
            type="button"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ring-1 ${status === value ? 'bg-ink text-white ring-ink' : 'bg-white ring-slate-300'}`}
          >
            {value ? REPAIR_STATUS_LABELS[value] : 'Toutes'}
          </button>
        ))}
      </div>

      {repairs.isPending && <Loader />}
      {repairs.isError && <Alert>{errorMessage(repairs.error)}</Alert>}
      {repairs.data && repairs.data.length === 0 && <p className="py-10 text-center text-slate-500">Aucune réparation trouvée.</p>}
      {repairs.data && repairs.data.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {repairs.data.map((repair) => (
            <li key={repair.id}>
              <Link to={`/reparations/${repair.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {repair.device} <span className="font-normal text-slate-500">· {repair.reference}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {repair.customer} · {repair.customerPhone} · déposé le {formatDate(repair.receivedAt)}
                    {repair.promisedOn && ` · prévu le ${formatDate(repair.promisedOn)}`}
                  </p>
                </div>
                {repair.balance > 0 && <span className="text-xs text-slate-500">reste {formatFcfa(repair.balance)}</span>}
                <Badge tone={statusTone(repair.status)}>{repair.statusLabel}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
