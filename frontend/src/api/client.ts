import axios, { AxiosError } from 'axios'
import type {
  Category,
  ContactForm,
  ContactMessage,
  ClientRepair,
  ClientRepairSummary,
  Customer,
  CustomerDetail,
  CustomerForm,
  Dashboard,
  DepositForm,
  Enrollment,
  EnrollmentStatus,
  NewRepair,
  NewUser,
  Order,
  OrderForm,
  OrderStatus,
  OrderSummary,
  PaymentMethod,
  RegisterForm,
  PeriodTotals,
  Quote,
  QuoteForm,
  QuoteSummary,
  Product,
  ProductForm,
  Repair,
  RepairStatus,
  RepairSummary,
  Sale,
  ShopInfo,
  ShopProduct,
  SaleSummary,
  StockMovement,
  Supplier,
  Training,
  TrainingForm,
  TrainingSummary,
  User,
} from './types'

// En developpement VITE_API_URL est vide : Vite transmet /api au backend (voir vite.config.ts)
export const API_URL: string = import.meta.env.VITE_API_URL ?? ''

const TOKEN_KEY = 'milatech_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({ baseURL: `${API_URL}/api` })

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Jeton expire ou compte desactive : on deconnecte l'utilisateur (l'ecran de connexion s'affiche)
api.interceptors.response.use(undefined, (error: AxiosError) => {
  if (error.response?.status === 401 && tokenStore.get() && !error.config?.url?.includes('/auth/login')) {
    tokenStore.clear()
    window.dispatchEvent(new Event('auth:logout'))
  }
  return Promise.reject(error)
})

type ApiErrorBody = { message?: string; errors?: Record<string, string> }

/** Message lisible pour l'utilisateur, quelle que soit l'erreur. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion Internet.'
    if (error.response.status === 403) return 'Vous n’avez pas le droit de faire cette action.'
    return error.response.data?.message ?? 'Une erreur est survenue. Réessayez.'
  }
  return 'Une erreur est survenue. Réessayez.'
}

/** Erreurs par champ renvoyees par la validation du serveur ({ "salePrice": "..." }). */
export function fieldErrors(error: unknown): Record<string, string> {
  return axios.isAxiosError<ApiErrorBody>(error) ? (error.response?.data?.errors ?? {}) : {}
}

const data = <T>(promise: Promise<{ data: T }>) => promise.then((response) => response.data)

// Les champs vides des formulaires deviennent null pour l'API
const clean = (form: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]))

export const healthApi = {
  get: () => data(api.get<{ status: string }>('/health')),
}

export const authApi = {
  login: (email: string, password: string) =>
    data(api.post<{ token: string; user: User }>('/auth/login', { email, password })),
  register: (form: RegisterForm) => data(api.post<{ token: string; user: User }>('/auth/register', form)),
  me: () => data(api.get<User>('/auth/me')),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
}

/** Espace personnel : informations, mot de passe et photo de chaque utilisateur. */
export const profileApi = {
  update: (changes: { firstName: string; lastName: string; phone: string }) => data(api.patch<User>('/me', changes)),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/me/password', { currentPassword, newPassword }),
  setAvatar: (dataUrl: string) => data(api.put<User>('/me/avatar', { dataUrl })),
  removeAvatar: () => data(api.delete<User>('/me/avatar')),
}

export const contactApi = {
  send: (form: ContactForm) => api.post('/contact', form),
  list: () => data(api.get<ContactMessage[]>('/contact-messages')),
  setHandled: (id: number, handled: boolean) => data(api.patch<ContactMessage>(`/contact-messages/${id}`, { handled })),
}

/** Les images sont servies par l'API : en production, son adresse est differente de celle du site. */
export const imageUrl = (path?: string | null) => (path ? `${API_URL}${path}` : undefined)

export const usersApi = {
  list: () => data(api.get<User[]>('/users')),
  create: (user: NewUser) => data(api.post<User>('/users', user)),
  update: (id: number, changes: Partial<Pick<User, 'role' | 'active' | 'firstName' | 'lastName' | 'phone'>>) =>
    data(api.patch<User>(`/users/${id}`, changes)),
}

