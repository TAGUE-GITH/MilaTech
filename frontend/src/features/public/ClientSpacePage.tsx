import { useQuery } from '@tanstack/react-query'
import { ChevronRight, LogOut, PackageSearch, Plus, Wrench } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { errorMessage, myOrdersApi, myQuotesApi } from '../../api/client'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Badge, Button, Card, Loader } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'
import { clientStepLabel, orderTone } from '../../lib/orders'
import { clientQuoteLabel, quoteTone } from '../../lib/quotes'
import { statusTone } from '../../lib/repairs'
import { buttonClasses } from '../../components/buttonClasses'
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
      <div className="grid gap-6 lg:grid-cols-2">
        <MyRepairs />
        <MyOrders />
      </div>
      <h2 className="mt-10 mb-4 text-xl font-bold">Mon profil</h2>
      <ProfilePanel />
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

/** Reparations en cours ou passees, et demandes de devis envoyees depuis le site. */
function MyRepairs() {
  const quotes = useQuery({ queryKey: ['my-quotes'], queryFn: myQuotesApi.list })
  const repairs = useQuery({ queryKey: ['my-repairs'], queryFn: myQuotesApi.repairs })
  // Une demande deposee est suivie comme reparation : on ne l'affiche plus en double
  const pending = quotes.data?.filter((quote) => quote.status !== 'DEPOSEE') ?? []

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <Wrench className="size-5 text-brand-700" aria-hidden />
          Mes réparations et devis
        </h2>
        <Link to="/mon-espace/devis/nouveau" className={buttonClasses('primary', 'px-3 py-2')}>
          <Plus className="size-4" aria-hidden />
          Demander un devis
        </Link>
      </div>
      {(quotes.isPending || repairs.isPending) && <Loader />}
      <Alert>{quotes.isError ? errorMessage(quotes.error) : repairs.isError ? errorMessage(repairs.error) : ''}</Alert>
      {quotes.data && repairs.data && pending.length === 0 && repairs.data.length === 0 && (
        <p className="mt-2 text-sm text-slate-600">Un appareil en panne ? Décrivez le problème, la boutique vous envoie un prix ici.</p>
      )}
      <ul className="mt-2 divide-y divide-slate-100">
        {repairs.data?.map((repair) => (
          <li key={`r${repair.id}`}>
            <Link to={`/mon-espace/reparations/${repair.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{repair.device}</p>
                <p className="text-sm text-slate-500">
                  Réparation {repair.reference}
                  {repair.balance > 0 ? ` · reste ${formatFcfa(repair.balance)}` : ''}
                </p>
              </div>
              <Badge tone={statusTone(repair.status)}>{repair.statusLabel}</Badge>
              <ChevronRight className="size-4 text-slate-400" aria-hidden />
            </Link>
          </li>
        ))}
        {pending.map((quote) => (
          <li key={`q${quote.id}`}>
            <Link to={`/mon-espace/devis/${quote.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{quote.device}</p>
                <p className="text-sm text-slate-500">
                  Devis {quote.reference}
                  {quote.quotedPrice ? ` · ${formatFcfa(quote.quotedPrice)}` : ''}
                </p>
              </div>
              <Badge tone={quoteTone(quote.status)}>{clientQuoteLabel(quote.status)}</Badge>
              <ChevronRight className="size-4 text-slate-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
