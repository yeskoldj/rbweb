
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import TabBar from '../../../components/TabBar';
import { useLanguage } from '../../../lib/languageContext';

interface CakeCustomizerProps {
  cakeId: string;
}

interface CakeLayer {
  id: string;
  name: string;
  size: string;
  price: number;
}

interface CakeOption {
  id: string;
  name: string;
  price: number;
  color?: string;
  icon?: string;
  description?: string;
}

interface DecorationExtra {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  variable?: boolean;
}

export default function CakeCustomizer({ cakeId }: CakeCustomizerProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [customizerMode, setCustomizerMode] = useState<'basic' | 'advanced'>('basic');
  const [currentStep, setCurrentStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState({
    shape: 'round',
    layers: [] as CakeLayer[],
    flavors: [] as string[],
    colors: [] as string[],
    fillings: [] as string[],
    decorations: [] as string[],
    inscription: '',
    specialRequests: ''
  });

  // Datos de los pasteles usando imágenes reales - PRECIOS ACTUALIZADOS SEGÚN TABLA
  const cakeProducts = {
    'birthday-classic': {
      name: 'Pastel Clásico de Cumpleaños',
      basePrice: 20,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png'
    },
    'birthday-deluxe': {
      name: 'Pastel Deluxe de Cumpleaños',
      basePrice: 30,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/def4b1d4d19f7bb63fe8ed7acc40b9e6.png'
    },
    'wedding-elegant': {
      name: 'Pastel Elegante de Boda',
      basePrice: 55,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/b55c6989623b0711cfe5124c88d92ed0.png'
    },
    'quince-princess': {
      name: 'Pastel Princesa de Quinceañera',
      basePrice: 45,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/04879db0557315e718d30f6f01a65327.png'
    },
    'graduation': {
      name: 'Pastel de Graduación',
      basePrice: 35,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/58a3f870af7fe55c1b2733bc57137538.png'
    },
    'photo-cake-basic': {
      name: 'Photo Cake Básico',
      basePrice: 25,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/def4b1d4d19f7bb63fe8ed7acc40b9e6.png'
    },
    'photo-cake-premium': {
      name: 'Photo Cake Premium',
      basePrice: 35,
      image: 'https://static.readdy.ai/image/9733c14590fa269b3349cd88bac6322e/b55c6989623b0711cfe5124c88d92ed0.png'
    }
  };

  // Formas disponibles
  const shapeOptions: CakeOption[] = [
    { id: 'round', name: 'Redondo', price: 0, icon: 'ri-circle-line' },
    { id: 'square', name: 'Cuadrado', price: 5, icon: 'ri-stop-line' },
    { id: 'rectangle', name: 'Rectangular', price: 8, icon: 'ri-rectangle-line' }
  ];

  // TAMAÑOS ACTUALIZADOS SEGÚN TABLA OFICIAL
  const sizeOptions = [
    { id: '6', name: '6 pulgadas', price: 20, serves: '4-6 personas' },
    { id: '8', name: '8 pulgadas', price: 30, serves: '8-10 personas' },
    { id: '10', name: '10 pulgadas', price: 35, serves: '10-15 personas' },
    { id: '12', name: '12 pulgadas', price: 55, serves: '20-25 personas' },
    { id: '14', name: '14 pulgadas', price: 80, serves: '35-40 personas' }
  ];

  // Sabores disponibles
  const flavorOptions: CakeOption[] = [
    { id: 'vanilla', name: 'Vainilla', price: 0, color: '#F5E6A3' },
    { id: 'chocolate', name: 'Chocolate', price: 0, color: '#8B4513' },
    { id: 'strawberry', name: 'Fresa', price: 3, color: '#FFB6C1' },
    { id: 'red-velvet', name: 'Red Velvet', price: 5, color: '#DC143C' },
    { id: 'tres-leches', name: 'Tres Leches', price: 8, color: '#FFF8DC' },
    { id: 'coconut', name: 'Coco', price: 5, color: '#FFFFFF' },
    { id: 'lemon', name: 'Limón', price: 4, color: '#FFFF99' },
    { id: 'carrot', name: 'Zanahoria', price: 6, color: '#DEB887' }
  ];

  // Colores de decoración
  const colorOptions: CakeOption[] = [
    { id: 'white', name: 'Blanco', price: 0, color: '#FFFFFF' },
    { id: 'pink', name: 'Rosa', price: 3, color: '#FF69B4' },
    { id: 'blue', name: 'Azul', price: 3, color: '#4169E1' },
    { id: 'purple', name: 'Morado', price: 3, color: '#9370DB' },
    { id: 'green', name: 'Verde', price: 3, color: '#32CD32' },
    { id: 'yellow', name: 'Amarillo', price: 3, color: '#FFD700' },
    { id: 'red', name: 'Rojo', price: 3, color: '#DC143C' },
    { id: 'gold', name: 'Dorado', price: 8, color: '#FFD700' },
    { id: 'silver', name: 'Plateado', price: 8, color: '#C0C0C0' }
  ];

  // Rellenos disponibles
  const fillingOptions: CakeOption[] = [
    { id: 'none', name: 'Sin Relleno', price: 0 },
    { id: 'buttercream', name: 'Buttercream', price: 4 },
    { id: 'cream-cheese', name: 'Crema de Queso', price: 5 },
    { id: 'strawberry-jam', name: 'Mermelada de Fresa', price: 5 },
    { id: 'chocolate-ganache', name: 'Ganache de Chocolate', price: 7 },
    { id: 'dulce-leche', name: 'Dulce de Leche', price: 7 },
    { id: 'fresh-fruits', name: 'Frutas Frescas', price: 10 },
    { id: 'custard', name: 'Crema Pastelera', price: 6 }
  ];

  // DECORACIONES ACTUALIZADAS SEGÚN TABLA OFICIAL
  const decorationOptions: DecorationExtra[] = [
    { id: 'natural-flowers', name: 'Flores Naturales', price: 30, icon: 'ri-flower-line', description: 'Flores frescas comestibles' },
    { id: 'flower-cascade', name: 'Cascada de Flores', price: 60, icon: 'ri-water-flash-line', description: 'Cascada decorativa de flores' },
    { id: 'drips', name: 'Derretidos', price: 20, icon: 'ri-drop-line', description: 'Efecto de chocolate derretido' },
    { id: 'sugar-flowers', name: 'Flores de Azúcar', price: 20, icon: 'ri-plant-line', description: 'Flores hechas de azúcar', variable: true },
    { id: 'pearls', name: 'Perlas', price: 10, icon: 'ri-bubble-chart-line', description: 'Perlas comestibles decorativas', variable: true },
    { id: 'balls', name: 'Bolas', price: 15, icon: 'ri-checkbox-blank-circle-line', description: 'Bolas decorativas de azúcar', variable: true },
    { id: 'cut-out', name: 'Cut Out', price: 15, icon: 'ri-scissors-cut-line', description: 'Formas cortadas personalizadas', variable: true },
    { id: 'butterflies', name: 'Mariposas', price: 10, icon: 'ri-service-line', description: 'Mariposas decorativas comestibles' },
    { id: 'bows', name: 'Lazos', price: 7, icon: 'ri-gift-line', description: 'Lazos decorativos de fondant' },
    { id: 'fake-flowers', name: 'Flores de Mentira', price: 20, icon: 'ri-leaf-line', description: 'Flores artificiales decorativas' }
  ];

  // COMBINACIONES PREDEFINIDAS ACTUALIZADAS SEGÚN TABLA OFICIAL
  const basicTierOptions = [
    {
      id: 'single-6',
      name: '1 Nivel - 6"',
      description: '4-6 personas',
      price: 20,
      layers: [{ id: 'layer-1', name: 'Nivel 1', size: '6', price: 20 }],
      icon: 'ri-circle-line'
    },
    {
      id: 'single-8',
      name: '1 Nivel - 8"',
      description: '8-10 personas',
      price: 30,
      layers: [{ id: 'layer-1', name: 'Nivel 1', size: '8', price: 30 }],
      icon: 'ri-circle-line'
    },
    {
      id: 'single-10',
      name: '1 Nivel - 10"',
      description: '10-15 personas',
      price: 35,
      layers: [{ id: 'layer-1', name: 'Nivel 1', size: '10', price: 35 }],
      icon: 'ri-circle-line'
    },
    {
      id: 'double-6',
      name: '2 Niveles - Doble 6"',
      description: '10-12 personas',
      price: 70,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '6', price: 35 },
        { id: 'layer-2', name: 'Nivel 2', size: '6', price: 35 }
      ],
      icon: 'ri-stack-line'
    },
    {
      id: 'double-8',
      name: '2 Niveles - Doble 8"',
      description: '25-30 personas',
      price: 80,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '8', price: 40 },
        { id: 'layer-2', name: 'Nivel 2', size: '8', price: 40 }
      ],
      icon: 'ri-stack-line'
    },
    {
      id: 'double-10',
      name: '2 Niveles - Doble 10"',
      description: '30-40 personas',
      price: 115,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '10', price: 57.5 },
        { id: 'layer-2', name: 'Nivel 2', size: '10', price: 57.5 }
      ],
      icon: 'ri-stack-line'
    },
    {
      id: 'double-12',
      name: '2 Niveles - Doble 12"',
      description: '50-60 personas',
      price: 135,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '12', price: 67.5 },
        { id: 'layer-2', name: 'Nivel 2', size: '12', price: 67.5 }
      ],
      icon: 'ri-stack-line'
    },
    {
      id: 'triple-6',
      name: '3 Niveles - Triple 6"',
      description: '15-18 personas',
      price: 90,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '6', price: 30 },
        { id: 'layer-2', name: 'Nivel 2', size: '6', price: 30 },
        { id: 'layer-3', name: 'Nivel 3', size: '6', price: 30 }
      ],
      icon: 'ri-stack-fill'
    },
    {
      id: 'triple-8',
      name: '3 Niveles - Triple 8"',
      description: '24-30 personas',
      price: 115,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '8', price: 38.33 },
        { id: 'layer-2', name: 'Nivel 2', size: '8', price: 38.33 },
        { id: 'layer-3', name: 'Nivel 3', size: '8', price: 38.33 }
      ],
      icon: 'ri-stack-fill'
    },
    {
      id: 'triple-10',
      name: '3 Niveles - Triple 10"',
      description: '30-45 personas',
      price: 140,
      layers: [
        { id: 'layer-1', name: 'Nivel 1', size: '10', price: 46.67 },
        { id: 'layer-2', name: 'Nivel 2', size: '10', price: 46.67 },
        { id: 'layer-3', name: 'Nivel 3', size: '10', price: 46.67 }
      ],
      icon: 'ri-stack-fill'
    }
  ];

  // Pasos para modo básico
  const basicSteps = [
    { id: 1, title: 'Forma', icon: 'ri-shape-line' },
    { id: 2, title: 'Tamaño', icon: 'ri-stack-line' },
    { id: 3, title: 'Sabor', icon: 'ri-cake-3-line' },
    { id: 4, title: 'Colores', icon: 'ri-palette-line' },
    { id: 5, title: 'Detalles', icon: 'ri-edit-line' }
  ];

  // Pasos para modo avanzado
  const advancedSteps = [
    { id: 1, title: 'Forma', icon: 'ri-shape-line' },
    { id: 2, title: 'Niveles', icon: 'ri-stack-line' },
    { id: 3, title: 'Sabores', icon: 'ri-cake-3-line' },
    { id: 4, title: 'Colores', icon: 'ri-palette-line' },
    { id: 5, title: 'Rellenos', icon: 'ri-contrast-drop-line' },
    { id: 6, title: 'Decoraciones', icon: 'ri-star-line' },
    { id: 7, title: 'Detalles', icon: 'ri-edit-line' }
  ];

  const steps = customizerMode === 'basic' ? basicSteps : advancedSteps;
  const maxSteps = customizerMode === 'basic' ? 5 : 7;

  const currentProduct = cakeProducts[cakeId as keyof typeof cakeProducts];

  // Funciones para manejar las capas
  const addLayer = () => {
    const layerNumber = selectedOptions.layers.length + 1;
    const timestamp = Date.now();
    
    // CORREGIDO: Usar tamaño 6" por defecto para que empiece desde $20
    const defaultSize = '6';
    const newLayer: CakeLayer = {
      id: `layer-${timestamp}`,
      name: `Nivel ${layerNumber}`,
      size: defaultSize,
      price: sizeOptions.find(s => s.id === defaultSize)?.price || 20
    };
    setSelectedOptions(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
  };

  const removeLayer = (layerId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      layers: prev.layers.filter(layer => layer.id !== layerId)
    }));
  };

  const updateLayer = (layerId: string, field: keyof CakeLayer, value: any) => {
    setSelectedOptions(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId
          ? { ...layer, [field]: value, ...(field === 'size' ? { price: sizeOptions.find(s => s.id === value)?.price || 0 } : {}) }
          : layer
      )
    }));
  };

  // Función para validar si un tamaño es válido para un nivel específico
  const isValidSizeForLayer = (layerIndex: number, sizeId: string): boolean => {
    const layers = selectedOptions.layers;
    const sizeNum = parseInt(sizeId);

    const otherLayers = layers.filter((_, index) => index !== layerIndex);
    const isUsed = otherLayers.some(layer => layer.size === sizeId);
    if (isUsed) return false;

    if (layerIndex === 0) return true;

    for (let i = 0; i < layerIndex; i++) {
      const lowerLayerSize = parseInt(layers[i].size);
      if (sizeNum >= lowerLayerSize) {
        return false;
      }
    }

    for (let i = layerIndex + 1; i < layers.length; i++) {
      const upperLayerSize = parseInt(layers[i].size);
      if (sizeNum <= upperLayerSize) {
        return false;
      }
    }

    return true;
  };

  // Función para obtener tamaños disponibles para un nivel específico
  const getAvailableSizesForLayer = (layerIndex: number) => {
    return sizeOptions.filter(size => isValidSizeForLayer(layerIndex, size.id));
  };

  // Función para validar la estructura completa del pastel
  const validateCakeStructure = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const layers = selectedOptions.layers;

    if (layers.length === 0) {
      errors.push('Debe tener al menos un nivel');
      return { isValid: false, errors };
    }

    const sizes = layers.map(layer => layer.size);
    const uniqueSizes = new Set(sizes);
    if (sizes.length !== uniqueSizes.size) {
      errors.push('No puedes usar el mismo tamaño en múltiples niveles');
    }

    for (let i = 1; i < layers.length; i++) {
      const lowerSize = parseInt(layers[i - 1].size);
      const upperSize = parseInt(layers[i].size);

      if (upperSize >= lowerSize) {
        errors.push(`El nivel ${i + 1} debe ser más pequeño que el nivel ${i}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  // Inicializar con una capa por defecto
  useEffect(() => {
    if (selectedOptions.layers.length === 0) {
      addLayer();
    }
  }, []);

  // Funciones para manejar opciones múltiples
  const toggleOption = (category: keyof typeof selectedOptions, optionId: string) => {
    setSelectedOptions(prev => {
      const currentArray = prev[category] as string[];
      const isSelected = currentArray.includes(optionId);

      return {
        ...prev,
        [category]: isSelected
          ? currentArray.filter(id => id !== optionId)
          : [...currentArray, optionId]
      };
    });
  };

  // Calcular precio total
  const calculateTotal = () => {
    let total = 0;

    total += selectedOptions.layers.reduce((sum, layer) => sum + layer.price, 0);

    const shapePrice = shapeOptions.find(s => s.id === selectedOptions.shape)?.price || 0;
    total += shapePrice;

    selectedOptions.flavors.forEach(flavorId => {
      const flavor = flavorOptions.find(f => f.id === flavorId);
      if (flavor) total += flavor.price;
    });

    selectedOptions.colors.forEach(colorId => {
      const color = colorOptions.find(c => c.id === colorId);
      if (color) total += color.price;
    });

    selectedOptions.fillings.forEach(fillingId => {
      const filling = fillingOptions.find(f => f.id === fillingId);
      if (filling) total += filling.price;
    });

    selectedOptions.decorations.forEach(decorationId => {
      const decoration = decorationOptions.find(d => d.id === decorationId);
      if (decoration) total += decoration.price;
    });

    return total * quantity;
  };

  // Vista previa visual del pastel
  const CakePreview = () => {
    const layers = selectedOptions.layers;
    const isSquare = selectedOptions.shape === 'square' || selectedOptions.shape === 'rectangle';

    return (
      <div className="flex flex-col items-center justify-end space-y-2 bg-gradient-to-b from-blue-50 to-pink-50 rounded-xl p-6 h-40 relative">
        {layers.map((layer, index) => {
          const layerIndex = layers.length - 1 - index;
          const sizeNum = parseInt(layer.size);
          
          // Mejorar el cálculo de tamaños para mejor visualización
          let widthClass, heightClass;
          if (layers.length === 1) {
            widthClass = 'w-20';
            heightClass = 'h-8';
          } else {
            const baseWidth = Math.max(12, sizeNum + 4);
            widthClass = layerIndex === 0 ? `w-24` : layerIndex === 1 ? `w-20` : `w-16`;
            heightClass = 'h-7';
          }
          
          const shapeClass = isSquare ? 'rounded-md' : 'rounded-lg';

          const flavorId = selectedOptions.flavors[layerIndex] || selectedOptions.flavors[0] || 'vanilla';
          const flavor = flavorOptions.find(f => f.id === flavorId);
          const layerColor = flavor?.color || '#F5E6A3';

          return (
            <div key={`cake-preview-${layer.id}-${index}-${Date.now()}`} className="relative">
              <div
                className={`${widthClass} ${heightClass} ${shapeClass} border-3 border-white shadow-md`}
                style={{ 
                  background: `linear-gradient(145deg, ${layerColor}, ${layerColor}dd)`,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
              
              {/* Decoraciones más visibles */}
              {selectedOptions.decorations.includes('natural-flowers') && layerIndex === layers.length - 1 && (
                <div className="absolute -top-2 -right-1 w-4 h-4 bg-pink-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-20">
                  <i className="ri-flower-line text-white text-xs"></i>
                </div>
              )}
              
              {selectedOptions.decorations.includes('drips') && (
                <div className="absolute top-0 left-2 w-1 h-3 bg-amber-600 rounded-full opacity-80 shadow-sm z-20"></div>
              )}
              
              {selectedOptions.decorations.includes('pearls') && (
                <div className="absolute top-1 right-2 flex space-x-1 z-20">
                  <div className="w-1.5 h-1.5 bg-white rounded-full border border-gray-300 shadow-sm"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full border border-gray-300 shadow-sm"></div>
                </div>
              )}
              
              {selectedOptions.decorations.includes('butterflies') && layerIndex === layers.length - 1 && (
                <div className="absolute -top-2 -left-1 w-4 h-4 bg-purple-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-20">
                  <i className="ri-service-line text-white text-xs transform rotate-12"></i>
                </div>
              )}
              
              {selectedOptions.decorations.includes('bows') && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-20">
                  <i className="ri-gift-line text-red-500 text-sm drop-shadow-sm"></i>
                </div>
              )}

              {/* Colores decorativos más visibles */}
              {selectedOptions.colors.length > 0 && (
                <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 flex space-x-1 z-20">
                  {selectedOptions.colors.slice(0, 2).map((colorId, i) => {
                    const color = colorOptions.find(c => c.id === colorId);
                    return (
                      <div
                        key={`preview-color-${colorId}-${i}-${layer.id}`}
                        className="w-2 h-2 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color?.color }}
                      />
                    );
                  })}
                </div>
              )}
              
              {/* Etiqueta de tamaño MÁS PROMINENTE Y POR ENCIMA */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-800 bg-white px-3 py-1.5 rounded-full shadow-md font-bold border-2 border-gray-200 z-30">
                {layer.size}"
              </div>
            </div>
          );
        })}
        
        {/* Base del pastel mejorada */}
        <div className="relative mt-4">
          <div className="w-28 h-3 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 rounded-full opacity-70 shadow-sm"></div>
          {selectedOptions.fillings.length > 0 && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-amber-700 z-20">
              <i className="ri-contrast-drop-line text-sm drop-shadow-sm"></i>
            </div>
          )}
        </div>
        
        {/* Información resumida más clara */}
        <div className="text-center mt-3 space-y-1 z-30 relative">
          <div className="text-sm text-gray-700 font-medium">
            {selectedOptions.layers.length} nivel{selectedOptions.layers.length > 1 ? 'es' : ''} • {shapeOptions.find(s => s.id === selectedOptions.shape)?.name}
          </div>
          {selectedOptions.decorations.length > 0 && (
            <div className="text-xs text-pink-600 font-medium">
              +{selectedOptions.decorations.length} decoración{selectedOptions.decorations.length > 1 ? 'es' : ''}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShapePreview = (shape: string, size: string) => {
    const baseClasses = 'relative bg-gradient-to-br border-2 border-gray-200 shadow-sm';

    switch (shape) {
      case 'square':
        return `${baseClasses} rounded-sm w-12 h-12`;
      case 'rectangle':
        return `${baseClasses} rounded-sm w-16 h-10`;
      default:
        return `${baseClasses} rounded-full w-12 h-12`;
    }
  };

  const renderCakePreview = () => {
    if (selectedOptions.layers.length === 0) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 text-center text-lg">Vista Previa del Pastel</h3>
        
        {/* Vista previa mejorada y más grande */}
        <div className="flex justify-center mb-6">
          <CakePreview />
        </div>

        {/* Información detallada con mejor espaciado */}
        <div className="space-y-4">
          {/* Información básica en tarjetas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">Forma</div>
              <div className="font-medium text-gray-800 capitalize">
                {shapeOptions.find(s => s.id === selectedOptions.shape)?.name}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">Niveles</div>
              <div className="font-medium text-gray-800">
                {selectedOptions.layers.length}
              </div>
            </div>
          </div>

          {/* Capas individuales mejoradas */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 text-sm">Detalles por Capa:</h4>
            {selectedOptions.layers.map((layer, index) => (
              <div key={`layer-detail-${layer.id}-${index}`} className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-6 rounded border-2 border-white shadow-sm" 
                         style={{ 
                           background: flavorOptions.find(f => f.id === selectedOptions.flavors[0])?.color || '#F3F4F6'
                         }}></div>
                    <div>
                      <span className="font-medium text-gray-800 text-sm">Capa {index + 1}</span>
                      <div className="text-xs text-gray-600">
                        {layer.size}" • {flavorOptions.find(f => f.id === selectedOptions.flavors[0])?.name || 'Sin sabor'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-pink-600">${layer.price}</div>
                    <div className="text-xs text-gray-500">{sizeOptions.find(s => s.id === layer.size)?.serves}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Extras seleccionados */}
          {(selectedOptions.decorations.length > 0 || selectedOptions.colors.length > 0 || selectedOptions.fillings.length > 0) && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">Extras Seleccionados:</h4>
              
              {selectedOptions.decorations.length > 0 && (
                <div className="bg-pink-50 rounded-lg p-3">
                  <div className="text-xs text-pink-700 font-medium mb-2">✨ Decoraciones:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedOptions.decorations.map((decorationId, index) => {
                      const decoration = decorationOptions.find(d => d.id === decorationId);
                      return decoration ? (
                        <span key={`decoration-tag-${decorationId}-${index}`} 
                              className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                          {decoration.name} (+${decoration.price})
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {selectedOptions.colors.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700 font-medium mb-2">🎨 Colores:</div>
                  <div className="flex space-x-2">
                    {selectedOptions.colors.map((colorId, index) => {
                      const color = colorOptions.find(c => c.id === colorId);
                      return color ? (
                        <div key={`color-preview-${colorId}-${index}`} className="flex items-center space-x-1">
                          <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                               style={{ backgroundColor: color.color }}></div>
                          <span className="text-xs text-blue-700">{color.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const addToCart = async () => {
    setIsAdding(true);

    const layerDescriptions = selectedOptions.layers
      .map((layer, index) => `Nivel ${index + 1}: ${layer.size}" (${sizeOptions.find(s => s.id === layer.size)?.serves})`)
      .join(', ');

    const flavorNames = selectedOptions.flavors
      .map(id => flavorOptions.find(f => f.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const decorationNames = selectedOptions.decorations
      .map(id => decorationOptions.find(d => d.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const cartItem = {
      id: `cake-${Date.now()}`,
      name: `${currentProduct?.name} Personalizado`,
      price: `$${calculateTotal().toFixed(2)}`,
      quantity: quantity,
      image: currentProduct?.image || '',
      type: 'cake',
      customization: {
        mode: customizerMode,
        shape: shapeOptions.find(s => s.id === selectedOptions.shape)?.name,
        layers: layerDescriptions,
        flavors: flavorNames,
        colors: selectedOptions.colors
          .map(id => colorOptions.find(c => c.id === id)?.name)
          .filter(Boolean)
          .join(', '),
        fillings: customizerMode === 'advanced' ? selectedOptions.fillings
          .map(id => fillingOptions.find(f => f.id === id)?.name)
          .filter(Boolean)
          .join(', ') : '',
        decorations: customizerMode === 'advanced' ? decorationNames : '',
        inscription: selectedOptions.inscription,
        specialRequests: selectedOptions.specialRequests
      }
    };

    const existingCart = localStorage.getItem('bakery-cart');
    let cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(cartItem);
    localStorage.setItem('bakery-cart', JSON.stringify(cart));

    setTimeout(() => {
      setIsAdding(false);
      router.push('/cart');
    }, 1000);
  };

  const nextStep = () => {
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando personalizador...</p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('form');
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [customMessage, setCustomMessage] = useState('');

  const totalPrice = calculateTotal();

  const renderAdvancedStep = () => {
    switch (currentStep) {
      case 1: // Forma
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-shape-line mr-3 text-pink-500 text-2xl"></i>
              Selecciona la Forma
            </h3>
            <p className="text-gray-600 mb-6">Elige la forma que mejor se adapte a tu ocasión especial</p>

            <div className="grid grid-cols-2 gap-4">
              {shapeOptions.map(shape => (
                <label
                  key={shape.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedOptions.shape === shape.id
                      ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shape"
                    checked={selectedOptions.shape === shape.id}
                    onChange={() => setSelectedOptions(prev => ({ ...prev, shape: shape.id }))}
                    className="opacity-0 absolute"
                  />
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      selectedOptions.shape === shape.id
                        ? 'bg-pink-100 text-pink-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <i className={`${shape.icon} text-2xl`}></i>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{shape.name}</h4>
                    <p className="text-sm font-bold text-pink-600">
                      {shape.price > 0 ? `+$${shape.price}` : 'Incluido'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 2: // Niveles (Avanzado)
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-stack-line mr-3 text-orange-500 text-2xl"></i>
              Construye tus Niveles
            </h3>
            <p className="text-gray-600 mb-6">Construye tu pastel capa por capa con total control</p>

            <div className="space-y-6">
              {/* Vista previa del pastel */}
              <div className="bg-gradient-to-b from-blue-50 to-pink-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-800 mb-4 text-center">Vista Previa</h4>
                <CakePreview />
              </div>

              {/* Controles de capas */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">Capas del Pastel</h4>
                  <button
                    type="button"
                    onClick={addLayer}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <i className="ri-add-line mr-1"></i>
                    Agregar Capa
                  </button>
                </div>

                {selectedOptions.layers.map((layer, index) => (
                  <div key={`layer-${layer.id}-${index}`} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-800">Capa {index + 1}</h5>
                      {selectedOptions.layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLayer(layer.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tamaño de la Capa {index + 1}
                        </label>
                        <select
                          value={layer.size}
                          onChange={(e) => updateLayer(layer.id, 'size', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        >
                          {getAvailableSizesForLayer(index).map(size => (
                            <option key={size.id} value={size.id}>
                              {size.name} - ${size.price} ({size.serves})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold text-orange-600">
                          ${layer.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Validación */}
              {!validateCakeStructure().isValid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <i className="ri-error-warning-line text-red-500 mr-3 mt-0.5"></i>
                    <div>
                      <h5 className="font-medium text-red-800 mb-1">Estructura inválida</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validateCakeStructure().errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Sabores (Avanzado)
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-cake-3-line mr-3 text-purple-500 text-2xl"></i>
              Sabores por Capa
            </h3>
            <p className="text-gray-600 mb-6">Selecciona sabores diferentes para cada capa (opcional)</p>

            <div className="grid grid-cols-2 gap-4">
              {flavorOptions.map(flavor => (
                <label
                  key={flavor.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedOptions.flavors.includes(flavor.id)
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.flavors.includes(flavor.id)}
                    onChange={() => toggleOption('flavors', flavor.id)}
                    className="opacity-0 absolute"
                  />
                  <div className="text-center">
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-white shadow-md"
                      style={{ backgroundColor: flavor.color }}
                    ></div>
                    <h4 className="font-semibold text-gray-800 mb-1">{flavor.name}</h4>
                    <p className="text-sm font-bold text-purple-600">
                      {flavor.price > 0 ? `+$${flavor.price}` : 'Incluido'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              {selectedOptions.flavors.length} sabor{selectedOptions.flavors.length !== 1 ? 'es' : ''} seleccionado{selectedOptions.flavors.length !== 1 ? 's' : ''}
            </div>
          </div>
        );

      case 4: // Colores (Avanzado)
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-palette-line mr-3 text-blue-500 text-2xl"></i>
              Esquema de Colores
            </h3>
            <p className="text-gray-600 mb-6">Selecciona hasta 3 colores para la decoración</p>

            <div className="grid grid-cols-3 gap-4">
              {colorOptions.map(color => (
                <label
                  key={color.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedOptions.colors.includes(color.id)
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    selectedOptions.colors.length >= 3 && !selectedOptions.colors.includes(color.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.colors.includes(color.id)}
                    onChange={() => {
                      if (selectedOptions.colors.includes(color.id)) {
                        setSelectedOptions(prev => ({
                          ...prev,
                          colors: prev.colors.filter(id => id !== color.id)
                        }));
                      } else if (selectedOptions.colors.length < 3) {
                        setSelectedOptions(prev => ({
                          ...prev,
                          colors: [...prev.colors, color.id]
                        }));
                      }
                    }}
                    disabled={selectedOptions.colors.length >= 3 && !selectedOptions.colors.includes(color.id)}
                    className="opacity-0 absolute"
                  />
                  <div className="text-center">
                    <div
                      className="w-10 h-10 mx-auto mb-1 rounded-full border-4 border-white shadow-md"
                      style={{ backgroundColor: color.color }}
                    ></div>
                    <h4 className="font-medium text-gray-800 text-sm mb-1">{color.name}</h4>
                    <p className="text-xs font-bold text-blue-600">
                      {color.price > 0 ? `+$${color.price}` : 'Incluido'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              {selectedOptions.colors.length}/3 colores seleccionados
            </div>
          </div>
        );

      case 5: // Rellenos (Avanzado)
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-contrast-drop-line mr-3 text-amber-500 text-2xl"></i>
              Rellenos Especiales
            </h3>
            <p className="text-gray-600 mb-6">Agrega rellenos deliciosos entre las capas</p>

            <div className="space-y-3">
              {fillingOptions.map(filling => (
                <label
                  key={filling.id}
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedOptions.fillings.includes(filling.id)
                      ? 'border-amber-500 bg-amber-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.fillings.includes(filling.id)}
                    onChange={() => toggleOption('fillings', filling.id)}
                    className="opacity-0 absolute"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{filling.name}</h4>
                      <p className="text-sm text-gray-600">Relleno cremoso entre capas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">
                        {filling.price > 0 ? `+$${filling.price}` : 'Incluido'}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 6: // Decoraciones (Avanzado)
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-star-line mr-3 text-yellow-500 text-2xl"></i>
              Decoraciones Premium
            </h3>
            <p className="text-gray-600 mb-6">Selecciona decoraciones especiales para tu pastel</p>

            <div className="grid grid-cols-2 gap-4">
              {decorationOptions.map(decoration => (
                <label
                  key={decoration.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedOptions.decorations.includes(decoration.id)
                      ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.decorations.includes(decoration.id)}
                    onChange={() => toggleOption('decorations', decoration.id)}
                    className="opacity-0 absolute"
                  />
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      selectedOptions.decorations.includes(decoration.id)
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <i className={`${decoration.icon} text-xl`}></i>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">{decoration.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{decoration.description}</p>
                    <p className="text-sm font-bold text-yellow-600">
                      +${decoration.price}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 7: // Detalles finales (Avanzado)
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
              <i className="ri-edit-line mr-3 text-green-500 text-2xl"></i>
              Toques Finales
            </h3>
            <p className="text-gray-600 mb-6">Personaliza los detalles finales de tu pastel</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Mensaje o Inscripción (Opcional)
                </label>
                <input
                  type="text"
                  value={selectedOptions.inscription}
                  onChange={e => setSelectedOptions(prev => ({ ...prev, inscription: e.target.value }))}
                  placeholder="Ej: ¡Feliz Cumpleaños María!"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                  maxLength={50}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {selectedOptions.inscription.length}/50 caracteres
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Solicitudes Especiales (Opcional)
                </label>
                <textarea
                  value={selectedOptions.specialRequests}
                  onChange={e => setSelectedOptions(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Cualquier instrucción especial, alergias, o detalles adicionales..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors h-24 resize-none"
                  maxLength={300}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {selectedOptions.specialRequests.length}/300 caracteres
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Cantidad
                </label>
                <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-xl p-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
                  >
                    <i className="ri-subtract-line text-xl"></i>
                  </button>
                  <span className="text-3xl font-bold text-gray-800 w-16 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  >
                    <i className="ri-add-line text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-bold text-green-800 mb-4 text-lg">Resumen Final</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Forma:</span>
                    <span className="font-medium text-gray-800 capitalize">
                      {shapeOptions.find(s => s.id === selectedOptions.shape)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Capas:</span>
                    <span className="font-medium text-gray-800">
                      {selectedOptions.layers.length} nivel{selectedOptions.layers.length > 1 ? 'es' : ''}
                    </span>
                  </div>
                  {selectedOptions.flavors.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Sabores:</span>
                      <span className="font-medium text-gray-800">
                        {selectedOptions.flavors.length} sabor{selectedOptions.flavors.length > 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                  {selectedOptions.colors.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Colores:</span>
                      <span className="font-medium text-gray-800">
                        {selectedOptions.colors.length} color{selectedOptions.colors.length > 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                  {selectedOptions.fillings.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Rellenos:</span>
                      <span className="font-medium text-gray-800">
                        {selectedOptions.fillings.length} relleno{selectedOptions.fillings.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {selectedOptions.decorations.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Decoraciones:</span>
                      <span className="font-medium text-gray-800">
                        {selectedOptions.decorations.length} decoración{selectedOptions.decorations.length > 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-green-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="font-bold text-green-600 text-xl">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 text-right mt-1">
                      Precio por {quantity} pastel{quantity > 1 ? 'es' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          <Link href="/cakes" className="inline-flex items-center text-pink-500 mb-4">
            <i className="ri-arrow-left-line mr-2"></i>
            Volver a Pasteles
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-amber-800 mb-3 text-center">Elige tu Experiencia</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setCustomizerMode('basic');
                  setCurrentStep(1);
                  setSelectedOptions(prev => ({ ...prev, layers: [], fillings: [], decorations: [] }));
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  customizerMode === 'basic'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    customizerMode === 'basic' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <i className="ri-magic-line text-xl"></i>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">Básico</h4>
                  <p className="text-xs text-gray-600">Rápido y simple</p>
                  <p className="text-xs text-green-600 font-medium mt-1">5 pasos</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setCustomizerMode('advanced');
                  setCurrentStep(1);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  customizerMode === 'advanced'
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    customizerMode === 'advanced' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <i className="ri-settings-3-line text-xl"></i>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">Avanzado</h4>
                  <p className="text-xs text-gray-600">Control total</p>
                  <p className="text-xs text-purple-600 font-medium mt-1">7 pasos</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 mb-6 sticky top-20 z-10">
            <div className="flex items-center space-x-4">
              <div className="w-40 flex-shrink-0">
                <CakePreview />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-amber-800 text-lg">{currentProduct.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    customizerMode === 'basic' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {customizerMode === 'basic' ? 'Básico' : 'Avanzado'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-checkbox-blank-circle-line text-pink-500 mr-2"></i>
                    <span>{shapeOptions.find(s => s.id === selectedOptions.shape)?.name}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-stack-line text-blue-500 mr-2"></i>
                    <span>{selectedOptions.layers.length} nivel{selectedOptions.layers.length > 1 ? 'es' : ''}</span>
                  </div>
                  
                  {selectedOptions.flavors.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="ri-cake-3-line text-purple-500 mr-2"></i>
                      <span>{selectedOptions.flavors.length} sabor{selectedOptions.flavors.length > 1 ? 'es' : ''}</span>
                    </div>
                  )}
                  
                  {customizerMode === 'advanced' && selectedOptions.decorations.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="ri-star-line text-yellow-500 mr-2"></i>
                      <span>{selectedOptions.decorations.length} decoración{selectedOptions.decorations.length > 1 ? 'es' : ''}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-pink-600">
                    ${totalPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Total por 1 pastel</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              {steps.map(step => (
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
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                      step.id === currentStep
                        ? 'bg-pink-500 text-white'
                        : step.id < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <i className="ri-check-line text-xs"></i>
                    ) : (
                      <i className={`${step.icon} text-xs`}></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">{step.title}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-teal-400 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentStep / maxSteps) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {customizerMode === 'basic' && (
              <>
                {currentStep === 1 && (
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                      <i className="ri-shape-line mr-3 text-pink-500 text-2xl"></i>
                      Selecciona la Forma
                    </h3>
                    <p className="text-gray-600 mb-6">Elige la forma que mejor se adapte a tu ocasión especial</p>

                    <div className="grid grid-cols-2 gap-4">
                      {shapeOptions.map(shape => (
                        <label
                          key={shape.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            selectedOptions.shape === shape.id
                              ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="shape"
                            checked={selectedOptions.shape === shape.id}
                            onChange={() => setSelectedOptions(prev => ({ ...prev, shape: shape.id }))}
                            className="opacity-0 absolute"
                          />
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                              selectedOptions.shape === shape.id
                                ? 'bg-pink-100 text-pink-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <i className={`${shape.icon} text-2xl`}></i>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">{shape.name}</h4>
                            <p className="text-sm font-bold text-pink-600">
                              {shape.price > 0 ? `+$${shape.price}` : 'Incluido'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-start">
                        <i className="ri-lightbulb-line text-blue-600 text-lg mr-3 mt-0.5"></i>
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-1">Consejo</h4>
                          <p className="text-blue-700 text-sm">
                            Las formas redondas son perfectas para cumpleelños, los corazones para aniversarios, 
                            y las rectangulares para eventos grandes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                      <i className="ri-stack-line mr-3 text-orange-500 text-2xl"></i>
                      Selecciona el Tamaño
                    </h3>
                    <p className="text-gray-600 mb-6">Elige el tamaño perfecto para tu celebración</p>

                    <div className="space-y-3">
                      {basicTierOptions.map(option => (
                        <label
                          key={option.id}
                          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            selectedOptions.layers.length > 0 && 
                            selectedOptions.layers[0].size === option.layers[0].size &&
                            selectedOptions.layers.length === option.layers.length
                              ? 'border-orange-500 bg-orange-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="basicTier"
                            checked={
                              selectedOptions.layers.length > 0 && 
                              selectedOptions.layers[0].size === option.layers[0].size &&
                              selectedOptions.layers.length === option.layers.length
                            }
                            onChange={() => setSelectedOptions(prev => ({ ...prev, layers: option.layers }))}
                            className="opacity-0 absolute"
                          />
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                            selectedOptions.layers.length > 0 && 
                            selectedOptions.layers[0].size === option.layers[0].size &&
                            selectedOptions.layers.length === option.layers.length
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <i className={`${option.icon} text-xl`}></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">{option.name}</h4>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600 text-lg">${option.price}</p>
                            <p className="text-xs text-gray-500">base</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-start">
                        <i className="ri-lightbulb-line text-orange-600 text-lg mr-3 mt-0.5"></i>
                        <div>
                          <h4 className="font-semibold text-orange-800 mb-1">Consejo</h4>
                          <p className="text-orange-700 text-sm">
                            Los pasteles de múltiples niveles son perfectos para celebraciones grandes. 
                            Cada nivel puede tener sabores diferentes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                      <i className="ri-cake-3-line mr-3 text-purple-500 text-2xl"></i>
                      Sabor Principal
                    </h3>
                    <p className="text-gray-600 mb-6">Elige el sabor principal para tu pastel</p>

                    <div className="grid grid-cols-2 gap-4">
                      {flavorOptions.slice(0, 6).map(flavor => (
                        <label
                          key={flavor.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            selectedOptions.flavors.includes(flavor.id)
                              ? 'border-purple-500 bg-purple-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="basicFlavor"
                            checked={selectedOptions.flavors.includes(flavor.id)}
                            onChange={() => setSelectedOptions(prev => ({ ...prev, flavors: [flavor.id] }))}
                            className="opacity-0 absolute"
                          />
                          <div className="text-center">
                            <div
                              className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-white shadow-md"
                              style={{ backgroundColor: flavor.color }}
                            ></div>
                            <h4 className="font-semibold text-gray-800 mb-1">{flavor.name}</h4>
                            <p className="text-sm font-bold text-purple-600">
                              {flavor.price > 0 ? `+$${flavor.price}` : 'Incluido'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                      <i className="ri-palette-line mr-3 text-blue-500 text-2xl"></i>
                      Colores de Decoración
                    </h3>
                    <p className="text-gray-600 mb-6">Selecciona hasta 2 colores principales (opcional)</p>

                    <div className="grid grid-cols-3 gap-4">
                      {colorOptions.slice(0, 6).map(color => (
                        <label
                          key={color.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            selectedOptions.colors.includes(color.id)
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${
                            selectedOptions.colors.length >= 2 && !selectedOptions.colors.includes(color.id)
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedOptions.colors.includes(color.id)}
                            onChange={() => {
                              if (selectedOptions.colors.includes(color.id)) {
                                setSelectedOptions(prev => ({
                                  ...prev,
                                  colors: prev.colors.filter(id => id !== color.id)
                                }));
                              } else if (selectedOptions.colors.length < 2) {
                                setSelectedOptions(prev => ({
                                  ...prev,
                                  colors: [...prev.colors, color.id]
                                }));
                              }
                            }}
                            disabled={selectedOptions.colors.length >= 2 && !selectedOptions.colors.includes(color.id)}
                            className="opacity-0 absolute"
                          />
                          <div className="text-center">
                            <div
                              className="w-10 h-10 mx-auto mb-1 rounded-full border-4 border-white shadow-md"
                              style={{ backgroundColor: color.color }}
                            ></div>
                            <h4 className="font-medium text-gray-800 text-sm mb-1">{color.name}</h4>
                            <p className="text-xs font-bold text-blue-600">
                              {color.price > 0 ? `+$${color.price}` : 'Incluido'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-500">
                      {selectedOptions.colors.length}/2 colores seleccionados
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                      <i className="ri-edit-line mr-3 text-green-500 text-2xl"></i>
                      Detalles finales 
                    </h3>
                    <p className="text-gray-600 mb-6">Añade los toques personales a tu pastel</p>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Mensaje o Inscripción (Opcional)
                        </label>
                        <input
                          type="text"
                          value={selectedOptions.inscription}
                          onChange={e => setSelectedOptions(prev => ({ ...prev, inscription: e.target.value }))}
                          placeholder="Ij: ¡Feliz Cumpleaños María!"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                          maxLength={50}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {selectedOptions.inscription.length}/50 caracteres
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Solicitudes Especiales (Opcional)
                        </label>
                        <textarea
                          value={selectedOptions.specialRequests}
                          onChange={e => setSelectedOptions(prev => ({ ...prev, specialRequests: e.target.value }))}
                          placeholder="Cualquier instrucción especial, alergias, o detalles adicionales..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors h-24 resize-none"
                          maxLength={300}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {selectedOptions.specialRequests.length}/300 caracteres
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Cantidad
                        </label>
                        <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-xl p-4">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-12 h-12 flex items-center justify-center bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
                          >
                            <i className="ri-subtract-line text-xl"></i>
                          </button>
                          <span className="text-3xl font-bold text-gray-800 w-16 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-12 h-12 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                          >
                            <i className="ri-add-line text-xl"></i>
                          </button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                        <h4 className="font-bold text-green-800 mb-4 text-lg">Resumen de tu Pedido</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Forma:</span>
                            <span className="font-medium text-gray-800 capitalize">
                              {shapeOptions.find(s => s.id === selectedOptions.shape)?.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Tamaño:</span>
                            <span className="font-medium text-gray-800">
                              {selectedOptions.layers.length} nivel{selectedOptions.layers.length > 1 ? 'es' : ''}
                            </span>
                          </div>
                          {selectedOptions.flavors.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Sabor:</span>
                              <span className="font-medium text-gray-800">
                                {flavorOptions.find(f => f.id === selectedOptions.flavors[0])?.name}
                              </span>
                            </div>
                          )}
                          {selectedOptions.colors.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Colores:</span>
                              <span className="font-medium text-gray-800">
                                {selectedOptions.colors.length} color{selectedOptions.colors.length > 1 ? 'es' : ''}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-green-200 pt-3 mt-3">
                            <div className="flex justify-between text-lg">
                              <span className="font-bold text-gray-800">Total:</span>
                              <span className="font-bold text-green-600 text-xl">
                                ${totalPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 text-right mt-1">
                              Precio por {quantity} pastel{quantity > 1 ? 'es' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {customizerMode === 'advanced' && renderAdvancedStep()}

            <div className="border-t bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-all"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Anterior
                </button>

                {currentStep < maxSteps ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (customizerMode === 'basic' && currentStep === 2 && selectedOptions.layers.length === 0) ||
                      (customizerMode === 'advanced' && currentStep === 2 && !validateCakeStructure().isValid)
                    }
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      (customizerMode === 'basic' && currentStep === 2 && selectedOptions.layers.length === 0) ||
                      (customizerMode === 'advanced' && currentStep === 2 && !validateCakeStructure().isValid)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-400 to-teal-400 text-white hover:shadow-lg'
                    }`}
                  >
                    Siguiente
                    <i className="ri-arrow-right-line ml-2"></i>
                  </button>
                ) : (
                  <button
                    onClick={addToCart}
                    disabled={isAdding || (customizerMode === 'basic' && selectedOptions.layers.length === 0)}
                    className="px-8 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <i className="ri-shopping-cart-line mr-2"></i>
                        Agregar al Carrito
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Vista Previa del Pastel */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Vista Previa</h3>
            <div className="flex flex-col items-center space-y-4">
              {/* Imagen del pastel */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                <div className="text-4xl">🎂</div>
              </div>
              
              {/* Información del pastel con mejor espaciado */}
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-gray-800 text-base">{currentProduct.name}</h4>
                
                {/* Detalles principales con iconos */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-checkbox-blank-circle-line text-xs"></i>
                    </span>
                    <span>{shapeOptions.find(s => s.id === selectedOptions.shape)?.name || 'Redondo'}</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-stack-line text-xs"></i>
                    </span>
                    <span>{selectedOptions.layers.length} {selectedOptions.layers.length === 1 ? 'nivel' : 'niveles'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Capas individuales con mejor presentación */}
            <div className="mt-6 space-y-3">
              {selectedOptions.layers.map((layer, index) => (
                <div key={`layer-${layer.id}-${index}`} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700 text-sm">
                      Capa {index + 1}
                    </span>
                    {selectedOptions.layers.length > 1 && (
                      <button
                        onClick={() => removeLayer(layer.id)}
                        className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    )}
                  </div>
                  
                  {/* Información de la capa en dos columnas */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="block font-medium text-gray-700">Tamaño</span>
                      <span>{layer.size}"</span>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-700">Sabor</span>
                      <span>{selectedOptions.flavors.length > 0 ? flavorOptions.find(f => f.id === selectedOptions.flavors[0])?.name || 'Vainilla' : 'Sin sabor'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Precio total más prominente */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">${totalPrice.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">x1 total</div>
              </div>
            </div>
          </div>

          {/* Controles de personalización con mejor espaciado */}
          <div className="space-y-6">
            {/* Navegación de pestañas mejorada */}
            <div className="bg-white rounded-2xl shadow-lg p-2">
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: 'form', label: 'Forma', icon: 'ri-checkbox-blank-circle-line' },
                  { id: 'size', label: 'Tamaño', icon: 'ri-expand-diagonal-line' },
                  { id: 'flavor', label: 'Sabor', icon: 'ri-cake-3-line' },
                  { id: 'colors', label: 'Colores', icon: 'ri-palette-line' },
                  { id: 'details', label: 'Detalles', icon: 'ri-settings-3-line' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-pink-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <i className={`${tab.icon} text-sm`}></i>
                      <span>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido de las pestañas con mejor espaciado */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Pestaña Forma */}
              {activeTab === 'form' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma del Pastel</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {shapeOptions.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, shape: shape.id }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedOptions.shape === shape.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-2xl">
                            <i className={shape.icon}></i>
                          </div>
                          <div className="font-medium text-sm text-gray-700">{shape.name}</div>
                          {shape.price > 0 && (
                            <div className="text-xs text-pink-600 font-medium">+${shape.price}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pestaña Tamaño */}
              {activeTab === 'size' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Tamaño del Pastel</h3>
                  <div className="space-y-3">
                    {sizeOptions.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => {
                          if (selectedOptions.layers.length > 0) {
                            updateLayer(selectedOptions.layers[selectedLayerIndex].id, 'size', size.id);
                          }
                        }}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedOptions.layers[selectedLayerIndex]?.size === size.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <div className="font-medium text-gray-800">{size.name}</div>
                            <div className="text-sm text-gray-600">{size.serves}</div>
                          </div>
                          <div className="text-pink-600 font-semibold">${size.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pestaña Sabor */}
              {activeTab === 'flavor' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Sabor del Pastel</h3>
                  <div className="space-y-3">
                    {flavorOptions.map((flavor) => (
                      <button
                        key={flavor.id}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, flavors: [flavor.id] }))}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          selectedOptions.flavors.includes(flavor.id)
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-left flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: flavor.color }}
                            ></div>
                            <div>
                              <div className="font-medium text-gray-800">{flavor.name}</div>
                              <div className="text-sm text-gray-600">Sabor tradicional</div>
                            </div>
                          </div>
                          {flavor.price > 0 && (
                            <div className="text-pink-600 font-semibold">+${flavor.price}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pestaña Colores */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Colores del Pastel</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => toggleOption('colors', color.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedOptions.colors.includes(color.id)
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center space-y-2">
                          <div 
                            className="w-8 h-8 rounded-full mx-auto border-2 border-white shadow-sm"
                            style={{ backgroundColor: color.color }}
                          ></div>
                          <div className="text-xs font-medium text-gray-700">{color.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pestaña Detalles */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles Adicionales</h3>
                  
                  {/* Agregar Capa */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Capas</h4>
                    <button
                      onClick={addLayer}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all"
                    >
                      <div className="flex items-center justify-center space-x-2 text-gray-600">
                        <i className="ri-add-line"></i>
                        <span>Agregar Capa (+$15)</span>
                      </div>
                    </button>
                  </div>

                  {/* Seleccionar Capa Activa */}
                  {selectedOptions.layers.length > 1 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Editar Capa</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedOptions.layers.map((layer, index) => (
                          <button
                            key={`layer-selector-${layer.id}-${index}`}
                            onClick={() => setSelectedLayerIndex(index)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              selectedLayerIndex === index
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-sm font-medium">Capa {index + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje Personalizado */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Mensaje en el Pastel</h4>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Ej: Feliz Cumpleaños María"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none resize-none"
                      rows={3}
                      maxLength={50}
                    />
                    <div className="text-xs text-gray-500 text-right">
                      {customMessage.length}/50 caracteres
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
