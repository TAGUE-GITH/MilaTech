import { AlertTriangle, CircuitBoard, Contact, FolderTree, GraduationCap, Home, LogOut, Menu, Package, Receipt, ShoppingCart, Users, Wrench, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ROLE_LABELS } from '../api/types'
import type { Role } from '../api/types'
import { useAuth } from '../auth/AuthProvider'

type NavItem = { to: string; label: string; Icon: LucideIcon; roles?: Role[] }

// Menus visibles selon le role (le serveur verifie aussi chaque droit)
const NAV: NavItem[] = [
  { to: '/', label: 'Accueil', Icon: Home },
  { to: '/caisse', label: 'Caisse', Icon: ShoppingCart, roles: ['GERANT', 'VENDEUR'] },
  { to: '/ventes', label: 'Ventes', Icon: Receipt, roles: ['GERANT', 'VENDEUR'] },
  { to: '/reparations', label: 'Réparations', Icon: Wrench, roles: ['GERANT', 'TECHNICIEN', 'VENDEUR'] },
  { to: '/formations', label: 'Formations', Icon: GraduationCap, roles: ['GERANT', 'FORMATEUR', 'VENDEUR'] },
  { to: '/clients', label: 'Clients', Icon: Contact },
  { to: '/produits', label: 'Produits et stock', Icon: Package },
  { to: '/stock/alertes', label: 'Stock bas', Icon: AlertTriangle, roles: ['GERANT', 'VENDEUR'] },
  { to: '/catalogue', label: 'Catégories et fournisseurs', Icon: FolderTree, roles: ['GERANT'] },
  { to: '/employes', label: 'Employés', Icon: Users, roles: ['GERANT'] },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-700 text-white">
        <CircuitBoard className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Mila<span className="text-brand-700">Tech</span>
      </span>
    </Link>
  )
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const items = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)))
  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-1">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100'
            }`
          }
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function UserBox() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold">
        {user.firstName[0]}
        {user.lastName[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.fullName}</p>
        <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink"
        aria-label="Se déconnecter"
        title="Se déconnecter"
      >
        <LogOut className="size-5" aria-hidden />
      </button>
    </div>
  )
}

// Ordinateur : menu fixe a gauche ; telephone : barre en haut et menu qui s'ouvre
export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden w-64 print:hidden! shrink-0 flex-col gap-6 border-r border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Logo />
        <div className="flex-1">
          <Navigation />
        </div>
        <UserBox />
      </aside>

      <header className="sticky top-0 z-30 print:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>
      {open && (
        <div className="space-y-4 border-b border-slate-200 bg-white p-4 lg:hidden">
          <Navigation onNavigate={() => setOpen(false)} />
          <UserBox />
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
