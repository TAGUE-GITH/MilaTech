import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Pencil, Phone } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { customersApi, errorMessage, fieldErrors } from '../../api/client'
import { PAYMENT_LABELS } from '../../api/types'
import type { Customer, CustomerForm } from '../../api/types'
import { Alert, Button, Card, Field, Loader, PageHeader, TextArea } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'
import { whatsappLink } from '../../lib/whatsapp'

// US-10 : fiche d'un client et son historique
export default function CustomerDetailPage() {
  const id = Number(useParams().id)
  const [editing, setEditing] = useState(false)
  const { data, isPending, isError, error } = useQuery({ queryKey: ['customer', id], queryFn: () => customersApi.get(id) })

  if (isPending) return <Loader />
  if (isError) return <Alert>{errorMessage(error)}</Alert>
  const { customer, sales, totalSpent } = data

  return (
    <>
      <Link to="/clients" className="text-sm font-semibold text-brand-700">
        ← Clients
      </Link>
      <PageHeader
        title={customer.fullName}
        subtitle={`Client depuis le ${formatDate(customer.createdAt)}`}
        actions={
          !editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              Modifier
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          {editing ? (
            <EditCustomer customer={customer} onDone={() => setEditing(false)} />
          ) : (
            <div className="space-y-3 text-sm">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 font-semibold text-brand-700">
                <Phone className="size-4" aria-hidden />
                {customer.phone}
              </a>
              <a href={whatsappLink(customer.phone, `Bonjour ${customer.fullName}, `)} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-emerald-700">
                <MessageCircle className="size-4" aria-hidden />
                Écrire sur WhatsApp
              </a>
              {customer.email && <p>{customer.email}</p>}
              {customer.notes && <p className="border-t border-slate-100 pt-3 text-slate-600">{customer.notes}</p>}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">Achats</h2>
            <span className="text-sm text-slate-500">Total : {formatFcfa(totalSpent)}</span>
          </div>
          {sales.length === 0 && <p className="text-sm text-slate-500">Aucun achat pour le moment.</p>}
          <ul className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <li key={sale.id}>
                <Link to={`/ventes/${sale.id}`} className="flex justify-between gap-3 py-2.5 text-sm hover:text-brand-700">
                  <span>
                    <span className="font-semibold">{sale.reference}</span>
                    <span className="text-slate-500"> · {formatDate(sale.createdAt)} · {PAYMENT_LABELS[sale.paymentMethod]}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatFcfa(sale.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">Les réparations et les formations apparaîtront ici aux prochains sprints.</p>
        </Card>
      </div>
    </>
  )
}

function EditCustomer({ customer, onDone }: { customer: Customer; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CustomerForm>({
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email ?? '',
    notes: customer.notes ?? '',
  })
  const save = useMutation({
    mutationFn: () => customersApi.save(form, customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onDone()
    },
  })
  const errors = fieldErrors(save.error)
  const set = (changes: Partial<CustomerForm>) => setForm((current) => ({ ...current, ...changes }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Alert>{save.isError && !Object.keys(errors).length ? errorMessage(save.error) : ''}</Alert>
      <Field label="Nom complet" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} error={errors.fullName} />
      <Field label="Téléphone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} />
      <Field label="Email (facultatif)" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} />
      <TextArea label="Notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
