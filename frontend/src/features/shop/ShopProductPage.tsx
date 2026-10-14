import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, ShoppingCart, Store, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, shopApi } from '../../api/client'
import { Alert, Button, Loader } from '../../components/ui'
import { buttonClasses } from '../../components/buttonClasses'
import { formatFcfa } from '../../lib/format'
import { ProductImage } from './ProductImage'
import { useShopCart } from './ShopCart'

// Fiche d'un produit de la boutique en ligne : photo, description, quantite et ajout au panier
export default function ShopProductPage() {
  const id = Number(useParams().id)
  const product = useQuery({ queryKey: ['shop-product', id], queryFn: () => shopApi.product(id) })
  const info = useQuery({ queryKey: ['shop-info'], queryFn: shopApi.info })
  const { lines, add } = useShopCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  if (product.isPending) return <Loader />
  if (product.isError)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <Alert>{errorMessage(product.error)}</Alert>
        <Link to="/boutique" className={buttonClasses('secondary', 'mt-6')}>
          Voir les autres produits
        </Link>
      </div>
    )

  const p = product.data
  const inCart = lines.find((line) => line.productId === p.id)?.quantity ?? 0
  const left = p.stock - inCart

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/boutique" className="text-sm font-semibold text-brand-700">
        ← Boutique
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <ProductImage src={p.imageUrl} alt={p.name} className="aspect-square w-full rounded-2xl ring-1 ring-slate-200" />
        <div>
          <p className="text-sm font-semibold text-slate-500">{p.category.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{p.name}</h1>
          <p className="mt-3 text-3xl font-extrabold text-brand-800 tabular-nums">{formatFcfa(p.price)}</p>
          <p className={`mt-2 text-sm font-semibold ${p.stock <= 3 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {p.stock <= 3 ? `Plus que ${p.stock} en stock` : 'En stock'}
          </p>
          {p.description && <p className="mt-5 whitespace-pre-line text-slate-700">{p.description}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl ring-1 ring-slate-300">
              <button type="button" className="p-2.5 disabled:opacity-30" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)} aria-label="Une pièce de moins">
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-bold tabular-nums" aria-label="Quantité">
                {quantity}
              </span>
              <button type="button" className="p-2.5 disabled:opacity-30" disabled={quantity >= left} onClick={() => setQuantity(quantity + 1)} aria-label="Une pièce de plus">
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              disabled={left <= 0}
              onClick={() => {
                add({ productId: p.id, name: p.name, unitPrice: p.price, available: p.stock, imageUrl: p.imageUrl }, quantity)
                setQuantity(1)
                setAdded(true)
              }}
            >
              <ShoppingCart className="size-4" aria-hidden />
              {left <= 0 ? 'Tout le stock est au panier' : 'Ajouter au panier'}
            </Button>
          </div>
          {added && (
            <div className="mt-4">
              <Alert type="success">
                Ajouté au panier ({inCart} au total).{' '}
                <Link to="/panier" className="font-bold underline">
                  Voir le panier
                </Link>
              </Alert>
            </div>
          )}

          <ul className="mt-8 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <li className="flex gap-3">
              <Store className="size-5 shrink-0 text-brand-700" aria-hidden />
              Retrait gratuit à la boutique, paiement sur place (espèces ou Mobile Money).
            </li>
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0 text-brand-700" aria-hidden />
              Livraison à {info.data?.deliveryCity ?? 'Yaoundé'}
              {info.data ? ` : ${formatFcfa(info.data.deliveryFee)}` : ''}, paiement à la livraison.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
