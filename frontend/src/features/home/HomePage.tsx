import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, GraduationCap, Package, ShoppingCart, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { productsApi } from '../../api/client'
import { ROLE_LABELS } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { Card } from '../../components/ui'

type Module = { title: string; text: string; to?: string; sprint?: number; Icon: LucideIcon }

const MODULES: Module[] = [
  { title: 'Produits et stock', text: 'Catalogue, achats, inventaire et historique', to: '/produits', Icon: Package },
  { title: 'Ventes', text: 'Caisse, reçus et historique des ventes', to: '/caisse', Icon: ShoppingCart },
  { title: 'Réparations', text: 'Dépôt, diagnostic, pièces et restitution', to: '/reparations', Icon: Wrench },
  { title: 'Formations', text: 'Sessions, apprenants et paiements', sprint: 4, Icon: GraduationCap },
]

function LowStockCard() {
  const { data } = useQuery({ queryKey: ['stock-alerts'], queryFn: productsApi.alerts })
  if (!data) return null
  const count = data.length
  return (
    <Link
      to="/stock/alertes"
      className={`flex items-center gap-4 rounded-2xl p-5 ring-1 transition hover:shadow-md ${
        count ? 'bg-red-50 text-red-900 ring-red-200' : 'bg-white text-ink ring-slate-200'
      }`}
    >
      <AlertTriangle className="size-6 shrink-0" aria-hidden />
      <span className="text-3xl font-extrabold">{count}</span>
      <span className="text-sm">{count > 1 ? 'produits en stock bas' : 'produit en stock bas'}</span>
    </Link>
  )
}

export default function HomePage() {
  const { user, hasRole } = useAuth()
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Bonjour {user?.firstName} 👋</h1>
      <p className="mt-1 text-slate-600">{user && ROLE_LABELS[user.role]} · MilaTech Management</p>

      {hasRole('GERANT', 'VENDEUR') && (
        <div className="mt-6 max-w-sm">
          <LowStockCard />
        </div>
      )}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODULES.map(({ title, text, to, sprint, Icon }) => {
          const content = (
            <Card className={`flex h-full gap-4 ${to ? 'transition hover:shadow-md' : 'opacity-75'}`}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="text-sm text-slate-600">{text}</p>
                {sprint && <p className="mt-2 text-xs font-semibold text-slate-500 uppercase">Bientôt · sprint {sprint}</p>}
              </div>
            </Card>
          )
          return <li key={title}>{to ? <Link to={to}>{content}</Link> : content}</li>
        })}
      </ul>
    </>
  )
}