export const catalogApi = {
  categories: () => data(api.get<Category[]>('/categories')),
  addCategory: (name: string) => data(api.post<Category>('/categories', { name })),
  renameCategory: (id: number, name: string) => data(api.put<Category>(`/categories/${id}`, { name })),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
  suppliers: () => data(api.get<Supplier[]>('/suppliers')),
  saveSupplier: (supplier: Omit<Supplier, 'id'>, id?: number) =>
    data(id ? api.put<Supplier>(`/suppliers/${id}`, supplier) : api.post<Supplier>('/suppliers', supplier)),
}

export type ProductFilters = { q?: string; categoryId?: number | ''; lowStock?: boolean }

export const productsApi = {
  list: (filters: ProductFilters = {}) => data(api.get<Product[]>('/products', { params: clean(filters) })),
  get: (id: number) => data(api.get<Product>(`/products/${id}`)),
  save: (form: ProductForm, id?: number) =>
    data(id ? api.put<Product>(`/products/${id}`, clean(form)) : api.post<Product>('/products', clean(form))),
  purchase: (id: number, body: { quantity: number; unitCost: number; supplierId?: number | null; note?: string }) =>
    data(api.post<Product>(`/products/${id}/purchases`, body)),
  adjust: (id: number, body: { quantity: number; reason: string }) =>
    data(api.post<Product>(`/products/${id}/adjustments`, body)),
  movements: (id: number) => data(api.get<StockMovement[]>(`/products/${id}/movements`)),
  alerts: () => data(api.get<Product[]>('/stock/alerts')),
  setImage: (id: number, dataUrl: string) => data(api.put<Product>(`/products/${id}/image`, { dataUrl })),
  removeImage: (id: number) => data(api.delete<Product>(`/products/${id}/image`)),
}

/** Boutique en ligne publique : produits en vente et en stock, sans connexion. */
export const shopApi = {
  products: (filters: { q?: string; categoryId?: number | '' } = {}) =>
    data(api.get<ShopProduct[]>('/shop/products', { params: clean(filters) })),
  product: (id: number) => data(api.get<ShopProduct>(`/shop/products/${id}`)),
  categories: () => data(api.get<Category[]>('/shop/categories')),
  info: () => data(api.get<ShopInfo>('/shop/info')),
}

/** Commandes du client connecte. */
export const myOrdersApi = {
  place: (form: OrderForm) => data(api.post<Order>('/me/orders', clean(form))),
  list: () => data(api.get<OrderSummary[]>('/me/orders')),
  get: (id: number) => data(api.get<Order>(`/me/orders/${id}`)),
  cancel: (id: number) => data(api.post<Order>(`/me/orders/${id}/cancel`, {})),
}

/** Traitement des commandes en ligne par la boutique. */
export const ordersApi = {
  list: (filters: { status?: OrderStatus | ''; open?: boolean } = {}) =>
    data(api.get<OrderSummary[]>('/orders', { params: clean(filters) })),
  get: (id: number) => data(api.get<Order>(`/orders/${id}`)),
  move: (id: number, body: { status: OrderStatus; paymentMethod?: PaymentMethod; note?: string }) =>
    data(api.post<Order>(`/orders/${id}/status`, body)),
}

export const customersApi = {
  search: (q = '') => data(api.get<Customer[]>('/customers', { params: { q } })),
  get: (id: number) => data(api.get<CustomerDetail>(`/customers/${id}`)),
  save: (form: CustomerForm, id?: number) =>
    data(id ? api.put<Customer>(`/customers/${id}`, clean(form)) : api.post<Customer>('/customers', clean(form))),
}

export type Period = { from?: string; to?: string }

export const salesApi = {
  sell: (body: { customerId: number | null; paymentMethod: PaymentMethod; lines: { productId: number; quantity: number }[] }) =>
    data(api.post<Sale>('/sales', body)),
  list: (period: Period) => data(api.get<SaleSummary[]>('/sales', { params: period })),
  summary: (period: Period) => data(api.get<PeriodTotals>('/sales/summary', { params: period })),
  get: (id: number) => data(api.get<Sale>(`/sales/${id}`)),
  openReceipt: (id: number) => openPdf(`/sales/${id}/receipt`),
}

