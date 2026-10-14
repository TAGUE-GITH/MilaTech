import { useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { errorMessage, productsApi } from '../../api/client'
import { Alert, Loader, PageHeader } from '../../components/ui'
import { StockBadge } from './StockBadge'

// US-09 : produits au seuil d'alerte ou en dessous, les plus urgents d'abord
export default function AlertsPage() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ['stock-alerts'], queryFn: productsApi.alerts })

  return (
    <>
      <PageHeader title="Stock bas" subtitle="Produits à racheter : quantité au seuil d’alerte ou en dessous" />
      {isPending && <Loader />}
      {isError && <Alert>{errorMessage(error)}</Alert>}
      {data && data.length === 0 && (
        <p className="flex items-center gap-2 py-10 text-emerald-700">
          <CheckCircle2 className="size-5" aria-hidden />
          Tout le stock est au-dessus des seuils d’alerte.
        </p>
      )}
      {data && data.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {data.map((product) => (
            <li key={product.id}>
              <Link to={`/produits/${product.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.reference} · {product.category.name} · alerte à {product.alertThreshold}
                  </p>
                </div>
                <StockBadge product={product} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
