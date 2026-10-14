import { Link } from 'react-router-dom'
import { COMPANY, displayPhone } from '../../lib/company'
import { HOURS } from '../../lib/hours'
import { LegalLayout } from './LegalLayout'
import type { LegalSection } from './LegalLayout'

// Conditions generales d'utilisation et de vente du site et de la boutique MilaTech
const SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: 'Objet et acceptation',
    content: (
      <>
        <p>
          Les présentes conditions s’appliquent à l’utilisation du site de {COMPANY.name} et à tous ses services : vente d’appareils et d’accessoires
          (en boutique et en ligne), réparation d’appareils électroniques, demandes de devis et formations.
        </p>
        <p>
          En créant un compte ou en passant une commande, le client déclare les avoir lues et acceptées. La version acceptée et la date
          d’acceptation sont enregistrées. Les conditions applicables sont celles en vigueur au jour de la commande ou du dépôt.
        </p>
      </>
    ),
  },
  {
    id: 'vendeur',
    title: 'Qui sommes-nous ?',
    content: (
      <>
        <p>
          {COMPANY.name}, boutique d’électronique située à {COMPANY.district}, {COMPANY.city} (Cameroun) : {COMPANY.directions}.
        </p>
        <p>Téléphone : {COMPANY.phones.map(displayPhone).join(' ou ')}.</p>
        <p>
          Horaires : {HOURS.map((line) => `${line.days.toLowerCase()} de ${line.hours.replace(' – ', ' à ')}`).join(', ')}.
        </p>
      </>
    ),
  },
  {
    id: 'compte',
    title: 'Compte client',
    content: (
      <>
        <p>
          Le compte est personnel. Le client fournit des informations exactes (nom, téléphone, email) et garde son mot de passe secret. Il peut
          le changer à tout moment dans son espace, ou en demander un nouveau avec « Mot de passe oublié ».
        </p>
        <p>{COMPANY.name} peut suspendre un compte utilisé de façon frauduleuse ou contraire aux présentes conditions.</p>
      </>
    ),
  },
  {
    id: 'prix',
    title: 'Produits et prix',
    content: (
      <>
        <p>
          Les produits sont présentés avec la plus grande exactitude possible ; les photos peuvent être indicatives. Seuls les produits
          disponibles en boutique sont proposés en ligne.
        </p>
        <p>
          Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises. Le prix appliqué est celui affiché au moment de la commande
          ou de la vente en boutique.
        </p>
      </>
    ),
  },
  {
    id: 'commande',
    title: 'Commande en ligne',
    content: (
      <>
        <p>
          Le client choisit ses articles, le retrait en boutique ou la livraison, puis valide sa commande. Les articles sont alors réservés pour
          lui. La boutique confirme la commande, le plus souvent par téléphone ou WhatsApp, et le client suit chaque étape dans son espace.
        </p>
        <p>
          Le client peut annuler sa commande tant qu’elle n’est pas confirmée, directement depuis son espace. Ensuite, il appelle la boutique.
          {' '}{COMPANY.name} peut annuler une commande si le client reste injoignable ou si un article s’avère indisponible ; aucune somme n’ayant
          été versée, aucune pénalité n’est due.
        </p>
        <p>Une commande prête et non retirée dans les 7 jours peut être annulée, et les articles remis en vente.</p>
      </>
    ),
  },
  {
    id: 'livraison',
    title: 'Retrait, livraison et paiement',
    content: (
      <>
        <ul>
          <li>Retrait en boutique : gratuit, aux heures d’ouverture.</li>
          <li>Livraison : uniquement à {COMPANY.city}, au tarif affiché avant de valider la commande.</li>
          <li>
            Paiement à la remise (au retrait ou à la livraison), en espèces ou par Mobile Money. Aucun paiement n’est demandé sur le site.
          </li>
        </ul>
        <p>Le client vérifie l’état des articles au moment de la remise. Un reçu lui est remis.</p>
      </>
    ),
  },
  {
    id: 'garantie',
    title: 'Garantie et échange',
    content: (
      <>
        <p>
          Les appareils neufs bénéficient de la garantie indiquée sur leur fiche ou leur reçu. Un article défectueux à l’achat est échangé ou
          réparé s’il est rapporté dans les 7 jours avec son reçu et son emballage.
        </p>
        <p>
          La garantie ne couvre pas les chocs, l’oxydation (contact avec un liquide), une mauvaise utilisation ni l’intervention d’un tiers.
          Ces conditions ne privent pas le client des droits que lui accorde la loi camerounaise, notamment la loi-cadre n° 2011/012 du
          6 mai 2011 portant protection du consommateur.
        </p>
      </>
    ),
  },
  {
    id: 'reparation',
    title: 'Devis et réparation',
    content: (
      <>
        <p>
          Le devis en ligne est gratuit et sans engagement. Le prix proposé est une estimation : le technicien le confirme après avoir examiné
          l’appareil, et aucune réparation n’est faite sans l’accord du client si le prix change.
        </p>
        <p>
          À chaque dépôt, un bon de dépôt est remis : il indique l’appareil, la panne signalée, les accessoires laissés et l’acompte éventuel.
          Il est demandé au retrait de l’appareil, qui n’est remis qu’après paiement du solde.
        </p>
        <p>
          Avant le dépôt, le client sauvegarde ses données (photos, contacts…) : une réparation peut entraîner leur perte, dont {COMPANY.name} ne
          peut être tenu responsable. Le technicien n’accède aux données de l’appareil que si la réparation l’exige.
        </p>
        <p>
          La réparation est garantie 30 jours pour la même panne et les pièces remplacées, hors chocs, oxydation ou ouverture de l’appareil par
          un tiers. Un appareil réparé ou déclaré irréparable, non récupéré 90 jours après que le client en a été prévenu, peut être considéré
          comme abandonné.
        </p>
      </>
    ),
  },
  {
    id: 'formation',
    title: 'Formations',
    content: (
      <>
        <p>
          L’inscription est confirmée par la boutique. Les frais peuvent être payés en plusieurs fois et doivent être soldés avant la fin de la
          session. Chaque paiement donne lieu à un reçu.
        </p>
        <p>
          Si {COMPANY.name} annule une session, les sommes versées sont remboursées. Un apprenant qui renonce au moins 7 jours avant le début est
          remboursé ; ensuite, les sommes versées restent acquises.
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    content: (
      <p>
        Les informations recueillies servent uniquement à fournir nos services. Leur utilisation et les droits du client sont décrits dans la{' '}
        <Link to="/confidentialite" className="font-semibold text-brand-700">
          politique de confidentialité
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'litiges',
    title: 'Réclamations et droit applicable',
    content: (
      <>
        <p>
          Toute réclamation peut être faite en boutique, par téléphone ou par le formulaire de contact : nous recherchons d’abord une solution
          amiable.
        </p>
        <p>
          Les présentes conditions sont soumises au droit camerounais, notamment à la loi n° 2010/021 du 21 décembre 2010 régissant le commerce
          électronique au Cameroun. À défaut d’accord amiable, le litige est porté devant les juridictions compétentes de {COMPANY.city}.
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalLayout
      title="Conditions générales"
      intro={<p>Conditions générales d’utilisation du site et de vente de {COMPANY.name} : achats, commandes en ligne, réparations et formations.</p>}
      sections={SECTIONS}
    />
  )
}
