import CakeCustomizer from './CakeCustomizer';

export async function generateStaticParams() {
  return [
    { id: 'birthday-classic' },
    { id: 'birthday-deluxe' },
    { id: 'wedding-elegant' },
    { id: 'quince-princess' },
    { id: 'graduation' },
    { id: 'photo-cake-basic' },
    { id: 'photo-cake-premium' },
  ];
}

export default function CakePage({ params }: { params: { id: string } }) {
  return <CakeCustomizer cakeId={params.id} />;
}