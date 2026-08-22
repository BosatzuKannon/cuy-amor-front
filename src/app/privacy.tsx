import { LegalScreen } from '@/components/legal-screen';

const SECTIONS = [
  {
    heading: '1. Datos que Recopilamos',
    body: 'Al registrarte, recopilamos tu nombre, correo (a través de Google Auth), fotos, fecha de nacimiento, género y preferencias de búsqueda. Para sugerir perfiles locales, requerimos acceso a tu ubicación en tiempo real.',
  },
  {
    heading: '2. Uso de la Información',
    body: 'Utilizamos tus datos exclusivamente para crear matches compatibles, gestionar tus interacciones, procesar transacciones en tu billetera y mantener la seguridad de la comunidad.',
  },
  {
    heading: '3. Compartir Información',
    body: 'No vendemos tus datos a terceros. Tu información solo es procesada en nuestros servidores seguros (Supabase) y podría ser compartida con autoridades competentes únicamente bajo una orden judicial oficial.',
  },
  {
    heading: '4. Visibilidad del Perfil',
    body: 'Tu foto de perfil, nombre, edad y ubicación aproximada serán visibles para otros usuarios en la plataforma. Tus chats son privados y están encriptados en nuestra base de datos.',
  },
  {
    heading: '5. Tus Derechos',
    body: 'Tienes derecho a conocer, actualizar, rectificar y eliminar tus datos personales en cualquier momento utilizando la opción "Eliminar Cuenta" en la configuración de tu perfil.',
  },
];

export default function PrivacyScreen() {
  return (
    <LegalScreen
      title="Políticas de Privacidad - Cuy Amor"
      intro="En cumplimiento de la Ley 1581 de 2012 (Habeas Data) de Colombia, informamos cómo tratamos tus datos:"
      sections={SECTIONS}
    />
  );
}