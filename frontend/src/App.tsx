import { Link, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'
import CatalogPage from './features/catalog/CatalogPage'
import HomePage from './features/home/HomePage'
import AlertsPage from './features/products/AlertsPage'
import ProductDetailPage from './features/products/ProductDetailPage'
import ProductFormPage from './features/products/ProductFormPage'
import ProductsPage from './features/products/ProductsPage'
import UsersPage from './features/users/UsersPage'

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
