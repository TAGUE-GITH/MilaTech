import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Phone } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { errorMessage, fieldErrors, imageUrl, quotesApi } from '../../api/client'
import { DEVICE_LABELS, PAYMENT_LABELS } from '../../api/types'
import type { DepositForm, PaymentMethod, Quote } from '../../api/types'
import { Alert, Badge, Button, Card, Field, Loader, PageHeader, Select, TextArea } from '../../components/ui'
import { formatFcfa } from '../../lib/format'
import { quoteTone, quoteWhatsappMessage } from '../../lib/quotes'
import { whatsappLink } from '../../lib/whatsapp'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Detail d'une demande de devis : la panne, le prix a envoyer, puis la reception de l'appareil
export default function QuoteDetailPage() {
  const id = Number(useParams().id)
  const quote = useQuery({ queryKey: ['quote', id], queryFn: () => quotesApi.get(id) })

  if (quote.isPending) return <Loader />
  if (quote.isError) return <Alert>{errorMessage(quote.error)}</Alert>
  const q = quote.data
  const canQuote = q.status === 'NOUVELLE' || q.status === 'DEVIS_ENVOYE'

  return (
    <>
      <Link to="/devis" className="text-sm font-semibold text-brand-700">
        ← Demandes de devis
      </Link>
      <PageHeader
        title={q.device}
        subtitle={`${DEVICE_LABELS[q.deviceType]} · ${q.reference} · demandée le ${dateTime(q.createdAt)}`}
        actions={<Badge tone={quoteTone(q.status)}>{q.statusLabel}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="flex flex-wrap gap-5">
            {q.imageUrl && (
              <a href={imageUrl(q.imageUrl)} target="_blank" rel="noreferrer" className="shrink-0" title="Agrandir la photo">
                <img src={imageUrl(q.imageUrl)} alt="Photo envoyée par le client" className="size-40 rounded-xl object-cover ring-1 ring-slate-200" />
              </a>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">Panne décrite par le client</h2>
              <p className="mt-1 whitespace-pre-line text-slate-700">{q.issue}</p>
            </div>
          </Card>
          {canQuote && <AnswerForm quote={q} />}
          {!canQuote && q.quotedPrice && (
            <Card className="space-y-1 text-sm">
              <p>
                Devis envoyé : <strong>{formatFcfa(q.quotedPrice)}</strong>
                {q.quotedBy && ` par ${q.quotedBy}`}
              </p>
              {q.quoteMessage && <p className="text-slate-600">{q.quoteMessage}</p>}
            </Card>
          )}
          {q.status === 'ACCEPTEE' && <ReceiveForm quote={q} />}
          {q.status === 'DEPOSEE' && q.repairId && (
            <Card>
              <p className="text-sm">
                Appareil reçu :{' '}
                <Link to={`/reparations/${q.repairId}`} className="font-semibold text-brand-700">
                  réparation {q.repairReference}
                </Link>
              </p>
            </Card>
          )}
        </div>

        <Card className="h-fit space-y-3 text-sm">
          <h2 className="font-bold">Client</h2>
          <p className="text-base font-semibold">
            <Link to={`/clients/${q.customer.id}`} className="hover:text-brand-700">
              {q.customer.fullName}
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${q.customer.phone}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">
              <Phone className="size-4" aria-hidden />
              {q.customer.phone}
            </a>
            <a
              href={whatsappLink(q.customer.phone, q.quotedPrice ? quoteWhatsappMessage(q) : `Bonjour ${q.customer.fullName}, au sujet de votre demande de devis ${q.reference} : `)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </div>
          {q.status === 'DEVIS_ENVOYE' && <p className="text-xs text-slate-500">Le client voit le prix dans son espace et peut l’accepter.</p>}
        </Card>
      </div>
    </>
  )
}

/** Prix envoye au client (modifiable tant qu'il n'a pas repondu). */
function AnswerForm({ quote }: { quote: Quote }) {
  const queryClient = useQueryClient()
  const [price, setPrice] = useState(quote.quotedPrice ? String(quote.quotedPrice) : '')
  const [message, setMessage] = useState(quote.quoteMessage ?? '')
  const [done, setDone] = useState(false)
  const answer = useMutation({
    mutationFn: () => quotesApi.answer(quote.id, Number(price), message),
    onSuccess: (updated) => {
      queryClient.setQueryData(['quote', quote.id], updated)
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      setDone(true)
    },
  })
  const errors = fieldErrors(answer.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setDone(false)
    answer.mutate()
  }

  return (
    <Card>
      <h2 className="mb-3 font-bold">{quote.status === 'NOUVELLE' ? 'Envoyer un prix au client' : 'Corriger le devis'}</h2>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Alert type="success">{done ? 'Devis envoyé : le client le voit dans son espace. Prévenez-le sur WhatsApp.' : ''}</Alert>
        <Alert>{answer.isError && !Object.keys(errors).length ? errorMessage(answer.error) : ''}</Alert>
        <Field label="Prix estimé (FCFA)" type="number" min={1} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} className="max-w-xs" />
        <TextArea label="Explication pour le client" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} placeholder="Ex. : écran d’origine, réparé en 24 h, garantie 1 mois." />
        <Button type="submit" loading={answer.isPending}>
          {quote.status === 'NOUVELLE' ? 'Envoyer le devis' : 'Mettre à jour le devis'}
        </Button>
      </form>
    </Card>
  )
}

/** Le client apporte l'appareil : on ouvre le dossier de reparation (bon de depot ensuite). */
function ReceiveForm({ quote }: { quote: Quote }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<DepositForm>({ serialNumber: '', accessories: '', promisedOn: '', deposit: '', depositMethod: 'ESPECES' })
  const set = (changes: Partial<DepositForm>) => setForm((current) => ({ ...current, ...changes }))
  const receive = useMutation({
    mutationFn: () => quotesApi.deposit(quote.id, form),
    onSuccess: (repair) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      navigate(`/reparations/${repair.id}`)
    },
  })
  const errors = fieldErrors(receive.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    receive.mutate()
  }

  return (
    <Card>
      <h2 className="font-bold">Le client a accepté : recevoir l’appareil</h2>
      <p className="mt-1 mb-3 text-sm text-slate-600">Quand le client apporte l’appareil, ouvrez la réparation : le prix accepté devient l’estimation.</p>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Alert>{receive.isError && !Object.keys(errors).length ? errorMessage(receive.error) : ''}</Alert>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Numéro de série / IMEI" value={form.serialNumber} onChange={(e) => set({ serialNumber: e.target.value })} />
          <Field label="Accessoires laissés" value={form.accessories} onChange={(e) => set({ accessories: e.target.value })} placeholder="Coque, chargeur…" />
          <Field label="Prêt le" type="date" value={form.promisedOn} onChange={(e) => set({ promisedOn: e.target.value })} />
          <Field label="Acompte (FCFA)" type="number" min={0} inputMode="numeric" value={form.deposit} onChange={(e) => set({ deposit: e.target.value === '' ? '' : Number(e.target.value) })} error={errors.deposit} />
        </div>
        {Number(form.deposit) > 0 && (
          <Select label="Acompte payé par" value={form.depositMethod} onChange={(e) => set({ depositMethod: e.target.value as PaymentMethod })} className="max-w-xs">
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
        <Button type="submit" loading={receive.isPending}>
          Ouvrir la réparation
        </Button>
      </form>
    </Card>
  )
}
