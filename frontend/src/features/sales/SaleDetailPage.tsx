import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, salesApi } from '../../api/client'
import { PAYMENT_LABELS } from '../../api/types'
import { Alert, Button, Card, Loader, PageHeader } from '../../components/ui'
import { formatFcfa } from '../../lib/format'

// Detail d'une vente : lignes aux prix figes, total, marge (gerant) et recu PDF
export default function SaleDetailPage() {
  const id = Number(useParams().id)
  const { data: sale, isPending, isError, error } = useQuery({ queryKey: ['sales', 'detail', id], queryFn: () => salesApi.get(id) })

  if (isPending) return <Loader />
  if (isError) return <Alert>{errorMessage(error)}</Alert>

  return (
    <>
      <Link to="/ventes" className="text-sm font-semibold text-brand-700">
        ← Ventes
      </Link>
      <PageHeader
        title={`Vente ${sale.reference}`}
        subtitle={`${new Date(sale.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })} · ${sale.seller}`}
        actions={
          <Button variant="secondary" onClick={() => salesApi.openReceipt(sale.id)}>
            <Printer className="size-4" aria-hidden />
            Reçu (PDF)
          </Button>
        }
      />
      <Card className="max-w-2xl">
        <p className="text-sm text-slate-600">
          {sale.customer ? (
            <>
              Client : <Link to={`/clients/${sale.customer.id}`} className="font-semibold text-brand-700">{sale.customer.name}</Link>
            </>
          ) : (
            'Client de passage'
          )}{' '}
          · {PAYMENT_LABELS[sale.paymentMethod]}
        </p>
        <ul className="mt-4 divide-y divide-slate-100">
          {sale.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-semibold">
                  {line.quantity} × {line.productName}
                </p>
                <p className="text-xs text-slate-500">
                  {line.productReference} · {formatFcfa(line.unitPrice)} l’unité
                  {line.unitCost !== undefined && ` · achat ${formatFcfa(line.unitCost)}`}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{formatFcfa(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">{formatFcfa(sale.total)}</span>
        </div>
        {sale.margin !== undefined && (
          <p className="mt-1 text-right text-sm text-slate-500">Marge théorique : {formatFcfa(sale.margin)}</p>
        )}
      </Card>
    </>
  )
}
