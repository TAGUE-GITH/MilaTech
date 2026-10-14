import { CircuitBoard, LayoutDashboard, MapPin, Menu, MessageCircle, Phone, ShoppingCart, User, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { homeOf, useAuth } from '../../auth/AuthProvider'
import { Avatar } from '../../components/Avatar'
import { OpeningHours } from '../../components/OpeningHours'
import { buttonClasses } from '../../components/buttonClasses'
import { COMPANY, displayPhone } from '../../lib/company'
import { whatsappLink } from '../../lib/whatsapp'
import { useShopCart } from '../shop/ShopCart'

// Annee du pied de page, calculee une fois au chargement
const YEAR = new Date().getFullYear()

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/#services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
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

function AccountButton() {
  const { user, isStaff } = useAuth()
  if (!user)
    return (
      <div className="flex items-center gap-2">
        <Link to="/connexion" className={buttonClasses('ghost', 'px-3')}>
          Connexion
        </Link>
        <Link to="/inscription" className={buttonClasses('primary', 'px-3')}>
          Créer un compte
        </Link>
      </div>
    )
  return (
    <Link to={homeOf(user)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold hover:bg-slate-100">
      <Avatar user={user} />
      <span className="hidden sm:inline">{isStaff ? 'Espace boutique' : 'Mon espace'}</span>
      {isStaff ? <LayoutDashboard className="size-4 sm:hidden" aria-hidden /> : <User className="size-4 sm:hidden" aria-hidden />}
    </Link>
  )
}

/** Panier toujours visible, avec le nombre d'articles. */
function CartButton() {
  const { count } = useShopCart()
  return (
    <Link to="/panier" className="relative rounded-xl p-2 text-slate-700 hover:bg-slate-100" aria-label={count ? `Panier : ${count} article(s)` : 'Panier'}>
      <ShoppingCart className="size-6" aria-hidden />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

// Site public de MilaTech : vitrine, boutique, contact, inscription et espace client
export default function PublicLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-5 md:flex" aria-label="Site">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end className="text-sm font-semibold text-slate-700 hover:text-brand-700">
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <AccountButton />
            </div>
            <CartButton />
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="-ml-4 rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
        {open && (
          <div className="space-y-3 border-t border-slate-200 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Site">
              {LINKS.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100">
                  {link.label}
                </Link>
              ))}
            </nav>
            <AccountButton />
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-slate-600">{COMPANY.tagline} à {COMPANY.city}.</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-ink">Nous trouver</p>
            <p className="mt-2 flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {COMPANY.district}, {COMPANY.city}
                <br />
                {COMPANY.directions}
              </span>
            </p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-ink">Horaires</p>
            <OpeningHours className="mt-2" />
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-semibold text-ink">Nous appeler</p>
            {COMPANY.phones.map((phone) => (
              <a key={phone} href={`tel:+237${phone}`} className="flex items-center gap-2 hover:text-brand-700">
                <Phone className="size-4" aria-hidden />
                {displayPhone(phone)}
              </a>
            ))}
            <a href={whatsappLink(COMPANY.whatsapp, 'Bonjour MilaTech, ')} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-emerald-700">
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-200 py-4 text-xs text-slate-500">
          <span>
            © {YEAR} {COMPANY.name} · {COMPANY.city}
          </span>
          <Link to="/conditions-generales" className="hover:text-brand-700">
            Conditions générales
          </Link>
          <Link to="/confidentialite" className="hover:text-brand-700">
            Confidentialité
          </Link>
          <Link to="/espace-boutique" className="hover:text-brand-700">
            Espace boutique (personnel)
          </Link>
        </div>
      </footer>
    </div>
  )
}
