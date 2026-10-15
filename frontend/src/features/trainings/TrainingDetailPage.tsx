import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, fieldErrors, trainingsApi } from '../../api/client'
import { ENROLLMENT_LABELS, PAYMENT_LABELS } from '../../api/types'
import type { Customer, Enrollment, EnrollmentStatus, PaymentMethod, Training } from '../../api/types'
import { Alert, Badge, Button, Card, Field, Loader, PageHeader, Select } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'
import { CustomerPicker } from '../customers/CustomerPicker'

// US-21 et US-22 : inscriptions, paiements et liste imprimable des apprenants
export default function TrainingDetailPage() {
  const id = Number(useParams().id)
  const { data: training, isPending, isError, error } = useQuery({ queryKey: ['training', id], queryFn: () => trainingsApi.get(id) })

  if (isPending) return <Loader />
  if (isError) return <Alert>{errorMessage(error)}</Alert>
  const active = training.enrollments.filter((e) => e.status !== 'ABANDON')

  return (
    <>
      <Link to="/formations" className="text-sm font-semibold text-brand-700 print:hidden">
        ← Formations
      </Link>
      <PageHeader
        title={training.title}
        subtitle={`Du ${formatDate(training.startDate)} au ${formatDate(training.endDate)} · ${formatFcfa(training.fee)}${training.trainer ? ` · Formateur : ${training.trainer}` : ''}`}
        actions={
          <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" aria-hidden />
            Imprimer la liste
          </Button>
        }
      />
      {training.description && <p className="-mt-3 mb-6 text-sm text-slate-600">{training.description}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] print:block">
        {/* min-w-0 : le tableau defile dans sa zone au lieu d'elargir la page sur telephone */}
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-4 text-sm print:hidden">
            <span>
              <strong>{active.length}</strong> / {training.capacity} apprenants
            </span>
            <span>
              Reste à encaisser : <strong>{formatFcfa(training.balanceDue)}</strong>
            </span>
          </div>
          {training.enrollments.length === 0 && <p className="py-10 text-center text-slate-500">Aucun apprenant inscrit.</p>}
          {training.enrollments.length > 0 && (
            <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 print:ring-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">Apprenant</th>
                    <th scope="col" className="px-4 py-3 text-right">Prix</th>
                    <th scope="col" className="px-4 py-3 text-right">Payé</th>
                    <th scope="col" className="px-4 py-3 text-right">Solde</th>
                    <th scope="col" className="px-4 py-3 print:hidden">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {training.enrollments.map((enrollment) => (
                    <LearnerRow key={enrollment.id} trainingId={training.id} enrollment={enrollment} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <EnrollForm training={training} />
      </div>
    </>
  )
}

function useTrainingRefresh(trainingId: number) {
  const queryClient = useQueryClient()
  return () => {
    for (const key of [['training', trainingId], ['trainings'], ['customer']]) queryClient.invalidateQueries({ queryKey: key })
  }
}

function LearnerRow({ trainingId, enrollment }: { trainingId: number; enrollment: Enrollment }) {
  const refresh = useTrainingRefresh(trainingId)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('ESPECES')
  const pay = useMutation({
    mutationFn: () => trainingsApi.pay(enrollment.id, Number(amount), method),
    onSuccess: () => {
      setAmount('')
      refresh()
    },
  })
  const status = useMutation({ mutationFn: (next: EnrollmentStatus) => trainingsApi.setStatus(enrollment.id, next), onSuccess: refresh })
  const dropped = enrollment.status === 'ABANDON'

  return (
    <tr className={dropped ? 'opacity-50 print:hidden' : ''}>
      <td className="px-4 py-3">
        <Link to={`/clients/${enrollment.customerId}`} className="font-semibold hover:text-brand-700">
          {enrollment.customer}
        </Link>
        <p className="text-xs text-slate-500">
          {enrollment.phone} · {enrollment.reference}{' '}
          {enrollment.status !== 'INSCRIT' && <Badge tone={dropped ? 'slate' : 'green'}>{ENROLLMENT_LABELS[enrollment.status]}</Badge>}
        </p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{formatFcfa(enrollment.agreedFee)}</td>
      <td className="px-4 py-3 text-right tabular-nums">{formatFcfa(enrollment.paid)}</td>
      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${enrollment.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
        {enrollment.balance > 0 ? formatFcfa(enrollment.balance) : 'Soldé'}
      </td>
      <td className="px-4 py-3 print:hidden">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {enrollment.balance > 0 && !dropped && (
            <form
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault()
                pay.mutate()
              }}
            >
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(enrollment.balance)}
                aria-label={`Paiement de ${enrollment.customer}`}
                className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} aria-label="Moyen de paiement" className="rounded-lg border border-slate-300 px-1.5 py-1.5 text-sm">
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_LABELS[m]}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" className="px-3 py-1.5" loading={pay.isPending} disabled={!amount}>
                Encaisser
              </Button>
            </form>
          )}
          <select
            value={enrollment.status}
            onChange={(e) => status.mutate(e.target.value as EnrollmentStatus)}
            aria-label={`Statut de ${enrollment.customer}`}
            className="rounded-lg border border-slate-300 px-1.5 py-1.5 text-sm"
          >
            {(Object.keys(ENROLLMENT_LABELS) as EnrollmentStatus[]).map((s) => (
              <option key={s} value={s}>
                {ENROLLMENT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {pay.isError && <p className="mt-1 text-right text-xs text-red-700">{errorMessage(pay.error)}</p>}
      </td>
    </tr>
  )
}

function EnrollForm({ training }: { training: Training }) {
  const refresh = useTrainingRefresh(training.id)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [agreedFee, setAgreedFee] = useState('')
  const [firstPayment, setFirstPayment] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('ESPECES')
  const [done, setDone] = useState('')
  const enroll = useMutation({
    mutationFn: () =>
      trainingsApi.enroll(training.id, {
        customerId: customer!.id,
        agreedFee: agreedFee === '' ? undefined : Number(agreedFee),
        firstPayment: firstPayment === '' ? undefined : Number(firstPayment),
        paymentMethod: method,
      }),
    onSuccess: (enrollment) => {
      setDone(`${enrollment.customer} est inscrit(e) (${enrollment.reference}).`)
      setCustomer(null)
      setAgreedFee('')
      setFirstPayment('')
      refresh()
    },
  })
  const errors = fieldErrors(enroll.error)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setDone('')
    enroll.mutate()
  }

  return (
    <Card className="h-fit print:hidden">
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <UserPlus className="size-5 text-brand-700" aria-hidden />
        Inscrire un apprenant
      </h2>
      {training.seatsLeft === 0 ? (
        <Alert>La session est complète.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <Alert type="success">{done}</Alert>
          <Alert>{enroll.isError && !Object.keys(errors).length ? errorMessage(enroll.error) : ''}</Alert>
          <CustomerPicker value={customer} onChange={setCustomer} emptyLabel="Choisir l’apprenant" />
          <Field label="Prix convenu (FCFA)" type="number" min={0} inputMode="numeric" value={agreedFee} onChange={(e) => setAgreedFee(e.target.value)} placeholder={String(training.fee)} hint="Laisser vide pour le prix de la session" error={errors.agreedFee} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Premier paiement" type="number" min={0} inputMode="numeric" value={firstPayment} onChange={(e) => setFirstPayment(e.target.value)} error={errors.firstPayment} />
            <Select label="Moyen" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={enroll.isPending} disabled={!customer} className="w-full">
            Inscrire
          </Button>
          <p className="text-xs text-slate-500">{training.seatsLeft} place(s) restante(s)</p>
        </form>
      )}
    </Card>
  )
}
