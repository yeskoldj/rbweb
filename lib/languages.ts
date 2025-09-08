
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
    emailConfirmations: "• Confirmaciones por email",
    
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
    photoCakes: "Photo Cakes",
    birthdayCakes: "Pasteles de Cumpleaños",
    weddingCakes: "Pasteles de Boda",
    quinceanerasCakes: "Pasteles de Quinceañera",
    specialCakes: "Pasteles Especiales",
    
    // Product details
    from: "Desde",
    sizes: "tamaños",
    flavors: "sabores",
    customize: "Personalizar",
    
    // Menu & Cakes
    customizeCake: "Personalizar Pastel",
    backToCakes: "Volver a Pasteles",
    cakeCustomization: "Personalización de Pastel",
    requires24Hours: "Requiere 24 horas de anticipación",
    
    // Reviews
    clientReviews: "Reseñas de Clientes",
    basedOnReviews: "Basado en {count} reseñas",
    waitingReviews: "Esperando reseñas",
    writeReview: "Escribir Reseña",
    beFirstReview: "¡Sé el primero en dejar una reseña!",
    shareExperience: "Compartir tu experiencia",
    viewOnGoogleMaps: "Ver en Google Maps",
    loadingReviews: "Cargando reseñas...",

    // Hero
    heroTagline: "Hechas con amor para tus momentos especiales",
    viewMenu: "Ver Menú",

    // Gallery
    galleryHeading: "Galería de Nuestras Creaciones",
    viewMorePhotos: "Ver Más Fotos",
    galleryModalHeading: "Nuestras Creaciones",
    seeMoreOnInstagram: "Ver más en Instagram",

    // Menu Preview
    accountRequired: "Necesitas crear una cuenta para agregar productos al carrito",
    addToCartError: "Error al agregar al carrito. Intenta de nuevo.",
    addedToCart: "agregado al carrito",
    customize: "Personalizar",
    tresLechesCupName: "Tres Leches en Vaso",
    tresLechesCupDesc: "Tradicional tres leches dominicano servido en vaso",
    flanName: "Flan",
    flanDesc: "Cremoso flan casero dominicano con caramelo",
    cheesecakeName: "Cheesecake",
    cheesecakeDesc: "Cremoso cheesecake estilo dominicano",
    birthdayCakeName: "Cake de Cumpleaños",
    birthdayCakeDesc: "Cake personalizado con decoración especial",
    miniCakesName: "Mini Pasteles",
    miniCakesDesc: "Pequeños pasteles dominicanos con frutas variadas",
    oreoTresLechesName: "Tres Leches de Oreo",
    oreoTresLechesDesc: "Nuestra versión especial dominicana con galletas Oreo",

    // Price List
    priceListTitle: "Precios de Pasteles - Ranger's Bakery",
    priceListSubtitle: "Lista oficial de precios actualizada",
    singleTierHeading: "TAMAÑOS SENCILLOS (1 piso)",
    doubleTierHeading: "DOBLE (2 pisos del mismo tamaño)",
    tripleTierHeading: "TRIPLE (3 pisos del mismo tamaño)",
    eventCakesHeading: "MULTINIVEL (combinados por cantidad de personas)",
    camouflageNote: "Nota \"Camuflaje\": En la lámina 2 aparece un precio alternativo si el pastel es Camuflaje: 1. $150+ | 2) $195+ | 3) $250+ | 4) $350+ | 5) $450",
    sizeIndicationNote: "Cada tamaño se indica como un piso de \"2 layers\".",
    extrasDecorationsHeading: "EXTRAS / DECORACIONES",
    camouflageNoteExtras: "Nota \"Camuflaje\": En la lámina 2 aparece un precio alternativo si el pastel es Camuflaje. El \"+\" depende de la cantidad solicitada. (El \"+\" depende de la cantidad)",
    customQuotePrompt: "¿Necesitas un presupuesto personalizado?",
    whatsappLabel: "WhatsApp:",
    callLabel: "Llamar:",

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
    success: "Éxito"
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
    
    // Reviews
    clientReviews: "Client Reviews",
    basedOnReviews: "Based on {count} reviews",
    waitingReviews: "Waiting for reviews",
    writeReview: "Write Review",
    beFirstReview: "Be the first to leave a review!",
    shareExperience: "Share your experience",
    viewOnGoogleMaps: "View on Google Maps",
    loadingReviews: "Loading reviews...",

    // Hero
    heroTagline: "Made with love for your special moments",
    viewMenu: "View Menu",

    // Gallery
    galleryHeading: "Gallery of Our Creations",
    viewMorePhotos: "View More Photos",
    galleryModalHeading: "Our Creations",
    seeMoreOnInstagram: "See more on Instagram",

    // Menu Preview
    accountRequired: "You need to create an account to add products to the cart",
    addToCartError: "Error adding to cart. Please try again.",
    addedToCart: "added to cart",
    customize: "Customize",
    tresLechesCupName: "Tres Leches Cup",
    tresLechesCupDesc: "Traditional Dominican tres leches served in a cup",
    flanName: "Flan",
    flanDesc: "Creamy homemade Dominican flan with caramel",
    cheesecakeName: "Cheesecake",
    cheesecakeDesc: "Creamy Dominican-style cheesecake",
    birthdayCakeName: "Birthday Cake",
    birthdayCakeDesc: "Custom cake with special decoration",
    miniCakesName: "Mini Cakes",
    miniCakesDesc: "Small Dominican cakes with assorted fruits",
    oreoTresLechesName: "Oreo Tres Leches",
    oreoTresLechesDesc: "Our special Dominican version with Oreo cookies",

    // Price List
    priceListTitle: "Cake Prices - Ranger's Bakery",
    priceListSubtitle: "Official updated price list",
    singleTierHeading: "SINGLE TIERS (1 layer)",
    doubleTierHeading: "DOUBLE (2 tiers same size)",
    tripleTierHeading: "TRIPLE (3 tiers same size)",
    eventCakesHeading: "MULTI-TIER (combined by number of people)",
    camouflageNote: "Camouflage Note: On slide 2 there's an alternate price if the cake is Camouflage: 1. $150+ | 2) $195+ | 3) $250+ | 4) $350+ | 5) $450",
    sizeIndicationNote: "Each size indicates a \"2 layers\" tier.",
    extrasDecorationsHeading: "EXTRAS / DECORATIONS",
    camouflageNoteExtras: "Camouflage Note: On slide 2 there is an alternate price if the cake is Camouflage. The \"+\" depends on the quantity requested. (The \"+\" depends on the amount)",
    customQuotePrompt: "Need a custom quote?",
    whatsappLabel: "WhatsApp:",
    callLabel: "Call:",

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
    success: "Success"
  }
};

export const getTranslation = (key: string, lang: string = 'es'): string => {
  const langTranslations = translations[lang as keyof typeof translations] || translations.es;
  return (langTranslations as any)[key] || key;
};
