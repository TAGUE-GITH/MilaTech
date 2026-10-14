import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, myQuotesApi } from '../../api/client'
import { DEVICE_LABELS } from '../../api/types'
import { Alert, Badge, Card, Loader } from '../../components/ui'
import { COMPANY } from '../../lib/company'
import { formatDate, formatFcfa } from '../../lib/format'
import { statusTone } from '../../lib/repairs'
import { whatsappLink } from '../../lib/whatsapp'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Suivi d'une reparation par le client : etapes, diagnostic, montant et reste a payer
export default function ClientRepairPage() {
  const id = Number(useParams().id)
  const repair = useQuery({ queryKey: ['my-repair', id], queryFn: () => myQuotesApi.repair(id) })

  if (repair.isPending) return <Loader />
  if (repair.isError)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert>{errorMessage(repair.error)}</Alert>
      </div>
    )
  const r = repair.data
  const ready = r.status === 'REPARE' || r.status === 'IRREPARABLE' || r.status === 'ANNULE'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/mon-espace" className="text-sm font-semibold text-brand-700">
        ← Mon espace
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{r.device}</h1>
          <p className="text-sm text-slate-500">
            {DEVICE_LABELS[r.deviceType]} · réparation {r.reference} · déposé le {formatDate(r.receivedAt)}
          </p>
        </div>
        <Badge tone={statusTone(r.status)}>{r.statusLabel}</Badge>
      </div>

      {ready && (
        <div className="mt-4">
          <Alert type="success">
            Votre appareil vous attend à la boutique.{r.balance > 0 ? ` Reste à payer : ${formatFcfa(r.balance)}.` : ''} Pensez à votre bon de dépôt.
          </Alert>
        </div>
      )}
      {r.promisedOn && !ready && r.status !== 'RESTITUE' && <p className="mt-4 text-sm text-slate-600">Prévu pour le {formatDate(r.promisedOn)}.</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Étapes</h2>
          <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
            {r.steps.map((step, index) => (
              <li key={index} className="relative">
                <span className={`absolute top-1.5 -left-[1.4rem] size-3 rounded-full ${index === r.steps.length - 1 ? 'bg-brand-700' : 'bg-slate-300'}`} aria-hidden />
                <p className={index === r.steps.length - 1 ? 'font-bold' : 'text-slate-700'}>{step.label}</p>
                <p className="text-xs text-slate-500">{dateTime(step.at)}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-3 text-sm">
          <div>
            <h2 className="font-bold">Panne signalée</h2>
            <p className="mt-1 text-slate-700">{r.reportedIssue}</p>
          </div>
          {r.diagnosis && (
            <div>
              <h2 className="font-bold">Diagnostic</h2>
              <p className="mt-1 text-slate-700">{r.diagnosis}</p>
            </div>
          )}
          <dl className="space-y-1.5 border-t border-slate-100 pt-3">
            {r.parts.map((part, index) => (
              <Row key={index} label={`${part.productName} × ${part.quantity}`} value={formatFcfa(part.lineTotal)} />
            ))}
            {r.laborCost > 0 && <Row label="Main-d’œuvre" value={formatFcfa(r.laborCost)} />}
            {r.total > 0 ? (
              <Row label="Total" value={formatFcfa(r.total)} strong />
            ) : (
              r.estimatedCost != null && <Row label="Prix estimé" value={formatFcfa(r.estimatedCost)} strong />
            )}
            {r.paid > 0 && <Row label="Déjà payé" value={formatFcfa(r.paid)} />}
            {r.balance > 0 && <Row label="Reste à payer" value={formatFcfa(r.balance)} strong />}
          </dl>
        </Card>
      </div>

      <a
        href={whatsappLink(COMPANY.whatsapp, `Bonjour MilaTech, au sujet de la réparation ${r.reference} (${r.device}) : `)}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        <MessageCircle className="size-4" aria-hidden />
        Écrire à la boutique
      </a>
    </div>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={strong ? 'font-bold' : 'text-slate-500'}>{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-extrabold' : 'font-semibold'}`}>{value}</dd>
    </div>
  )
}
