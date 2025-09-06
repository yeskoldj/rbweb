
'use client';

import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../../lib/languageContext';

export default function CakesPage() {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(t('all'));

  const categories = [
    t('all'),
    t('birthday'),
    t('weddings'),
    t('quinceaneras'),
    t('special'),
    t('photoCakes')
  ];

  const cakeCategories = [
    {
      category: t('birthdayCakes'),
      items: [
        {
          id: 'birthday-classic',
          name_es: 'Pastel Clásico de Cumpleaños',
          name_en: 'Classic Birthday Cake',
          basePrice: 25.00,
          description_es: 'Pastel tradicional dominicano perfecto para celebraciones',
          description_en: 'Traditional Dominican cake perfect for celebrations',
          image: 'https://readdy.ai/api/search-image?query=Classic%20Dominican%20birthday%20cake%20with%20colorful%20frosting%2C%20traditional%20decorations%2C%20festive%20design%2C%20professional%20bakery%20style%2C%20vibrant%20colors%2C%20celebration%20theme%2C%20clean%20background&width=300&height=200&seq=birthdayclassic1&orientation=landscape',
          sizes: [
            { name_es: '6 pulgadas', name_en: '6 inches', price: 25.00, serves_es: '4-6 personas', serves_en: '4-6 people' },
            { name_es: '8 pulgadas', name_en: '8 inches', price: 35.00, serves_es: '8-10 personas', serves_en: '8-10 people' },
            { name_es: '10 pulgadas', name_en: '10 inches', price: 45.00, serves_es: '12-15 personas', serves_en: '12-15 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Chocolate', name_en: 'Chocolate', price: 0 },
            { name_es: 'Fresa', name_en: 'Strawberry', price: 2.00 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 5.00 }
          ]
        },
        {
          id: 'birthday-deluxe',
          name_es: 'Pastel Deluxe de Cumpleaños',
          name_en: 'Deluxe Birthday Cake',
          basePrice: 35.00,
          description_es: 'Pastel premium con decoraciones elaboradas',
          description_en: 'Premium cake with elaborate decorations',
          image: 'https://readdy.ai/api/search-image?query=Deluxe%20Dominican%20birthday%20cake%20with%20elaborate%20decorations%2C%20premium%20frosting%20roses%2C%20elegant%20design%2C%20professional%20bakery%20quality%2C%20rich%20colors%2C%20luxury%20celebration%20cake&width=300&height=200&seq=birthdaydeluxe1&orientation=landscape',
          sizes: [
            { name_es: '6 pulgadas', name_en: '6 inches', price: 35.00, serves_es: '4-6 personas', serves_en: '4-6 people' },
            { name_es: '8 pulgadas', name_en: '8 inches', price: 50.00, serves_es: '8-10 personas', serves_en: '8-10 people' },
            { name_es: '10 pulgadas', name_en: '10 inches', price: 65.00, serves_es: '12-15 personas', serves_en: '12-15 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Chocolate', name_en: 'Chocolate', price: 0 },
            { name_es: 'Red Velvet', name_en: 'Red Velvet', price: 8.00 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 5.00 }
          ]
        }
      ]
    },
    {
      category: t('weddingCakes'),
      items: [
        {
          id: 'wedding-elegant',
          name_es: 'Pastel Elegante de Boda',
          name_en: 'Elegant Wedding Cake',
          basePrice: 80.00,
          description_es: 'Hermoso pastel de bodas con diseño sofisticado',
          description_en: 'Beautiful wedding cake with sophisticated design',
          image: 'https://readdy.ai/api/search-image?query=Elegant%20Dominican%20wedding%20cake%20with%20white%20frosting%2C%20sophisticated%20decorations%2C%20multi-tier%20design%2C%20professional%20wedding%20bakery%2C%20classic%20white%20and%20gold%20accents%2C%20romantic%20style&width=300&height=200&seq=weddingelegan1&orientation=landscape',
          sizes: [
            { name_es: '2 niveles', name_en: '2 tiers', price: 80.00, serves_es: '20-25 personas', serves_en: '20-25 people' },
            { name_es: '3 niveles', name_en: '3 tiers', price: 120.00, serves_es: '40-50 personas', serves_en: '40-50 people' },
            { name_es: '4 niveles', name_en: '4 tiers', price: 180.00, serves_es: '70-80 personas', serves_en: '70-80 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Chocolate', name_en: 'Chocolate', price: 0 },
            { name_es: 'Red Velvet', name_en: 'Red Velvet', price: 15.00 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 20.00 }
          ]
        }
      ]
    },
    {
      category: t('quinceanerasCakes'),
      items: [
        {
          id: 'quince-princess',
          name_es: 'Pastel Princesa de Quinceañera',
          name_en: 'Quinceañera Princess Cake',
          basePrice: 65.00,
          description_es: 'Pastel especial para celebrar los 15 años',
          description_en: 'Special cake to celebrate the 15th birthday',
          image: 'https://readdy.ai/api/search-image?query=Dominican%20quincea%C3%B1era%20princess%20cake%20with%20pink%20decorations%2C%20elegant%20tiara%20design%2C%20multi-tier%20celebration%20cake%2C%20professional%20bakery%20style%2C%20festive%20quincea%C3%B1era%20theme%2C%20beautiful%20frosting%20details&width=300&height=200&seq=quinceprincess1&orientation=landscape',
          sizes: [
            { name_es: '8 pulgadas', name_en: '8 inches', price: 65.00, serves_es: '15-20 personas', serves_en: '15-20 people' },
            { name_es: '10 pulgadas', name_en: '10 inches', price: 85.00, serves_es: '25-30 personas', serves_en: '25-30 people' },
            { name_es: '2 niveles', name_en: '2 tiers', price: 120.00, serves_es: '40-50 personas', serves_en: '40-50 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Fresa', name_en: 'Strawberry', price: 5.00 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 10.00 },
            { name_es: 'Red Velvet', name_en: 'Red Velvet', price: 12.00 }
          ]
        }
      ]
    },
    {
      category: t('specialCakes'),
      items: [
        {
          id: 'graduation',
          name_es: 'Pastel de Graduación',
          name_en: 'Graduation Cake',
          basePrice: 40.00,
          description_es: 'Celebra el logro académico con este pastel especial',
          description_en: 'Celebrate academic achievement with this special cake',
          image: 'https://readdy.ai/api/search-image?query=Dominican%20graduation%20cake%20with%20cap%20and%20diploma%20decorations%2C%20academic%20theme%2C%20professional%20bakery%20design%2C%20celebration%20cake%2C%20school%20colors%2C%20achievement%20theme%2C%20clean%20background&width=300&height=200&seq=graduation1&orientation=landscape',
          sizes: [
            { name_es: '8 pulgadas', name_en: '8 inches', price: 40.00, serves_es: '8-12 personas', serves_en: '8-12 people' },
            { name_es: '10 pulgadas', name_en: '10 inches', price: 55.00, serves_es: '15-20 personas', serves_en: '15-20 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Chocolate', name_en: 'Chocolate', price: 0 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 8.00 }
          ]
        }
      ]
    },
    {
      category: t('photoCakes'),
      items: [
        {
          id: 'photo-cake-basic',
          name_es: 'Photo Cake Básico',
          name_en: 'Basic Photo Cake',
          basePrice: 35.00,
          description_es: 'Pastel personalizado con tu foto favorita impresa',
          description_en: 'Personalized cake with your favorite photo printed',
          image: 'https://readdy.ai/api/search-image?query=Photo%20cake%20with%20edible%20image%20print%2C%20Dominican%20bakery%20style%2C%20personalized%20cake%20design%2C%20professional%20photo%20printing%20on%20cake%2C%20custom%20celebration%20cake%2C%20high%20quality%20edible%20photo&width=300&height=200&seq=photocakebasic1&orientation=landscape',
          sizes: [
            { name_es: '8 pulgadas', name_en: '8 inches', price: 35.00, serves_es: '8-12 personas', serves_en: '8-12 people' },
            { name_es: '10 pulgadas', name_en: '10 inches', price: 50.00, serves_es: '15-20 personas', serves_en: '15-20 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Chocolate', name_en: 'Chocolate', price: 0 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 8.00 }
          ]
        },
        {
          id: 'photo-cake-premium',
          name_es: 'Photo Cake Premium',
          name_en: 'Premium Photo Cake',
          basePrice: 50.00,
          description_es: 'Photo cake con decoraciones adicionales alrededor de la imagen',
          description_en: 'Photo cake with additional decorations around the image',
          image: 'https://readdy.ai/api/search-image?query=Premium%20photo%20cake%20with%20edible%20image%20and%20decorative%20frosting%20borders%2C%20Dominican%20bakery%20quality%2C%20enhanced%20design%20with%20flowers%20and%20borders%20around%20photo%2C%20luxury%20personalized%20cake&width=300&height=200&seq=photocakepremium1&orientation=landscape',
          sizes: [
            { name_es: '8 pulgadas', name_en: '8 inches', price: 50.00, serves_es: '8-12 personas', serves_en: '8-12 people' },
            { name_es: '10 pulgadas', name_en: '10 inches', price: 70.00, serves_es: '15-20 personas', serves_en: '15-20 people' }
          ],
          flavors: [
            { name_es: 'Vainilla', name_en: 'Vanilla', price: 0 },
            { name_es: 'Chocolate', name_en: 'Chocolate', price: 0 },
            { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 10.00 }
          ]
        }
      ]
    }
  ];

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      [t('birthdayCakes')]: t('birthday'),
      [t('weddingCakes')]: t('weddings'),
      [t('quinceanerasCakes')]: t('quinceaneras'),
      [t('specialCakes')]: t('special')
    };
    return categoryMap[category] || category;
  };

  const filteredCakeItems = selectedCategory === t('all') 
    ? cakeCategories 
    : cakeCategories.filter(section => getCategoryDisplayName(section.category) === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <h1 className="text-2xl font-bold text-amber-800 text-center mb-1">
            {t('customCakes')}
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm">
            {t('customCakesDescription')}
          </p>

          {/* Custom Quote Section - Moved to top for better visibility */}
          <div className="mb-6 bg-gradient-to-r from-pink-400 to-teal-400 rounded-xl p-5 text-white text-center mx-2">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-cake-3-line text-2xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">{t('needSomethingUnique')}</h3>
            <p className="text-sm opacity-90 mb-4">
              {t('customQuoteDescription')}
            </p>
            <div className="flex flex-col gap-3 justify-center">
              <Link href="/quote">
                <button className="w-full bg-white text-pink-500 px-6 py-3 rounded-full font-bold flex items-center justify-center hover:shadow-lg transition-all">
                  <i className="ri-file-list-3-line mr-2"></i>
                  {t('requestQuote')}
                </button>
              </Link>
              <div className="flex flex-col space-y-2">
                <a 
                  href="https://wa.me/12014968731?text=Hola%2C%20me%20interesa%20hacer%20un%20pedido%20de%20pastel%20personalizado"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-full font-medium flex items-center justify-center hover:bg-green-600 transition-all"
                >
                  <i className="ri-whatsapp-line mr-2"></i>
                  WhatsApp: +1 (201) 496-8731
                </a>
                <a 
                  href="tel:+18622337204"
                  className="w-full bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all"
                >
                  <i className="ri-phone-line mr-2"></i>
                  Llamar: (862) 233-7204
                </a>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6 bg-white rounded-xl p-3 shadow-sm">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-pink-400 to-teal-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredCakeItems.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-xl font-bold text-amber-800 mb-4 px-2">
                {section.category}
              </h2>
              
              <div className="space-y-3">
                {section.items.map((cake) => (
                  <div key={cake.id} className="bg-white rounded-lg shadow-md overflow-hidden mx-2">
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={cake.image}
                          alt={language === 'es' ? cake.name_es : cake.name_en}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      
                      <div className="flex-1 p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-amber-800 text-base leading-tight">
                            {language === 'es' ? cake.name_es : cake.name_en}
                          </h3>
                          <span className="text-lg font-bold text-pink-600 ml-2">
                            {t('from')} ${cake.basePrice}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-xs mb-3 leading-tight">
                          {language === 'es' ? cake.description_es : cake.description_en}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {cake.sizes.length} {t('sizes')} • {cake.flavors.length} {t('flavors')}
                          </div>
                          
                          <Link href={`/cakes/${cake.id}`}>
                            <button className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:shadow-md transition-all">
                              <i className="ri-edit-line mr-1 text-xs"></i>
                              {t('customize')}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom CTA - Smaller version since main CTA is at top */}
          <div className="mt-6 bg-white rounded-xl p-4 text-center mx-2 border border-pink-100">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">{t('stillNotSure')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('contactUsForHelp')}
            </p>
            <Link href="/order">
              <button className="bg-gradient-to-r from-pink-400 to-teal-400 text-white px-6 py-2 rounded-full font-medium">
                <i className="ri-customer-service-line mr-2"></i>
                {t('getHelp')}
              </button>
            </Link>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
