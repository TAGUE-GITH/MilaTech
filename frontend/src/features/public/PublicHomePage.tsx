import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, GraduationCap, MapPin, MessageCircle, Phone, ShieldCheck, Smartphone, Truck, Wallet, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { shopApi } from '../../api/client'
import { buttonClasses } from '../../components/buttonClasses'
import { COMPANY, displayPhone } from '../../lib/company'
import { PHOTOS, photoSrcSet, photoUrl } from '../../lib/photos'
import type { Photo } from '../../lib/photos'
import { whatsappLink } from '../../lib/whatsapp'
import { ProductCard } from '../shop/ShopPage'

type Service = { title: string; text: string; points: string[]; Icon: LucideIcon; photo: Photo; cta: { label: string; to: string } }

const SERVICES: Service[] = [
  {
    title: 'Vente',
    text: 'Appareils neufs, accessoires et composants électroniques.',
    points: ['Téléphones et accessoires', 'Appareils Bluetooth', 'Composants et pièces détachées'],
    Icon: Smartphone,
    photo: PHOTOS.sale,
    cta: { label: 'Voir la boutique', to: '/boutique' },
  },
  {
    title: 'Réparation',
    text: 'Téléphones, ordinateurs, tablettes et appareils Bluetooth.',
    points: ['Diagnostic avant toute réparation', 'Devis communiqué avant de commencer', 'Suivi de la réparation en ligne'],
    Icon: Wrench,
    photo: PHOTOS.repair,
    cta: { label: 'Demander un devis', to: '/mon-espace/devis/nouveau' },
  },
  {
    title: 'Formation',
    text: 'Formations pratiques en présentiel, à la boutique.',
    points: ['Réparation de téléphones', 'Électronique', 'Paiement en plusieurs fois'],
    Icon: GraduationCap,
    photo: PHOTOS.training,
    cta: { label: 'Se renseigner', to: '/contact' },
  },
]

const STEPS = [
  { title: 'Devis en ligne', text: 'Décrivez la panne (avec une photo) : nous vous envoyons un prix dans votre espace.' },
  { title: 'Dépôt', text: 'Vous apportez l’appareil, nous notons la panne et vous remettons un bon de dépôt.' },
  { title: 'Diagnostic et réparation', text: 'Nous trouvons la cause et réparons avec votre accord, avec des pièces de qualité.' },
  { title: 'Retrait', text: 'Suivez chaque étape dans votre espace ; nous vous prévenons sur WhatsApp dès que c’est prêt.' },
]

const GALLERY: { photo: Photo; caption: string }[] = [
  { photo: PHOTOS.parts, caption: 'Composants et pièces détachées' },
  { photo: PHOTOS.multimeter, caption: 'Diagnostic précis' },
  { photo: PHOTOS.disassembly, caption: 'Réparations soignées' },
  { photo: PHOTOS.customer, caption: 'Un service proche de vous' },
]

const TRUST: { label: string; Icon: LucideIcon }[] = [
  { label: 'Diagnostic avant réparation', Icon: ShieldCheck },
  { label: 'Espèces ou Mobile Money', Icon: Wallet },
  { label: `Livraison à ${COMPANY.city}`, Icon: Truck },
]

/** Photo responsive : le navigateur charge la taille adaptee a l'ecran. */
function Picture({ photo, ratio, sizes, className = '', eager = false }: { photo: Photo; ratio: number; sizes: string; className?: string; eager?: boolean }) {
  return (
    <img
      src={photoUrl(photo, 960, Math.round(960 / ratio))}
      srcSet={photoSrcSet(photo, [480, 960, 1600], ratio)}
      sizes={sizes}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      className={`bg-slate-200 object-cover ${className}`}
    />
  )
}

