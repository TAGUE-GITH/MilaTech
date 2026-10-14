import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { contactApi, errorMessage, fieldErrors } from '../../api/client'
import type { ContactForm } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { buttonClasses } from '../../components/buttonClasses'
import { Alert, Button, Card, Field, TextArea } from '../../components/ui'
import { OpeningHours } from '../../components/OpeningHours'
import { COMPANY, displayPhone } from '../../lib/company'
import { whatsappLink } from '../../lib/whatsapp'

// Formulaire de contact : le message arrive dans l'espace boutique (rubrique Messages)
export default function ContactPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<ContactForm>({
    name: user?.fullName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    subject: '',
    message: '',
    website: '',
  })
  const send = useMutation({ mutationFn: () => contactApi.send(form) })
  const errors = fieldErrors(send.error)
  const set = (changes: Partial<ContactForm>) => setForm((current) => ({ ...current, ...changes }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send.mutate()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact</h1>
      <p className="mt-2 text-slate-600">Une question, un devis de réparation, une formation ? Écrivez-nous, nous vous rappelons.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <Card>
          {send.isSuccess ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
              <p className="mt-3 text-lg font-bold">Message envoyé, merci !</p>
              <p className="mt-1 text-slate-600">Nous vous recontactons au {form.phone} dès que possible.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Alert>{send.isError && !Object.keys(errors).length ? errorMessage(send.error) : ''}</Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Votre nom" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} autoComplete="name" />
                <Field label="Téléphone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} autoComplete="tel" placeholder="6XX XX XX XX" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email (facultatif)" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} autoComplete="email" />
                <Field label="Sujet (facultatif)" value={form.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="Devis réparation, formation…" />
              </div>
              <TextArea label="Votre message" rows={5} value={form.message} onChange={(e) => set({ message: e.target.value })} error={errors.message} />
              {/* Piege a robots : invisible pour les visiteurs, ignore par les lecteurs d'ecran */}
              <div className="hidden" aria-hidden>
                <label>
                  Site web
                  <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                  Vos informations servent uniquement à vous répondre.{' '}
                  <Link to="/confidentialite" className="font-semibold text-brand-700">
                    Politique de confidentialité
                  </Link>
                </p>
                <Button type="submit" loading={send.isPending}>
                Envoyer le message
              </Button>
            </form>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 font-bold">
              <MapPin className="size-5 text-brand-700" aria-hidden />
              Adresse
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              <strong>
                {COMPANY.district}, {COMPANY.city}
              </strong>
              <br />
              {COMPANY.directions}
            </p>
            <a href={COMPANY.mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand-700">
              Ouvrir dans Google Maps
            </a>
          </Card>
          <Card>
            <h2 className="font-bold">Horaires d’ouverture</h2>
            <OpeningHours className="mt-2 text-slate-700" />
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-bold">
              <Phone className="size-5 text-brand-700" aria-hidden />
              Téléphone
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {COMPANY.phones.map((phone) => (
                <a key={phone} href={`tel:+237${phone}`} className={buttonClasses('secondary', 'justify-start')}>
                  {displayPhone(phone)}
                </a>
              ))}
              <a href={whatsappLink(COMPANY.whatsapp, 'Bonjour MilaTech, ')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                <MessageCircle className="size-4" aria-hidden />
                Écrire sur WhatsApp
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
