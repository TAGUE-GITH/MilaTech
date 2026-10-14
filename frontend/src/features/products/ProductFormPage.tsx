import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { catalogApi, errorMessage, fieldErrors, productsApi } from '../../api/client'
import type { Product, ProductForm } from '../../api/types'
import { Alert, Button, Card, Field, Loader, PageHeader, Select, TextArea } from '../../components/ui'
import { formatFcfa } from '../../lib/format'

const EMPTY: ProductForm = {
  reference: '',
  name: '',
  categoryId: '',
  supplierId: '',
  description: '',
  purchasePrice: '',
  salePrice: '',
  alertThreshold: 3,
  initialQuantity: '',
  active: true,
}

const toForm = (product: Product): ProductForm => ({
  reference: product.reference,
  name: product.name,
  categoryId: product.category.id,
  supplierId: product.supplier?.id ?? '',
  description: product.description ?? '',
  purchasePrice: product.purchasePrice ?? '',
  salePrice: product.salePrice,
  alertThreshold: product.alertThreshold,
  active: product.active,
})

const numberOrEmpty = (value: string) => (value === '' ? '' : Number(value))

// US-05 : creation et modification d'un produit (gerant)
export default function ProductFormPage() {
  const { id } = useParams()
  const productId = id ? Number(id) : undefined
  const existing = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId!),
    enabled: Boolean(productId),
  })
  if (productId && existing.isPending) return <Loader />
  if (existing.isError) return <Alert>{errorMessage(existing.error)}</Alert>
  return <ProductEditor key={productId ?? 'new'} product={existing.data} />
}

function ProductEditor({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductForm>(() => (product ? toForm(product) : EMPTY))
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories })
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: catalogApi.suppliers })

  const save = useMutation({
    mutationFn: () => productsApi.save(form, product?.id),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      queryClient.setQueryData(['product', saved.id], saved)
      navigate(`/produits/${saved.id}`)
    },
  })
  const errors = fieldErrors(save.error)
  const set = (changes: Partial<ProductForm>) => setForm((current) => ({ ...current, ...changes }))
  const margin =
    form.salePrice !== '' && form.purchasePrice !== '' ? Number(form.salePrice) - Number(form.purchasePrice) : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <>
      <Link to={product ? `/produits/${product.id}` : '/produits'} className="text-sm font-semibold text-brand-700">
        ← Retour
      </Link>
      <PageHeader title={product ? `Modifier « ${product.name} »` : 'Nouveau produit'} />
      <form onSubmit={submit} noValidate>
        <Card className="max-w-3xl space-y-4">
          <Alert>{save.isError && Object.keys(errors).length === 0 ? errorMessage(save.error) : ''}</Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Référence" value={form.reference} onChange={(e) => set({ reference: e.target.value })} error={errors.reference} hint="Unique, par exemple TEL-A15" required />
            <Field label="Nom" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} required />
            <Select label="Catégorie" value={form.categoryId} onChange={(e) => set({ categoryId: numberOrEmpty(e.target.value) })} error={errors.categoryId}>
              <option value="">Choisir…</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select label="Fournisseur (facultatif)" value={form.supplierId} onChange={(e) => set({ supplierId: numberOrEmpty(e.target.value) })}>
              <option value="">Aucun</option>
              {suppliers?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </div>
          <TextArea label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Prix d’achat (FCFA)" type="number" min={0} inputMode="numeric" value={form.purchasePrice} onChange={(e) => set({ purchasePrice: numberOrEmpty(e.target.value) })} error={errors.purchasePrice} />
            <Field label="Prix de vente (FCFA)" type="number" min={1} inputMode="numeric" value={form.salePrice} onChange={(e) => set({ salePrice: numberOrEmpty(e.target.value) })} error={errors.salePrice} />
            <Field label="Seuil d’alerte" type="number" min={0} inputMode="numeric" value={form.alertThreshold} onChange={(e) => set({ alertThreshold: numberOrEmpty(e.target.value) })} error={errors.alertThreshold} hint="Alerte quand le stock descend à ce nombre" />
          </div>
          {margin !== null && (
            <p className={`text-sm ${margin > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Marge théorique par pièce : {formatFcfa(margin)} (hors charges de l’entreprise)
            </p>
          )}
          {!product && (
            <Field label="Stock initial (facultatif)" type="number" min={0} inputMode="numeric" value={form.initialQuantity ?? ''} onChange={(e) => set({ initialQuantity: numberOrEmpty(e.target.value) })} error={errors.initialQuantity} hint="Pièces déjà en boutique. Les achats suivants s’enregistrent depuis la fiche du produit." className="max-w-xs" />
          )}
          {product && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-brand-700" />
              Produit actif (décochez pour ne plus le vendre)
            </label>
          )}
          <Button type="submit" loading={save.isPending}>
            {product ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </Card>
      </form>
    </>
  )
}
