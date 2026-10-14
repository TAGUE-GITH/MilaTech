import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors, myQuotesApi } from '../../api/client'
import { DEVICE_LABELS } from '../../api/types'
import type { DeviceType, QuoteForm } from '../../api/types'
import { Alert, Button, Card, Field, Select, TextArea } from '../../components/ui'
import { resizeImage } from '../../lib/image'

// Demande de devis de reparation envoyee par le client depuis son espace
export default function NewQuotePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<QuoteForm>({ deviceType: 'TELEPHONE', brand: '', model: '', issue: '', photo: '' })
  const [photoError, setPhotoError] = useState('')
  const set = (changes: Partial<QuoteForm>) => setForm((current) => ({ ...current, ...changes }))

  const send = useMutation({
    mutationFn: () => myQuotesApi.request(form),
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ['my-quotes'] })
      navigate(`/mon-espace/devis/${quote.id}`, { replace: true, state: { sent: true } })
    },
  })
  const errors = fieldErrors(send.error)

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoError('')
    try {
      set({ photo: await resizeImage(file, 1024, 0.8) })
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Image illisible.')
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link to="/mon-espace" className="text-sm font-semibold text-brand-700">
        ← Mon espace
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Demander un devis</h1>
      <p className="mt-1 text-slate-600">Décrivez la panne : la boutique vous répond avec un prix dans votre espace. C’est gratuit et sans engagement.</p>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Alert>{send.isError && !Object.keys(errors).length ? errorMessage(send.error) : ''}</Alert>
          <Select label="Type d’appareil" value={form.deviceType} onChange={(e) => set({ deviceType: e.target.value as DeviceType })} error={errors.deviceType}>
            {Object.entries(DEVICE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Marque" value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Tecno, Samsung, HP…" />
            <Field label="Modèle" value={form.model} onChange={(e) => set({ model: e.target.value })} placeholder="Spark 10, Galaxy A15…" />
          </div>
          <TextArea label="La panne" rows={4} value={form.issue} onChange={(e) => set({ issue: e.target.value })} error={errors.issue} placeholder="Que se passe-t-il ? Depuis quand ? Après une chute, un contact avec l’eau ?" />
          <div>
            <p className="mb-1.5 text-sm font-semibold">Photo (facultatif)</p>
            <input ref={input} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={choose} aria-label="Choisir une photo de l’appareil" />
            {form.photo ? (
              <div className="flex items-center gap-3">
                <img src={form.photo} alt="Photo de l’appareil" className="size-24 rounded-xl object-cover ring-1 ring-slate-200" />
                <Button variant="ghost" onClick={() => set({ photo: '' })}>
                  <Trash2 className="size-4" aria-hidden />
                  Retirer
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => input.current?.click()}>
                <Camera className="size-4" aria-hidden />
                Ajouter une photo
              </Button>
            )}
            <div className="mt-2">
              <Alert>{photoError}</Alert>
            </div>
          </div>
          <Button type="submit" loading={send.isPending} className="w-full">
            Envoyer ma demande
          </Button>
        </form>
      </Card>
    </div>
  )
}
