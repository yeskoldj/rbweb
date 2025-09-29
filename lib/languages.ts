
export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const languages: Language[] = [
  { code: 'es', name: 'Español', flag: '🇩🇴' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export const translations = {
  es: {
    // Header
    bakeryName: "Ranger's Bakery",
    
    // Language selector
    selectLanguage: "Selecciona tu idioma",
    language: "Idioma",
    
    // Home Page
    featuredProducts: "Productos Destacados",
    seeFullMenu: "Ver Menú Completo",
    addToCart: "Agregar",
    heroSubtitle: "Hechas con amor para tus momentos especiales",

    // Gallery
    galleryTitle: "Galería de Nuestras Creaciones",
    viewMorePhotos: "Ver Más Fotos",
    galleryModalTitle: "Nuestras Creaciones",
    galleryInstagramCta: "Ver más en Instagram",

    // Contact
    contactTitle: "Contáctanos",
    contactSubtitle: "¡Nos encantaría saber de ti! Escríbenos para pedidos personalizados o preguntas.",
    contactGetInTouch: "Ponte en contacto",
    contactFollowUs: "Síguenos",
    contactInstagramSectionTitle: "¡Síguenos en Instagram!",
    contactInstagramDescription: "Mira nuestras últimas creaciones y momentos detrás de cámara",
    contactInstagramButton: "Seguir @rangersbakery",

    // Language selector
    languageWelcomeTitle: "Bienvenido a Ranger's Bakery",
    languageWelcomeDescription: "Selecciona tu idioma preferido",

    // PWA Install
    installApp: "¡Instala nuestra App!",
    installDescription: "Accede más rápido a nuestros deliciosos pasteles",
    installButton: "Instalar App",
    installLater: "Más tarde",
    
    // Auth
    login: "Iniciar Sesión",
    signup: "Registrarse",
    email: "Correo electrónico",
    password: "Contraseña",
    fullName: "Nombre completo",
    welcomeBack: "¡Bienvenido de vuelta!",
    joinBakery: "Únete a Ranger's Bakery",
    loginButton: "Iniciar Sesión",
    signupButton: "Crear Cuenta",
    noAccount: "¿No tienes cuenta? Regístrate",
    hasAccount: "¿Ya tienes cuenta? Inicia sesión",
    whyAccount: "¿Por qué crear una cuenta?",
    addToCartBenefit: "• Agregar productos al carrito",
    placeOrders: "• Realizar y rastrear pedidos",
    orderHistory: "• Ver historial de pedidos",
    emailConfirmations: "• Confirmaciones por correo electrónico",
    
    // Navigation
    home: "Inicio",
    menu: "Menú",
    cakes: "Pasteles",
    order: "Pedido",
    track: "Rastrear",
    dashboard: "Panel",
    
    // Dashboard
    userManagement: "Gestión de Usuarios",
    myProfile: "Mi Perfil",
    changePassword: "Cambiar Contraseña",
    currentPassword: "Contraseña Actual",
    newPassword: "Nueva Contraseña",
    confirmPassword: "Confirmar Nueva Contraseña",
    saveChanges: "Guardar Cambios",
    cancel: "Cancelar",
    phone: "Teléfono",
    
    // Cakes Page
    customCakes: "Pasteles Personalizados",
    customCakesDescription: "Creamos el pastel perfecto para tu celebración especial",
    needSomethingUnique: "¿Necesitas algo único?",
    customQuoteDescription: "Solicita una cotización personalizada para tu celebración especial",
    requestQuote: "Solicitar Cotización",
    contactDirectly: "Contactar Directamente",
    stillNotSure: "¿Aún no estás seguro?",
    contactUsForHelp: "Contáctanos y te ayudaremos a elegir el pastel perfecto",
    getHelp: "Obtener Ayuda",
    
    // Categories
    all: "Todos",
    birthday: "Cumpleaños",
    weddings: "Bodas",
    quinceaneras: "Quinceañeras",
    special: "Especiales",
    photoCakes: "Pasteles con Foto",
    birthdayCakes: "Pasteles de Cumpleaños",
    weddingCakes: "Pasteles de Boda",
    quinceanerasCakes: "Pasteles de Quinceañera",
    specialCakes: "Pasteles Especiales",
    
    // Product details
    from: "Desde",
    sizes: "Tamaños",
    flavors: "Masas",
    customize: "Personalizar",
    
    // Menu & Cakes
    customizeCake: "Personalizar Pastel",
    backToCakes: "Volver a los Pasteles",
    cakeCustomization: "Personalización del Pastel",
    requires24Hours: "Requiere 24 horas de anticipación",
    priceDefinedByBakery: "Precio definido por la panadería",
    priceConfirmedLater: "El precio final será confirmado por la panadería después de revisar tu personalización",

    // Reviews
    clientReviews: "Reseñas de Clientes",
    basedOnReviews: "Basado en {count} reseñas",
    waitingReviews: "Esperando reseñas",
    writeReview: "Escribir Reseña",
    beFirstReview: "¡Sé el primero en dejar una reseña!",
    shareExperience: "Compartir tu experiencia",
    viewOnGoogleMaps: "Ver en Google Maps",
    loadingReviews: "Cargando reseñas...",
    
    // Common
    loading: "Cargando...",
    save: "Guardar",
    edit: "Editar",
    delete: "Eliminar",
    close: "Cerrar",
    yes: "Sí",
    no: "No",
    pleaseWait: "Por favor espera...",
    error: "Error",
    success: "Éxito",
    included: "Incluido",
    bakeryWillQuote: "Cotización con la panadería",
    loginRequiredForCart: "Necesitas crear una cuenta para agregar productos al carrito",
    addToCartError: "Error al agregar al carrito. Intenta de nuevo.",
    itemAddedToCart: "{item} agregado al carrito",

    // Menu Page
    menuTitle: "Nuestro Menú",
    menuSubtitle: "Delicias dominicanas hechas con amor para ti",
    menuReadyToOrder: "¿Listo para ordenar?",
    menuReadyDescription: "Haz tu pedido y lo tendremos listo para ti",
    menuOrderButton: "Hacer Pedido",
    menuCategoryAll: "Todos",
    menuCategoryClassics: "Postres Clásicos",
    menuCategorySpecialties: "Especialidades",
    menuCategoryTropical: "Tropicales",
    menuCategorySmallDelights: "Pequeños Placeres",
    menuCategoryUnique: "Únicos",

    // Menu Items
    productTresLechesVasoName: "Tres Leches en Vaso",
    productTresLechesVasoDescription: "Tradicional tres leches dominicano servido en vaso",
    productFlanName: "Flan",
    productFlanDescription: "Cremoso flan casero dominicano con caramelo",
    productCheesecakeName: "Cheesecake",
    productCheesecakeDescription: "Cremoso cheesecake estilo dominicano",
    productBirthdayCakeName: "Cake de Cumpleaños",
    productBirthdayCakeDescription: "Cake personalizado con decoración especial",
    productMiniPastelesName: "Mini Pasteles",
    productMiniPastelesDescription: "Pequeños pasteles dominicanos con frutas variadas",
    productTresLechesOreoName: "Tres Leches de Oreo",
    productTresLechesOreoDescription: "Nuestra versión especial dominicana con galletas Oreo",
    priceCustomQuote: "Cotización personalizada",

    // Cakes page
    cakesBackLink: "Volver al Inicio",
    cakesTitle: "Pasteles Personalizados",
    cakesSubtitle: "Crea el pastel perfecto para tu ocasión especial",
    cakeCategoryAll: "Todos",
    cakeCategoryBirthday: "Cumpleaños",
    cakeCategoryWeddings: "Bodas",
    cakeCategoryQuince: "Quinceañera",
    cakeCategoryPhoto: "Pastel con Foto",
    sendUsYourPhoto: "Envíanos tu foto",
    popularTag: "Popular",
    fromPrice: "Desde",
    howItWorks: "¿Cómo funciona?",
    stepSelect: "Selecciona el tipo de pastel que más te guste",
    stepCustomize: "Personaliza forma, masas, colores y decoraciones",
    stepOrder: "Ordena y nosotros lo preparamos especialmente para ti",
    cantFindCta: "¿No encuentras lo que buscas?",
    contactForCustom: "Contáctanos para crear un diseño completamente personalizado",

    // Contact info labels
    contactSectionGetInTouch: "Ponte en contacto",
    contactSectionFollowUs: "Síguenos",
    contactFollowButton: "Seguir @rangersbakery"
  },
  en: {
    // Header
    bakeryName: "Ranger's Bakery",
    
    // Language selector
    selectLanguage: "Select your language",
    language: "Language",
    
    // Home Page
    featuredProducts: "Featured Products",
    seeFullMenu: "See Full Menu",
    addToCart: "Add",
    heroSubtitle: "Made with love for your special moments",

    // Gallery
    galleryTitle: "Gallery of Our Creations",
    viewMorePhotos: "View More Photos",
    galleryModalTitle: "Our Creations",
    galleryInstagramCta: "See more on Instagram",

    // Contact
    contactTitle: "Contact Us",
    contactSubtitle: "We'd love to hear from you! Reach out for custom orders or questions.",
    contactGetInTouch: "Get in Touch",
    contactFollowUs: "Follow Us",
    contactInstagramSectionTitle: "Follow us on Instagram!",
    contactInstagramDescription: "See our latest creations and behind-the-scenes moments",
    contactInstagramButton: "Follow @rangersbakery",

    // Language selector
    languageWelcomeTitle: "Welcome to Ranger's Bakery",
    languageWelcomeDescription: "Please select your preferred language",

    // PWA Install
    installApp: "Install our App!",
    installDescription: "Get faster access to our delicious cakes",
    installButton: "Install App",
    installLater: "Later",
    
    // Auth
    login: "Login",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    welcomeBack: "Welcome back!",
    joinBakery: "Join Ranger's Bakery",
    loginButton: "Login",
    signupButton: "Create Account",
    noAccount: "Don't have an account? Sign up",
    hasAccount: "Already have an account? Login",
    whyAccount: "Why create an account?",
    addToCartBenefit: "• Add products to cart",
    placeOrders: "• Place and track orders",
    orderHistory: "• View order history",
    emailConfirmations: "• Email confirmations",
    
    // Navigation
    home: "Home",
    menu: "Menu",
    cakes: "Cakes",
    order: "Order",
    track: "Track",
    dashboard: "Dashboard",
    
    // Dashboard
    userManagement: "User Management",
    myProfile: "My Profile",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    phone: "Phone",
    
    // Cakes Page
    customCakes: "Custom Cakes",
    customCakesDescription: "We create the perfect cake for your special celebration",
    needSomethingUnique: "Need something unique?",
    customQuoteDescription: "Request a personalized quote for your special celebration",
    requestQuote: "Request Quote",
    contactDirectly: "Contact Directly",
    stillNotSure: "Still not sure?",
    contactUsForHelp: "Contact us and we'll help you choose the perfect cake",
    getHelp: "Get Help",
    
    // Categories
    all: "All",
    birthday: "Birthday",
    weddings: "Weddings",
    quinceaneras: "Quinceañeras",
    special: "Special",
    photoCakes: "Photo Cakes",
    birthdayCakes: "Birthday Cakes",
    weddingCakes: "Wedding Cakes",
    quinceanerasCakes: "Quinceañera Cakes",
    specialCakes: "Special Cakes",
    
    // Product details
    from: "From",
    sizes: "sizes",
    flavors: "flavors",
    customize: "Customize",
    
    // Menu & Cakes
    customizeCake: "Customize Cake",
    backToCakes: "Back to Cakes",
    cakeCustomization: "Cake Customization",
    requires24Hours: "Requires 24 hours notice",
    priceDefinedByBakery: "Price determined by the bakery",
    priceConfirmedLater: "The final price will be confirmed by the bakery after reviewing your customization",

    // Reviews
    clientReviews: "Client Reviews",
    basedOnReviews: "Based on {count} reviews",
    waitingReviews: "Waiting for reviews",
    writeReview: "Write Review",
    beFirstReview: "Be the first to leave a review!",
    shareExperience: "Share your experience",
    viewOnGoogleMaps: "View on Google Maps",
    loadingReviews: "Loading reviews...",
    
    // Common
    loading: "Loading...",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    yes: "Yes",
    no: "No",
    pleaseWait: "Please wait...",
    error: "Error",
    success: "Success",
    included: "Included",
    bakeryWillQuote: "Bakery will provide quote",
    loginRequiredForCart: "You need to create an account to add products to the cart",
    addToCartError: "Error adding to cart. Please try again.",
    itemAddedToCart: "{item} added to cart",

    // Menu Page
    menuTitle: "Our Menu",
    menuSubtitle: "Dominican delights made with love for you",
    menuReadyToOrder: "Ready to order?",
    menuReadyDescription: "Place your order and we'll have it ready for you",
    menuOrderButton: "Place Order",
    menuCategoryAll: "All",
    menuCategoryClassics: "Classic Desserts",
    menuCategorySpecialties: "Specialties",
    menuCategoryTropical: "Tropical",
    menuCategorySmallDelights: "Small Delights",
    menuCategoryUnique: "Unique",

    // Menu Items
    productTresLechesVasoName: "Tres Leches in a Cup",
    productTresLechesVasoDescription: "Traditional Dominican tres leches served in a cup",
    productFlanName: "Flan",
    productFlanDescription: "Creamy homemade Dominican flan with caramel",
    productCheesecakeName: "Cheesecake",
    productCheesecakeDescription: "Creamy Dominican-style cheesecake",
    productBirthdayCakeName: "Birthday Cake",
    productBirthdayCakeDescription: "Personalized cake with special decoration",
    productMiniPastelesName: "Mini Cakes",
    productMiniPastelesDescription: "Small Dominican cakes with assorted fruits",
    productTresLechesOreoName: "Oreo Tres Leches",
    productTresLechesOreoDescription: "Our special Dominican version with Oreo cookies",
    priceCustomQuote: "Custom quote",

    // Cakes page
    cakesBackLink: "Back to Home",
    cakesTitle: "Custom Cakes",
    cakesSubtitle: "Create the perfect cake for your special occasion",
    cakeCategoryAll: "All",
    cakeCategoryBirthday: "Birthday",
    cakeCategoryWeddings: "Weddings",
    cakeCategoryQuince: "Quinceañera",
    cakeCategoryPhoto: "Photo Cake",
    sendUsYourPhoto: "Send us your photo",
    popularTag: "Popular",
    fromPrice: "From",
    howItWorks: "How does it work?",
    stepSelect: "Select the cake type you love the most",
    stepCustomize: "Customize shape, flavors, colors and decorations",
    stepOrder: "Place your order and we'll prepare it especially for you",
    cantFindCta: "Can't find what you're looking for?",
    contactForCustom: "Contact us to create a fully custom design",

    // Contact info labels
    contactSectionGetInTouch: "Get in Touch",
    contactSectionFollowUs: "Follow Us",
    contactFollowButton: "Follow @rangersbakery"
  }
};

export const getTranslation = (key: string, lang: string = 'es'): string => {
  const langTranslations = translations[lang as keyof typeof translations] || translations.es;
  return (langTranslations as any)[key] || key;
};
