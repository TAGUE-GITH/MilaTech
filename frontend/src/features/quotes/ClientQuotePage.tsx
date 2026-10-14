import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, MessageCircle } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { errorMessage, imageUrl, myQuotesApi } from '../../api/client'
import { DEVICE_LABELS } from '../../api/types'
import type { Quote } from '../../api/types'
import { Alert, Badge, Button, Card, Loader } from '../../components/ui'
import { buttonClasses } from '../../components/buttonClasses'
import { COMPANY } from '../../lib/company'
import { formatDate, formatFcfa } from '../../lib/format'
import { clientQuoteLabel, quoteTone } from '../../lib/quotes'
import { whatsappLink } from '../../lib/whatsapp'

// Suivi d'une demande de devis par le client : prix propose, acceptation ou refus
export default function ClientQuotePage() {
  const id = Number(useParams().id)
  const sent = (useLocation().state as { sent?: boolean } | null)?.sent
  const queryClient = useQueryClient()
  const quote = useQuery({ queryKey: ['my-quote', id], queryFn: () => myQuotesApi.get(id) })
  const act = useMutation({
    mutationFn: (action: 'accept' | 'refuse' | 'cancel') => myQuotesApi[action](id),
    onSuccess: (updated) => {
      queryClient.setQueryData(['my-quote', id], updated)
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] })
    },
  })

  if (quote.isPending) return <Loader />
  if (quote.isError)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert>{errorMessage(quote.error)}</Alert>
      </div>
    )
  const q = quote.data

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/mon-espace" className="text-sm font-semibold text-brand-700">
        ← Mon espace
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Devis {q.reference}</h1>
          <p className="text-sm text-slate-500">
            {DEVICE_LABELS[q.deviceType]} · {q.device} · demandé le {formatDate(q.createdAt)}
          </p>
        </div>
        <Badge tone={quoteTone(q.status)}>{clientQuoteLabel(q.status)}</Badge>
      </div>

      {sent && (
        <div className="mt-4">
          <Alert type="success">Demande envoyée ! La boutique vous répond ici avec un prix, en général dans la journée.</Alert>
        </div>
      )}

      <Answer quote={q} />
      <div className="mt-3">
        <Alert>{act.isError ? errorMessage(act.error) : ''}</Alert>
      </div>
      {q.status === 'DEVIS_ENVOYE' && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button loading={act.isPending && act.variables === 'accept'} disabled={act.isPending} onClick={() => act.mutate('accept')}>
            Accepter le devis
          </Button>
          <Button variant="ghost" disabled={act.isPending} onClick={() => window.confirm('Refuser ce devis ?') && act.mutate('refuse')}>
            Refuser
          </Button>
        </div>
      )}

      <Card className="mt-6 flex flex-wrap gap-5">
        {q.imageUrl && (
          <a href={imageUrl(q.imageUrl)} target="_blank" rel="noreferrer" className="shrink-0">
            <img src={imageUrl(q.imageUrl)} alt="Photo envoyée" className="size-28 rounded-xl object-cover ring-1 ring-slate-200" />
          </a>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">La panne décrite</h2>
          <p className="mt-1 whitespace-pre-line text-slate-700">{q.issue}</p>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsappLink(COMPANY.whatsapp, `Bonjour MilaTech, au sujet de ma demande de devis ${q.reference} : `)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <MessageCircle className="size-4" aria-hidden />
          Écrire à la boutique
        </a>
        {q.status === 'NOUVELLE' && (
          <Button variant="ghost" loading={act.isPending} onClick={() => window.confirm('Annuler cette demande ?') && act.mutate('cancel')}>
            Annuler la demande
          </Button>
        )}
      </div>
    </div>
  )
}

/** Reponse de la boutique et ce que le client doit faire ensuite. */
function Answer({ quote }: { quote: Quote }) {
  if (quote.status === 'NOUVELLE')
    return (
      <Card className="mt-6">
        <p className="text-slate-700">La boutique étudie votre demande. Vous verrez le prix ici dès qu’il sera prêt.</p>
      </Card>
    )
  if (quote.status === 'ANNULEE')
    return (
      <Card className="mt-6">
        <p className="text-slate-700">Vous avez annulé cette demande.</p>
      </Card>
    )
  return (
    <Card className="mt-6 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold">Prix proposé par la boutique</h2>
        <p className="text-3xl font-extrabold text-brand-800 tabular-nums">{formatFcfa(quote.quotedPrice ?? 0)}</p>
      </div>
      {quote.quoteMessage && <p className="rounded-xl bg-slate-50 p-3 text-slate-700">{quote.quoteMessage}</p>}
      <p className="text-xs text-slate-500">Prix estimé : le technicien le confirme après avoir examiné l’appareil, avant toute réparation.</p>
      {quote.status === 'ACCEPTEE' && (
        <Alert type="success">
          Devis accepté. Apportez votre appareil à la boutique : {COMPANY.district}, {COMPANY.directions}
        </Alert>
      )}
      {quote.status === 'ACCEPTEE' && (
        <a href={COMPANY.mapsUrl} target="_blank" rel="noreferrer" className={buttonClasses('secondary')}>
          <MapPin className="size-4" aria-hidden />
          Voir le plan
        </a>
      )}
      {quote.status === 'REFUSEE' && <p className="text-sm text-slate-600">Vous avez refusé ce devis.</p>}
      {quote.status === 'DEPOSEE' && quote.repairId && (
        <p className="text-sm">
          Votre appareil est à la boutique.{' '}
          <Link to={`/mon-espace/reparations/${quote.repairId}`} className="font-semibold text-brand-700">
            Suivre la réparation {quote.repairReference}
          </Link>
        </p>
      )}
    </Card>
  )
}
