
'use client';

import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import TabBar from '../../../components/TabBar';
import Link from 'next/link';
import { useLanguage } from '../../../lib/languageContext';

interface CakeSize {
  name_es: string;
  name_en: string;
  price: number;
  serves_es: string;
  serves_en: string;
  tiers?: number;
  shape?: string;
}

interface CakeFlavor {
  name_es: string;
  name_en: string;
  price: number;
  color: string;
}

interface CakeFilling {
  name_es: string;
  name_en: string;
  price: number;
  restriction_es?: string;
  restriction_en?: string;
}

interface CakeShape {
  id: string;
  name_es: string;
  name_en: string;
  price: number;
  icon: string;
}

interface CakeData {
  id: string;
  name_es: string;
  name_en: string;
  basePrice: number;
  description_es: string;
  description_en: string;
  image: string;
  sizes: CakeSize[];
  flavors: CakeFlavor[];
  fillings: CakeFilling[];
  shapes: CakeShape[];
}

interface CakeCustomizerProps {
  cakeId: string;
}

export default function CakeCustomizer({ cakeId }: CakeCustomizerProps) {
  const { language, t } = useLanguage();
  const [cake, setCake] = useState<CakeData | null>(null);
  const [selectedSize, setSelectedSize] = useState<CakeSize | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<CakeFlavor | null>(null);
  const [selectedFilling, setSelectedFilling] = useState<CakeFilling | null>(null);
  const [selectedShape, setSelectedShape] = useState<CakeShape | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [inscription, setInscription] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const availableShapes: CakeShape[] = [
    { id: 'round', name_es: 'Redondo', name_en: 'Round', price: 0, icon: 'ri-circle-line' },
    { id: 'square', name_es: 'Cuadrado', name_en: 'Square', price: 5, icon: 'ri-stop-line' },
    { id: 'rectangle', name_es: 'Rectangular', name_en: 'Rectangle', price: 8, icon: 'ri-rectangle-line' }
  ];

  const cakeDatabase: { [key: string]: CakeData } = {
    'birthday-classic': {
      id: 'birthday-classic',
      name_es: 'Pastel Clásico de Cumpleaños',
      name_en: 'Classic Birthday Cake',
      basePrice: 25.00,
      description_es: 'Pastel tradicional dominicano perfecto para celebraciones',
      description_en: 'Traditional Dominican cake perfect for celebrations',
      image: 'https://readdy.ai/api/search-image?query=Simple%20birthday%20cake%20with%20colorful%20frosting%2C%20clean%20design%2C%20professional%20bakery%20style%2C%20celebration%20theme&width=300&height=300&seq=basic1&orientation=squarish',
      shapes: availableShapes,
      sizes: [
        { name_es: '6 pulgadas - 1 nivel', name_en: '6 inches - 1 tier', price: 25.00, serves_es: '4-6 personas', serves_en: '4-6 people', tiers: 1 },
        { name_es: '8 pulgadas - 1 nivel', name_en: '8 inches - 1 tier', price: 35.00, serves_es: '8-10 personas', serves_en: '8-10 people', tiers: 1 },
        { name_es: '10 pulgadas - 1 nivel', name_en: '10 inches - 1 tier', price: 45.00, serves_es: '12-15 personas', serves_en: '12-15 people', tiers: 1 },
        { name_es: '12 pulgadas - 1 nivel', name_en: '12 inches - 1 tier', price: 60.00, serves_es: '20-25 personas', serves_en: '20-25 people', tiers: 1 },
        { name_es: '14 pulgadas - 1 nivel', name_en: '14 inches - 1 tier', price: 80.00, serves_es: '35-40 personas', serves_en: '35-40 people', tiers: 1 },
        { name_es: '2 niveles (6" + 4")', name_en: '2 tiers (6" + 4")', price: 50.00, serves_es: '10-12 personas', serves_en: '10-12 people', tiers: 2 },
        { name_es: '2 niveles (8" + 6")', name_en: '2 tiers (8" + 6")', price: 70.00, serves_es: '25-30 personas', serves_en: '25-30 people', tiers: 2 },
        { name_es: '2 niveles (10" + 8")', name_en: '2 tiers (10" + 8")', price: 90.00, serves_es: '30-40 personas', serves_en: '30-40 people', tiers: 2 },
        { name_es: '2 niveles (12" + 10")', name_en: '2 tiers (12" + 10")', price: 120.00, serves_es: '50-60 personas', serves_en: '50-60 people', tiers: 2 },
        { name_es: '3 niveles (6" + 4" + 2")', name_en: '3 tiers (6" + 4" + 2")', price: 85.00, serves_es: '16-20 personas', serves_en: '16-20 people', tiers: 3 },
        { name_es: '3 niveles (8" + 6" + 4")', name_en: '3 tiers (8" + 6" + 4")', price: 105.00, serves_es: '35-40 personas', serves_en: '35-40 people', tiers: 3 },
        { name_es: '3 niveles (10" + 8" + 6")', name_en: '3 tiers (10" + 8" + 6")', price: 135.00, serves_es: '45-55 personas', serves_en: '45-55 people', tiers: 3 }
      ],
      flavors: [
        { name_es: 'Vainilla', name_en: 'Vanilla', price: 0, color: '#F5E6A3' },
        { name_es: 'Chocolate', name_en: 'Chocolate', price: 0, color: '#8B4513' },
        { name_es: 'Fresa', name_en: 'Strawberry', price: 2.00, color: '#FFB6C1' },
        { name_es: 'Red Velvet', name_en: 'Red Velvet', price: 5.00, color: '#DC143C' }
      ],
      fillings: [
        { name_es: 'Sin Relleno', name_en: 'No Filling', price: 0 },
        { name_es: 'Buttercream', name_en: 'Buttercream', price: 3.00 },
        { name_es: 'Crema de Queso', name_en: 'Cream Cheese', price: 4.00 },
        { name_es: 'Fresas Frescas', name_en: 'Fresh Strawberries', price: 5.00 },
        { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 8.00, restriction_es: 'Solo para pasteles de un nivel', restriction_en: 'Single level cakes only' },
        { name_es: 'Dulce de Leche', name_en: 'Dulce de Leche', price: 6.00 }
      ]
    },
    'photo-cake-basic': {
      id: 'photo-cake-basic',
      name_es: 'Photo Cake Básico',
      name_en: 'Basic Photo Cake',
      basePrice: 35.00,
      description_es: 'Pastel personalizado con tu foto favorita impresa',
      description_en: 'Personalized cake with your favorite photo printed',
      image: 'https://readdy.ai/api/search-image?query=Photo%20cake%20with%20edible%20image%20print%2C%20Dominican%20bakery%20style%2C%20personalized%20cake%20design%2C%20professional%20photo%20printing%20on%20cake%2C%20custom%20celebration%20cake%2C%20high%20quality%20edible%20photo&width=300&height=300&seq=photocakebasic1&orientation=squarish',
      shapes: availableShapes,
      sizes: [
        { name_es: '8 pulgadas', name_en: '8 inches', price: 35.00, serves_es: '8-12 personas', serves_en: '8-12 people', tiers: 1 },
        { name_es: '10 pulgadas', name_en: '10 inches', price: 50.00, serves_es: '15-20 personas', serves_en: '15-20 people', tiers: 1 }
      ],
      flavors: [
        { name_es: 'Vainilla', name_en: 'Vanilla', price: 0, color: '#F5E6A3' },
        { name_es: 'Chocolate', name_en: 'Chocolate', price: 0, color: '#8B4513' },
        { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 8.00, color: '#FFF8DC' }
      ],
      fillings: [
        { name_es: 'Sin Relleno', name_en: 'No Filling', price: 0 },
        { name_es: 'Buttercream', name_en: 'Buttercream', price: 3.00 },
        { name_es: 'Crema de Queso', name_en: 'Cream Cheese', price: 4.00 },
        { name_es: 'Fresas Frescas', name_en: 'Fresh Strawberries', price: 5.00 }
      ]
    },
    'photo-cake-premium': {
      id: 'photo-cake-premium',
      name_es: 'Photo Cake Premium',
      name_en: 'Premium Photo Cake',
      basePrice: 50.00,
      description_es: 'Photo cake con decoraciones adicionales alrededor de la imagen',
      description_en: 'Photo cake with additional decorations around the image',
      image: 'https://readdy.ai/api/search-image?query=Premium%20photo%20cake%20with%20edible%20image%20and%20decorative%20frosting%20borders%2C%20Dominican%20bakery%20quality%2C%20enhanced%20design%20with%20flowers%20and%20borders%20around%20photo%2C%20luxury%20personalized%20cake&width=300&height=300&seq=photocakepremium1&orientation=squarish',
      shapes: availableShapes,
      sizes: [
        { name_es: '8 pulgadas', name_en: '8 inches', price: 50.00, serves_es: '8-12 personas', serves_en: '8-12 people', tiers: 1 },
        { name_es: '10 pulgadas', name_en: '10 inches', price: 70.00, serves_es: '15-20 personas', serves_en: '15-20 people', tiers: 1 },
        { name_es: '2 niveles (8" + 6")', name_en: '2 tiers (8" + 6")', price: 95.00, serves_es: '20-25 personas', serves_en: '20-25 people', tiers: 2 }
      ],
      flavors: [
        { name_es: 'Vainilla', name_en: 'Vanilla', price: 0, color: '#F5E6A3' },
        { name_es: 'Chocolate', name_en: 'Chocolate', price: 0, color: '#8B4513' },
        { name_es: 'Red Velvet', name_en: 'Red Velvet', price: 8.00, color: '#DC143C' },
        { name_es: 'Tres Leches', name_en: 'Tres Leches', price: 10.00, color: '#FFF8DC' }
      ],
      fillings: [
        { name_es: 'Sin Relleno', name_en: 'No Filling', price: 0 },
        { name_es: 'Buttercream', name_en: 'Buttercream', price: 3.00 },
        { name_es: 'Crema de Queso', name_en: 'Cream Cheese', price: 4.00 },
        { name_es: 'Fresas Frescas', name_en: 'Fresh Strawberries', price: 5.00 },
        { name_es: 'Dulce de Leche', name_en: 'Dulce de Leche', price: 6.00 }
      ]
    }
  };

  const availableColors = [
    { name_es: 'Rosa', name_en: 'Pink', value: '#FF69B4' },
    { name_es: 'Azul', name_en: 'Blue', value: '#4169E1' },
    { name_es: 'Verde', name_en: 'Green', value: '#32CD32' },
    { name_es: 'Amarillo', name_en: 'Yellow', value: '#FFD700' },
    { name_es: 'Morado', name_en: 'Purple', value: '#9370DB' },
    { name_es: 'Rojo', name_en: 'Red', value: '#DC143C' },
    { name_es: 'Blanco', name_en: 'White', value: '#FFFFFF' }
  ];

  const steps = [
    { id: 1, title_es: 'Forma', title_en: 'Shape', icon: 'ri-shape-line' },
    { id: 2, title_es: 'Tamaño', title_en: 'Size', icon: 'ri-stack-line' },
    { id: 3, title_es: 'Sabor', title_en: 'Flavor', icon: 'ri-cake-3-line' },
    ...(cake?.id.includes('photo') ? [{ id: 4, title_es: 'Foto', title_en: 'Photo', icon: 'ri-image-line' }] : [{ id: 4, title_es: 'Colores', title_en: 'Colors', icon: 'ri-palette-line' }]),
    { id: 5, title_es: 'Detalles', title_en: 'Details', icon: 'ri-edit-line' }
  ];

  useEffect(() => {
    const cakeData = cakeDatabase[cakeId];
    if (cakeData) {
      setCake(cakeData);
      setSelectedShape(cakeData.shapes[0]);
      setSelectedSize(cakeData.sizes[0]);
      setSelectedFlavor(cakeData.flavors[0]);
      setSelectedFilling(cakeData.fillings[0]);
    }
  }, [cakeId]);

  const calculateTotal = () => {
    if (!cake || !selectedSize || !selectedFlavor || !selectedFilling || !selectedShape) return 0;
    
    const basePrice = selectedSize.price;
    const flavorPrice = selectedFlavor.price;
    const fillingPrice = selectedFilling.price;
    const shapePrice = selectedShape.price;
    const colorPrice = selectedColors.length * 2;
    
    return (basePrice + flavorPrice + fillingPrice + shapePrice + colorPrice) * quantity;
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev => 
      prev.includes(colorName) 
        ? prev.filter(c => c !== colorName)
        : [...prev, colorName]
    );
  };

  // Simplified preview - just shows basic cake shape with colors
  const getCakePreview = () => {
    if (!selectedSize || !selectedFlavor || !selectedShape) return null;

    const tiers = selectedSize.tiers || 1;
    const baseColor = selectedFlavor.color;
    const isSquare = selectedShape.id === 'square' || selectedShape.id === 'rectangle';
    const isHeart = selectedShape.id === 'heart';
    const decorColors = selectedColors.map(colorName => {
      const color = availableColors.find(c => 
        (language === 'es' ? c.name_es : c.name_en) === colorName
      );
      return color?.value || '#FF69B4';
    });

    return (
      <div className="flex flex-col items-center justify-end space-y-1">
        {Array.from({ length: tiers }).map((_, index) => {
          const tierIndex = tiers - 1 - index;
          const widthClass = tiers === 1 ? 'w-20' : 
                           tierIndex === 0 ? 'w-24' : 
                           tierIndex === 1 ? 'w-20' : 'w-16';
          const heightClass = 'h-8';
          const shapeClass = isSquare ? '' : isHeart ? 'rounded-t-full' : 'rounded-md';
          
          return (
            <div key={index} className="relative">
              <div 
                className={`${widthClass} ${heightClass} ${shapeClass} border-2 border-gray-300 ${isHeart ? 'transform rotate-45' : ''}`}
                style={{ backgroundColor: baseColor }}
              />
              {decorColors.length > 0 && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {decorColors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full border border-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Función para manejar la subida de fotos con validación de seguridad
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar formato de archivo - solo imágenes seguras
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB máximo

    if (!allowedTypes.includes(file.type)) {
      alert('Por favor selecciona solo archivos de imagen (JPG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > maxSize) {
      alert('La imagen es demasiado grande. Máximo 5MB permitido.');
      return;
    }

    // Validar nombre de archivo para evitar caracteres maliciosos
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    if (sanitizedName !== file.name) {
      alert('Nombre de archivo no válido. Solo se permiten letras, números, puntos y guiones.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedPhoto(result);
      setPhotoFile(file);
      
      // Guardar la imagen en localStorage con ID único
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`bakery-photo-${photoId}`, result);
      localStorage.setItem(`bakery-photo-info-${photoId}`, JSON.stringify({
        name: sanitizedName,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setUploadedPhoto(null);
    setPhotoFile(null);
  };

  const addToCart = () => {
    if (!cake || !selectedSize || !selectedFlavor || !selectedFilling || !selectedShape) return;

    // Validar que photo cakes tengan foto subida
    if (cake.id.includes('photo') && !uploadedPhoto) {
      alert('Por favor sube una foto para tu Photo Cake');
      return;
    }

    const cartItem = {
      id: `${cake.id}-${Date.now()}`,
      name: language === 'es' ? cake.name_es : cake.name_en,
      shape: language === 'es' ? selectedShape.name_es : selectedShape.name_en,
      size: language === 'es' ? selectedSize.name_es : selectedSize.name_en,
      flavor: language === 'es' ? selectedFlavor.name_es : selectedFlavor.name_en,
      filling: language === 'es' ? selectedFilling.name_es : selectedFilling.name_en,
      colors: selectedColors,
      inscription: inscription,
      specialRequests: specialRequests,
      price: calculateTotal(),
      quantity: quantity,
      image: cake.image,
      type: 'cake',
      photoData: uploadedPhoto,
      photoInfo: photoFile ? {
        name: photoFile.name,
        size: photoFile.size,
        type: photoFile.type
      } : null
    };

    const existingCart = JSON.parse(localStorage.getItem('bakery-cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('bakery-cart', JSON.stringify(existingCart));
    
    alert('¡Pastel agregado al carrito!');
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!cake) {
    return <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <Link href="/cakes" className="inline-flex items-center text-pink-500 mb-4">
            <i className="ri-arrow-left-line mr-2"></i>
            Volver a Pasteles
          </Link>

          {/* Preview Card - Always Visible */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6 sticky top-20 z-10">
            <div className="flex items-center">
              <div className="w-24 h-24 flex items-center justify-center bg-gray-50 rounded-lg mr-4">
                {getCakePreview()}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-amber-800 text-lg mb-1">
                  {language === 'es' ? cake.name_es : cake.name_en}
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedShape && (
                    <div>🎂 {language === 'es' ? selectedShape.name_es : selectedShape.name_en}</div>
                  )}
                  {selectedSize && (
                    <div>📏 {language === 'es' ? selectedSize.name_es : selectedSize.name_en}</div>
                  )}
                  {selectedFlavor && (
                    <div>🍰 {language === 'es' ? selectedFlavor.name_es : selectedFlavor.name_en}</div>
                  )}
                  {selectedColors.length > 0 && (
                    <div className="flex items-center">
                      🎨 
                      <div className="flex ml-1 space-x-1">
                        {selectedColors.slice(0, 3).map((colorName, index) => {
                          const color = availableColors.find(c => 
                            (language === 'es' ? c.name_es : c.name_en) === colorName
                          );
                          return (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color?.value }}
                            ></div>
                          );
                        })}
                        {selectedColors.length > 3 && (
                          <span className="text-xs text-gray-500">+{selectedColors.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-pink-600">${calculateTotal().toFixed(2)}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    step.id === currentStep 
                      ? 'text-pink-500' 
                      : step.id < currentStep 
                        ? 'text-green-500' 
                        : 'text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
                    step.id === currentStep
                      ? 'bg-pink-500 text-white'
                      : step.id < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.id < currentStep ? (
                      <i className="ri-check-line text-sm"></i>
                    ) : (
                      <i className={`${step.icon} text-sm`}></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">
                    {language === 'es' ? step.title_es : step.title_en}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-400 to-teal-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Step 1: Shape */}
            {currentStep === 1 && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <i className="ri-shape-line mr-3 text-pink-500 text-2xl"></i>
                  Elige la Forma
                </h3>
                <p className="text-gray-600 mb-6">Selecciona la forma de tu pastel</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {cake?.shapes.map((shape, index) => (
                    <label 
                      key={index} 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                        selectedShape === shape ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shape"
                        checked={selectedShape === shape}
                        onChange={() => setSelectedShape(shape)}
                        className="opacity-0 absolute"
                      />
                      <div className={`w-12 h-12 flex items-center justify-center mx-auto mb-3 rounded-lg ${
                        selectedShape === shape ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <i className={`${shape.icon} text-2xl`}></i>
                      </div>
                      <div className="font-semibold text-gray-800 mb-1">
                        {language === 'es' ? shape.name_es : shape.name_en}
                      </div>
                      <div className="text-sm font-bold text-pink-600">
                        {shape.price > 0 ? `+$${shape.price.toFixed(2)}` : 'Incluido'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Size & Tiers */}
            {currentStep === 2 && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <i className="ri-stack-line mr-3 text-pink-500 text-2xl"></i>
                  Elige el Tamaño {cake?.id.includes('photo') ? '' : 'y Niveles'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {cake?.id.includes('photo') 
                    ? 'Selecciona el tamaño ideal para tu foto'
                    : 'Selecciona cuántos niveles quieres y el tamaño'
                  }
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {cake?.sizes.map((size, index) => (
                    <label 
                      key={index} 
                      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedSize === size ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedSize === size}
                          onChange={() => setSelectedSize(size)}
                          className="opacity-0 absolute"
                        />
                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                          selectedSize === size ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                        }`}>
                          {selectedSize === size && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Mini visual preview */}
                          <div className="flex flex-col items-center space-y-0.5">
                            {cake?.id.includes('photo') ? (
                              <div className="w-8 h-6 bg-gradient-to-br from-pink-200 to-purple-200 rounded border-2 border-pink-300 flex items-center justify-center">
                                <i className="ri-image-line text-xs text-pink-600"></i>
                              </div>
                            ) : (
                              Array.from({ length: size.tiers || 1 }).map((_, i) => {
                                const tierIndex = (size.tiers || 1) - 1 - i;
                                const width = (size.tiers || 1) === 1 ? 'w-6' : 
                                            tierIndex === 0 ? 'w-8' : 
                                            tierIndex === 1 ? 'w-6' : 'w-4';
                                return (
                                  <div key={i} className={`${width} h-2 bg-pink-200 rounded-sm`} />
                                );
                              })
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {language === 'es' ? size.name_es : size.name_en}
                            </div>
                            <div className="text-sm text-gray-600">
                              {language === 'es' ? size.serves_es : size.serves_en}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-pink-600 text-lg">${size.price.toFixed(2)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Flavor */}
            {currentStep === 3 && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <i className="ri-cake-3-line mr-3 text-pink-500 text-2xl"></i>
                  Elige el Sabor
                </h3>
                <p className="text-gray-600 mb-6">El sabor define el color base de tu pastel</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {cake?.flavors.map((flavor, index) => (
                    <label 
                      key={index} 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                        selectedFlavor === flavor ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="flavor"
                        checked={selectedFlavor === flavor}
                        onChange={() => setSelectedFlavor(flavor)}
                        className="opacity-0 absolute"
                      />
                      <div 
                        className="w-12 h-12 rounded-full mx-auto mb-3 border-2 border-white shadow-md"
                        style={{ backgroundColor: flavor.color }}
                      />
                      <div className="font-semibold text-gray-800 mb-1">
                        {language === 'es' ? flavor.name_es : flavor.name_en}
                      </div>
                      <div className="text-sm font-bold text-pink-600">
                        {flavor.price > 0 ? `+$${flavor.price.toFixed(2)}` : 'Incluido'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Photo Upload for Photo Cakes or Colors for Regular Cakes */}
            {currentStep === 4 && cake?.id.includes('photo') && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <i className="ri-image-line mr-3 text-pink-500 text-2xl"></i>
                  Sube tu Foto
                </h3>
                <p className="text-gray-600 mb-6">Sube la imagen que quieres en tu pastel</p>
                
                <div className="space-y-4">
                  {!uploadedPhoto ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-upload-cloud-2-line text-2xl text-pink-500"></i>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        Selecciona tu foto
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Formatos permitidos: JPG, PNG, GIF, WEBP<br/>
                        Tamaño máximo: 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-xl font-semibold cursor-pointer hover:shadow-lg transition-all"
                      >
                        <i className="ri-image-add-line mr-2"></i>
                        Elegir Archivo
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-gray-50 rounded-xl p-4">
                        <img
                          src={uploadedPhoto}
                          alt="Foto seleccionada"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={removePhoto}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <i className="ri-close-line text-sm"></i>
                        </button>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <i className="ri-check-line text-green-600 mr-2"></i>
                          <span className="text-green-800 font-medium">¡Foto cargada exitosamente!</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          {photoFile?.name} ({Math.round((photoFile?.size || 0) / 1024)} KB)
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-800 mb-2">
                          <i className="ri-information-line mr-2"></i>
                          Recomendaciones para mejores resultados:
                        </h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Usa imágenes de alta resolución (mínimo 300 DPI)</li>
                          <li>• Evita fotos muy oscuras o con poco contraste</li>
                          <li>• Las fotos cuadradas o rectangulares funcionan mejor</li>
                          <li>• Asegúrate de que la imagen esté bien enfocada</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Colors for Regular Cakes */}
            {currentStep === 4 && !cake?.id.includes('photo') && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                  <i className="ri-palette-line mr-3 text-pink-500 text-2xl"></i>
                  Colores de Decoración
                </h3>
                <p className="text-gray-600 mb-6">Elige los colores para decorar tu pastel (+$2 cada color)</p>
                
                <div className="grid grid-cols-3 gap-4">
                  {availableColors.map((color, index) => {
                    const colorName = language === 'es' ? color.name_es : color.name_en;
                    const isSelected = selectedColors.includes(colorName);
                    return (
                      <button
                        key={index}
                        onClick={() => toggleColor(colorName)}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? 'border-pink-500 shadow-lg bg-pink-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-full mx-auto mb-2 border-2 border-white shadow-md"
                          style={{ backgroundColor: color.value }}
                        />
                        <div className="text-sm font-medium text-gray-800">{colorName}</div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                            <i className="ri-check-line text-white text-xs"></i>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Details */}
            {currentStep === 5 && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-6 flex items-center">
                  <i className="ri-edit-line mr-3 text-pink-500 text-2xl"></i>
                  Detalles Finales
                </h3>
                
                <div className="space-y-6">
                  {/* Filling Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Relleno</label>
                    <div className="grid grid-cols-1 gap-2">
                      {cake?.fillings.slice(0, 4).map((filling, index) => (
                        <label 
                          key={index}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedFilling === filling ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="filling"
                              checked={selectedFilling === filling}
                              onChange={() => setSelectedFilling(filling)}
                              className="opacity-0 absolute"
                            />
                            <div className={`w-4 h-4 rounded-full border mr-3 ${
                              selectedFilling === filling ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                            }`}>
                              {selectedFilling === filling && <div className="w-2 h-2 bg-white rounded-full m-1"></div>}
                            </div>
                            <span className="text-sm font-medium">
                              {language === 'es' ? filling.name_es : filling.name_en}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-pink-600">
                            {filling.price > 0 ? `+$${filling.price.toFixed(2)}` : 'Gratis'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Inscription */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mensaje en el pastel (opcional)
                    </label>
                    <input
                      type="text"
                      value={inscription}
                      onChange={(e) => setInscription(e.target.value)}
                      placeholder={cake?.id.includes('photo') ? "Ej: ¡Feliz Cumpleaños!" : "Ej: ¡Feliz Cumpleaños María!"}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      maxLength={30}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">{inscription.length}/30</div>
                  </div>

                  {/* Special Instructions for Photo Cakes */}
                  {cake?.id.includes('photo') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Instrucciones especiales para la foto (opcional)
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Ej: Recortar solo la cara, agregar borde dorado, etc."
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 h-20 resize-none"
                        maxLength={200}
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">{specialRequests.length}/200</div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Cantidad</label>
                    <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-lg p-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
                      >
                        <i className="ri-subtract-line"></i>
                      </button>
                      <span className="text-2xl font-bold text-gray-800 w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                      >
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="border-t bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    currentStep === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Anterior
                </button>

                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    disabled={cake?.id.includes('photo') && currentStep === 4 && !uploadedPhoto}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      cake?.id.includes('photo') && currentStep === 4 && !uploadedPhoto
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-400 to-teal-400 text-white hover:shadow-lg'
                    }`}
                  >
                    Siguiente
                    <i className="ri-arrow-right-line ml-2"></i>
                  </button>
                ) : (
                  <button
                    onClick={addToCart}
                    className="px-8 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    <i className="ri-shopping-cart-line mr-2"></i>
                    Agregar al Carrito
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
