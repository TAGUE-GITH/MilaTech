// Types des donnees echangees avec l'API Spring Boot

export type Role = 'GERANT' | 'VENDEUR' | 'TECHNICIEN' | 'FORMATEUR'

export const ROLE_LABELS: Record<Role, string> = {
  GERANT: 'Gérant',
  VENDEUR: 'Vendeur',
  TECHNICIEN: 'Technicien',
  FORMATEUR: 'Formateur',
}

export type User = {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  role: Role
  active: boolean
  createdAt: string
}

export type Named = { id: number; name: string }

export type Category = Named

export type Supplier = {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export type Product = {
  id: number
  reference: string
  name: string
  category: Named
  supplier?: Named
  description?: string
  /** Absent pour les employes qui ne sont pas gerants */
  purchasePrice?: number
  salePrice: number
  quantity: number
  alertThreshold: number
  lowStock: boolean
  active: boolean
}

export type ProductForm = {
  reference: string
  name: string
  categoryId: number | ''
  supplierId: number | ''
  description: string
  purchasePrice: number | ''
  salePrice: number | ''
  alertThreshold: number | ''
  initialQuantity?: number | ''
  active: boolean
}

export type MovementType = 'STOCK_INITIAL' | 'ACHAT' | 'CORRECTION' | 'VENTE' | 'PIECE_REPARATION' | 'RETOUR_PIECE'

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  STOCK_INITIAL: 'Stock initial',
  ACHAT: 'Achat',
  CORRECTION: 'Correction',
  VENTE: 'Vente',
  PIECE_REPARATION: 'Pièce de réparation',
  RETOUR_PIECE: 'Retour de pièce',
}

export type StockMovement = {
  id: number
  type: MovementType
  quantity: number
  quantityAfter: number
  unitCost: number | null
  supplier: string | null
  reason: string | null
  author: string
  createdAt: string
}

export type NewUser = {
  email: string
  firstName: string
  lastName: string
  phone: string
  role: Role
  password: string
}

export type Customer = {
  id: number
  fullName: string
  phone: string
  email: string | null
  notes: string | null
  createdAt: string
}

export type CustomerForm = { fullName: string; phone: string; email: string; notes: string }

export type PaymentMethod = 'ESPECES' | 'MOBILE_MONEY'

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
}

export type SaleSummary = {
  id: number
  reference: string
  customer?: string
  seller: string
  paymentMethod: PaymentMethod
  total: number
  /** Seulement pour le gerant */
  margin?: number
  createdAt: string
}

export type SaleLine = {
  productId: number
  productName: string
  productReference: string
  quantity: number
  unitPrice: number
  lineTotal: number
  unitCost?: number
}

export type Sale = Omit<SaleSummary, 'customer'> & { customer?: Named; lines: SaleLine[] }

export type CustomerDetail = { customer: Customer; sales: SaleSummary[]; totalSpent: number; repairs: RepairSummary[] }

export type PeriodTotals = { count: number; total: number; margin: number }

export type RepairStatus = 'RECU' | 'EN_DIAGNOSTIC' | 'EN_REPARATION' | 'REPARE' | 'IRREPARABLE' | 'ANNULE' | 'RESTITUE'

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  RECU: 'Reçu',
  EN_DIAGNOSTIC: 'En diagnostic',
  EN_REPARATION: 'En réparation',
  REPARE: 'Réparé',
  IRREPARABLE: 'Irréparable',
  ANNULE: 'Annulé',
  RESTITUE: 'Restitué',
}

export type DeviceType = 'TELEPHONE' | 'ORDINATEUR' | 'TABLETTE' | 'BLUETOOTH' | 'AUTRE'

export const DEVICE_LABELS: Record<DeviceType, string> = {
  TELEPHONE: 'Téléphone',
  ORDINATEUR: 'Ordinateur',
  TABLETTE: 'Tablette',
  BLUETOOTH: 'Appareil Bluetooth',
  AUTRE: 'Autre',
}

export type Reception = 'BOUTIQUE' | 'DOMICILE'

export type RepairSummary = {
  id: number
  reference: string
  customer: string
  customerPhone: string
  device: string
  deviceType: DeviceType
  status: RepairStatus
  statusLabel: string
  promisedOn: string | null
  total: number
  balance: number
  receivedAt: string
}

export type Repair = {
  id: number
  reference: string
  customer: { id: number; fullName: string; phone: string }
  deviceType: DeviceType
  brand: string | null
  model: string | null
  device: string
  serialNumber: string | null
  accessories: string | null
  reception: Reception
  reportedIssue: string
  diagnosis: string | null
  status: RepairStatus
  statusLabel: string
  nextStatuses: RepairStatus[]
  laborCost: number
  estimatedCost: number | null
  promisedOn: string | null
  total: number
  paid: number
  balance: number
  remainingToPay: number
  receivedBy: string
  receivedAt: string
  returnedAt: string | null
  parts: { id: number; productId: number; productName: string; quantity: number; unitPrice: number; lineTotal: number }[]
  events: { status: RepairStatus; label: string; note: string | null; author: string; createdAt: string }[]
  payments: { id: number; amount: number; method: PaymentMethod; receivedBy: string; paidAt: string }[]
}

export type NewRepair = {
  customerId: number | null
  deviceType: DeviceType
  brand: string
  model: string
  serialNumber: string
  accessories: string
  reception: Reception
  reportedIssue: string
  estimatedCost: number | ''
  promisedOn: string
  deposit: number | ''
  depositMethod: PaymentMethod
}
