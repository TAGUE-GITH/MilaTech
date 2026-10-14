import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { customersApi, errorMessage, fieldErrors } from '../../api/client'
import type { Customer } from '../../api/types'
import { Alert, Button, Field } from '../../components/ui'

type Props = {
  value: Customer | null
  onChange: (customer: Customer | null) => void
  /** Texte quand aucun client n'est choisi (ex. « Client de passage ») */
  emptyLabel?: string
}

/**
 * Choix d'un client existant (recherche par nom ou telephone) ou creation rapide sur place.
 * Utilise par la caisse, et plus tard par les reparations et les formations.
 */
export function CustomerPicker({ value, onChange, emptyLabel = 'Aucun client' }: Props) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const results = useQuery({
    queryKey: ['customers', query],
    queryFn: () => customersApi.search(query),
    enabled: query.trim().length >= 2,
  })
  const create = useMutation({
    mutationFn: () => customersApi.save({ ...form, email: '', notes: '' }),
    onSuccess: (customer) => {
      onChange(customer)
      setCreating(false)
      setForm({ fullName: '', phone: '' })
    },
  })
  const errors = fieldErrors(create.error)

  if (value)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2.5 ring-1 ring-brand-100">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{value.fullName}</p>
          <p className="text-xs text-slate-600">{value.phone}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white" aria-label="Retirer le client">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    )

  if (creating)
    return (
      <div className="space-y-3 rounded-xl p-3 ring-1 ring-slate-200">
        <Alert>{create.isError && !Object.keys(errors).length ? errorMessage(create.error) : ''}</Alert>
        <Field label="Nom du client" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
        <Field label="Téléphone du client" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
        <div className="flex gap-2">
          <Button type="button" loading={create.isPending} onClick={() => create.mutate()}>
            Enregistrer le client
          </Button>
          <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
            Annuler
          </Button>
        </div>
      </div>
    )

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`${emptyLabel} — rechercher par nom ou téléphone`}
          aria-label="Rechercher un client"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm"
        />
      </div>
      {results.data && (
        <ul className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          {results.data.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(customer)
                  setQuery('')
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-semibold">{customer.fullName}</span> <span className="text-slate-500">· {customer.phone}</span>
              </button>
            </li>
          ))}
          {results.data.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Aucun client trouvé.</li>}
        </ul>
      )}
      <button type="button" onClick={() => setCreating(true)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
        <UserPlus className="size-4" aria-hidden />
        Nouveau client
      </button>
    </div>
  )
}
