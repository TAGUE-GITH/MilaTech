import { Link, Route, Routes } from 'react-router-dom'
import type { Role } from './api/types'
import { RequireAuth } from './auth/RequireAuth'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'
import CatalogPage from './features/catalog/CatalogPage'
import CustomerDetailPage from './features/customers/CustomerDetailPage'
import CustomersPage from './features/customers/CustomersPage'
import HomePage from './features/home/HomePage'
import AlertsPage from './features/products/AlertsPage'
import ProductDetailPage from './features/products/ProductDetailPage'
import ProductFormPage from './features/products/ProductFormPage'
import ProductsPage from './features/products/ProductsPage'
import NewRepairPage from './features/repairs/NewRepairPage'
import RepairDetailPage from './features/repairs/RepairDetailPage'
import RepairsPage from './features/repairs/RepairsPage'
import CashRegisterPage from './features/sales/CashRegisterPage'
import SaleDetailPage from './features/sales/SaleDetailPage'
import SalesPage from './features/sales/SalesPage'
import UsersPage from './features/users/UsersPage'

// Les formateurs n'ont pas acces aux reparations
const REPAIR_ROLES: Role[] = ['GERANT', 'TECHNICIEN', 'VENDEUR']

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

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="caisse" element={<RequireAuth roles={['GERANT', 'VENDEUR']}><CashRegisterPage /></RequireAuth>} />
        <Route path="ventes" element={<RequireAuth roles={['GERANT', 'VENDEUR']}><SalesPage /></RequireAuth>} />
        <Route path="ventes/:id" element={<RequireAuth roles={['GERANT', 'VENDEUR']}><SaleDetailPage /></RequireAuth>} />
        <Route path="reparations" element={<RequireAuth roles={REPAIR_ROLES}><RepairsPage /></RequireAuth>} />
        <Route path="reparations/nouvelle" element={<RequireAuth roles={REPAIR_ROLES}><NewRepairPage /></RequireAuth>} />
        <Route path="reparations/:id" element={<RequireAuth roles={REPAIR_ROLES}><RepairDetailPage /></RequireAuth>} />
        <Route path="clients" element={<CustomersPage />} />
        <Route path="clients/:id" element={<CustomerDetailPage />} />
        <Route path="produits" element={<ProductsPage />} />
        <Route path="produits/nouveau" element={<RequireAuth roles={['GERANT']}><ProductFormPage /></RequireAuth>} />
        <Route path="produits/:id" element={<ProductDetailPage />} />
        <Route path="produits/:id/modifier" element={<RequireAuth roles={['GERANT']}><ProductFormPage /></RequireAuth>} />
        <Route path="stock/alertes" element={<RequireAuth roles={['GERANT', 'VENDEUR']}><AlertsPage /></RequireAuth>} />
        <Route path="catalogue" element={<RequireAuth roles={['GERANT']}><CatalogPage /></RequireAuth>} />
        <Route path="employes" element={<RequireAuth roles={['GERANT']}><UsersPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
