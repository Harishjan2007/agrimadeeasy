export type Language = 'en' | 'ta';

export interface Translations {
  // Navigation & Header
  nav: {
    home: string;
    cropPrices: string;
    predictions: string;
    dealers: string;
    ecommerce: string;
    machinery: string;
    schemes: string;
    bookings: string;
    myBookings: string;
    profile: string;
    signIn: string;
    signUp: string;
    createAccount: string;
    signOut: string;
    dealerPortal: string;
    machineryHostPortal: string;
    machineryPortal: string;
    mandiDirectory: string;
    fleetCatalog: string;
    liveTickerAnnouncement: string;
    tagline: string;
    specializedPortals: string;
    switchLanguage: string;
    english: string;
    tamil: string;
  };

  // Common UI
  common: {
    brandName: string;
    search: string;
    searchPlaceholder: string;
    filter: string;
    all: string;
    loading: string;
    error: string;
    retry: string;
    viewAll: string;
    viewDetails: string;
    back: string;
    submit: string;
    submitting: string;
    cancel: string;
    saveChanges: string;
    saving: string;
    success: string;
    close: string;
    delete: string;
    verified: string;
    source: string;
    lastVerified: string;
    status: string;
    date: string;
    time: string;
    location: string;
    phone: string;
    email: string;
    name: string;
    address: string;
    price: string;
    unit: string;
    total: string;
    active: string;
    inactive: string;
    action: string;
    clearFilters: string;
    required: string;
    optional: string;
    noResults: string;
    rupeesPerQuintal: string;
    rupeesPerHour: string;
    rupeesPerDay: string;
  };

  // Home Page
  home: {
    heroBadge: string;
    heroTitlePrefix: string;
    heroTitleHighlight: string;
    heroTitleSuffix: string;
    heroDescription: string;
    explorePricesBtn: string;
    bookMachineryBtn: string;
    findDealersBtn: string;
    checkSchemesBtn: string;
    statsFarmers: string;
    statsMandis: string;
    statsAccuracy: string;
    statsSchemes: string;
    marketPricesTitle: string;
    marketPricesSubtitle: string;
    quickServicesTitle: string;
    quickServicesSubtitle: string;
    predictionsTitle: string;
    predictionsSubtitle: string;
    recommendationsTitle: string;
    recommendationsSubtitle: string;
    featuredDealersTitle: string;
    todayMarket: string;
    liveMandiPrices: string;
    updatedJustNow: string;
    viewPricePrediction: string;
    highDemand: string;
    topGainers: string;
  };

