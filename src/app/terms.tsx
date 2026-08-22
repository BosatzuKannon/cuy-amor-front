import { LegalScreen } from '@/components/legal-screen';

const SECTIONS = [
  {
    heading: '1. Aceptación',
    body: 'Al crear una cuenta en Cuy Amor, confirmas que tienes al menos 18 años de edad y resides en Colombia. El uso de perfiles falsos o la suplantación de identidad resultará en la eliminación permanente de la cuenta.',
  },
  {
    heading: '2. Conducta del Usuario',
    body: 'Cuy Amor es una plataforma para conectar personas. Está estrictamente prohibido el acoso, el lenguaje de odio, el envío de contenido sexual no solicitado, y la promoción de servicios comerciales o de prostitución.',
  },
  {
    heading: '3. Seguridad en la Vida Real',
    body: 'Cuy Amor no realiza verificaciones de antecedentes penales de sus usuarios. Tú eres el único responsable de tu seguridad. Recomendamos realizar las citas en lugares públicos, informar a un amigo sobre tu ubicación y no compartir información financiera con tus matches.',
  },
  {
    heading: '4. Economía Interna y Billetera',
    body: 'La aplicación maneja saldo en efectivo y una moneda virtual ("Cuy Coins"). Los Cuy Coins no son reembolsables. Las solicitudes de retiro de saldo en efectivo están sujetas a revisión por motivos de seguridad y prevención de lavado de activos, y pueden tardar hasta 3 días hábiles.',
  },
  {
    heading: '5. Exención de Responsabilidad',
    body: 'Cuy Amor no se hace responsable por la conducta de ningún usuario dentro o fuera de la aplicación, ni por daños o perjuicios derivados de las interacciones generadas a través de la plataforma.',
  },
];

export default function TermsScreen() {
  return <LegalScreen title="Términos y Condiciones de Uso - Cuy Amor" sections={SECTIONS} />;
}