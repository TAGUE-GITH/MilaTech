import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, PackagePlus, Pencil, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { ReactNode } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { catalogApi, errorMessage, fieldErrors, productsApi } from '../../api/client'
import { MOVEMENT_LABELS } from '../../api/types'
import type { Product } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Badge, Button, Card, Field, Loader, PageHeader, Select } from '../../components/ui'
import { buttonClasses } from '../../components/buttonClasses'
import { formatFcfa } from '../../lib/format'
import { resizeImage } from '../../lib/image'
import { ProductImage } from '../shop/ProductImage'
import { StockBadge } from './StockBadge'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Fiche d'un produit : informations, stock, achats et corrections (gerant), historique des mouvements
export default function ProductDetailPage() {
  const id = Number(useParams().id)
  const { hasRole } = useAuth()
  const manager = hasRole('GERANT')
  const product = useQuery({ queryKey: ['product', id], queryFn: () => productsApi.get(id) })

  if (product.isPending) return <Loader />
  if (product.isError) return <Alert>{errorMessage(product.error)}</Alert>
  const p = product.data

  return (
    <>
      <Link to="/produits" className="text-sm font-semibold text-brand-700">
        ← Produits
      </Link>
      <PageHeader
        title={p.name}
        subtitle={`${p.reference} · ${p.category.name}`}
        actions={
          manager && (
            <Link to={`/produits/${p.id}/modifier`} className={buttonClasses('secondary')}>
              <Pencil className="size-4" aria-hidden />
              Modifier
            </Link>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-1">
          <ProductPhoto product={p} editable={manager} />
          <div className="flex items-center justify-between">
            <h2 className="font-bold">En stock</h2>
            <StockBadge product={p} />
          </div>
          <p className="text-4xl font-extrabold tabular-nums">{p.quantity}</p>
          <p className="text-sm text-slate-500">Alerte à partir de {p.alertThreshold} pièce(s)</p>
          <dl className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            <Row label="Prix de vente" value={formatFcfa(p.salePrice)} />
            {p.purchasePrice !== undefined && <Row label="Prix d’achat" value={formatFcfa(p.purchasePrice)} />}
            {p.purchasePrice !== undefined && (
              <Row label="Marge théorique / pièce" value={formatFcfa(p.salePrice - p.purchasePrice)} />
            )}
            {p.supplier && <Row label="Fournisseur" value={p.supplier.name} />}
            {!p.active && <Row label="Statut" value={<Badge>Inactif</Badge>} />}
          </dl>
          {p.description && <p className="border-t border-slate-100 pt-3 text-sm text-slate-600">{p.description}</p>}
        </Card>

        {manager && (
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-6 md:grid-cols-2">
              <PurchaseForm product={p} />
              <AdjustmentForm product={p} />
            </div>
            <Movements productId={p.id} />
          </div>
        )}
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/** Apres un achat ou une correction : la fiche, la liste et les alertes se mettent a jour. */
function useStockUpdate(productId: number) {
  const queryClient = useQueryClient()
  return (updated: Product) => {
    queryClient.setQueryData(['product', productId], updated)
    queryClient.invalidateQueries({ queryKey: ['movements', productId] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
  }
}

// US-06 : achat fournisseur
function PurchaseForm({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(String(product.purchasePrice ?? ''))
  const [supplierId, setSupplierId] = useState(product.supplier ? String(product.supplier.id) : '')
  const [note, setNote] = useState('')
  const [done, setDone] = useState('')
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: catalogApi.suppliers })
  const update = useStockUpdate(product.id)
  const purchase = useMutation({
    mutationFn: () =>
      productsApi.purchase(product.id, {
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        supplierId: supplierId ? Number(supplierId) : null,
        note: note.trim() || undefined,
      }),
    onSuccess: (updated) => {
      update(updated)
      setDone(`${quantity} pièce(s) ajoutée(s). Stock : ${updated.quantity}.`)
      setQuantity('')
      setNote('')
    },
  })
  const errors = fieldErrors(purchase.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setDone('')
    purchase.mutate()
  }

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <PackagePlus className="size-5 text-brand-700" aria-hidden />
        Enregistrer un achat
      </h2>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Alert type="success">{done}</Alert>
        <Alert>{purchase.isError && !Object.keys(errors).length ? errorMessage(purchase.error) : ''}</Alert>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantité reçue" type="number" min={1} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={errors.quantity} />
          <Field label="Prix unitaire (FCFA)" type="number" min={0} inputMode="numeric" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} error={errors.unitCost} />
        </div>
        <Select label="Fournisseur" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Non précisé</option>
          {suppliers?.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </Select>
        <Field label="Note (facture, bon…)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" loading={purchase.isPending} className="w-full">
          Ajouter au stock
        </Button>
      </form>
    </Card>
  )
}

// US-07 : correction d'inventaire
function AdjustmentForm({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [done, setDone] = useState('')
  const update = useStockUpdate(product.id)
  const adjust = useMutation({
    mutationFn: () => productsApi.adjust(product.id, { quantity: Number(quantity), reason }),
    onSuccess: (updated) => {
      update(updated)
      setDone(`Stock corrigé : ${updated.quantity} pièce(s).`)
      setQuantity('')
      setReason('')
    },
  })
  const errors = fieldErrors(adjust.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setDone('')
    adjust.mutate()
  }

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <SlidersHorizontal className="size-5 text-brand-700" aria-hidden />
        Corriger après un comptage
      </h2>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Alert type="success">{done}</Alert>
        <Alert>{adjust.isError && !Object.keys(errors).length ? errorMessage(adjust.error) : ''}</Alert>
        <Field label="Quantité réellement comptée" type="number" min={0} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={errors.quantity} hint={`Actuellement : ${product.quantity}`} />
        <Field label="Motif" value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} placeholder="Casse, perte, erreur de saisie…" />
        <Button type="submit" variant="secondary" loading={adjust.isPending} className="w-full">
          Corriger le stock
        </Button>
      </form>
    </Card>
  )
}

// US-08 : historique des mouvements
function Movements({ productId }: { productId: number }) {
  const { data, isPending } = useQuery({ queryKey: ['movements', productId], queryFn: () => productsApi.movements(productId) })
  return (
    <Card>
      <h2 className="mb-3 font-bold">Historique du stock</h2>
      {isPending && <Loader />}
      {data && data.length === 0 && <p className="text-sm text-slate-500">Aucun mouvement pour le moment.</p>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.map((movement) => (
            <li key={movement.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
              <span className={`w-14 font-bold tabular-nums ${movement.quantity > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {MOVEMENT_LABELS[movement.type]}
                  {movement.unitCost !== null && movement.type === 'ACHAT' && (
                    <span className="font-normal text-slate-500"> · {formatFcfa(movement.unitCost)} / pièce</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {dateTime(movement.createdAt)} · {movement.author}
                  {movement.supplier && ` · ${movement.supplier}`}
                  {movement.reason && ` · ${movement.reason}`}
                </p>
              </div>
              <span className="text-xs text-slate-500">Stock : {movement.quantityAfter}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// Photo affichee dans la boutique en ligne (reduite dans le navigateur avant l'envoi)
function ProductPhoto({ product, editable }: { product: Product; editable: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const onSuccess = (updated: Product) => {
    queryClient.setQueryData(['product', product.id], updated)
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }
  const upload = useMutation({ mutationFn: (dataUrl: string) => productsApi.setImage(product.id, dataUrl), onSuccess, onError: (err) => setError(errorMessage(err)) })
  const remove = useMutation({ mutationFn: () => productsApi.removeImage(product.id), onSuccess })

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try {
      upload.mutate(await resizeImage(file, 800, 0.8))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image illisible.')
    }
  }

  return (
    <div className="space-y-2">
      <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-xl ring-1 ring-slate-200" />
      {editable && (
        <>
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={choose} aria-label="Choisir la photo du produit" />
            <Button variant="secondary" loading={upload.isPending} onClick={() => input.current?.click()}>
              <Camera className="size-4" aria-hidden />
              {product.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </Button>
            {product.imageUrl && (
              <Button variant="ghost" loading={remove.isPending} onClick={() => remove.mutate()}>
                <Trash2 className="size-4" aria-hidden />
                Retirer
              </Button>
            )}
          </div>
          <Alert>{error}</Alert>
          {!product.imageUrl && <p className="text-xs text-slate-500">La photo s’affiche dans la boutique en ligne.</p>}
        </>
      )}
    </div>
  )
}
