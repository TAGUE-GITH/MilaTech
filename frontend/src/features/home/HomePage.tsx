import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, GraduationCap, Package, ShoppingCart, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { productsApi } from '../../api/client'
import { ROLE_LABELS } from '../../api/types'
import type { Role } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { Card } from '../../components/ui'
import DashboardPage from '../dashboard/DashboardPage'

type Module = { title: string; text: string; to: string; roles: Role[]; Icon: LucideIcon }

const MODULES: Module[] = [
  { title: 'Produits et stock', text: 'Catalogue, achats, inventaire et historique', to: '/produits', roles: ['VENDEUR', 'TECHNICIEN', 'FORMATEUR'], Icon: Package },
  { title: 'Ventes', text: 'Caisse, reçus et historique des ventes', to: '/caisse', roles: ['VENDEUR'], Icon: ShoppingCart },
  { title: 'Réparations', text: 'Dépôt, diagnostic, pièces et restitution', to: '/reparations', roles: ['VENDEUR', 'TECHNICIEN'], Icon: Wrench },
  { title: 'Formations', text: 'Sessions, apprenants et paiements', to: '/formations', roles: ['VENDEUR', 'FORMATEUR'], Icon: GraduationCap },
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

      {/* Le gerant arrive directement sur son tableau de bord (US-24) */}
      {hasRole('GERANT') && (
        <div className="mt-6">
          <DashboardPage />
        </div>
      )}

      {hasRole('VENDEUR') && (
        <div className="mt-6 max-w-sm">
          <LowStockCard />
        </div>
      )}

      {/* Les autres employes voient les modules de leur role */}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODULES.filter((module) => hasRole(...module.roles)).map(({ title, text, to, Icon }) => (
          <li key={title}>
            <Link to={to}>
              <Card className="flex h-full gap-4 transition hover:shadow-md">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-bold">{title}</h2>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
