'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import Link from 'next/link';
import { useLanguage } from '../../lib/languageContext';
import { supabase } from '../../lib/supabase';

export default function QuotePage() {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteData, setQuoteData] = useState({
    hasReferencePhoto: false,
    photoDescription: '',
    occasion: '',
    ageGroup: '',
    theme: '',
    servings: '',
    budget: '',
    date: '',
    details: '',
    contactInfo: {
      name: '',
      phone: '',
      email: ''
    }
  });

  const occasions = [
    { id: 'birthday', name_es: 'Cumpleaños', name_en: 'Birthday', icon: 'ri-cake-3-line' },
    { id: 'wedding', name_es: 'Boda', name_en: 'Wedding', icon: 'ri-heart-2-line' },
    { id: 'baby-shower', name_es: 'Baby Shower', name_en: 'Baby Shower', icon: 'ri-bear-smile-line' },
    { id: 'quinceañera', name_es: 'Quinceañera', name_en: 'Quinceañera', icon: 'ri-crown-line' },
    { id: 'graduation', name_es: 'Graduación', name_en: 'Graduation', icon: 'ri-graduation-cap-line' },
    { id: 'anniversary', name_es: 'Aniversario', name_en: 'Anniversary', icon: 'ri-gift-line' },
    { id: 'baptism', name_es: 'Bautizo', name_en: 'Baptism', icon: 'ri-church-line' },
    { id: 'other', name_es: 'Otro', name_en: 'Other', icon: 'ri-more-line' }
  ];

  // Preguntas de edad específicas por ocasión
  const getAgeGroupsByOccasion = (occasion: string) => {
    switch (occasion) {
      case 'birthday':
        return [
          { id: 'baby', name_es: 'Bebé (0-2 años)', name_en: 'Baby (0-2 years)', icon: 'ri-bear-smile-line' },
          { id: 'small-kid', name_es: 'Niño Pequeño (3-8 años)', name_en: 'Small Kid (3-8 years)', icon: 'ri-emotion-happy-line' },
          { id: 'teen', name_es: 'Adolescente (9-17 años)', name_en: 'Teen (9-17 years)', icon: 'ri-user-smile-line' },
          { id: 'adult', name_es: 'Adulto (18+ años)', name_en: 'Adult (18+ years)', icon: 'ri-user-line' }
        ];
      case 'wedding':
        return [
          { id: 'intimate', name_es: 'Boda Íntima (20-50 personas)', name_en: 'Intimate Wedding (20-50 people)', icon: 'ri-heart-line' },
          { id: 'medium', name_es: 'Boda Mediana (51-100 personas)', name_en: 'Medium Wedding (51-100 people)', icon: 'ri-heart-2-line' },
          { id: 'large', name_es: 'Boda Grande (100+ personas)', name_en: 'Large Wedding (100+ people)', icon: 'ri-heart-3-line' }
        ];
      case 'baby-shower':
        return [
          { id: 'boy', name_es: 'Para Niño', name_en: 'For Boy', icon: 'ri-user-smile-line' },
          { id: 'girl', name_es: 'Para Niña', name_en: 'For Girl', icon: 'ri-user-heart-line' },
          { id: 'neutral', name_es: 'Neutral/Sorpresa', name_en: 'Neutral/Surprise', icon: 'ri-question-line' }
        ];
      case 'quinceañera':
        return [
          { id: 'traditional', name_es: 'Estilo Tradicional', name_en: 'Traditional Style', icon: 'ri-crown-line' },
          { id: 'modern', name_es: 'Estilo Moderno', name_en: 'Modern Style', icon: 'ri-star-line' },
          { id: 'themed', name_es: 'Con Tema Específico', name_en: 'Themed', icon: 'ri-palette-line' }
        ];
      case 'graduation':
        return [
          { id: 'school', name_es: 'Graduación Escolar', name_en: 'School Graduation', icon: 'ri-school-line' },
          { id: 'university', name_es: 'Graduación Universitaria', name_en: 'University Graduation', icon: 'ri-graduation-cap-line' },
          { id: 'masters', name_es: 'Maestría/Posgrado', name_en: 'Masters/Graduate', icon: 'ri-medal-line' }
        ];
      case 'anniversary':
        return [
          { id: '1-5', name_es: '1-5 años juntos', name_en: '1-5 years together', icon: 'ri-heart-line' },
          { id: '6-15', name_es: '6-15 años juntos', name_en: '6-15 years together', icon: 'ri-heart-2-line' },
          { id: '16+', name_es: 'Más de 15 años juntos', name_en: 'More than 15 years together', icon: 'ri-heart-3-line' }
        ];
      case 'baptism':
        return [
          { id: 'baby-baptism', name_es: 'Bautizo de Bebé', name_en: 'Baby Baptism', icon: 'ri-bear-smile-line' },
          { id: 'child-baptism', name_es: 'Bautizo de Niño/a', name_en: 'Child Baptism', icon: 'ri-emotion-happy-line' },
          { id: 'adult-baptism', name_es: 'Bautizo de Adulto', name_en: 'Adult Baptism', icon: 'ri-user-line' }
        ];
      default:
        return [
          { id: 'small', name_es: 'Evento Pequeño (1-25 personas)', name_en: 'Small Event (1-25 people)', icon: 'ri-user-line' },
          { id: 'medium', name_es: 'Evento Mediano (26-75 personas)', name_en: 'Medium Event (26-75 people)', icon: 'ri-group-line' },
          { id: 'large', name_es: 'Evento Grande (75+ personas)', name_en: 'Large Event (75+ people)', icon: 'ri-team-line' }
        ];
    }
  };

  // Temas específicos por ocasión
  const getThemesByOccasion = (occasion: string) => {
    switch (occasion) {
      case 'birthday':
        return [
          { id: 'princess', name_es: 'Princesas', name_en: 'Princess', icon: 'ri-crown-line' },
          { id: 'superhero', name_es: 'Superhéroes', name_en: 'Superhero', icon: 'ri-flashlight-line' },
          { id: 'animals', name_es: 'Animales', name_en: 'Animals', icon: 'ri-bear-smile-line' },
          { id: 'cars', name_es: 'Carros', name_en: 'Cars', icon: 'ri-car-line' },
          { id: 'flowers', name_es: 'Flores', name_en: 'Flowers', icon: 'ri-flower-line' },
          { id: 'sports', name_es: 'Deportes', name_en: 'Sports', icon: 'ri-football-line' },
          { id: 'elegant', name_es: 'Elegante/Adulto', name_en: 'Elegant/Adult', icon: 'ri-vip-crown-line' },
          { id: 'custom', name_es: 'Personalizado', name_en: 'Custom', icon: 'ri-palette-line' }
        ];
      case 'wedding':
        return [
          { id: 'classic', name_es: 'Clásico Blanco', name_en: 'Classic White', icon: 'ri-heart-line' },
          { id: 'romantic', name_es: 'Romántico con Flores', name_en: 'Romantic with Flowers', icon: 'ri-flower-line' },
          { id: 'rustic', name_es: 'Rústico', name_en: 'Rustic', icon: 'ri-leaf-line' },
          { id: 'beach', name_es: 'Playa', name_en: 'Beach', icon: 'ri-sun-line' },
          { id: 'vintage', name_es: 'Vintage', name_en: 'Vintage', icon: 'ri-ancient-gate-line' },
          { id: 'modern', name_es: 'Moderno', name_en: 'Modern', icon: 'ri-star-line' }
        ];
      case 'baby-shower':
        return [
          { id: 'animals', name_es: 'Animalitos', name_en: 'Little Animals', icon: 'ri-bear-smile-line' },
          { id: 'clouds', name_es: 'Nubes y Estrellas', name_en: 'Clouds and Stars', icon: 'ri-cloud-line' },
          { id: 'toys', name_es: 'Juguetes', name_en: 'Toys', icon: 'ri-gamepad-line' },
          { id: 'stork', name_es: 'Cigüeña', name_en: 'Stork', icon: 'ri-flight-takeoff-line' },
          { id: 'bottles', name_es: 'Biberones y Pañales', name_en: 'Bottles and Diapers', icon: 'ri-heart-pulse-line' },
          { id: 'rainbow', name_es: 'Arcoíris', name_en: 'Rainbow', icon: 'ri-rainbow-line' }
        ];
      case 'quinceañera':
        return [
          { id: 'princess', name_es: 'Princesa Tradicional', name_en: 'Traditional Princess', icon: 'ri-crown-line' },
          { id: 'butterflies', name_es: 'Mariposas', name_en: 'Butterflies', icon: 'ri-bug-line' },
          { id: 'flowers', name_es: 'Flores Elegantes', name_en: 'Elegant Flowers', icon: 'ri-flower-line' },
          { id: 'masquerade', name_es: 'Baile de Máscaras', name_en: 'Masquerade', icon: 'ri-mask-line' },
          { id: 'paris', name_es: 'París/Torre Eiffel', name_en: 'Paris/Eiffel Tower', icon: 'ri-building-line' },
          { id: 'vintage', name_es: 'Vintage Glamour', name_en: 'Vintage Glamour', icon: 'ri-vip-crown-line' }
        ];
      case 'graduation':
        return [
          { id: 'academic', name_es: 'Académico Tradicional', name_en: 'Traditional Academic', icon: 'ri-graduation-cap-line' },
          { id: 'books', name_es: 'Libros y Conocimiento', name_en: 'Books and Knowledge', icon: 'ri-book-line' },
          { id: 'future', name_es: 'Futuro y Metas', name_en: 'Future and Goals', icon: 'ri-rocket-line' },
          { id: 'career', name_es: 'Carrera Específica', name_en: 'Specific Career', icon: 'ri-briefcase-line' },
          { id: 'celebration', name_es: 'Celebración Festiva', name_en: 'Festive Celebration', icon: 'ri-trophy-line' }
        ];
      default:
        return [
          { id: 'elegant', name_es: 'Elegante', name_en: 'Elegant', icon: 'ri-vip-crown-line' },
          { id: 'fun', name_es: 'Divertido', name_en: 'Fun', icon: 'ri-emotion-happy-line' },
          { id: 'floral', name_es: 'Floral', name_en: 'Floral', icon: 'ri-flower-line' },
          { id: 'minimalist', name_es: 'Minimalista', name_en: 'Minimalist', icon: 'ri-subtract-line' },
          { id: 'colorful', name_es: 'Colorido', name_en: 'Colorful', icon: 'ri-palette-line' },
          { id: 'custom', name_es: 'Personalizado', name_en: 'Custom', icon: 'ri-more-line' }
        ];
    }
  };

  const servingSizes = [
    { id: '1-10', name_es: '1-10 personas', name_en: '1-10 people', price_es: '$25-$45', price_en: '$25-$45' },
    { id: '11-25', name_es: '11-25 personas', name_en: '11-25 people', price_es: '$50-$85', price_en: '$50-$85' },
    { id: '26-50', name_es: '26-50 personas', name_en: '26-50 people', price_es: '$90-$150', price_en: '$90-$150' },
    { id: '51-100', name_es: '51-100 personas', name_en: '51-100 people', price_es: '$160-$280', price_en: '$160-$280' },
    { id: '100+', name_es: 'Más de 100 personas', name_en: 'More than 100 people', price_es: 'Cotización especial', price_en: 'Special quote' }
  ];

  const budgetRanges = [
    { id: 'budget', name_es: 'Económico ($25-$50)', name_en: 'Budget ($25-$50)', icon: 'ri-money-dollar-circle-line' },
    { id: 'standard', name_es: 'Estándar ($51-$100)', name_en: 'Standard ($51-$100)', icon: 'ri-money-dollar-circle-line' },
    { id: 'premium', name_es: 'Premium ($101-$200)', name_en: 'Premium ($101-$200)', icon: 'ri-money-dollar-circle-line' },
    { id: 'luxury', name_es: 'Lujo ($201+)', name_en: 'Luxury ($201+)', icon: 'ri-money-dollar-circle-line' },
    { id: 'flexible', name_es: 'Flexible', name_en: 'Flexible', icon: 'ri-question-line' }
  ];

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar formato de archivo
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

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage.from('temp-uploads').upload(fileName, file);
      if (error) {
        throw error;
      }

      setPhotoPath(data.path);
      setUploadedPhoto(URL.createObjectURL(file));
      setPhotoFile(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(language === 'es' ? 'Error al subir la foto' : 'Error uploading photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setUploadedPhoto(null);
    setPhotoFile(null);
    setPhotoPath(null);
    setQuoteData(prev => ({ ...prev, hasReferencePhoto: false, photoDescription: '' }));
  };

  const handleSubmitQuote = async () => {
    if (isSubmitting) return;

    // Validar información de contacto antes de enviar
    if (!quoteData.contactInfo.name.trim()) {
      alert(language === 'es' ? 'Por favor ingresa tu nombre completo' : 'Please enter your full name');
      return;
    }

    if (!quoteData.contactInfo.phone.trim() && !quoteData.contactInfo.email.trim()) {
      alert(language === 'es' 
        ? 'Debes proporcionar al menos un teléfono o correo electrónico para contactarte' 
        : 'You must provide at least a phone number or email to contact you');
      return;
    }

    // Validar formato de email si se proporciona
    if (quoteData.contactInfo.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(quoteData.contactInfo.email)) {
        alert(language === 'es' ? 'Por favor ingresa un correo electrónico válido' : 'Please enter a valid email address');
        return;
      }
    }

    // Validar formato de teléfono si se proporciona
    if (quoteData.contactInfo.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(quoteData.contactInfo.phone.replace(/\s/g, ''))) {
        alert(language === 'es' ? 'Por favor ingresa un número de teléfono válido' : 'Please enter a valid phone number');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para Supabase
      const quoteRecord = {
        customer_name: quoteData.contactInfo.name.trim(),
        customer_phone: quoteData.contactInfo.phone.trim() || '',
        customer_email: quoteData.contactInfo.email.trim() || null,
        occasion: quoteData.occasion || null,
        age_group: quoteData.ageGroup || null,
        theme: quoteData.theme || null,
        servings: quoteData.servings || null,
        budget: quoteData.budget || null,
        event_date: quoteData.date || null,
        event_details: quoteData.details || null,
        has_reference_photo: quoteData.hasReferencePhoto,
        photo_description: quoteData.photoDescription || null,
        reference_photo_url: photoPath || null,
        status: 'pending',
        priority: 'normal'
      };

      // Intentar guardar en Supabase
      const { data, error } = await supabase
        .from('quotes')
        .insert([quoteRecord])
        .select()
        .single();

      if (error) {
        console.error('Error guardando en Supabase:', error);
        // Fallback: enviar por email como antes
        await sendQuoteByEmail();
      } else {
        console.log('Cotización guardada en Supabase:', data);
        // También enviar notificación por email al administrador
        await sendNotificationToAdmin(data);
      }

      alert(language === 'es' ? '¡Cotización enviada! Te contactaremos pronto con los detalles.' : 'Quote sent! We will contact you soon with the details.');
      
      // Limpiar formulario
      setQuoteData({
        hasReferencePhoto: false,
        photoDescription: '',
        occasion: '',
        ageGroup: '',
        theme: '',
        servings: '',
        budget: '',
        date: '',
        details: '',
        contactInfo: { name: '', phone: '', email: '' }
      });
      setUploadedPhoto(null);
      setPhotoFile(null);
      setPhotoPath(null);
      setCurrentStep(0);

    } catch (error) {
      console.error('Error al enviar la cotización:', error);
      alert(language === 'es' ? 'Ocurrió un error al enviar la cotización. Por favor, intenta nuevamente.' : 'An error occurred while sending the quote. Please try again.');
    }

    setIsSubmitting(false);
  };

  const sendQuoteByEmail = async () => {
    // Fallback: método original por email
    const formData = new FormData();
    
    formData.append('name', quoteData.contactInfo.name);
    formData.append('phone', quoteData.contactInfo.phone);
    formData.append('email', quoteData.contactInfo.email);
    formData.append('occasion', quoteData.occasion);
    formData.append('ageGroup', quoteData.ageGroup);
    formData.append('theme', quoteData.theme);
    formData.append('servings', quoteData.servings);
    formData.append('budget', quoteData.budget);
    formData.append('date', quoteData.date);
    formData.append('details', quoteData.details);
    formData.append('hasReferencePhoto', quoteData.hasReferencePhoto.toString());
    formData.append('photoDescription', quoteData.photoDescription);
    
    if (photoFile) {
      formData.append('referencePhoto', photoFile);
    }

    const response = await fetch('https://formsubmit.co/ajax/rangerbakery@gmail.com', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al enviar por email');
    }
  };

  const sendNotificationToAdmin = async (quoteData: any) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: 'rangerbakery@gmail.com',
          type: 'new_quote',
          language: 'es',
          quoteData: quoteData
        })
      });
    } catch (error) {
      console.log('Error enviando notificación:', error);
    }
  };

  const updateQuoteData = (field: string, value: string) => {
    setQuoteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateContactInfo = (field: string, value: string) => {
    setQuoteData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const steps = language === 'es'
    ? quoteData.hasReferencePhoto
      ? ['Tipo', 'Foto', 'Detalles', 'Tema', 'Porciones', 'Presupuesto', 'Fecha', 'Contacto']
      : ['Tipo', 'Ocasión', 'Detalles', 'Tema', 'Porciones', 'Presupuesto', 'Fecha', 'Contacto']
    : quoteData.hasReferencePhoto
      ? ['Type', 'Photo', 'Details', 'Theme', 'Servings', 'Budget', 'Date', 'Contact']
      : ['Type', 'Occasion', 'Details', 'Theme', 'Servings', 'Budget', 'Date', 'Contact'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="pt-16 pb-20">
        <div className="px-3 py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-amber-800 mb-2">
              {language === 'es' ? 'Solicitar Cotización' : 'Request Quote'}
            </h1>
            <p className="text-gray-600 text-sm">
              {language === 'es' ? 'Cuéntanos sobre tu celebración perfecta' : 'Tell us about your perfect celebration'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {language === 'es' ? `Paso ${currentStep + 1} de ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
              </span>
              <span className="text-sm font-medium text-pink-600">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-teal-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-700">{steps[currentStep]}</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            {/* Step 0: Quote Type Selection */}
            {currentStep === 0 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? '¿Cómo prefieres hacer tu cotización?' : 'How would you prefer to make your quote?'}
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setQuoteData(prev => ({ ...prev, hasReferencePhoto: false }));
                      setCurrentStep(1);
                    }}
                    className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-pink-300 transition-all text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <i className="ri-questionnaire-line text-blue-600 text-2xl"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {language === 'es' ? 'Cotización Guiada' : 'Guided Quote'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {language === 'es' 
                            ? 'Te guiaremos paso a paso para crear tu cotización perfecta'
                            : 'We\'ll guide you step by step to create your perfect quote'
                          }
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setQuoteData(prev => ({ ...prev, hasReferencePhoto: true }));
                      setCurrentStep(1);
                    }}
                    className="w-full p-5 border-2 border-pink-300 bg-pink-50 rounded-xl hover:border-pink-400 transition-all text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                        <i className="ri-image-add-line text-pink-600 text-2xl"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {language === 'es' ? 'Cotización con Foto de Referencia' : 'Quote with Reference Photo'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {language === 'es' 
                            ? 'Sube una imagen de lo que quieres y cuéntanos qué te gusta de ella'
                            : 'Upload an image of what you want and tell us what you like about it'
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Reference Photo or Occasion */}
            {currentStep === 1 && quoteData.hasReferencePhoto && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? 'Sube tu Foto de Referencia' : 'Upload Your Reference Photo'}
                </h2>
                
                <div className="space-y-4">
                  {!uploadedPhoto ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-upload-cloud-2-line text-2xl text-pink-500"></i>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        {language === 'es' ? 'Selecciona tu foto de referencia' : 'Select your reference photo'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {language === 'es' 
                          ? 'Formatos permitidos: JPG, PNG, GIF, WEBP\nTamaño máximo: 5MB'
                          : 'Allowed formats: JPG, PNG, GIF, WEBP\nMaximum size: 5MB'
                        }
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="reference-photo-upload"
                      />
                      <label
                        htmlFor="reference-photo-upload"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-teal-400 text-white rounded-xl font-semibold cursor-pointer hover:shadow-lg transition-all"
                      >
                        <i className="ri-image-add-line mr-2"></i>
                        {language === 'es' ? 'Elegir Archivo' : 'Choose File'}
                      </label>
                      {isUploadingPhoto && (
                        <p className="text-sm text-gray-500 mt-2">
                          {language === 'es' ? 'Subiendo foto...' : 'Uploading photo...'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-gray-50 rounded-xl p-4">
                        <img
                          src={uploadedPhoto}
                          alt="Foto de referencia"
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
                          <span className="text-green-800 font-medium">
                            {language === 'es' ? '¡Foto cargada exitosamente!' : 'Photo uploaded successfully!'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {language === 'es' 
                            ? 'Describe qué te gusta de esta imagen y qué partes quieres que incluyamos'
                            : 'Describe what you like about this image and which parts you want us to include'
                          }
                        </label>
                        <textarea
                          value={quoteData.photoDescription}
                          onChange={e => setQuoteData(prev => ({ ...prev, photoDescription: e.target.value }))}
                          placeholder={language === 'es' 
                            ? "Ej: Me gusta el diseño de las flores en la parte superior, los colores rosados y dorados, y la forma del pastel. No me gusta la decoración de la base..."
                            : "Ex: I like the flower design on top, the pink and gold colors, and the cake shape. I don't like the base decoration..."
                          }
                          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-sm h-32 resize-none"
                          maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          {quoteData.photoDescription.length}/500 {language === 'es' ? 'caracteres' : 'characters'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Occasion (for guided quote) */}
            {currentStep === 1 && !quoteData.hasReferencePhoto && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? '¿Qué están celebrando?' : 'What are you celebrating?'}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {occasions.map(occasion => (
                    <button
                      key={occasion.id}
                      onClick={() => updateQuoteData('occasion', occasion.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        quoteData.occasion === occasion.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <i className={`${occasion.icon} text-2xl ${
                          quoteData.occasion === occasion.id ? 'text-pink-500' : 'text-gray-400'
                        }`}></i>
                      </div>
                      <div className={`text-sm font-medium ${
                        quoteData.occasion === occasion.id ? 'text-pink-700' : 'text-gray-700'
                      }`}>
                        {language === 'es' ? occasion.name_es : occasion.name_en}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Age/Details Group - Contextualized based on occasion */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' 
                    ? quoteData.hasReferencePhoto 
                      ? '¿Para qué tipo de celebración es?'
                      : quoteData.occasion === 'birthday' 
                        ? '¿De quién es el cumpleaños?'
                        : quoteData.occasion === 'wedding'
                          ? '¿Qué tipo de boda es?'
                          : quoteData.occasion === 'baby-shower'
                            ? '¿Es para niño, niña o sorpresa?'
                            : quoteData.occasion === 'quinceañera'
                              ? '¿Qué estilo prefieres?'
                              : quoteData.occasion === 'graduation'
                                ? '¿Qué tipo de graduación?'
                                : quoteData.occasion === 'anniversary'
                                  ? '¿Cuántos años están celebrando?'
                                  : quoteData.occasion === 'baptism'
                                    ? '¿Qué tipo de bautizo?'
                                    : '¿Qué tamaño de evento es?'
                    : quoteData.hasReferencePhoto 
                      ? 'What type of celebration is it for?'
                      : quoteData.occasion === 'birthday' 
                        ? 'Whose birthday is it?'
                        : quoteData.occasion === 'wedding'
                          ? 'What type of wedding is it?'
                          : quoteData.occasion === 'baby-shower'
                            ? 'Is it for a boy, girl or surprise?'
                            : quoteData.occasion === 'quinceañera'
                              ? 'What style do you prefer?'
                              : quoteData.occasion === 'graduation'
                                ? 'What type of graduation?'
                                : quoteData.occasion === 'anniversary'
                                  ? 'How many years are you celebrating?'
                                  : quoteData.occasion === 'baptism'
                                    ? 'What type of baptism?'
                                    : 'What size event is it?'
                  }
                </h2>
                <div className="space-y-3">
                  {getAgeGroupsByOccasion(quoteData.hasReferencePhoto ? 'other' : quoteData.occasion).map(age => (
                    <button
                      key={age.id}
                      onClick={() => updateQuoteData('ageGroup', age.id)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                        quoteData.ageGroup === age.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 mr-4 flex items-center justify-center">
                        <i className={`${age.icon} text-2xl ${
                          quoteData.ageGroup === age.id ? 'text-pink-500' : 'text-gray-400'
                        }`}></i>
                      </div>
                      <div className={`text-left ${
                        quoteData.ageGroup === age.id ? 'text-pink-700' : 'text-gray-700'
                      }`}>
                        <div className="font-medium">{language === 'es' ? age.name_es : age.name_en}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Theme - Contextualized based on occasion */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' 
                    ? quoteData.hasReferencePhoto
                      ? 'Tema o Estilo Adicional'
                      : 'Tema o Estilo Preferido'
                    : quoteData.hasReferencePhoto
                      ? 'Additional Theme or Style'
                      : 'Theme or Preferred Style'
                  }
                </h2>
                
                {/* Themed Options for specific occasions */}
                {!quoteData.hasReferencePhoto && (quoteData.occasion === 'birthday' || quoteData.occasion === 'wedding' || quoteData.occasion === 'baby-shower' || quoteData.occasion === 'quinceañera' || quoteData.occasion === 'graduation') && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {getThemesByOccasion(quoteData.occasion).map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => updateQuoteData('theme', theme.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          quoteData.theme === theme.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                          <i className={`${theme.icon} text-xl ${
                            quoteData.theme === theme.id ? 'text-pink-500' : 'text-gray-400'
                          }`}></i>
                        </div>
                        <div className={`text-xs font-medium text-center ${
                          quoteData.theme === theme.id ? 'text-pink-700' : 'text-gray-700'
                        }`}>
                          {language === 'es' ? theme.name_es : theme.name_en}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Free text area for additional details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'es' 
                      ? quoteData.hasReferencePhoto 
                        ? 'Describe cualquier tema adicional o estilo específico que tengas en mente, además de la foto de referencia'
                        : (quoteData.theme && quoteData.theme !== 'custom') 
                          ? 'Detalles adicionales sobre el tema seleccionado (colores específicos, elementos que quieres incluir, etc.)'
                          : 'Describe el tema, colores, decoraciones o ideas que tienes en mente'
                      : quoteData.hasReferencePhoto
                        ? 'Describe any additional theme or specific style you have in mind, in addition to the reference photo'
                        : (quoteData.theme && quoteData.theme !== 'custom')
                          ? 'Additional details about the selected theme (specific colors, elements you want to include, etc.)'
                          : 'Describe the theme, colors, decorations or ideas you have in mind'
                    }
                  </label>
                  <textarea
                    value={typeof quoteData.theme === 'string' && !getThemesByOccasion(quoteData.occasion || 'other').find(t => t.id === quoteData.theme) ? quoteData.theme : ''}
                    onChange={e => updateQuoteData('theme', e.target.value)}
                    placeholder={language === 'es' 
                      ? "Ej: Colores rosado y dorado, decoración con mariposas, estilo elegante y romántico..."
                      : "Ex: Pink and gold colors, butterfly decorations, elegant and romantic style..."
                    }
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-sm h-32 resize-none"
                    maxLength={300}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {(typeof quoteData.theme === 'string' && !getThemesByOccasion(quoteData.occasion || 'other').find(t => t.id === quoteData.theme) ? quoteData.theme : '').length}/300 {language === 'es' ? 'caracteres' : 'characters'}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Servings */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? '¿Para cuántas personas?' : 'How many people?'}
                </h2>
                <div className="space-y-3">
                  {servingSizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => updateQuoteData('servings', size.id)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                        quoteData.servings === size.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={quoteData.servings === size.id ? 'text-pink-700' : 'text-gray-700'}>
                        <div className="font-medium">{language === 'es' ? size.name_es : size.name_en}</div>
                      </div>
                      <div className={`text-sm ${quoteData.servings === size.id ? 'text-pink-600' : 'text-gray-500'}`}>
                        {language === 'es' ? size.price_es : size.price_en}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Budget */}
            {currentStep === 5 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? 'Presupuesto Aproximado' : 'Approximate Budget'}
                </h2>
                <div className="space-y-3">
                  {budgetRanges.map(budget => (
                    <button
                      key={budget.id}
                      onClick={() => updateQuoteData('budget', budget.id)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                        quoteData.budget === budget.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 mr-4 flex items-center justify-center">
                        <i className={`${budget.icon} text-2xl ${
                          quoteData.budget === budget.id ? 'text-pink-500' : 'text-gray-400'
                        }`}></i>
                      </div>
                      <div className={`text-left ${quoteData.budget === budget.id ? 'text-pink-700' : 'text-gray-700'}`}>
                        <div className="font-medium">{language === 'es' ? budget.name_es : budget.name_en}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Date */}
            {currentStep === 6 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? '¿Cuándo es el evento?' : 'When is the event?'}
                </h2>
                <div className="space-y-4">
                  <input
                    type="date"
                    value={quoteData.date}
                    onChange={e => updateQuoteData('date', e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-base"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <textarea
                    value={quoteData.details}
                    onChange={e => updateQuoteData('details', e.target.value)}
                    placeholder={language === 'es' 
                      ? "Detalles adicionales sobre el evento (hora, lugar, instrucciones especiales...)"
                      : "Additional event details (time, location, special instructions...)"
                    }
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-sm h-24 resize-none"
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500">
                    {quoteData.details.length}/200 {language === 'es' ? 'caracteres' : 'characters'}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Contact Info */}
            {currentStep === 7 && (
              <div>
                <h2 className="text-xl font-semibold text-amber-800 mb-4 text-center">
                  {language === 'es' ? 'Información de Contacto' : 'Contact Information'}
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={quoteData.contactInfo.name}
                    onChange={e => updateContactInfo('name', e.target.value)}
                    placeholder={language === 'es' ? 'Nombre completo *' : 'Full name *'}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-base"
                    required
                  />
                  <input
                    type="tel"
                    value={quoteData.contactInfo.phone}
                    onChange={e => updateContactInfo('phone', e.target.value)}
                    placeholder={language === 'es' ? 'Teléfono' : 'Phone'}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-base"
                  />
                  <input
                    type="email"
                    value={quoteData.contactInfo.email}
                    onChange={e => updateContactInfo('email', e.target.value)}
                    placeholder="Email"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-500 text-base"
                  />
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <i className="ri-information-line text-amber-600 mr-2 mt-0.5"></i>
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">
                          {language === 'es' ? '¡Importante!' : 'Important!'}
                        </p>
                        <p>
                          {language === 'es' 
                            ? 'Debes proporcionar al menos un teléfono o correo electrónico para que podamos contactarte con tu cotización.'
                            : 'You must provide at least a phone number or email so we can contact you with your quote.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'es' 
                      ? 'Te contactaremos dentro de 24 horas con tu cotización personalizada'
                      : 'We will contact you within 24 hours with your personalized quote'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all !rounded-button ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-pink-300 text-pink-500 hover:bg-pink-50'
              }`}
            >
              <i className="ri-arrow-left-line mr-2"></i>
              {language === 'es' ? 'Anterior' : 'Previous'}
            </button>

            {currentStep < 7 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && quoteData.hasReferencePhoto && (!uploadedPhoto || !quoteData.photoDescription)) ||
                  (currentStep === 1 && !quoteData.hasReferencePhoto && !quoteData.occasion) ||
                  (currentStep === 2 && !quoteData.ageGroup) ||
                  (currentStep === 4 && !quoteData.servings) ||
                  (currentStep === 5 && !quoteData.budget) ||
                  (currentStep === 6 && !quoteData.date)
                }
                className={`px-6 py-3 rounded-xl font-medium transition-all !rounded-button ${
                  (currentStep === 1 && quoteData.hasReferencePhoto && (!uploadedPhoto || !quoteData.photoDescription)) ||
                  (currentStep === 1 && !quoteData.hasReferencePhoto && !quoteData.occasion) ||
                  (currentStep === 2 && !quoteData.ageGroup) ||
                  (currentStep === 4 && !quoteData.servings) ||
                  (currentStep === 5 && !quoteData.budget) ||
                  (currentStep === 6 && !quoteData.date)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-400 to-teal-400 text-white hover:shadow-lg'
                }`}
              >
                {language === 'es' ? 'Siguiente' : 'Next'}
                <i className="ri-arrow-right-line ml-2"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmitQuote}
                disabled={
                  !quoteData.contactInfo.name || 
                  (!quoteData.contactInfo.phone && !quoteData.contactInfo.email) ||
                  isSubmitting
                }
                className={`px-6 py-3 rounded-xl font-medium transition-all !rounded-button ${
                  !quoteData.contactInfo.name || 
                  (!quoteData.contactInfo.phone && !quoteData.contactInfo.email) ||
                  isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-400 to-teal-400 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                    {language === 'es' ? 'Enviando...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line mr-2"></i>
                    {language === 'es' ? 'Enviar Cotización' : 'Send Quote'}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/cakes" className="text-pink-500 text-sm hover:text-pink-600">
              <i className="ri-arrow-left-line mr-1"></i>
              {language === 'es' ? 'Volver a Pasteles' : 'Back to Cakes'}
            </Link>
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}