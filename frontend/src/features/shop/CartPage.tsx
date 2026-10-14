import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, ShoppingBag, Store, Trash2, Truck } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors, myOrdersApi, shopApi } from '../../api/client'
import type { DeliveryMode } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Button, Card, Checkbox, Field, TextArea } from '../../components/ui'
import { buttonClasses } from '../../components/buttonClasses'
import { COMPANY } from '../../lib/company'
import { formatFcfa } from '../../lib/format'
import { deliveryFeeFor } from '../../lib/orders'
import { ProductImage } from './ProductImage'
import { useShopCart } from './ShopCart'

// Panier de la boutique en ligne et validation de la commande (retrait ou livraison, paiement a la remise)
export default function CartPage() {
  const { user, isStaff } = useAuth()
  const { lines, total, setLineQuantity, clear } = useShopCart()
  const info = useQuery({ queryKey: ['shop-info'], queryFn: shopApi.info })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [mode, setMode] = useState<DeliveryMode>('RETRAIT')
  const [address, setAddress] = useState('')
  // null tant que le client n'a rien saisi : on propose le numero de son compte
  const [phone, setPhone] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const fee = deliveryFeeFor(mode, info.data?.deliveryFee ?? 0)
  const order = useMutation({
    mutationFn: () =>
      myOrdersApi.place({
        deliveryMode: mode,
        address: mode === 'LIVRAISON' ? address : '',
        phone: phone ?? user?.phone ?? '',
        note,
        lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        acceptTerms,
      }),
    onSuccess: (placed) => {
      clear()
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['shop'] })
      navigate(`/mon-espace/commandes/${placed.id}`, { state: { placed: true } })
    },
  })
  const errors = fieldErrors(order.error)

  if (lines.length === 0)
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag className="mx-auto size-14 text-slate-300" strokeWidth={1.2} aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold">Votre panier est vide</h1>
        <p className="mt-2 text-slate-600">Parcourez la boutique et ajoutez les articles qui vous intéressent.</p>
        <Link to="/boutique" className={buttonClasses('primary', 'mt-6')}>
          Voir la boutique
        </Link>
      </div>
    )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    order.mutate()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Mon panier</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="h-fit p-0!">
          <ul className="divide-y divide-slate-100">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-3 p-4">
                <Link to={`/boutique/${line.productId}`} className="shrink-0">
                  <ProductImage src={line.imageUrl} alt={line.name} className="size-20 rounded-xl ring-1 ring-slate-200" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{line.name}</p>
                  <p className="text-sm text-slate-500 tabular-nums">{formatFcfa(line.unitPrice)} / pièce</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg ring-1 ring-slate-300">
                      <button type="button" className="p-1.5" onClick={() => setLineQuantity(line.productId, line.quantity - 1)} aria-label={`Une pièce de moins : ${line.name}`}>
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        className="p-1.5 disabled:opacity-30"
                        disabled={line.quantity >= line.available}
                        onClick={() => setLineQuantity(line.productId, line.quantity + 1)}
                        aria-label={`Une pièce de plus : ${line.name}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <p className="font-bold tabular-nums">{formatFcfa(line.unitPrice * line.quantity)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setLineQuantity(line.productId, 0)} className="self-start p-1.5 text-slate-400 hover:text-red-700" aria-label={`Retirer ${line.name}`}>
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Card className="space-y-4">
            <fieldset>
              <legend className="mb-2 font-bold">Comment recevoir votre commande ?</legend>
              <div className="space-y-2">
                <ModeOption checked={mode === 'RETRAIT'} onSelect={() => setMode('RETRAIT')} icon={<Store className="size-5" aria-hidden />} title="Retrait en boutique" detail={`Gratuit · ${COMPANY.district}, ${COMPANY.city}`} />
                <ModeOption
                  checked={mode === 'LIVRAISON'}
                  onSelect={() => setMode('LIVRAISON')}
                  icon={<Truck className="size-5" aria-hidden />}
                  title={`Livraison à ${info.data?.deliveryCity ?? 'Yaoundé'}`}
                  detail={info.data ? formatFcfa(info.data.deliveryFee) : '…'}
                />
              </div>
            </fieldset>
            {mode === 'LIVRAISON' && (
              <Field label="Quartier et repère" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} placeholder="Ex. : Bonas, près de la pharmacie" />
            )}
            <Field label="Téléphone pour vous joindre" type="tel" value={phone ?? user?.phone ?? ''} onChange={(e) => setPhone(e.target.value)} error={errors.phone} placeholder="6XX XX XX XX" />
            <TextArea label="Précision (facultatif)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} />
          </Card>

          <Card className="space-y-2">
            <Line label="Articles" value={formatFcfa(total)} />
            <Line label={mode === 'LIVRAISON' ? 'Livraison' : 'Retrait en boutique'} value={fee ? formatFcfa(fee) : 'Gratuit'} />
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
              <span className="font-bold">Total à payer</span>
              <span className="text-2xl font-extrabold text-brand-800 tabular-nums">{formatFcfa(total + fee)}</span>
            </div>
            <p className="text-xs text-slate-500">Paiement {mode === 'LIVRAISON' ? 'à la livraison' : 'au retrait'} : espèces ou Mobile Money.</p>
            <Alert>{order.isError && !Object.keys(errors).length ? errorMessage(order.error) : ''}</Alert>
            {!user && (
              <div className="space-y-2 pt-2">
                <p className="text-sm text-slate-600">Connectez-vous pour commander : vous suivrez votre commande dans votre espace.</p>
                <Link to="/connexion" state={{ from: '/panier' }} className={buttonClasses('primary', 'w-full')}>
                  Se connecter pour commander
                </Link>
                <Link to="/inscription" state={{ from: '/panier' }} className={buttonClasses('secondary', 'w-full')}>
                  Créer mon compte
                </Link>
              </div>
            )}
            {user && isStaff && <Alert>Les commandes en ligne se font avec un compte client.</Alert>}
            {user && !isStaff && (
              <Checkbox
                className="pt-2"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                error={errors.acceptTerms}
                label={
                  <>
                    J’accepte les{' '}
                    <Link to="/conditions-generales" target="_blank" className="font-semibold text-brand-700 underline">
                      conditions générales de vente
                    </Link>
                    .
                  </>
                }
              />
            )}
            {user && !isStaff && (
              <Button type="submit" loading={order.isPending} className="mt-2 w-full">
                Commander
              </Button>
            )}
          </Card>
        </form>
      </div>
    </div>
  )
}

function ModeOption({ checked, onSelect, icon, title, detail }: { checked: boolean; onSelect: () => void; icon: ReactNode; title: string; detail: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ${checked ? 'bg-brand-50 ring-2 ring-brand-600' : 'ring-slate-300 hover:bg-slate-50'}`}>
      <input type="radio" name="mode" checked={checked} onChange={onSelect} className="sr-only" />
      <span className={checked ? 'text-brand-700' : 'text-slate-500'}>{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
    </label>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}
