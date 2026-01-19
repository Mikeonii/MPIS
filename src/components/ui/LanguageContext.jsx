import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    accounts: "Accounts",
    pharmacies: "Pharmacies",
    settings: "Settings",
    logout: "Logout",
    
    // Dashboard
    totalAccounts: "Total Accounts",
    totalAssistance: "Total Assistance",
    totalPharmacies: "Pharmacies",
    assistedThisMonth: "Assisted This Month",
    assistedByBarangay: "Assisted Clients by Barangay",
    recentAssistance: "Recent Assistance",
    assistanceByType: "Assistance by Type",
    
    // Account Form
    accountInformation: "Account Information",
    personalInfo: "Personal Information",
    lastName: "Last Name",
    firstName: "First Name",
    middleName: "Middle Name",
    extensionName: "Extension Name",
    addressInfo: "Address Information",
    houseNumber: "House Number",
    street: "Street",
    purok: "Purok",
    barangay: "Barangay",
    cityMunicipality: "City/Municipality",
    district: "District",
    province: "Province",
    region: "Region",
    contactInfo: "Contact Information",
    mobileNumber: "Mobile Number",
    birthdate: "Birthdate",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    civilStatus: "Civil Status",
    single: "Single",
    married: "Married",
    widowed: "Widowed",
    separated: "Separated",
    divorced: "Divorced",
    occupation: "Occupation",
    monthlyIncome: "Monthly Income",
    
    // Representative
    representativeInfo: "Representative Information",
    sameAsAccountHolder: "Same as Account Holder",
    relationshipToHolder: "Relationship to Account Holder",
    
    // Beneficiary
    beneficiaryCategory: "Beneficiary Category",
    targetSector: "Target Sector",
    subCategory: "Sub Category",
    specifyOther: "Specify Other",
    
    // Family Composition
    familyComposition: "Family Composition",
    completeName: "Complete Name",
    relationship: "Relationship",
    addFamilyMember: "Add Family Member",
    
    // Assistance
    assistanceRendered: "Assistance Rendered",
    typeOfAssistance: "Type of Assistance",
    medical: "Medical",
    funeral: "Funeral",
    cashAssistance: "Cash Assistance",
    interviewedBy: "Interviewed & Approved By",
    amount: "Amount",
    pharmacyName: "Pharmacy Name",
    dateRendered: "Date Rendered",
    addAssistance: "Add Assistance",
    
    // Pharmacy
    pharmacyManagement: "Pharmacy Management",
    contactPerson: "Contact Person",
    contactNumber: "Contact Number",
    dateRegistered: "Date Registered",
    addPharmacy: "Add Pharmacy",
    
    // Actions
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    filter: "Filter",
    print: "Print",
    printGeneralIntake: "Print General Intake Sheet",
    printApplicationForm: "Print Application Form",
    register: "Register",
    newAccount: "New Account",
    viewDetails: "View Details",
    
    // Status
    active: "Active",
    inactive: "Inactive",
    status: "Status",
    
    // Messages
    confirmDelete: "Are you sure you want to delete this?",
    savedSuccessfully: "Saved successfully",
    deletedSuccessfully: "Deleted successfully",
    
    // Theme
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    english: "English",
    cebuano: "Cebuano",
    colorTheme: "Color Theme",
    
    // Years old
    yearsOld: "years old"
  },
  ceb: {
    // Navigation
    dashboard: "Dashboard",
    accounts: "Mga Account",
    pharmacies: "Mga Parmasya",
    settings: "Mga Setting",
    logout: "Gawas",
    
    // Dashboard
    totalAccounts: "Total nga Accounts",
    totalAssistance: "Total nga Tabang",
    totalPharmacies: "Mga Parmasya",
    assistedThisMonth: "Gitabangan Karong Bulan",
    assistedByBarangay: "Gitabangan nga Kliyente matag Barangay",
    recentAssistance: "Bag-ong Tabang",
    assistanceByType: "Tabang Matag Klase",
    
    // Account Form
    accountInformation: "Impormasyon sa Account",
    personalInfo: "Personal nga Impormasyon",
    lastName: "Apelyido",
    firstName: "Ngalan",
    middleName: "Tungatunga nga Ngalan",
    extensionName: "Extension nga Ngalan",
    addressInfo: "Impormasyon sa Address",
    houseNumber: "Numero sa Balay",
    street: "Dalan",
    purok: "Purok",
    barangay: "Barangay",
    cityMunicipality: "Syudad/Munisipyo",
    district: "Distrito",
    province: "Lalawigan",
    region: "Rehiyon",
    contactInfo: "Impormasyon sa Kontak",
    mobileNumber: "Numero sa Mobile",
    birthdate: "Adlaw sa Pagkatawo",
    age: "Edad",
    gender: "Kasarian",
    male: "Lalaki",
    female: "Babae",
    civilStatus: "Kahimtang Sibil",
    single: "Ulitawo/Dalaga",
    married: "Minyo",
    widowed: "Balo",
    separated: "Nagbulag",
    divorced: "Diborsyado",
    occupation: "Trabaho",
    monthlyIncome: "Binuwan nga Kita",
    
    // Representative
    representativeInfo: "Impormasyon sa Representante",
    sameAsAccountHolder: "Pareho sa Tag-iya sa Account",
    relationshipToHolder: "Relasyon sa Tag-iya sa Account",
    
    // Beneficiary
    beneficiaryCategory: "Kategorya sa Benepisyaryo",
    targetSector: "Target nga Sektor",
    subCategory: "Sub nga Kategorya",
    specifyOther: "Ispecify ang Uban",
    
    // Family Composition
    familyComposition: "Komposisyon sa Pamilya",
    completeName: "Kompleto nga Ngalan",
    relationship: "Relasyon",
    addFamilyMember: "Idugang ang Myembro sa Pamilya",
    
    // Assistance
    assistanceRendered: "Tabang nga Gihatag",
    typeOfAssistance: "Klase sa Tabang",
    medical: "Medikal",
    funeral: "Lubong",
    cashAssistance: "Cash nga Tabang",
    interviewedBy: "Gi-interview ug Gi-aprubahan Ni",
    amount: "Kantidad",
    pharmacyName: "Ngalan sa Parmasya",
    dateRendered: "Petsa nga Gihatag",
    addAssistance: "Idugang ang Tabang",
    
    // Pharmacy
    pharmacyManagement: "Pagdumala sa Parmasya",
    contactPerson: "Kontak nga Tawo",
    contactNumber: "Numero sa Kontak",
    dateRegistered: "Petsa sa Pag-rehistro",
    addPharmacy: "Idugang ang Parmasya",
    
    // Actions
    save: "I-save",
    cancel: "Kanselahon",
    edit: "I-edit",
    delete: "Tangtangon",
    search: "Pangita",
    filter: "Pagsala",
    print: "I-print",
    printGeneralIntake: "I-print ang General Intake Sheet",
    printApplicationForm: "I-print ang Application Form",
    register: "Irehistro",
    newAccount: "Bag-ong Account",
    viewDetails: "Tan-awon ang Detalye",
    
    // Status
    active: "Aktibo",
    inactive: "Dili Aktibo",
    status: "Kahimtang",
    
    // Messages
    confirmDelete: "Sigurado ka ba nga gusto nimo kini tangtangon?",
    savedSuccessfully: "Malampuson nga na-save",
    deletedSuccessfully: "Malampuson nga natangtang",
    
    // Theme
    theme: "Tema",
    lightMode: "Hayag nga Mode",
    darkMode: "Ngitngit nga Mode",
    language: "Pinulongan",
    english: "English",
    cebuano: "Cebuano",
    colorTheme: "Kolor sa Tema",
    
    // Years old
    yearsOld: "ka tuig"
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_language') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;