/** Les PDF sont proteges par le jeton : on les telecharge puis on les ouvre dans un nouvel onglet. */
async function openPdf(url: string) {
  const tab = window.open('', '_blank')
  const response = await api.get<Blob>(url, { responseType: 'blob' })
  const file = URL.createObjectURL(response.data)
  if (tab) tab.location.href = file
  else window.location.href = file
}

export type RepairChanges = Partial<{
  diagnosis: string
  laborCost: number
  estimatedCost: number
  promisedOn: string
  accessories: string
}>

export const repairsApi = {
  list: (filters: { q?: string; status?: RepairStatus | '' } = {}) =>
    data(api.get<RepairSummary[]>('/repairs', { params: clean(filters) })),
  get: (id: number) => data(api.get<Repair>(`/repairs/${id}`)),
  receive: (form: NewRepair) => data(api.post<Repair>('/repairs', clean(form))),
  update: (id: number, changes: RepairChanges) => data(api.patch<Repair>(`/repairs/${id}`, changes)),
  move: (id: number, status: RepairStatus, note: string) =>
    data(api.patch<Repair>(`/repairs/${id}/status`, { status, note })),
  addPart: (id: number, productId: number, quantity: number) =>
    data(api.post<Repair>(`/repairs/${id}/parts`, { productId, quantity })),
  removePart: (id: number, partId: number) => data(api.delete<Repair>(`/repairs/${id}/parts/${partId}`)),
  pay: (id: number, amount: number, method: PaymentMethod) =>
    data(api.post<Repair>(`/repairs/${id}/payments`, { amount, method })),
  openSlip: (id: number) => openPdf(`/repairs/${id}/slip`),
}

export type EnrollmentForm = {
  customerId: number
  agreedFee?: number
  firstPayment?: number
  paymentMethod?: PaymentMethod
}

export const trainingsApi = {
  list: () => data(api.get<TrainingSummary[]>('/trainings')),
  get: (id: number) => data(api.get<Training>(`/trainings/${id}`)),
  save: (form: TrainingForm, id?: number) =>
    data(id ? api.put<Training>(`/trainings/${id}`, clean(form)) : api.post<Training>('/trainings', clean(form))),
  enroll: (trainingId: number, form: EnrollmentForm) =>
    data(api.post<Enrollment>(`/trainings/${trainingId}/enrollments`, form)),
  setStatus: (enrollmentId: number, status: EnrollmentStatus) =>
    data(api.patch<Enrollment>(`/enrollments/${enrollmentId}`, { status })),
  pay: (enrollmentId: number, amount: number, method: PaymentMethod) =>
    data(api.post<Enrollment>(`/enrollments/${enrollmentId}/payments`, { amount, method })),
}

/** Demandes de devis et reparations du client connecte. */
export const myQuotesApi = {
  request: (form: QuoteForm) => data(api.post<Quote>('/me/quotes', clean(form))),
  list: () => data(api.get<Quote[]>('/me/quotes')),
  get: (id: number) => data(api.get<Quote>(`/me/quotes/${id}`)),
  accept: (id: number) => data(api.post<Quote>(`/me/quotes/${id}/accept`, {})),
  refuse: (id: number) => data(api.post<Quote>(`/me/quotes/${id}/refuse`, {})),
  cancel: (id: number) => data(api.post<Quote>(`/me/quotes/${id}/cancel`, {})),
  repairs: () => data(api.get<ClientRepairSummary[]>('/me/repairs')),
  repair: (id: number) => data(api.get<ClientRepair>(`/me/repairs/${id}`)),
}

/** Demandes de devis cote boutique. */
export const quotesApi = {
  list: (open = false) => data(api.get<QuoteSummary[]>('/quotes', { params: { open } })),
  get: (id: number) => data(api.get<Quote>(`/quotes/${id}`)),
  answer: (id: number, price: number, message: string) => data(api.post<Quote>(`/quotes/${id}/answer`, { price, message })),
  deposit: (id: number, form: DepositForm) => data(api.post<Repair>(`/quotes/${id}/repair`, clean(form))),
}

export const dashboardApi = {
  get: () => data(api.get<Dashboard>('/dashboard')),
}
