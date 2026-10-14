import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Truck } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { catalogApi, errorMessage, fieldErrors } from '../../api/client'
import type { Category, Supplier } from '../../api/types'
import { Alert, Button, Card, Field, Loader, PageHeader } from '../../components/ui'

// US-04 : categories de produits et fournisseurs (gerant)
export default function CatalogPage() {
  return (
    <>
      <PageHeader title="Catégories et fournisseurs" subtitle="Organisation du catalogue et contacts d’approvisionnement" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Categories />
        <Suppliers />
      </div>
    </>
  )
}

function Categories() {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories })
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  const add = useMutation({
    mutationFn: () => catalogApi.addCategory(name),
    onSuccess: () => {
      setName('')
      refresh()
    },
    onError: (err) => setError(fieldErrors(err).name ?? errorMessage(err)),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    add.mutate()
  }

  return (
    <Card>
      <h2 className="mb-3 font-bold">Catégories</h2>
      <form onSubmit={submit} className="mb-4 flex items-end gap-2" noValidate>
        <Field label="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Pièces détachées" className="flex-1" />
        <Button type="submit" loading={add.isPending} aria-label="Ajouter la catégorie">
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Button>
      </form>
      <Alert>{error}</Alert>
      {isPending && <Loader />}
      <ul className="mt-2 divide-y divide-slate-100">
        {data?.map((category) => <CategoryRow key={category.id} category={category} onChange={refresh} onError={setError} />)}
      </ul>
      {data?.length === 0 && <p className="text-sm text-slate-500">Aucune catégorie pour le moment.</p>}
    </Card>
  )
}

function CategoryRow({ category, onChange, onError }: { category: Category; onChange: () => void; onError: (message: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)

  const run = async (action: () => Promise<unknown>) => {
    onError('')
    try {
      await action()
      setEditing(false)
      onChange()
    } catch (err) {
      onError(errorMessage(err))
    }
  }

  if (editing)
    return (
      <li className="py-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            run(() => catalogApi.renameCategory(category.id, name))
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} aria-label={`Renommer ${category.name}`} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" autoFocus />
          <Button type="submit" variant="secondary" className="px-3 py-1.5">
            Enregistrer
          </Button>
          <Button type="button" variant="ghost" className="px-3 py-1.5" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </form>
      </li>
    )

  return (
    <li className="flex items-center gap-2 py-2">
      <span className="flex-1 text-sm font-medium">{category.name}</span>
      <button type="button" onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label={`Renommer ${category.name}`}>
        <Pencil className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => window.confirm(`Supprimer la catégorie « ${category.name} » ?`) && run(() => catalogApi.deleteCategory(category.id))}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
        aria-label={`Supprimer ${category.name}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  )
}

const EMPTY_SUPPLIER = { name: '', phone: '', email: '', address: '' }

function Suppliers() {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({ queryKey: ['suppliers'], queryFn: catalogApi.suppliers })
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(EMPTY_SUPPLIER)
  const save = useMutation({
    mutationFn: () => catalogApi.saveSupplier({ ...form, email: form.email || null, phone: form.phone || null, address: form.address || null }, editing?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setEditing(null)
      setForm(EMPTY_SUPPLIER)
    },
  })
  const errors = fieldErrors(save.error)
  const set = (changes: Partial<typeof form>) => setForm((current) => ({ ...current, ...changes }))

  const edit = (supplier: Supplier) => {
    setEditing(supplier)
    setForm({ name: supplier.name, phone: supplier.phone ?? '', email: supplier.email ?? '', address: supplier.address ?? '' })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <Truck className="size-5 text-brand-700" aria-hidden />
        Fournisseurs
      </h2>
      {isPending && <Loader />}
      <ul className="mb-4 divide-y divide-slate-100">
        {data?.map((supplier) => (
          <li key={supplier.id} className="flex items-center gap-2 py-2">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{supplier.name}</p>
              <p className="text-xs text-slate-500">{[supplier.phone, supplier.email, supplier.address].filter(Boolean).join(' · ') || '—'}</p>
            </div>
            <button type="button" onClick={() => edit(supplier)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label={`Modifier ${supplier.name}`}>
              <Pencil className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="space-y-3 border-t border-slate-100 pt-4" noValidate>
        <p className="text-sm font-semibold">{editing ? `Modifier « ${editing.name} »` : 'Nouveau fournisseur'}</p>
        <Alert>{save.isError && !Object.keys(errors).length ? errorMessage(save.error) : ''}</Alert>
        <Field label="Nom" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Téléphone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} />
        </div>
        <Field label="Adresse" value={form.address} onChange={(e) => set({ address: e.target.value })} />
        <div className="flex gap-2">
          <Button type="submit" loading={save.isPending}>
            {editing ? 'Enregistrer' : 'Ajouter le fournisseur'}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={() => (setEditing(null), setForm(EMPTY_SUPPLIER))}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
