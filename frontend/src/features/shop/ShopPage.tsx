import { useQuery } from '@tanstack/react-query'
import { Check, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, shopApi } from '../../api/client'
import type { ShopProduct } from '../../api/types'
import { Alert, Button, Loader } from '../../components/ui'
import { formatFcfa } from '../../lib/format'
import { ProductImage } from './ProductImage'
import { useShopCart } from './ShopCart'

/** Article encore en stock mais bientot epuise : on previent le client. */
const LOW = 3

// Boutique en ligne : les produits disponibles en boutique, avec leur photo et leur prix
export default function ShopPage() {
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const products = useQuery({ queryKey: ['shop', q, categoryId], queryFn: () => shopApi.products({ q, categoryId }) })
  const categories = useQuery({ queryKey: ['shop-categories'], queryFn: shopApi.categories })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Boutique</h1>
      <p className="mt-1 text-slate-600">Commandez en ligne, puis retirez en boutique ou faites-vous livrer. Paiement à la remise.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block sm:w-80">
          <span className="sr-only">Rechercher un produit</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>
        {categories.data && categories.data.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Catégories">
            {[{ id: '' as const, name: 'Tout' }, ...categories.data].map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${
                  categoryId === category.id ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        {products.isPending && <Loader />}
        {products.isError && <Alert>{errorMessage(products.error)}</Alert>}
        {products.data?.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-600">
            {q || categoryId ? 'Aucun produit ne correspond à votre recherche.' : 'Les produits arrivent bientôt en ligne. Passez nous voir en boutique !'}
          </p>
        )}
        {products.data && products.data.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function ProductCard({ product }: { product: ShopProduct }) {
  const { lines, add } = useShopCart()
  const inCart = lines.find((line) => line.productId === product.id)?.quantity ?? 0
  const full = inCart >= product.stock

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-md">
      <Link to={`/boutique/${product.id}`} className="block">
        <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="text-xs font-semibold text-slate-500">{product.category.name}</p>
        <Link to={`/boutique/${product.id}`} className="line-clamp-2 font-semibold hover:text-brand-700">
          {product.name}
        </Link>
        <p className="mt-auto pt-1 text-lg font-extrabold text-brand-800 tabular-nums">{formatFcfa(product.price)}</p>
        {product.stock <= LOW && <p className="text-xs font-semibold text-amber-700">Plus que {product.stock} en stock</p>}
        <Button
          variant={inCart ? 'secondary' : 'primary'}
          disabled={full}
          className="mt-2 w-full px-2"
          onClick={() => add({ productId: product.id, name: product.name, unitPrice: product.price, available: product.stock, imageUrl: product.imageUrl })}
          aria-label={`Ajouter au panier : ${product.name}`}
        >
          {inCart ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
          {full ? 'Tout est au panier' : inCart ? `Au panier (${inCart})` : 'Ajouter'}
        </Button>
      </div>
    </li>
  )
}
