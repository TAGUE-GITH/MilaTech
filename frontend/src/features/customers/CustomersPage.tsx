import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { customersApi, errorMessage, fieldErrors } from '../../api/client'
import type { CustomerForm } from '../../api/types'
import { Alert, Button, Card, Field, Loader, PageHeader, TextArea } from '../../components/ui'

const EMPTY: CustomerForm = { fullName: '', phone: '', email: '', notes: '' }

// US-10 : fiches clients (tous les employes)
export default function CustomersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const customers = useQuery({ queryKey: ['customers', query], queryFn: () => customersApi.search(query) })
  const [form, setForm] = useState(EMPTY)
  const create = useMutation({
    mutationFn: () => customersApi.save(form),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate(`/clients/${customer.id}`)
    },
  })
  const errors = fieldErrors(create.error)
  const set = (changes: Partial<CustomerForm>) => setForm((current) => ({ ...current, ...changes }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate()
  }

  return (
    <>
      <PageHeader title="Clients" subtitle="Coordonnées et historique : achats, réparations, formations" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom ou numéro de téléphone"
              aria-label="Rechercher un client"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm"
            />
          </div>
          {customers.isPending && <Loader />}
          {customers.isError && <Alert>{errorMessage(customers.error)}</Alert>}
          {customers.data && customers.data.length === 0 && <p className="py-10 text-center text-slate-500">Aucun client trouvé.</p>}
          {customers.data && customers.data.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
              {customers.data.map((customer) => (
                <li key={customer.id}>
                  <Link to={`/clients/${customer.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">
                      {customer.fullName[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{customer.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {customer.phone}
                        {customer.email && ` · ${customer.email}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card className="h-fit">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <UserPlus className="size-5 text-brand-700" aria-hidden />
            Nouveau client
          </h2>
          <form onSubmit={submit} className="space-y-3" noValidate>
            <Alert>{create.isError && !Object.keys(errors).length ? errorMessage(create.error) : ''}</Alert>
            <Field label="Nom complet" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} error={errors.fullName} />
            <Field label="Téléphone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} placeholder="6XX XX XX XX" />
            <Field label="Email (facultatif)" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} />
            <TextArea label="Notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            <Button type="submit" loading={create.isPending} className="w-full">
              Enregistrer le client
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
