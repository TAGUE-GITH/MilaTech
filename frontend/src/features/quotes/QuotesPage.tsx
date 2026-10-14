import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, quotesApi } from '../../api/client'
import { Alert, Badge, Card, Loader, PageHeader } from '../../components/ui'
import { formatFcfa } from '../../lib/format'
import { quoteTone } from '../../lib/quotes'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Demandes de devis envoyees par les clients depuis le site
export default function QuotesPage() {
  const [open, setOpen] = useState(true)
  const quotes = useQuery({ queryKey: ['quotes', open], queryFn: () => quotesApi.list(open), refetchInterval: 60_000 })

  return (
    <>
      <PageHeader title="Demandes de devis" subtitle="Pannes décrites par les clients sur le site : envoyez-leur un prix" />
      <div className="mb-4 flex gap-2" role="group" aria-label="Afficher">
        {[
          { value: true, label: 'En cours' },
          { value: false, label: 'Toutes' },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={open === option.value}
            onClick={() => setOpen(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${open === option.value ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-slate-700 ring-slate-300'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {quotes.isPending && <Loader />}
      {quotes.isError && <Alert>{errorMessage(quotes.error)}</Alert>}
      {quotes.data?.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500">{open ? 'Aucune demande en cours.' : 'Aucune demande pour le moment.'}</p>
        </Card>
      )}
      {quotes.data && quotes.data.length > 0 && (
        <Card className="p-0!">
          <ul className="divide-y divide-slate-100">
            {quotes.data.map((quote) => (
              <li key={quote.id}>
                <Link to={`/devis/${quote.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {quote.device} <span className="font-normal text-slate-500">· {quote.reference}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {quote.customer} · {quote.customerPhone} · {dateTime(quote.createdAt)}
                    </p>
                  </div>
                  {quote.quotedPrice && <span className="font-bold tabular-nums">{formatFcfa(quote.quotedPrice)}</span>}
                  <Badge tone={quoteTone(quote.status)}>{quote.statusLabel}</Badge>
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
