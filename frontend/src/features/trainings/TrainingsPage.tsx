import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors, trainingsApi } from '../../api/client'
import type { TrainingForm } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { Alert, Badge, Button, Card, Field, Loader, PageHeader, TextArea } from '../../components/ui'
import { formatDate, formatFcfa } from '../../lib/format'

const EMPTY: TrainingForm = { title: '', description: '', startDate: '', endDate: '', fee: '', capacity: '' }
const numberOrEmpty = (value: string) => (value === '' ? '' : Number(value))

// US-20 : sessions de formation
export default function TrainingsPage() {
  const { hasRole } = useAuth()
  const organizer = hasRole('GERANT', 'FORMATEUR')
  const { data, isPending, isError, error } = useQuery({ queryKey: ['trainings'], queryFn: trainingsApi.list })

  return (
    <>
      <PageHeader title="Formations" subtitle="Sessions en présentiel, apprenants et paiements" />
      <div className={`grid gap-6 ${organizer ? 'lg:grid-cols-[1fr_22rem]' : ''}`}>
        <section>
          {isPending && <Loader />}
          {isError && <Alert>{errorMessage(error)}</Alert>}
          {data && data.length === 0 && <p className="py-10 text-center text-slate-500">Aucune session pour le moment.</p>}
          <ul className="space-y-3">
            {data?.map((training) => (
              <li key={training.id}>
                <Link to={`/formations/${training.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{training.title}</p>
                      <p className="text-sm text-slate-500">
                        Du {formatDate(training.startDate)} au {formatDate(training.endDate)} · {formatFcfa(training.fee)}
                        {training.trainer && ` · ${training.trainer}`}
                      </p>
                    </div>
                    <Badge tone={training.seatsLeft === 0 ? 'red' : 'brand'}>
                      {training.seatsLeft === 0 ? 'Complet' : `${training.seatsLeft} place(s) libre(s)`}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100" aria-hidden>
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${(training.enrolled / training.capacity) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {training.enrolled} / {training.capacity} apprenants
                    {training.balanceDue > 0 && ` · reste à encaisser ${formatFcfa(training.balanceDue)}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {organizer && <NewTraining />}
      </div>
    </>
  )
}

function NewTraining() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const save = useMutation({
    mutationFn: () => trainingsApi.save(form),
    onSuccess: (training) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
      navigate(`/formations/${training.id}`)
    },
  })
  const errors = fieldErrors(save.error)
  const set = (changes: Partial<TrainingForm>) => setForm((current) => ({ ...current, ...changes }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  return (
    <Card className="h-fit">
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <CalendarPlus className="size-5 text-brand-700" aria-hidden />
        Nouvelle session
      </h2>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Alert>{save.isError && !Object.keys(errors).length ? errorMessage(save.error) : ''}</Alert>
        <Field label="Intitulé" value={form.title} onChange={(e) => set({ title: e.target.value })} error={errors.title} placeholder="Réparation de téléphones" />
        <TextArea label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début" type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} error={errors.startDate} />
          <Field label="Fin" type="date" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} error={errors.endDate} />
          <Field label="Frais (FCFA)" type="number" min={0} inputMode="numeric" value={form.fee} onChange={(e) => set({ fee: numberOrEmpty(e.target.value) })} error={errors.fee} />
          <Field label="Places" type="number" min={1} inputMode="numeric" value={form.capacity} onChange={(e) => set({ capacity: numberOrEmpty(e.target.value) })} error={errors.capacity} />
        </div>
        <Button type="submit" loading={save.isPending} className="w-full">
          Créer la session
        </Button>
      </form>
    </Card>
  )
}
