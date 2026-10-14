import { useQuery } from '@tanstack/react-query'
import { demoApi } from '../api/client'

/** Bandeau visible en mode demonstration : les visiteurs savent que les donnees sont fictives. */
export function DemoBanner() {
  const { data } = useQuery({ queryKey: ['demo'], queryFn: demoApi.info, staleTime: Infinity })
  if (!data?.enabled) return null
  return (
    <p className="bg-amber-100 px-4 py-1.5 text-center text-xs font-semibold text-amber-900 print:hidden">
      Site de démonstration : produits, clients et chiffres sont fictifs, les photos sont libres de droits.
    </p>
  )
}
