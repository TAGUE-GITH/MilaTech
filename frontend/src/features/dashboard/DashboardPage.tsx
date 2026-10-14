import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, GraduationCap, Receipt, ShoppingCart, Wallet, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi, errorMessage } from '../../api/client'
import type { Dashboard } from '../../api/types'
import { Alert, Badge, Card, Loader } from '../../components/ui'
import { formatFcfa } from '../../lib/format'
import { statusTone } from '../../lib/repairs'

const shortDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
const time = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const OPERATION_ICONS: Record<Dashboard['recent'][number]['type'], LucideIcon> = {
  VENTE: ShoppingCart,
  REPARATION: Wrench,
  INSCRIPTION: GraduationCap,
}

const OPERATION_LINKS: Record<Dashboard['recent'][number]['type'], string> = {
  VENTE: '/ventes',
  REPARATION: '/reparations',
  INSCRIPTION: '/formations',
}

function Tile({ label, value, detail, to, Icon, alert = false }: { label: string; value: string; detail?: string; to: string; Icon: LucideIcon; alert?: boolean }) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl p-5 ring-1 transition hover:shadow-md ${alert ? 'bg-red-50 text-red-900 ring-red-200' : 'bg-white ring-slate-200'}`}
    >
      <p className={`flex items-center gap-2 text-sm font-medium ${alert ? '' : 'text-slate-500'}`}>
        <Icon className="size-4" aria-hidden />
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {detail && <p className={`mt-1 text-xs ${alert ? '' : 'text-slate-500'}`}>{detail}</p>}
    </Link>
  )
}

/** Ventes des 7 derniers jours : barres horizontales (une seule serie), avec le montant ecrit en clair. */
function DailySales({ days }: { days: Dashboard['dailySales'] }) {
  const max = Math.max(1, ...days.map((day) => day.total))
  return (
    <Card>
      <h2 className="font-bold">Ventes des 7 derniers jours</h2>
      <ul className="mt-4 space-y-2.5" aria-label="Chiffre d’affaires par jour">
        {days.map((day) => (
          <li key={day.date} className="grid grid-cols-[4.5rem_1fr_7rem] items-center gap-3 text-sm">
            <span className="text-slate-500 capitalize">{shortDay(day.date)}</span>
            <span className="h-2.5 rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(day.total / max) * 100}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{formatFcfa(day.total)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// US-24 : tableau de bord du gerant
export default function DashboardPage() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get })
  if (isPending) return <Loader />
  if (isError) return <Alert>{errorMessage(error)}</Alert>
  const due = data.amountsDue.repairs + data.amountsDue.trainings

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Ventes du jour" value={formatFcfa(data.salesToday.total)} detail={`${data.salesToday.count} vente(s)`} to="/ventes" Icon={Receipt} />
        <Tile label="Ce mois-ci" value={formatFcfa(data.salesMonth.total)} detail={`Marge théorique ${formatFcfa(data.salesMonth.margin)}`} to="/ventes" Icon={ShoppingCart} />
        <Tile label="Réparations en cours" value={String(data.repairsInProgress)} detail={`${data.repairsReady.length} appareil(s) à rendre`} to="/reparations" Icon={Wrench} />
        <Tile
          label="À encaisser"
          value={formatFcfa(due)}
          detail={`Réparations ${formatFcfa(data.amountsDue.repairs)} · formations ${formatFcfa(data.amountsDue.trainings)}`}
          to="/formations"
          Icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DailySales days={data.dailySales} />
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Appareils prêts à rendre</h2>
            <Link to="/reparations" className="text-sm font-semibold text-brand-700">
              Tout voir
            </Link>
          </div>
          {data.repairsReady.length === 0 && <p className="mt-3 text-sm text-slate-500">Aucun appareil en attente de son propriétaire.</p>}
          <ul className="mt-2 divide-y divide-slate-100">
            {data.repairsReady.map((repair) => (
              <li key={repair.id}>
                <Link to={`/reparations/${repair.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-brand-700">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{repair.device}</span>
                    <span className="text-slate-500"> · {repair.customer}</span>
                  </span>
                  {repair.balance > 0 && <span className="text-xs text-amber-700">reste {formatFcfa(repair.balance)}</span>}
                  <Badge tone={statusTone(repair.status)}>{repair.statusLabel}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <AlertTriangle className="size-5 text-amber-600" aria-hidden />
              Stock bas
            </h2>
            <Link to="/stock/alertes" className="text-sm font-semibold text-brand-700">
              {data.lowStockCount} produit(s)
            </Link>
          </div>
          {data.lowStock.length === 0 && <p className="mt-3 text-sm text-slate-500">Tout le stock est au-dessus des seuils.</p>}
          <ul className="mt-2 divide-y divide-slate-100">
            {data.lowStock.map((product) => (
              <li key={product.id}>
                <Link to={`/produits/${product.id}`} className="flex justify-between py-2.5 text-sm hover:text-brand-700">
                  <span className="font-semibold">{product.name}</span>
                  <Badge tone={product.quantity === 0 ? 'red' : 'amber'}>{product.quantity === 0 ? 'Épuisé' : `${product.quantity} en stock`}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-bold">Dernières opérations</h2>
          {data.recent.length === 0 && <p className="mt-3 text-sm text-slate-500">Aucune opération pour le moment.</p>}
          <ul className="mt-2 divide-y divide-slate-100">
            {data.recent.map((operation, index) => {
              const Icon = OPERATION_ICONS[operation.type]
              return (
                <li key={index}>
                  <Link to={`${OPERATION_LINKS[operation.type]}/${operation.targetId}`} className="flex gap-3 py-2.5 text-sm hover:text-brand-700">
                    <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{operation.label}</span>
                      <span className="block text-xs text-slate-500">
                        {operation.detail} · {time(operation.at)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
