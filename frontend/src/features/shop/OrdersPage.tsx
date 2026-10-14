import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Store, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, ordersApi } from '../../api/client'
import type { OrderStatus } from '../../api/types'
import { Alert, Badge, Card, Loader, PageHeader, Select } from '../../components/ui'
import { formatFcfa } from '../../lib/format'
import { orderTone } from '../../lib/orders'

type Filter = 'OPEN' | 'ALL' | OrderStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'OPEN', label: 'À traiter' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CONFIRMEE', label: 'Confirmées' },
  { value: 'PRETE', label: 'Prêtes' },
  { value: 'REMISE', label: 'Remises' },
  { value: 'ANNULEE', label: 'Annulées' },
  { value: 'ALL', label: 'Toutes' },
]

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Commandes passees sur le site, a confirmer, preparer et remettre
export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>('OPEN')
  const orders = useQuery({
    queryKey: ['orders', filter],
    queryFn: () =>
      ordersApi.list(filter === 'OPEN' ? { open: true } : filter === 'ALL' ? {} : { status: filter }),
    refetchInterval: 60_000,
  })

  return (
    <>
      <PageHeader title="Commandes en ligne" subtitle="Commandes passées par les clients sur le site" />
      <div className="mb-4 max-w-xs">
        <Select label="Afficher" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>
      {orders.isPending && <Loader />}
      {orders.isError && <Alert>{errorMessage(orders.error)}</Alert>}
      {orders.data?.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500">{filter === 'OPEN' ? 'Aucune commande à traiter pour le moment.' : 'Aucune commande.'}</p>
        </Card>
      )}
      {orders.data && orders.data.length > 0 && (
        <Card className="p-0!">
          <ul className="divide-y divide-slate-100">
            {orders.data.map((order) => (
              <li key={order.id}>
                <Link to={`/commandes/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50">
                  <span className="text-slate-500" title={order.deliveryMode === 'LIVRAISON' ? 'Livraison' : 'Retrait en boutique'}>
                    {order.deliveryMode === 'LIVRAISON' ? <Truck className="size-5" aria-label="Livraison" /> : <Store className="size-5" aria-label="Retrait en boutique" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {order.customer} <span className="font-normal text-slate-500">· {order.reference}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {dateTime(order.createdAt)} · {order.itemCount} article(s) · {order.customerPhone}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums">{formatFcfa(order.total)}</span>
                  <Badge tone={orderTone(order.status)}>{order.statusLabel}</Badge>
                  <ChevronRight className="size-4 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
