import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi, errorMessage, productsApi } from '../../api/client'
import type { Product } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Loader, PageHeader } from '../../components/ui'
import { buttonClasses } from '../../components/buttonClasses'
import { formatFcfa } from '../../lib/format'
import { StockBadge } from './StockBadge'

// US-05 : catalogue, recherche par nom ou reference, filtres par categorie et stock bas
export default function ProductsPage() {
  const { hasRole } = useAuth()
  const manager = hasRole('GERANT')
  const [query, setQuery] = useState('')
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [lowStock, setLowStock] = useState(false)
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories })
  const products = useQuery({
    queryKey: ['products', { q, categoryId, lowStock }],
    queryFn: () => productsApi.list({ q, categoryId, lowStock }),
  })

  const search = (event: FormEvent) => {
    event.preventDefault()
    setQ(query.trim())
  }

  return (
    <>
      <PageHeader
        title="Produits et stock"
        subtitle="Appareils, composants et pièces détachées"
        actions={
          manager && (
            <Link to="/produits/nouveau" className={buttonClasses('primary')}>
              <Plus className="size-4" aria-hidden />
              Nouveau produit
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form role="search" onSubmit={search} className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom ou référence"
            aria-label="Rechercher un produit"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm"
          />
        </form>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : '')}
          aria-label="Catégorie"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Toutes les catégories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={lowStock} onChange={(event) => setLowStock(event.target.checked)} className="size-4 accent-brand-700" />
          Stock bas seulement
        </label>
      </div>

      {products.isPending && <Loader />}
      {products.isError && <Alert>{errorMessage(products.error)}</Alert>}
      {products.data && <ProductList products={products.data} manager={manager} />}
    </>
  )
}

function ProductList({ products, manager }: { products: Product[]; manager: boolean }) {
  if (products.length === 0) return <p className="py-10 text-center text-slate-500">Aucun produit trouvé.</p>
  return (
    <>
      {/* Telephone : cartes */}
      <ul className="space-y-3 md:hidden">
        {products.map((product) => (
          <li key={product.id}>
            <Link to={`/produits/${product.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.reference} · {product.category.name}
                  </p>
                </div>
                <StockBadge product={product} />
              </div>
              <p className="mt-2 text-sm font-semibold">{formatFcfa(product.salePrice)}</p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Ordinateur : tableau */}
      <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Produit</th>
              <th scope="col" className="px-4 py-3">Catégorie</th>
              {manager && <th scope="col" className="px-4 py-3 text-right">Prix d’achat</th>}
              <th scope="col" className="px-4 py-3 text-right">Prix de vente</th>
              <th scope="col" className="px-4 py-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/produits/${product.id}`} className="font-semibold hover:text-brand-700">
                    {product.name}
                  </Link>
                  <p className="text-xs text-slate-500">{product.reference}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{product.category.name}</td>
                {manager && <td className="px-4 py-3 text-right tabular-nums">{formatFcfa(product.purchasePrice ?? 0)}</td>}
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatFcfa(product.salePrice)}</td>
                <td className="px-4 py-3 text-right">
                  <StockBadge product={product} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
