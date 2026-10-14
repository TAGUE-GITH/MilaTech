import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileText, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { errorMessage, fieldErrors, productsApi, repairsApi } from '../../api/client'
import type { RepairChanges } from '../../api/client'
import { DEVICE_LABELS, PAYMENT_LABELS, REPAIR_STATUS_LABELS } from '../../api/types'
import type { PaymentMethod, Repair, RepairStatus } from '../../api/types'
import { Alert, Badge, Button, Card, Field, Loader, PageHeader, Select, TextArea } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'
import { customerMessage, statusTone } from '../../lib/repairs'
import { whatsappLink } from '../../lib/whatsapp'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Apres chaque action : le dossier affiche est remplace par la reponse du serveur. */
function useRepairUpdate(id: number) {
  const queryClient = useQueryClient()
  return (updated: Repair) => {
    queryClient.setQueryData(['repair', id], updated)
    for (const key of ['repairs', 'products', 'product', 'stock-alerts', 'customer'])
      queryClient.invalidateQueries({ queryKey: [key] })
  }
}

// US-15 a US-19 : dossier de reparation
export default function RepairDetailPage() {
  const id = Number(useParams().id)
  const created = (useLocation().state as { created?: boolean } | null)?.created
  const { data: repair, isPending, isError, error } = useQuery({ queryKey: ['repair', id], queryFn: () => repairsApi.get(id) })

  if (isPending) return <Loader />
  if (isError) return <Alert>{errorMessage(error)}</Alert>
  const closed = repair.status === 'RESTITUE'

  return (
    <>
      <Link to="/reparations" className="text-sm font-semibold text-brand-700">
        ← Réparations
      </Link>
      {created && (
        <div className="my-4">
          <Alert type="success">Dépôt enregistré. Imprimez le bon de dépôt et remettez-le au client.</Alert>
        </div>
      )}
      <PageHeader
        title={repair.device}
        subtitle={`${repair.reference} · ${DEVICE_LABELS[repair.deviceType]}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => repairsApi.openSlip(repair.id)}>
              <FileText className="size-4" aria-hidden />
              Bon de dépôt
            </Button>
            <a
              href={whatsappLink(repair.customer.phone, customerMessage(repair))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="size-4" aria-hidden />
              {repair.status === 'REPARE' || repair.status === 'IRREPARABLE' ? 'Prévenir le client' : 'WhatsApp'}
            </a>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Un nouveau paiement efface un ancien refus de restitution (le probleme est regle) */}
          <Steps key={repair.paid} repair={repair} />
          <Diagnosis repair={repair} disabled={closed} />
          <Parts repair={repair} />
        </div>
        <div className="space-y-6">
          <Amounts repair={repair} disabled={closed} />
          <Card>
            <h2 className="mb-3 font-bold">Dépôt</h2>
            <dl className="space-y-2 text-sm">
              <Info label="Client">
                <Link to={`/clients/${repair.customer.id}`} className="font-semibold text-brand-700">
                  {repair.customer.fullName}
                </Link>{' '}
                · {repair.customer.phone}
              </Info>
              <Info label="Panne signalée">{repair.reportedIssue}</Info>
              {repair.serialNumber && <Info label="N° série / IMEI">{repair.serialNumber}</Info>}
              <Info label="Accessoires">{repair.accessories ?? 'Aucun'}</Info>
              <Info label="Reçu">
                {dateTime(repair.receivedAt)} par {repair.receivedBy} {repair.reception === 'DOMICILE' && '(à domicile)'}
              </Info>
              {repair.promisedOn && <Info label="Prévu le">{formatDate(repair.promisedOn)}</Info>}
              {repair.returnedAt && <Info label="Restitué le">{dateTime(repair.returnedAt)}</Info>}
            </dl>
          </Card>
          <History repair={repair} />
        </div>
      </div>
    </>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// R6 : etapes suivantes possibles, avec une note facultative
function Steps({ repair }: { repair: Repair }) {
  const update = useRepairUpdate(repair.id)
  const [note, setNote] = useState('')
  const move = useMutation({
    mutationFn: (status: RepairStatus) => repairsApi.move(repair.id, status, note),
    onSuccess: (updated) => {
      update(updated)
      setNote('')
    },
  })

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Étape</h2>
        <Badge tone={statusTone(repair.status)}>{repair.statusLabel}</Badge>
      </div>
      {repair.nextStatuses.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" aria-hidden />
          Appareil restitué : le dossier est clos.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <Field label="Note (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Devis accepté par téléphone, pièce commandée…" />
          <Alert>{move.isError ? errorMessage(move.error) : ''}</Alert>
          <div className="flex flex-wrap gap-2">
            {repair.nextStatuses.map((status) => {
              const negative = status === 'IRREPARABLE' || status === 'ANNULE'
              return (
                <Button key={status} variant={negative ? 'danger' : 'primary'} loading={move.isPending && move.variables === status} onClick={() => move.mutate(status)}>
                  {status === 'RESTITUE' ? 'Restituer au client' : `Passer à « ${REPAIR_STATUS_LABELS[status]} »`}
                </Button>
              )
            })}
          </div>
          {repair.nextStatuses.includes('RESTITUE') && repair.balance > 0 && (
            <p className="text-xs text-amber-700">Reste à payer {formatFcfa(repair.balance)} avant de restituer l’appareil.</p>
          )}
        </div>
      )}
    </Card>
  )
}

function Diagnosis({ repair, disabled }: { repair: Repair; disabled: boolean }) {
  const update = useRepairUpdate(repair.id)
  const [form, setForm] = useState({
    diagnosis: repair.diagnosis ?? '',
    laborCost: repair.laborCost === 0 ? '' : String(repair.laborCost),
    estimatedCost: repair.estimatedCost === null ? '' : String(repair.estimatedCost),
    promisedOn: repair.promisedOn ?? '',
  })
  const [saved, setSaved] = useState(false)
  const save = useMutation({
    mutationFn: () => {
      const changes: RepairChanges = { diagnosis: form.diagnosis, laborCost: Number(form.laborCost || 0) }
      if (form.estimatedCost !== '') changes.estimatedCost = Number(form.estimatedCost)
      if (form.promisedOn) changes.promisedOn = form.promisedOn
      return repairsApi.update(repair.id, changes)
    },
    onSuccess: (updated) => {
      update(updated)
      setSaved(true)
    },
  })
  const errors = fieldErrors(save.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSaved(false)
    save.mutate()
  }

  return (
    <Card>
      <h2 className="mb-3 font-bold">Diagnostic et devis</h2>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Alert type="success">{saved ? 'Enregistré.' : ''}</Alert>
        <Alert>{save.isError && !Object.keys(errors).length ? errorMessage(save.error) : ''}</Alert>
        <TextArea label="Diagnostic du technicien" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} disabled={disabled} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Main-d’œuvre (FCFA)" type="number" min={0} inputMode="numeric" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} error={errors.laborCost} disabled={disabled} />
          <Field label="Coût estimé (FCFA)" type="number" min={0} inputMode="numeric" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} disabled={disabled} />
          <Field label="Date prévue" type="date" value={form.promisedOn} onChange={(e) => setForm({ ...form, promisedOn: e.target.value })} disabled={disabled} />
        </div>
        {!disabled && (
          <Button type="submit" variant="secondary" loading={save.isPending}>
            Enregistrer le diagnostic
          </Button>
        )}
      </form>
    </Card>
  )
}

// R7 : pieces prises dans le stock
function Parts({ repair }: { repair: Repair }) {
  const update = useRepairUpdate(repair.id)
  const allowed = repair.status === 'EN_DIAGNOSTIC' || repair.status === 'EN_REPARATION'
  const [query, setQuery] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const products = useQuery({ queryKey: ['products', { q: query, parts: true }], queryFn: () => productsApi.list({ q: query }), enabled: allowed })
  const add = useMutation({
    mutationFn: () => repairsApi.addPart(repair.id, Number(productId), Number(quantity)),
    onSuccess: (updated) => {
      update(updated)
      setProductId('')
      setQuantity('1')
    },
  })
  const remove = useMutation({ mutationFn: (partId: number) => repairsApi.removePart(repair.id, partId), onSuccess: update })

  return (
    <Card>
      <h2 className="mb-3 font-bold">Pièces utilisées</h2>
      {repair.parts.length === 0 && <p className="text-sm text-slate-500">Aucune pièce pour le moment.</p>}
      <ul className="divide-y divide-slate-100">
        {repair.parts.map((part) => (
          <li key={part.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="flex-1">
              {part.quantity} × {part.productName} <span className="text-slate-500">· {formatFcfa(part.unitPrice)}</span>
            </span>
            <span className="font-semibold tabular-nums">{formatFcfa(part.lineTotal)}</span>
            {allowed && (
              <button type="button" onClick={() => remove.mutate(part.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label={`Retirer ${part.productName}`}>
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Alert>{add.isError ? errorMessage(add.error) : remove.isError ? errorMessage(remove.error) : ''}</Alert>
      {allowed ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <Field label="Chercher une pièce" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Écran, batterie, connecteur…" />
          <div className="flex flex-wrap items-end gap-2">
            <Select label="Pièce" value={productId} onChange={(e) => setProductId(e.target.value)} className="min-w-52 flex-1">
              <option value="">Choisir…</option>
              {products.data?.filter((p) => p.active && p.quantity > 0).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatFcfa(p.salePrice)} ({p.quantity} en stock)
                </option>
              ))}
            </Select>
            <Field label="Quantité" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
            <Button variant="secondary" disabled={!productId} loading={add.isPending} onClick={() => add.mutate()}>
              <Plus className="size-4" aria-hidden />
              Ajouter
            </Button>
          </div>
        </div>
      ) : (
        repair.status === 'RECU' && <p className="mt-3 text-xs text-slate-500">Les pièces s’ajoutent à partir du diagnostic.</p>
      )}
    </Card>
  )
}

function Amounts({ repair, disabled }: { repair: Repair; disabled: boolean }) {
  const update = useRepairUpdate(repair.id)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('ESPECES')
  const pay = useMutation({
    mutationFn: () => repairsApi.pay(repair.id, Number(amount), method),
    onSuccess: (updated) => {
      update(updated)
      setAmount('')
    },
  })
  const errors = fieldErrors(pay.error)
  const partsTotal = repair.total - repair.laborCost

  return (
    <Card>
      <h2 className="mb-3 font-bold">Montant</h2>
      <dl className="space-y-1.5 text-sm">
        <Row label="Main-d’œuvre" value={formatFcfa(repair.laborCost)} />
        <Row label="Pièces" value={formatFcfa(partsTotal)} />
        <Row label="Total" value={formatFcfa(repair.total)} strong />
        <Row label="Déjà payé" value={formatFcfa(repair.paid)} />
        <Row label={repair.balance < 0 ? 'Trop-perçu à rendre' : 'Reste à payer'} value={formatFcfa(Math.abs(repair.balance))} strong />
      </dl>
      {repair.payments.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {repair.payments.map((payment) => (
            <li key={payment.id}>
              {dateTime(payment.paidAt)} · {formatFcfa(payment.amount)} · {PAYMENT_LABELS[payment.method]} · {payment.receivedBy}
            </li>
          ))}
        </ul>
      )}
      {!disabled && repair.remainingToPay > 0 && (
        <form
          className="mt-4 space-y-2 border-t border-slate-100 pt-4"
          onSubmit={(event) => {
            event.preventDefault()
            pay.mutate()
          }}
          noValidate
        >
          <Alert>{pay.isError && !Object.keys(errors).length ? errorMessage(pay.error) : ''}</Alert>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Paiement (FCFA)" type="number" min={1} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(repair.remainingToPay)} error={errors.amount} />
            <Select label="Moyen" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary" loading={pay.isPending} className="w-full">
            Encaisser
          </Button>
        </form>
      )}
    </Card>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-bold' : ''}`}>
      <dt className={strong ? '' : 'text-slate-500'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

function History({ repair }: { repair: Repair }) {
  return (
    <Card>
      <h2 className="mb-3 font-bold">Historique</h2>
      <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
        {repair.events.map((event, index) => (
          <li key={index} className="text-sm">
            <p className="font-semibold">{event.label}</p>
            <p className="text-xs text-slate-500">
              {dateTime(event.createdAt)} · {event.author}
            </p>
            {event.note && <p className="mt-0.5 text-slate-600">{event.note}</p>}
          </li>
        ))}
      </ol>
    </Card>
  )
}
