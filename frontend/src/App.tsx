import { useQuery } from '@tanstack/react-query'
import { CircuitBoard, GraduationCap, Package, ShoppingCart, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'
import { healthApi } from './api/client'

type Module = { title: string; text: string; sprint: number; Icon: LucideIcon }

// Les quatre activites de MilaTech, livrees sprint apres sprint (voir docs/02-user-stories.md)
const MODULES: Module[] = [
  { title: 'Stock', text: 'Produits, achats fournisseurs, inventaire et alertes', sprint: 1, Icon: Package },
  { title: 'Ventes', text: 'Caisse, reçus et historique des ventes', sprint: 2, Icon: ShoppingCart },
  { title: 'Réparations', text: 'Dépôt, diagnostic, pièces et restitution', sprint: 3, Icon: Wrench },
  { title: 'Formations', text: 'Sessions, apprenants et paiements', sprint: 4, Icon: GraduationCap },
]

function ApiStatus() {
  const { isPending, isError } = useQuery({ queryKey: ['health'], queryFn: healthApi.get })
  const [label, color] = isPending
    ? ['Connexion au serveur…', 'bg-slate-300']
    : isError
      ? ['Serveur injoignable', 'bg-red-500']
      : ['Serveur connecté', 'bg-emerald-500']
  return (
    <p className="flex items-center gap-2 text-sm text-slate-600" role="status">
      <span className={`size-2.5 rounded-full ${color}`} aria-hidden />
      {label}
    </p>
  )
}

function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">MilaTech Management</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Ventes, stock, réparations et formations de MilaTech, dans un seul outil, sur ordinateur et sur téléphone.
      </p>
      <div className="mt-4">
        <ApiStatus />
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODULES.map(({ title, text, sprint, Icon }) => (
          <li key={title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="text-sm text-slate-600">{text}</p>
              <p className="mt-2 text-xs font-semibold text-brand-700 uppercase">Sprint {sprint}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-brand-700">
        Retour à l’accueil
      </Link>
    </main>
  )
}

export default function App() {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <CircuitBoard className="size-5" aria-hidden />
          </span>
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            Mila<span className="text-brand-700">Tech</span>
          </Link>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
