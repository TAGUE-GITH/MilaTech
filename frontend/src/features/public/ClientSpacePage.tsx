import { LogOut, PackageSearch, Wrench } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Button, Card } from '../../components/ui'
import { ProfilePanel } from '../profile/ProfilePanel'

// « Mon espace » : l'espace personnel d'un client du site
export default function ClientSpacePage() {
  const { user, logout } = useAuth()
  const welcome = (useLocation().state as { welcome?: boolean } | null)?.welcome

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mon espace</h1>
          <p className="mt-1 text-slate-600">Bonjour {user?.firstName}, bienvenue chez MilaTech.</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut className="size-4" aria-hidden />
          Se déconnecter
        </Button>
      </div>
      {welcome && (
        <div className="mb-6">
          <Alert type="success">Votre compte est créé. Ajoutez une photo si vous le souhaitez.</Alert>
        </div>
      )}
      <ProfilePanel />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="opacity-80">
          <h2 className="flex items-center gap-2 font-bold">
            <PackageSearch className="size-5 text-brand-700" aria-hidden />
            Mes commandes
          </h2>
          <p className="mt-2 text-sm text-slate-600">Bientôt : commandez en ligne et suivez vos commandes ici.</p>
        </Card>
        <Card className="opacity-80">
          <h2 className="flex items-center gap-2 font-bold">
            <Wrench className="size-5 text-brand-700" aria-hidden />
            Mes réparations et devis
          </h2>
          <p className="mt-2 text-sm text-slate-600">Bientôt : demandez un devis et suivez la réparation de vos appareils ici.</p>
        </Card>
      </div>
    </div>
  )
}