// Page d'accueil publique : la vitrine de MilaTech
export default function PublicHomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Picture photo={PHOTOS.hero} ratio={16 / 9} sizes="100vw" eager className="absolute inset-0 -z-10 size-full" />
        <div className="absolute inset-0 -z-10 bg-slate-950/75 sm:bg-transparent sm:bg-gradient-to-r sm:from-slate-950/95 sm:via-slate-950/75 sm:to-slate-950/30" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-32">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/20 backdrop-blur">
            <MapPin className="size-4" aria-hidden />
            {COMPANY.district} · {COMPANY.city}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl">
            Votre spécialiste de l’électronique à {COMPANY.city}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-200">
            Vente d’appareils et de composants, réparation de téléphones, d’ordinateurs et d’appareils Bluetooth, et formations pratiques.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/boutique" className={buttonClasses('primary', 'px-6 py-3 text-base')}>
              Voir la boutique
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/mon-espace/devis/nouveau"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-ink hover:bg-slate-100"
            >
              <Wrench className="size-4" aria-hidden />
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
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-200">
            {TRUST.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-brand-300" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Nos services</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">Tout ce qu’il faut pour vos appareils, au même endroit.</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICES.map(({ title, text, points, Icon, photo, cta }) => (
            <li key={title} className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-lg">
              <div className="relative overflow-hidden">
                <Picture photo={photo} ratio={3 / 2} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[3/2] w-full transition duration-500 group-hover:scale-105" />
                <span className="absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow">
                  <Icon className="size-6" aria-hidden />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-1 text-slate-600">{text}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link to={cta.to} className="mt-auto inline-flex items-center gap-1 pt-5 font-semibold text-brand-700 hover:text-brand-800">
                  {cta.label}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ShopPreview />

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <Picture photo={PHOTOS.opened} ratio={4 / 3} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-3xl shadow-xl" />
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Une réparation, comment ça se passe ?</h2>
            <ol className="mt-8 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">{index + 1}</span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-0.5 text-slate-600">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/mon-espace/devis/nouveau" className={buttonClasses('primary', 'mt-8 px-6 py-3 text-base')}>
              Demander un devis gratuit
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-wider text-brand-200 uppercase">Formation</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Apprenez un métier qui a de l’avenir</h2>
            <p className="mt-4 text-lg text-brand-50">
              Réparation de téléphones et électronique : des sessions en petits groupes, à la boutique, avec de vrais appareils et un formateur à vos côtés.
            </p>
            <ul className="mt-6 space-y-2">
              {['Pratique dès le premier jour', 'Petits groupes', 'Paiement en plusieurs fois'].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-5 text-brand-300" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <a
              href={whatsappLink(COMPANY.whatsapp, 'Bonjour MilaTech, je voudrais des informations sur les formations.')}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-ink hover:bg-slate-100"
            >
              <MessageCircle className="size-5 text-emerald-600" aria-hidden />
              Prochaines sessions
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Picture photo={PHOTOS.training} ratio={3 / 4} sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[3/4] w-full rounded-2xl" />
            <Picture photo={PHOTOS.workshop} ratio={3 / 4} sizes="(min-width: 1024px) 25vw, 50vw" className="mt-10 aspect-[3/4] w-full rounded-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">L’électronique, notre métier</h2>
        <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {GALLERY.map(({ photo, caption }) => (
            <li key={caption} className="relative overflow-hidden rounded-2xl">
              <Picture photo={photo} ratio={1} sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-square w-full" />
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-3 pt-10 text-sm font-semibold text-white">{caption}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:pb-20">
        <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:p-8">
          <h2 className="text-3xl font-extrabold tracking-tight">Venez nous voir</h2>
          <p className="mt-4 flex gap-2 text-slate-700">
            <MapPin className="mt-1 size-5 shrink-0 text-brand-700" aria-hidden />
            <span>
              <strong>
                {COMPANY.district}, {COMPANY.city}
              </strong>
              <br />
              {COMPANY.directions}
            </span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
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
        <div className="flex flex-col justify-center rounded-3xl bg-brand-50 p-6 ring-1 ring-brand-100 sm:p-8">
          <h3 className="text-2xl font-bold">Créez votre compte client</h3>
          <p className="mt-2 text-slate-700">Commandez en ligne, demandez vos devis de réparation et suivez vos appareils depuis votre espace.</p>
          <div className="mt-6 flex flex-wrap gap-3">
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
          <p className="mt-1 text-slate-600">Commandez en ligne : retrait en boutique ou livraison à {COMPANY.city}.</p>
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
