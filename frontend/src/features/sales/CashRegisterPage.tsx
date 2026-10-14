import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Minus, Plus, Printer, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, productsApi, salesApi } from '../../api/client'
import { PAYMENT_LABELS } from '../../api/types'
import type { Customer, PaymentMethod, Sale } from '../../api/types'
import { Alert, Button, Card, Loader, PageHeader } from '../../components/ui'
import { addToCart, cartCount, cartTotal, setQuantity } from '../../lib/cart'
import type { CartLine } from '../../lib/cart'
import { formatFcfa } from '../../lib/format'
import { CustomerPicker } from '../customers/CustomerPicker'

// US-11 : vente au comptoir (gerant et vendeurs)
export default function CashRegisterPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [payment, setPayment] = useState<PaymentMethod>('ESPECES')
  const [done, setDone] = useState<Sale | null>(null)
  const products = useQuery({ queryKey: ['products', { q: query, sale: true }], queryFn: () => productsApi.list({ q: query }) })

  const sell = useMutation({
    mutationFn: () =>
      salesApi.sell({
        customerId: customer?.id ?? null,
        paymentMethod: payment,
        lines: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      }),
    onSuccess: (sale) => {
      setDone(sale)
      setCart([])
      setCustomer(null)
      for (const key of ['products', 'stock-alerts', 'sales', 'product', 'movements'])
        queryClient.invalidateQueries({ queryKey: [key] })
    },
  })

  if (done)
    return (
      <Card className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h1 className="mt-3 text-xl font-extrabold">Vente enregistrée</h1>
        <p className="mt-1 text-slate-600">
          {done.reference} · {formatFcfa(done.total)} · {PAYMENT_LABELS[done.paymentMethod]}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="secondary" onClick={() => salesApi.openReceipt(done.id)}>
            <Printer className="size-4" aria-hidden />
            Reçu (PDF)
          </Button>
          <Button onClick={() => setDone(null)}>Nouvelle vente</Button>
        </div>
        <Link to={`/ventes/${done.id}`} className="mt-4 inline-block text-sm font-semibold text-brand-700">
          Voir le détail
        </Link>
      </Card>
    )

  const available = (products.data ?? []).filter((product) => product.active)

  return (
    <>
      <PageHeader title="Caisse" subtitle="Choisissez les produits, le client et le moyen de paiement" />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom ou référence du produit"
              aria-label="Rechercher un produit à vendre"
              className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm"
            />
          </div>
          {products.isPending && <Loader />}
          <ul className="mt-4 grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
            {available.map((product) => {
              const soldOut = product.quantity === 0
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() =>
                      setCart((current) =>
                        addToCart(current, {
                          productId: product.id,
                          name: product.name,
                          reference: product.reference,
                          unitPrice: product.salePrice,
                          available: product.quantity,
                        }),
                      )
                    }
                    className="w-full rounded-xl p-3 text-left ring-1 ring-slate-200 transition hover:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Ajouter ${product.name}`}
                  >
                    <span className="block font-semibold">{product.name}</span>
                    <span className="block text-xs text-slate-500">{product.reference}</span>
                    <span className="mt-1 flex justify-between text-sm">
                      <span className="font-semibold">{formatFcfa(product.salePrice)}</span>
                      <span className={soldOut ? 'text-red-700' : 'text-slate-500'}>{soldOut ? 'Épuisé' : `${product.quantity} en stock`}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {products.data && available.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucun produit trouvé.</p>}
        </Card>

        <Card className="h-fit space-y-4 lg:sticky lg:top-6">
          <h2 className="font-bold">Ticket {cart.length > 0 && <span className="font-normal text-slate-500">· {cartCount(cart)} article(s)</span>}</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Touchez un produit pour l’ajouter.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((line) => (
                <li key={line.productId} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{line.name}</p>
                    <p className="text-xs text-slate-500">{formatFcfa(line.unitPrice)} l’unité</p>
                  </div>
                  <div className="flex items-center rounded-lg ring-1 ring-slate-200">
                    <button type="button" onClick={() => setCart(setQuantity(cart, line.productId, line.quantity - 1))} className="p-1.5" aria-label={`Une pièce de moins : ${line.name}`}>
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                    <button type="button" disabled={line.quantity >= line.available} onClick={() => setCart(setQuantity(cart, line.productId, line.quantity + 1))} className="p-1.5 disabled:opacity-30" aria-label={`Une pièce de plus : ${line.name}`}>
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                  <button type="button" onClick={() => setCart(setQuantity(cart, line.productId, 0))} className="p-1.5 text-slate-400 hover:text-red-700" aria-label={`Retirer ${line.name}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Client (facultatif)</p>
            <CustomerPicker value={customer} onChange={setCustomer} emptyLabel="Client de passage" />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Paiement</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                <label key={method} className={`cursor-pointer rounded-xl px-3 py-2.5 text-center text-sm font-semibold ring-1 ${payment === method ? 'bg-ink text-white ring-ink' : 'ring-slate-300'}`}>
                  <input type="radio" name="payment" value={method} checked={payment === method} onChange={() => setPayment(method)} className="sr-only" />
                  {PAYMENT_LABELS[method]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-extrabold tabular-nums">{formatFcfa(cartTotal(cart))}</span>
          </div>
          <Alert>{sell.isError ? errorMessage(sell.error) : ''}</Alert>
          <Button className="w-full py-3" disabled={cart.length === 0} loading={sell.isPending} onClick={() => sell.mutate()}>
            Encaisser
          </Button>
        </Card>
      </div>
    </>
  )
}
