import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Phone } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, ordersApi } from '../../api/client'
import { DELIVERY_LABELS, PAYMENT_LABELS } from '../../api/types'
import type { Order, OrderStatus, PaymentMethod } from '../../api/types'
import { Alert, Badge, Button, Card, Field, Loader, PageHeader, Select } from '../../components/ui'
import { formatFcfa } from '../../lib/format'
import { actionLabel, orderTone, orderWhatsappMessage } from '../../lib/orders'
import { whatsappLink } from '../../lib/whatsapp'
import { ProductImage } from './ProductImage'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Detail d'une commande en ligne pour la boutique : client, articles, etapes suivantes
export default function OrderDetailPage() {
  const id = Number(useParams().id)
  const order = useQuery({ queryKey: ['order', id], queryFn: () => ordersApi.get(id) })

  if (order.isPending) return <Loader />
  if (order.isError) return <Alert>{errorMessage(order.error)}</Alert>
  const o = order.data

  return (
    <>
      <Link to="/commandes" className="text-sm font-semibold text-brand-700">
        ← Commandes en ligne
      </Link>
      <PageHeader
        title={`Commande ${o.reference}`}
        subtitle={`${DELIVERY_LABELS[o.deliveryMode]} · passée le ${dateTime(o.createdAt)}`}
        actions={<Badge tone={orderTone(o.status)}>{o.statusLabel}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-0!">
            <ul className="divide-y divide-slate-100">
              {o.lines.map((line) => (
                <li key={line.productId} className="flex items-center gap-3 p-4">
                  <ProductImage src={line.imageUrl} alt={line.productName} className="size-12 shrink-0 rounded-lg ring-1 ring-slate-200" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/produits/${line.productId}`} className="font-semibold hover:text-brand-700">
                      {line.productName}
                    </Link>
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
              <Row label={<strong>Total à encaisser</strong>} value={<strong className="text-base">{formatFcfa(o.total)}</strong>} />
            </dl>
          </Card>
          <Actions order={o} />
        </div>

        <Card className="h-fit space-y-3 text-sm">
          <h2 className="font-bold">Client</h2>
          <p className="text-base font-semibold">
            <Link to={`/clients/${o.customer.id}`} className="hover:text-brand-700">
              {o.customer.fullName}
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">
              <Phone className="size-4" aria-hidden />
              {o.phone}
            </a>
            <a
              href={whatsappLink(o.phone, orderWhatsappMessage(o))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </div>
          {o.deliveryMode === 'LIVRAISON' && (
            <p>
              <span className="text-slate-500">Adresse : </span>
              {o.address}
            </p>
          )}
          {o.note && (
            <p>
              <span className="text-slate-500">Précision : </span>
              {o.note}
            </p>
          )}
          {o.cancelReason && (
            <p>
              <span className="text-slate-500">Motif d’annulation : </span>
              {o.cancelReason}
            </p>
          )}
          {o.saleId && (
            <p>
              <span className="text-slate-500">Vente : </span>
              <Link to={`/ventes/${o.saleId}`} className="font-semibold text-brand-700">
                {o.saleReference}
              </Link>
            </p>
          )}
        </Card>
      </div>
    </>
  )
}

/** Boutons des etapes suivantes ; la remise demande le moyen de paiement, l'annulation un motif. */
function Actions({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const [method, setMethod] = useState<PaymentMethod>('ESPECES')
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const move = useMutation({
    mutationFn: (status: OrderStatus) =>
      ordersApi.move(order.id, {
        status,
        paymentMethod: status === 'REMISE' ? method : undefined,
        note: status === 'ANNULEE' ? reason : undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order', order.id], updated)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setCancelling(false)
    },
  })

  if (order.nextStatuses.length === 0) return null
  const forward = order.nextStatuses.filter((status) => status !== 'ANNULEE')

  return (
    <Card className="space-y-4">
      <h2 className="font-bold">Étape suivante</h2>
      <Alert>{move.isError ? errorMessage(move.error) : ''}</Alert>
      {forward.map((status) => (
        <div key={status} className="flex flex-wrap items-end gap-3">
          {status === 'REMISE' && (
            <Select label="Le client a payé par" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-48">
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          <Button loading={move.isPending && move.variables === status} disabled={move.isPending} onClick={() => move.mutate(status)}>
            {actionLabel(status, order.deliveryMode)}
          </Button>
        </div>
      ))}
      {order.nextStatuses.includes('ANNULEE') && (
        <div className="border-t border-slate-100 pt-4">
          {!cancelling ? (
            <Button variant="ghost" onClick={() => setCancelling(true)}>
              Annuler la commande…
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Motif d’annulation" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Client injoignable, article abîmé…" className="min-w-60 flex-1" />
              <Button variant="danger" loading={move.isPending && move.variables === 'ANNULEE'} onClick={() => move.mutate('ANNULEE')}>
                Confirmer l’annulation
              </Button>
              <Button variant="ghost" onClick={() => setCancelling(false)}>
                Retour
              </Button>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">Les articles reviennent alors en stock.</p>
        </div>
      )}
    </Card>
  )
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
