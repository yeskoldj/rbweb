
'use client';

import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import MenuSection from './MenuSection';
import gelatinaImg from '../../images/gelatina.jpeg';
import flanImg from '../../images/flan.jpeg';
import budinPanImg from '../../images/pudin de pan.jpeg';
import cheesecakeImg from '../../images/Cheesecake .jpeg';
import tresLechesVasoImg from '../../images/Vasito de tres leches.jpeg';
import tresLechesOreoImg from '../../images/Tres leches de Oreo.jpeg';
import dulceLecheImg from '../../images/pedazo de dulce de leche.jpeg';
import tortaPinaImg from '../../images/pedazo de pina.jpeg';
import cocoPinaImg from '../../images/Coco-pina.jpeg';
import macarronCocoImg from '../../images/Coco-macarrón.jpeg';
import tortaGuayabaImg from '../../images/guava.jpeg';
import mantecaditosImg from '../../images/Mantecados.jpeg';
import donasImg from '../../images/Donas .jpeg';
import donasAzucaradasImg from '../../images/Donas azucaradas.jpeg';
import galletasImg from '../../images/Cookies .jpeg';
import croissantImg from '../../images/Croissant.jpeg';
import miniPastelesImg from '../../images/Minipies  (2).jpeg';
import pastelitoImg from '../../images/milojas.jpeg';
import torticasChocolateImg from '../../images/Coques de chocolate.jpeg';
import miniCannolisImg from '../../images/Cannolis.jpeg';


export default function MenuPage() {
  const menuItems = [
    {
      category: 'Postres Clásicos',
      items: [
        {
          name: 'Gelatina',
          price: '$3.00',
          description: 'Refrescante gelatina dominicana con varios sabores',
          image: gelatinaImg.src
        },
        {
          name: 'Flan',
          price: '$4.00',
          description: 'Cremoso flan casero dominicano con caramelo',
          image: flanImg.src
        },
        {
          name: 'Budín de Pan',
          price: '$3.50',
          description: 'Delicioso budín de pan dominicano con canela',
          image: budinPanImg.src
        }
      ]
    },
    {
      category: 'Especialidades de la Casa',
      items: [
        {
          name: 'Cheesecake',
          price: '$5.00',
          description: 'Cremoso cheesecake estilo dominicano',
          image: cheesecakeImg.src
        },
        {
          name: 'Tres Leches en Vaso',
          price: '$5.00',
          description: 'Tradicional tres leches dominicano servido en vaso',
          image: tresLechesVasoImg.src
        },
        {
          name: 'Tres Leches de Oreo',
          price: '$5.00',
          description: 'Nuestra versión especial dominicana con galletas Oreo',
          image: tresLechesOreoImg.src
        },
        {
          name: 'Rebanada de Dulce de Leche',
          price: '$5.00',
          description: 'Irresistible dulce de leche casero dominicano',
          image: dulceLecheImg.src
        },
        {
          name: 'Rebanada de Torta de Piña',
          price: '$5.00',
          description: 'Esponjosa torta dominicana con piña fresca',
          image: tortaPinaImg.src
        }
      ]
    },
    {
      category: 'Productos Tropicales',
      items: [
        {
          name: 'Coco-Piña',
          price: '$5.00',
          description: 'Exótica combinación dominicana de coco y piña',
          image: cocoPinaImg.src
        },
        {
          name: 'Macarrón de Coco',
          price: '$1.50',
          description: 'Tradicional dulce dominicano de coco',
          image: macarronCocoImg.src
        },
        {
          name: 'Torta de Guayaba',
          price: '$2.50',
          description: 'Suave torta dominicana con relleno de guayaba',
          image: tortaGuayabaImg.src
        }
      ]
    },
    {
      category: 'Pequeños Placeres',
      items: [
        {
          name: 'Mantecaditos',
          price: '$1.50',
          description: 'Tradicionales mantecaditos dominicanos',
          image: mantecaditosImg.src
        },
        {
          name: 'Donas',
          price: '$1.50',
          description: 'Frescas y esponjosas donas dominicanas',
          image: donasImg.src
        },
        {
          name: 'Donas Azucaradas',
          price: '$1.50',
          description: 'Donas dominicanas espolvoreadas con azúcar',
          image: donasAzucaradasImg.src
        },
        {
          name: 'Galletas',
          price: '$3.00 por 2',
          description: 'Deliciosas galletas caseras dominicanas (2 piezas)',
          image: galletasImg.src
        },
        {
          name: 'Croissant',
          price: '$1.50',
          description: 'Croissant recién horneado estilo dominicano',
          image: croissantImg.src
        }
      ]
    },
    {
      category: 'Especialidades Únicas',
      items: [
        {
          name: 'Mini Pasteles',
          price: '$2.50',
          description: 'Pequeños pasteles dominicanos con frutas variadas',
          image: miniPastelesImg.src
        },
        {
          name: 'Pastelito',
          price: '$2.00',
          description: 'Tradicional dulce dominicano frito',
          image: pastelitoImg.src
        },
        {
          name: 'Torticas de Chocolate',
          price: '$2.00',
          description: 'Crujientes torticas dominicanas bañadas en chocolate',
          image: torticasChocolateImg.src
        },
        {
          name: 'Mini Cannolis',
          price: '$1.50',
          description: 'Mini cannolis dominicanos rellenos de crema',
          image: miniCannolisImg.src
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        {menuItems.map((section, index) => (
          <MenuSection key={index} items={section.items} />
        ))}
      </div>
      <TabBar />
    </div>
  );
}
