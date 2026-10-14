import { Package } from 'lucide-react'
import { imageUrl } from '../../api/client'

/** Photo d'un produit, ou une illustration neutre quand le gerant n'en a pas encore ajoute. */
export function ProductImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  if (src) return <img src={imageUrl(src)} alt={alt} loading="lazy" className={`bg-white object-contain ${className}`} />
  return (
    <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`} role="img" aria-label={`${alt} (pas de photo)`}>
      <Package className="size-1/3 max-h-16 max-w-16" strokeWidth={1.2} aria-hidden />
    </div>
  )
}
