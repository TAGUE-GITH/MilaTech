// Types des donnees echangees avec l'API Spring Boot

export type Role = 'GERANT' | 'VENDEUR' | 'TECHNICIEN' | 'FORMATEUR' | 'CLIENT'

/** Personnel de la boutique (l'espace de gestion), par opposition aux clients du site */
export const STAFF_ROLES: Role[] = ['GERANT', 'VENDEUR', 'TECHNICIEN', 'FORMATEUR']

export const ROLE_LABELS: Record<Role, string> = {
  GERANT: 'Gérant',
  VENDEUR: 'Vendeur',
  TECHNICIEN: 'Technicien',
  FORMATEUR: 'Formateur',
  CLIENT: 'Client',
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
  avatarUrl?: string
  customerId?: number
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
  /** Photo affichee dans la boutique en ligne */
  imageUrl?: string
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

export type MovementType =
  | 'STOCK_INITIAL'
  | 'ACHAT'
  | 'CORRECTION'
  | 'VENTE'
  | 'PIECE_REPARATION'
  | 'RETOUR_PIECE'
  | 'COMMANDE_EN_LIGNE'
  | 'ANNULATION_COMMANDE'

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  STOCK_INITIAL: 'Stock initial',
  ACHAT: 'Achat',
  CORRECTION: 'Correction',
  VENTE: 'Vente',
  PIECE_REPARATION: 'Pièce de réparation',
  RETOUR_PIECE: 'Retour de pièce',
  COMMANDE_EN_LIGNE: 'Commande en ligne',
  ANNULATION_COMMANDE: 'Commande annulée',
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

export type CustomerDetail = {
  customer: Customer
  sales: SaleSummary[]
  totalSpent: number
  repairs: RepairSummary[]
  enrollments: Enrollment[]
}

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

export type EnrollmentStatus = 'INSCRIT' | 'TERMINE' | 'ABANDON'

export const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  INSCRIT: 'Inscrit',
  TERMINE: 'Terminé',
  ABANDON: 'Abandon',
}

export type Enrollment = {
  id: number
  reference: string
  trainingId: number
  training: string
  customerId: number
  customer: string
  phone: string
  agreedFee: number
  paid: number
  balance: number
  status: EnrollmentStatus
  enrolledAt: string
  payments: { id: number; amount: number; method: PaymentMethod; receivedBy: string; paidAt: string }[]
}

export type TrainingSummary = {
  id: number
  title: string
  startDate: string
  endDate: string
  fee: number
  capacity: number
  enrolled: number
  seatsLeft: number
  balanceDue: number
  trainer: string | null
}

export type Training = TrainingSummary & { description: string | null; enrollments: Enrollment[] }

export type TrainingForm = {
  title: string
  description: string
  startDate: string
  endDate: string
  fee: number | ''
  capacity: number | ''
}

export type Dashboard = {
  salesToday: { count: number; total: number; margin: number }
  salesMonth: { count: number; total: number; margin: number }
  dailySales: { date: string; total: number }[]
  lowStock: { id: number; name: string; quantity: number; alertThreshold: number }[]
  lowStockCount: number
  repairsInProgress: number
  repairsReady: RepairSummary[]
  amountsDue: { repairs: number; trainings: number }
  recent: { type: 'VENTE' | 'REPARATION' | 'INSCRIPTION'; label: string; detail: string; targetId: number; at: string }[]
  ordersToProcess: number
  quotesToAnswer: number
}

export type ContactMessage = {
  id: number
  name: string
  phone: string
  email: string | null
  subject: string | null
  message: string
  handled: boolean
  createdAt: string
}

export type ContactForm = { name: string; phone: string; email: string; subject: string; message: string; website: string }

export type RegisterForm = { firstName: string; lastName: string; email: string; phone: string; password: string; acceptTerms: boolean }

/** Produit tel qu'il apparait dans la boutique en ligne (sans reference interne ni prix d'achat) */
export type ShopProduct = {
  id: number
  name: string
  description?: string
  category: Named
  price: number
  stock: number
  imageUrl?: string
}

export type ShopInfo = { deliveryFee: number; deliveryCity: string }

export type OrderStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'PRETE' | 'REMISE' | 'ANNULEE'

export type DeliveryMode = 'RETRAIT' | 'LIVRAISON'

export const DELIVERY_LABELS: Record<DeliveryMode, string> = {
  RETRAIT: 'Retrait en boutique',
  LIVRAISON: 'Livraison',
}

export type OrderSummary = {
  id: number
  reference: string
  customer: string
  customerPhone: string
  status: OrderStatus
  statusLabel: string
  deliveryMode: DeliveryMode
  total: number
  itemCount: number
  createdAt: string
}

export type Order = {
  id: number
  reference: string
  status: OrderStatus
  statusLabel: string
  nextStatuses: OrderStatus[]
  deliveryMode: DeliveryMode
  address?: string
  phone: string
  note?: string
  subtotal: number
  deliveryFee: number
  total: number
  cancelReason?: string
  saleId?: number
  saleReference?: string
  customer: { id: number; fullName: string; phone: string }
  createdAt: string
  updatedAt: string
  lines: { productId: number; productName: string; imageUrl?: string; quantity: number; unitPrice: number; lineTotal: number }[]
}

export type OrderForm = {
  deliveryMode: DeliveryMode
  address: string
  phone: string
  note: string
  lines: { productId: number; quantity: number }[]
  acceptTerms: boolean
}

export type QuoteStatus = 'NOUVELLE' | 'DEVIS_ENVOYE' | 'ACCEPTEE' | 'REFUSEE' | 'ANNULEE' | 'DEPOSEE'

export type Quote = {
  id: number
  reference: string
  status: QuoteStatus
  statusLabel: string
  deviceType: DeviceType
  brand?: string
  model?: string
  device: string
  issue: string
  imageUrl?: string
  quotedPrice?: number
  quoteMessage?: string
  /** Seulement pour la boutique */
  quotedBy?: string
  quotedAt?: string
  answeredAt?: string
  repairId?: number
  repairReference?: string
  customer: { id: number; fullName: string; phone: string }
  createdAt: string
}

export type QuoteSummary = {
  id: number
  reference: string
  customer: string
  customerPhone: string
  device: string
  deviceType: DeviceType
  status: QuoteStatus
  statusLabel: string
  quotedPrice?: number
  createdAt: string
}

export type QuoteForm = { deviceType: DeviceType; brand: string; model: string; issue: string; photo: string }

export type DepositForm = {
  serialNumber: string
  accessories: string
  promisedOn: string
  deposit: number | ''
  depositMethod: PaymentMethod
}

/** Reparation vue par le client (sans notes internes ni noms des employes) */
export type ClientRepairSummary = {
  id: number
  reference: string
  device: string
  deviceType: DeviceType
  status: RepairStatus
  statusLabel: string
  total: number
  balance: number
  promisedOn: string | null
  receivedAt: string
}

export type ClientRepair = ClientRepairSummary & {
  reportedIssue: string
  diagnosis?: string
  estimatedCost?: number
  laborCost: number
  paid: number
  returnedAt?: string
  parts: { productName: string; quantity: number; lineTotal: number }[]
  steps: { status: RepairStatus; label: string; at: string }[]
}

export type DemoInfo = { enabled: boolean; password?: string; accounts: { email: string; role: Role; name: string }[] }
