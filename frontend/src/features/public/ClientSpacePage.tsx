import { useQuery } from '@tanstack/react-query'
import { ChevronRight, LogOut, PackageSearch, Wrench } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { errorMessage, myOrdersApi } from '../../api/client'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Badge, Button, Card, Loader } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'
import { clientStepLabel, orderTone } from '../../lib/orders'
import { ProfilePanel } from '../profile/ProfilePanel'

// « Mon espace » : l'espace personnel d'un client du site
export default function ClientSpacePage() {
  const { user, logout } = useAuth()
  const welcome = (useLocation().state as { welcome?: boolean } | null)?.welcome

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mon espace</h1>
          <p className="mt-1 text-slate-600">Bonjour {user?.firstName}, bienvenue chez MilaTech.</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut className="size-4" aria-hidden />
          Se déconnecter
        </Button>
      </div>
      {welcome && (
        <div className="mb-6">
          <Alert type="success">Votre compte est créé. Ajoutez une photo si vous le souhaitez.</Alert>
        </div>
      )}
      <ProfilePanel />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <MyOrders />
        <Card className="opacity-80">
          <h2 className="flex items-center gap-2 font-bold">
            <Wrench className="size-5 text-brand-700" aria-hidden />
            Mes réparations et devis
          </h2>
          <p className="mt-2 text-sm text-slate-600">Bientôt : demandez un devis et suivez la réparation de vos appareils ici.</p>
        </Card>
      </div>
    </div>
  )
}

function MyOrders() {
  const orders = useQuery({ queryKey: ['my-orders'], queryFn: myOrdersApi.list })
  return (
    <Card>
      <h2 className="flex items-center gap-2 font-bold">
        <PackageSearch className="size-5 text-brand-700" aria-hidden />
        Mes commandes
      </h2>
      {orders.isPending && <Loader />}
      {orders.isError && <Alert>{errorMessage(orders.error)}</Alert>}
      {orders.data?.length === 0 && (
        <p className="mt-2 text-sm text-slate-600">
          Vous n’avez pas encore commandé.{' '}
          <Link to="/boutique" className="font-semibold text-brand-700">
            Voir la boutique
          </Link>
        </p>
      )}
      {orders.data && orders.data.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100">
          {orders.data.map((order) => (
            <li key={order.id}>
              <Link to={`/mon-espace/commandes/${order.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {order.reference} <span className="font-normal text-slate-500">· {formatDate(order.createdAt)}</span>
                  </p>
                  <p className="text-sm text-slate-500 tabular-nums">
                    {order.itemCount} article(s) · {formatFcfa(order.total)}
                  </p>
                </div>
                <Badge tone={orderTone(order.status)}>{clientStepLabel(order.status, order.deliveryMode)}</Badge>
                <ChevronRight className="size-4 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