  // Crop Price Page
  cropPrices: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterByCategory: string;
    filterByMarket: string;
    sortBy: string;
    sortPriceHighLow: string;
    sortPriceLowHigh: string;
    sortRecent: string;
    sortCropName: string;
    calculatorTitle: string;
    calculatorSubtitle: string;
    selectCrop: string;
    enterQuantity: string;
    estimatedValue: string;
    quintals: string;
    noPricesFound: string;
    noPricesDescription: string;
    unableToLoad: string;
    currentRate: string;
    highestMandi: string;
    lowestMandi: string;
    stateAverage: string;
    mandiLocation: string;
  };

  // Predictions Page
  prediction: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    currentPrice: string;
    predictedRange: string;
    predictedMin: string;
    predictedMax: string;
    trend: string;
    predictionDate: string;
    predictionPeriod: string;
    expectedChange: string;
    confidenceHigh: string;
    confidenceMed: string;
    historicalAccuracy: string;
    noPredictionsFound: string;
    noPredictionsDescription: string;
    marketOutlook: string;
    increasing: string;
    decreasing: string;
    stable: string;
    aiRecommendation: string;
    recommendationHold: string;
    recommendationSell: string;
    recommendationNeutral: string;
  };

  // Dealers & Dealer Directory
  dealers: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    shopName: string;
    contactDealer: string;
    phone: string;
    address: string;
    openingHours: string;
    cropsWeBuy: string;
    buyingPrice: string;
    viewDealer: string;
    backToDealers: string;
    dealerNotFound: string;
    dealerNotFoundDesc: string;
    directBuyerBadge: string;
    inquireSale: string;
    inquireSaleModalTitle: string;
    inquireSaleModalDesc: string;
    farmerNameLabel: string;
    farmerPhoneLabel: string;
    quantityAvailable: string;
    messageLabel: string;
    submitInquiryBtn: string;
    inquirySuccess: string;
    noDealersFound: string;
    noDealersDescription: string;
  };

  // E-Commerce
  ecommerce: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    category: string;
    price: string;
    retailPrice: string;
    stock: string;
    available: string;
    outOfStock: string;
    buyNow: string;
    viewProduct: string;
    dealer: string;
    soldBy: string;
    allCategories: string;
    seeds: string;
    fertilizers: string;
    pesticides: string;
    tools: string;
    noProductsFound: string;
    noProductsDescription: string;
    productDetails: string;
    addToCart: string;
    inCart: string;
    cart: string;
    emptyCart: string;
    subtotal: string;
    checkout: string;
    orderPlaced: string;
    sellerInfo: string;
  };

  // Machinery & Rentals
  machinery: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allMachinery: string;
    tractor: string;
    paddyHarvester: string;
    powerTiller: string;
    rotavator: string;
    cultivator: string;
    other: string;
    rentalRate: string;
    perHour: string;
    perDay: string;
    location: string;
    provider: string;
    available: string;
    unavailable: string;
    bookNow: string;
    backToMachinery: string;
    noMachineryFound: string;
    specifications: string;
    operatorIncluded: string;
    fuelIncluded: string;
  };

  // Machinery Booking Modal
  booking: {
    modalTitle: string;
    modalSubtitle: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    duration: string;
    hours: string;
    days: string;
    totalAmount: string;
    fieldLocation: string;
    notes: string;
    requestBooking: string;
    submitting: string;
    bookingSubmitted: string;
    bookingSuccessMessage: string;
    signInPrompt: string;
    signInPromptDesc: string;
    fillAllFieldsError: string;
    invalidTimeError: string;
    viewMyBookings: string;
  };

  // My Bookings Page
  myBookings: {
    title: string;
    subtitle: string;
    bookingId: string;
    machineryDetails: string;
    bookingDate: string;
    bookingTime: string;
    totalAmount: string;
    status: string;
    noBookingsYet: string;
    noBookingsDesc: string;
    noBookings: string;
    noBookingsDescription: string;
    browseMachinery: string;
    browseMachineryBtn: string;
    statusPending: string;
    statusAccepted: string;
    statusRejected: string;
    statusCompleted: string;
    statusCancelled: string;
    contactProvider: string;
    cancelBooking: string;
    farmerAccountFeature: string;
    signedInAsRole: string;
    farmerFeatureNotice: string;
    backToMachinery: string;
    rentAnother: string;
    totalBookings: string;
    allBookings: string;
  };

  // Government Schemes
  schemes: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allSchemes: string;
    centralGovernment: string;
    centralGov: string;
    tamilNaduGovernment: string;
    stateGov: string;
    schemesCount: string;
    directIncomeSupport: string;
    machinerySubsidy: string;
    cropInsurance: string;
    creditLoans: string;
    irrigation: string;
    organicNaturalFarming: string;
    infrastructure: string;
    seedsPlantingMaterial: string;
    soilHealth: string;
    horticulture: string;
    farmerOrganizations: string;
    marketing: string;
    eligibility: string;
    benefits: string;
    applicationInfo: string;
    applicationProcess: string;
    officialInformation: string;
    officialWebsite: string;
    viewOfficialInfo: string;
    viewDetails: string;
    verifiedOfficial: string;
    authoritativeSource: string;
    lastVerifiedDate: string;
    noSchemesAvailable: string;
    noSchemesFound: string;
    noSchemesDesc: string;
    noSchemesDescription: string;
    modalTitle: string;
  };

  // Auth (Login / Signup)
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    loginTitle: string;
    loginSubtitle: string;
    loginButton: string;
    loginRequiredTitle: string;
    loginRequiredDescription: string;
    signUpTitle: string;
    signUpSubtitle: string;
    signupTitle: string;
    signupSubtitle: string;
    signupButton: string;
    signupLink: string;
    selectRole: string;
    signout: string;
    fullName: string;
    email: string;
    phone: string;
    location: string;
    password: string;
    confirmPassword: string;
    accountType: string;
    roleFarmer: string;
    roleFarmerDesc: string;
    roleDealer: string;
    roleDealerDesc: string;
    roleMachineryProvider: string;
    roleMachineryProviderDesc: string;
    pleaseSignIn: string;
    invalidEmail: string;
    incorrectPassword: string;
    passwordTooShort: string;
    accountCreatedSuccess: string;
    checkEmailVerification: string;
    signOutSuccess: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    signInBtn: string;
    createAccountBtn: string;
    loggingIn: string;
    signingUp: string;
  };

  // Profile
  profile: {
    title: string;
    subtitle: string;
    personalInfo: string;
    name: string;
    fullName: string;
    email: string;
    phone: string;
    location: string;
    accountType: string;
    role: string;
    memberSince: string;
    editProfile: string;
    saveChanges: string;
    saving: string;
    cancel: string;
    cancelEdit: string;
    profileUpdated: string;
    profileUpdatedSuccess: string;
    quickShortcuts: string;
    farmerRoleBadge: string;
    dealerRoleBadge: string;
    providerRoleBadge: string;
    loginRequiredTitle: string;
    loginRequiredDescription: string;
    loginButton: string;
    signupTitle: string;
  };

  // Dealer Dashboard / Portal
  dealerPortal: {
    title: string;
    subtitle: string;
    welcomeBadge: string;
    featuresTitle: string;
    feature1: string;
    feature2: string;
    feature3: string;
    browseDealers: string;
    viewMarketplace: string;
    shopDetails: string;
    editShopInfo: string;
    activeProcurementList: string;
    addCropRate: string;
    cropName: string;
    buyingPrice: string;
    unit: string;
    status: string;
    updateRate: string;
    inquiriesReceived: string;
  };

  // Machinery Provider Dashboard / Portal
  providerPortal: {
    title: string;
    subtitle: string;
    welcomeBadge: string;
    featuresTitle: string;
    feature1: string;
    feature2: string;
    feature3: string;
    browseCatalog: string;
    manageProfile: string;
    fleetManagement: string;
    addNewMachine: string;
    bookingRequests: string;
    pendingRequests: string;
    acceptBooking: string;
    rejectBooking: string;
    markCompleted: string;
    hourlyRate: string;
    availabilityStatus: string;
  };

  // Crop Name Translations (Display helper)
  crops: {
    paddy: string;
    groundnut: string;
    maize: string;
    cotton: string;
    tomato: string;
    onion: string;
    sugarcane: string;
    turmeric: string;
    banana: string;
    wheat: string;
    soybean: string;
    chilli: string;
    potato: string;
    coconut: string;
  };
}
