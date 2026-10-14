import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, MessageCircle } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { errorMessage, myOrdersApi } from '../../api/client'
import type { Order, OrderStatus } from '../../api/types'
import { DELIVERY_LABELS } from '../../api/types'
import { Alert, Badge, Button, Card, Loader } from '../../components/ui'
import { COMPANY } from '../../lib/company'
import { formatDate, formatFcfa } from '../../lib/format'
import { clientStepLabel, orderTone } from '../../lib/orders'
import { whatsappLink } from '../../lib/whatsapp'
import { ProductImage } from './ProductImage'

const STEPS: OrderStatus[] = ['EN_ATTENTE', 'CONFIRMEE', 'PRETE', 'REMISE']

// Suivi d'une commande par le client : etapes, articles, montant, annulation tant qu'elle est en attente
export default function ClientOrderPage() {
  const id = Number(useParams().id)
  const placed = (useLocation().state as { placed?: boolean } | null)?.placed
  const queryClient = useQueryClient()
  const order = useQuery({ queryKey: ['my-order', id], queryFn: () => myOrdersApi.get(id) })
  const cancel = useMutation({
    mutationFn: () => myOrdersApi.cancel(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['my-order', id], updated)
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })

  if (order.isPending) return <Loader />
  if (order.isError)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert>{errorMessage(order.error)}</Alert>
      </div>
    )
  const o = order.data

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/mon-espace" className="text-sm font-semibold text-brand-700">
        ← Mon espace
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Commande {o.reference}</h1>
          <p className="text-sm text-slate-500">
            Passée le {formatDate(o.createdAt)} · {DELIVERY_LABELS[o.deliveryMode]}
          </p>
        </div>
        <Badge tone={orderTone(o.status)}>{clientStepLabel(o.status, o.deliveryMode)}</Badge>
      </div>

      {placed && (
        <div className="mt-4">
          <Alert type="success">Merci ! Votre commande est enregistrée. La boutique va la confirmer, puis vous prévenir.</Alert>
        </div>
      )}

      <Card className="mt-6">
        {o.status === 'ANNULEE' ? (
          <p className="text-sm text-slate-700">
            Cette commande a été annulée{o.cancelReason ? ` (${o.cancelReason})` : ''}. Les articles sont de nouveau disponibles en boutique.
          </p>
        ) : (
          <Steps order={o} />
        )}
      </Card>

      <Card className="mt-6 p-0!">
        <ul className="divide-y divide-slate-100">
          {o.lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-3 p-4">
              <ProductImage src={line.imageUrl} alt={line.productName} className="size-14 shrink-0 rounded-lg ring-1 ring-slate-200" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{line.productName}</p>
                <p className="text-sm text-slate-500 tabular-nums">
                  {line.quantity} × {formatFcfa(line.unitPrice)}
                </p>
              </div>
              <p className="font-bold tabular-nums">{formatFcfa(line.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t border-slate-100 p-4 text-sm">
          <Row label="Articles" value={formatFcfa(o.subtotal)} />
          <Row label="Livraison" value={o.deliveryFee ? formatFcfa(o.deliveryFee) : 'Gratuit'} />
          <div className="flex justify-between pt-1 text-base">
            <dt className="font-bold">Total {o.status === 'REMISE' ? 'payé' : 'à payer'}</dt>
            <dd className="font-extrabold tabular-nums">{formatFcfa(o.total)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-6 space-y-1 text-sm text-slate-700">
        {o.deliveryMode === 'LIVRAISON' ? (
          <p>
            <strong>Livraison :</strong> {o.address}
          </p>
        ) : (
          <p>
            <strong>Retrait :</strong> boutique MilaTech, {COMPANY.district}, {COMPANY.directions}
          </p>
        )}
        <p>
          <strong>Téléphone :</strong> {o.phone}
        </p>
        {o.note && (
          <p>
            <strong>Précision :</strong> {o.note}
          </p>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsappLink(COMPANY.whatsapp, `Bonjour MilaTech, au sujet de ma commande ${o.reference} : `)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <MessageCircle className="size-4" aria-hidden />
          Écrire à la boutique
        </a>
        {o.status === 'EN_ATTENTE' && (
          <Button variant="ghost" loading={cancel.isPending} onClick={() => window.confirm('Annuler cette commande ?') && cancel.mutate()}>
            Annuler la commande
          </Button>
        )}
      </div>
      <div className="mt-3">
        <Alert>{cancel.isError ? errorMessage(cancel.error) : ''}</Alert>
      </div>
    </div>
  )
}

function Steps({ order }: { order: Order }) {
  const current = STEPS.indexOf(order.status)
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {STEPS.map((step, index) => {
        const done = index <= current
        return (
          <li key={step} className="flex items-center gap-2 sm:flex-col sm:text-center">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {index < current ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span className={`text-sm ${index === current ? 'font-bold text-ink' : done ? 'text-slate-700' : 'text-slate-400'}`}>
              {clientStepLabel(step, order.deliveryMode)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
