import { ArrowRight, Cpu, GraduationCap, MapPin, MessageCircle, Phone, ShieldCheck, Smartphone, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { shopApi } from '../../api/client'
import { buttonClasses } from '../../components/buttonClasses'
import { COMPANY, displayPhone } from '../../lib/company'
import { whatsappLink } from '../../lib/whatsapp'
import { ProductCard } from '../shop/ShopPage'

type Service = { title: string; text: string; points: string[]; Icon: LucideIcon }

const SERVICES: Service[] = [
  {
    title: 'Vente',
    text: 'Appareils neufs, accessoires et composants électroniques.',
    points: ['Téléphones et accessoires', 'Appareils Bluetooth', 'Composants et pièces détachées'],
    Icon: Smartphone,
  },
  {
    title: 'Réparation',
    text: 'Téléphones, ordinateurs, tablettes et appareils Bluetooth.',
    points: ['Diagnostic avant toute réparation', 'Devis communiqué avant de commencer', 'Bon de dépôt remis au client'],
    Icon: Wrench,
  },
  {
    title: 'Formation',
    text: 'Formations pratiques en présentiel, à la boutique.',
    points: ['Réparation de téléphones', 'Électronique', 'Paiement en plusieurs fois'],
    Icon: GraduationCap,
  },
]

const STEPS = [
  { title: 'Devis', text: 'Décrivez la panne en ligne (avec une photo) : nous vous envoyons un prix dans votre espace.' },
  { title: 'Déposez', text: 'Vous apportez l’appareil, nous notons la panne et vous remettons un bon de dépôt.' },
  { title: 'Diagnostic', text: 'Nous trouvons la cause et vous donnons le prix avant toute réparation.' },
  { title: 'Réparation', text: 'Avec votre accord, nous réparons avec des pièces de qualité.' },
  { title: 'Récupérez', text: 'Suivez la réparation dans votre espace ; nous vous prévenons sur WhatsApp dès que l’appareil est prêt.' },
]

// Page d'accueil publique : la vitrine de MilaTech
export default function PublicHomePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div>
            <p className="text-sm font-semibold tracking-wider text-brand-100 uppercase">
              {COMPANY.district} · {COMPANY.city}
            </p>
            <h1 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              Votre spécialiste de l’électronique à {COMPANY.city}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-50">
              Vente d’appareils et de composants, réparation de téléphones, d’ordinateurs et d’appareils Bluetooth, et formations pratiques.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/boutique" className={buttonClasses('secondary', 'px-6 py-3 text-base')}>
                Voir la boutique
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link to="/mon-espace/devis/nouveau" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white ring-1 ring-white/60 hover:bg-white/10">
                Demander un devis
              </Link>
              <a
                href={whatsappLink(COMPANY.whatsapp, 'Bonjour MilaTech, ')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600"
              >
                <MessageCircle className="size-5" aria-hidden />
                WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden justify-center lg:flex" aria-hidden>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl" />
              <Cpu className="relative size-64 text-white/90" strokeWidth={0.8} />
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Nos services</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">Tout ce qu’il faut pour vos appareils, au même endroit.</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICES.map(({ title, text, points, Icon }) => (
            <li key={title} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-1 text-slate-600">{text}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <ShopPreview />

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">Une réparation, comment ça se passe ?</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{index + 1}</span>
                <h3 className="mt-4 font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Venez nous voir</h2>
          <p className="mt-3 flex gap-2 text-slate-700">
            <MapPin className="mt-1 size-5 shrink-0 text-brand-700" aria-hidden />
            <span>
              <strong>
                {COMPANY.district}, {COMPANY.city}
              </strong>
              <br />
              {COMPANY.directions}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {COMPANY.phones.map((phone) => (
              <a key={phone} href={`tel:+237${phone}`} className={buttonClasses('secondary')}>
                <Phone className="size-4" aria-hidden />
                {displayPhone(phone)}
              </a>
            ))}
            <a href={COMPANY.mapsUrl} target="_blank" rel="noreferrer" className={buttonClasses('ghost')}>
              Ouvrir dans Google Maps
            </a>
          </div>
        </div>
        <div className="rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-100">
          <h3 className="text-xl font-bold">Créez votre compte client</h3>
          <p className="mt-2 text-slate-700">
            Retrouvez vos achats, suivez vos réparations et, bientôt, commandez en ligne et demandez vos devis depuis votre espace.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/inscription" className={buttonClasses('primary')}>
              Créer mon compte
            </Link>
            <Link to="/contact" className={buttonClasses('secondary')}>
              Nous écrire
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/** Quelques produits de la boutique en ligne (rien ne s'affiche tant qu'aucun produit n'est disponible). */
function ShopPreview() {
  const { data } = useQuery({ queryKey: ['shop', '', ''], queryFn: () => shopApi.products() })
  if (!data?.length) return null
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">En boutique</h2>
          <p className="mt-1 text-slate-600">Commandez en ligne : retrait en boutique ou livraison à Yaoundé.</p>
        </div>
        <Link to="/boutique" className="font-semibold text-brand-700">
          Tous les produits →
        </Link>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {data.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  )
}
