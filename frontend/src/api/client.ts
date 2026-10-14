import axios, { AxiosError } from 'axios'
import type { Category, NewUser, Product, ProductForm, StockMovement, Supplier, User } from './types'

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
  me: () => data(api.get<User>('/auth/me')),
}

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
}
