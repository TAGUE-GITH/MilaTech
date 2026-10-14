import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react'
import { contactApi, errorMessage } from '../../api/client'
import type { ContactMessage } from '../../api/types'
import { Alert, Badge, Button, Card, Loader, PageHeader } from '../../components/ui'
import { displayPhone } from '../../lib/company'
import { whatsappLink } from '../../lib/whatsapp'

const dateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Messages recus par le formulaire de contact du site (gerant et vendeurs)
export default function MessagesPage() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ['contact-messages'], queryFn: contactApi.list })
  const waiting = data?.filter((message) => !message.handled).length ?? 0

  return (
    <>
      <PageHeader title="Messages" subtitle={data ? `${waiting} message(s) à traiter` : 'Formulaire de contact du site'} />
      {isPending && <Loader />}
      {isError && <Alert>{errorMessage(error)}</Alert>}
      {data && data.length === 0 && <p className="py-10 text-center text-slate-500">Aucun message pour le moment.</p>}
      <ul className="space-y-3">
        {data?.map((message) => <MessageCard key={message.id} message={message} />)}
      </ul>
    </>
  )
}

function MessageCard({ message }: { message: ContactMessage }) {
  const queryClient = useQueryClient()
  const toggle = useMutation({
    mutationFn: () => contactApi.setHandled(message.id, !message.handled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-messages'] }),
  })

  return (
    <li>
      <Card className={message.handled ? 'opacity-60' : ''}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">
              {message.name} {message.subject && <span className="font-normal text-slate-500">· {message.subject}</span>}
            </p>
            <p className="text-xs text-slate-500">{dateTime(message.createdAt)}</p>
          </div>
          {message.handled ? <Badge tone="green">Traité</Badge> : <Badge tone="amber">À traiter</Badge>}
        </div>
        <p className="mt-3 text-sm whitespace-pre-line text-slate-700">{message.message}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <a href={`tel:+237${message.phone}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-brand-700 hover:bg-brand-50">
            <Phone className="size-4" aria-hidden />
            {displayPhone(message.phone)}
          </a>
          <a href={whatsappLink(message.phone, `Bonjour ${message.name}, merci pour votre message à MilaTech. `)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-emerald-700 hover:bg-emerald-50">
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </a>
          {message.email && (
            <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100">
              <Mail className="size-4" aria-hidden />
              {message.email}
            </a>
          )}
          <Button variant={message.handled ? 'ghost' : 'secondary'} className="ml-auto px-3 py-1.5" loading={toggle.isPending} onClick={() => toggle.mutate()}>
            <CheckCircle2 className="size-4" aria-hidden />
            {message.handled ? 'Remettre à traiter' : 'Marquer comme traité'}
          </Button>
        </div>
      </Card>
    </li>
  )
}
