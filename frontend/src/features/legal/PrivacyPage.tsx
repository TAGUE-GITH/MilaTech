import { Link } from 'react-router-dom'
import { COMPANY, displayPhone } from '../../lib/company'
import { LegalLayout } from './LegalLayout'
import type { LegalSection } from './LegalLayout'

// Politique de confidentialite : quelles donnees, pourquoi, combien de temps, et les droits du client
const SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Responsable',
    content: (
      <p>
        {COMPANY.name}, {COMPANY.district}, {COMPANY.city} (Cameroun), téléphone {COMPANY.phones.map(displayPhone).join(' ou ')}, est responsable
        des données personnelles recueillies sur ce site et en boutique.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Données recueillies',
    content: (
      <ul>
        <li>Compte : nom, prénom, téléphone, email, mot de passe (enregistré sous une forme chiffrée, que personne ne peut relire), photo de profil facultative.</li>
        <li>Commandes : articles, mode de remise, quartier et repère pour la livraison, montants.</li>
        <li>Réparations et devis : appareil, panne décrite, photo facultative, diagnostic, paiements.</li>
        <li>Formations : inscriptions et paiements.</li>
        <li>Messages envoyés par le formulaire de contact.</li>
      </ul>
    ),
  },
  {
    id: 'finalites',
    title: 'À quoi servent-elles ?',
    content: (
      <>
        <ul>
          <li>Gérer le compte, les commandes, les réparations, les devis et les formations du client.</li>
          <li>Le contacter à leur sujet (appel, SMS, WhatsApp, email), par exemple quand son appareil est prêt.</li>
          <li>Tenir la comptabilité et répondre aux obligations légales.</li>
          <li>Assurer la sécurité du site (par exemple, la réinitialisation du mot de passe).</li>
        </ul>
        <p>
          Ces traitements reposent sur le contrat entre le client et {COMPANY.name}, sur ses obligations légales et, pour les éléments
          facultatifs (photos), sur le consentement du client. Aucune donnée n’est vendue ni utilisée pour de la publicité.
        </p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Qui y a accès ?',
    content: (
      <>
        <p>
          Seul le personnel de {COMPANY.name} y a accès, selon son rôle : par exemple, un formateur ne voit pas les réparations. Le client voit
          ses propres informations dans son espace, jamais celles des autres clients.
        </p>
        <p>Le site s’appuie sur des prestataires techniques, qui ne traitent les données que pour faire fonctionner le service :</p>
        <ul>
          <li>Render et Neon (hébergement du serveur et de la base de données, en Europe) ;</li>
          <li>Vercel (diffusion des pages du site) ;</li>
          <li>Brevo (envoi des emails, comme le lien « mot de passe oublié ») ;</li>
          <li>Unsplash (certaines photos d’illustration du site, chargées depuis ses serveurs).</li>
        </ul>
        <p>Ces prestataires étant situés hors du Cameroun, les données peuvent y être hébergées, avec des mesures de sécurité adaptées.</p>
      </>
    ),
  },
  {
    id: 'duree',
    title: 'Combien de temps ?',
    content: (
      <ul>
        <li>Compte et historique : tant que le compte est actif, puis 3 ans après le dernier achat ou la dernière réparation.</li>
        <li>Pièces comptables (ventes, reçus, paiements) : 10 ans, comme l’exige la loi.</li>
        <li>Messages du formulaire de contact : 1 an.</li>
        <li>Liens « mot de passe oublié » : 1 heure.</li>
      </ul>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    content: (
      <p>
        Les échanges avec le site sont chiffrés (HTTPS), les mots de passe ne sont jamais stockés en clair, chaque employé n’accède qu’à ce
        dont il a besoin, et les liens de réinitialisation sont à usage unique.
      </p>
    ),
  },
  {
    id: 'stockage',
    title: 'Cookies et stockage dans le navigateur',
    content: (
      <p>
        Le site n’utilise ni cookie publicitaire ni outil de suivi. Il garde seulement dans le navigateur la connexion du client et le contenu
        de son panier, pour qu’ils ne soient pas perdus d’une page à l’autre. Se déconnecter efface la connexion.
      </p>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    content: (
      <>
        <p>
          Conformément à la réglementation camerounaise sur la protection des données à caractère personnel, le client peut demander à
          consulter ses données, à les faire corriger ou supprimer, ou s’opposer à leur utilisation, sauf lorsque leur conservation est
          imposée par la loi (pièces comptables).
        </p>
        <p>
          Il peut modifier lui-même son nom, son téléphone et sa photo dans son espace. Pour toute autre demande, notamment la suppression du
          compte : en boutique, par téléphone ou par le{' '}
          <Link to="/contact" className="font-semibold text-brand-700">
            formulaire de contact
          </Link>
          . Nous répondons dans un délai d’un mois.
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      intro={<p>Comment {COMPANY.name} protège les informations de ses clients, sur le site comme en boutique.</p>}
      sections={SECTIONS}
    />
  )
}
