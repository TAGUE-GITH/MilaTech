import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors, repairsApi } from '../../api/client'
import { DEVICE_LABELS, PAYMENT_LABELS } from '../../api/types'
import type { Customer, DeviceType, NewRepair, PaymentMethod } from '../../api/types'
import { Alert, Button, Card, Field, PageHeader, Select, TextArea } from '../../components/ui'
import { CustomerPicker } from '../customers/CustomerPicker'

const numberOrEmpty = (value: string) => (value === '' ? '' : Number(value))

// US-14 : depot d'un appareil a reparer
export default function NewRepairPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<Omit<NewRepair, 'customerId'>>({
    deviceType: 'TELEPHONE',
    brand: '',
    model: '',
    serialNumber: '',
    accessories: '',
    reception: 'BOUTIQUE',
    reportedIssue: '',
    estimatedCost: '',
    promisedOn: '',
    deposit: '',
    depositMethod: 'ESPECES',
  })
  const receive = useMutation({
    mutationFn: () => repairsApi.receive({ ...form, customerId: customer?.id ?? null }),
    onSuccess: (repair) => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      navigate(`/reparations/${repair.id}`, { state: { created: true } })
    },
  })
  const errors = fieldErrors(receive.error)
  const set = (changes: Partial<typeof form>) => setForm((current) => ({ ...current, ...changes }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    receive.mutate()
  }

  return (
    <>
      <Link to="/reparations" className="text-sm font-semibold text-brand-700">
        ← Réparations
      </Link>
      <PageHeader title="Nouveau dépôt" subtitle="Le client repart avec un bon de dépôt imprimable" />
      <form onSubmit={submit} noValidate className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-bold">Client</h2>
          <CustomerPicker value={customer} onChange={setCustomer} emptyLabel="Choisir le client" />
          {errors.customerId && <p className="text-sm text-red-700">{errors.customerId}</p>}

          <h2 className="pt-2 font-bold">Appareil</h2>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.deviceType} onChange={(e) => set({ deviceType: e.target.value as DeviceType })}>
              {(Object.keys(DEVICE_LABELS) as DeviceType[]).map((type) => (
                <option key={type} value={type}>
                  {DEVICE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Select label="Récupéré" value={form.reception} onChange={(e) => set({ reception: e.target.value as NewRepair['reception'] })} error={errors.reception}>
              <option value="BOUTIQUE">En boutique</option>
              <option value="DOMICILE">À domicile</option>
            </Select>
            <Field label="Marque" value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Samsung, HP, JBL…" />
            <Field label="Modèle" value={form.model} onChange={(e) => set({ model: e.target.value })} placeholder="Galaxy A15" />
          </div>
          <Field label="N° de série ou IMEI" value={form.serialNumber} onChange={(e) => set({ serialNumber: e.target.value })} hint="Sur l’étiquette ou en tapant *#06# sur un téléphone" />
          <Field label="Accessoires laissés" value={form.accessories} onChange={(e) => set({ accessories: e.target.value })} placeholder="Chargeur, coque, carte SIM…" />
        </Card>

        <Card className="h-fit space-y-4">
          <h2 className="font-bold">Panne et conditions</h2>
          <Alert>{receive.isError && !Object.keys(errors).length ? errorMessage(receive.error) : ''}</Alert>
          <TextArea label="Problème signalé par le client" value={form.reportedIssue} onChange={(e) => set({ reportedIssue: e.target.value })} error={errors.reportedIssue} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Coût estimé (FCFA)" type="number" min={0} inputMode="numeric" value={form.estimatedCost} onChange={(e) => set({ estimatedCost: numberOrEmpty(e.target.value) })} error={errors.estimatedCost} />
            <Field label="Date prévue" type="date" value={form.promisedOn} onChange={(e) => set({ promisedOn: e.target.value })} />
            <Field label="Acompte versé (FCFA)" type="number" min={0} inputMode="numeric" value={form.deposit} onChange={(e) => set({ deposit: numberOrEmpty(e.target.value) })} error={errors.deposit} />
            <Select label="Payé en" value={form.depositMethod} onChange={(e) => set({ depositMethod: e.target.value as PaymentMethod })}>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_LABELS[method]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={receive.isPending} className="w-full">
            Enregistrer le dépôt
          </Button>
        </Card>
      </form>
    </>
  )
}
