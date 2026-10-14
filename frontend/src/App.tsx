import type { ReactNode } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { STAFF_ROLES } from './api/types'
import type { Role } from './api/types'
import { RequireAuth } from './auth/RequireAuth'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'
import CatalogPage from './features/catalog/CatalogPage'
import CustomerDetailPage from './features/customers/CustomerDetailPage'
import CustomersPage from './features/customers/CustomersPage'
import HomePage from './features/home/HomePage'
import MessagesPage from './features/messages/MessagesPage'
import AlertsPage from './features/products/AlertsPage'
import ProductDetailPage from './features/products/ProductDetailPage'
import ProductFormPage from './features/products/ProductFormPage'
import ProductsPage from './features/products/ProductsPage'
import ProfilePage from './features/profile/ProfilePage'
import ClientSpacePage from './features/public/ClientSpacePage'
import ContactPage from './features/public/ContactPage'
import PublicHomePage from './features/public/PublicHomePage'
import PublicLayout from './features/public/PublicLayout'
import RegisterPage from './features/public/RegisterPage'
import NewRepairPage from './features/repairs/NewRepairPage'
import RepairDetailPage from './features/repairs/RepairDetailPage'
import RepairsPage from './features/repairs/RepairsPage'
import CashRegisterPage from './features/sales/CashRegisterPage'
import SaleDetailPage from './features/sales/SaleDetailPage'
import SalesPage from './features/sales/SalesPage'
import TrainingDetailPage from './features/trainings/TrainingDetailPage'
import TrainingsPage from './features/trainings/TrainingsPage'
import UsersPage from './features/users/UsersPage'

// Les formateurs n'ont pas acces aux reparations
const REPAIR_ROLES: Role[] = ['GERANT', 'TECHNICIEN', 'VENDEUR']
// Les techniciens n'ont pas acces aux formations
const TRAINING_ROLES: Role[] = ['GERANT', 'FORMATEUR', 'VENDEUR']

function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <Link to="/" className="mt-4 inline-block font-semibold text-brand-700">
        Retour à l’accueil
      </Link>
    </div>
  )
}

const only = (roles: Role[], page: ReactNode) => <RequireAuth roles={roles}>{page}</RequireAuth>

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />

      {/* Site public : vitrine, contact, inscription et espace des clients */}
      <Route element={<PublicLayout />}>
        <Route index element={<PublicHomePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="mon-espace" element={only(['CLIENT'], <ClientSpacePage />)} />
      </Route>

      {/* Espace de gestion : reserve au personnel de la boutique */}
      <Route element={only(STAFF_ROLES, <Layout />)}>
        <Route path="accueil" element={<HomePage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="caisse" element={only(['GERANT', 'VENDEUR'], <CashRegisterPage />)} />
        <Route path="ventes" element={only(['GERANT', 'VENDEUR'], <SalesPage />)} />
        <Route path="ventes/:id" element={only(['GERANT', 'VENDEUR'], <SaleDetailPage />)} />
        <Route path="reparations" element={only(REPAIR_ROLES, <RepairsPage />)} />
        <Route path="reparations/nouvelle" element={only(REPAIR_ROLES, <NewRepairPage />)} />
        <Route path="reparations/:id" element={only(REPAIR_ROLES, <RepairDetailPage />)} />
        <Route path="formations" element={only(TRAINING_ROLES, <TrainingsPage />)} />
        <Route path="formations/:id" element={only(TRAINING_ROLES, <TrainingDetailPage />)} />
        <Route path="clients" element={<CustomersPage />} />
        <Route path="clients/:id" element={<CustomerDetailPage />} />
        <Route path="produits" element={<ProductsPage />} />
        <Route path="produits/nouveau" element={only(['GERANT'], <ProductFormPage />)} />
        <Route path="produits/:id" element={<ProductDetailPage />} />
        <Route path="produits/:id/modifier" element={only(['GERANT'], <ProductFormPage />)} />
        <Route path="stock/alertes" element={only(['GERANT', 'VENDEUR'], <AlertsPage />)} />
        <Route path="catalogue" element={only(['GERANT'], <CatalogPage />)} />
        <Route path="messages" element={only(['GERANT', 'VENDEUR'], <MessagesPage />)} />
        <Route path="employes" element={only(['GERANT'], <UsersPage />)} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
