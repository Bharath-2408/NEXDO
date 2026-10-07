/**
 * NEXDO Canonical Service Taxonomy
 * Standardized service identities across all languages (English, Tamil, Tanglish, Mixed)
 */

export type CanonicalServiceType =
  | 'AC_REPAIR'
  | 'AC_SERVICE'
  | 'AC_INSTALLATION'
  | 'ELECTRICAL'
  | 'ELECTRICIAN'
  | 'PLUMBING'
  | 'PLUMBER'
  | 'FAN_REPAIR'
  | 'REFRIGERATOR_REPAIR'
  | 'WASHING_MACHINE_REPAIR'
  | 'TV_REPAIR'
  | 'MICROWAVE_REPAIR'
  | 'GEYSER_REPAIR'
  | 'APPLIANCE_REPAIR'
  | 'CAR_REPAIR'
  | 'BIKE_REPAIR'
  | 'CLEANING'
  | 'GENERAL_HOME_MAINTENANCE';

export interface CanonicalServiceInfo {
  code: CanonicalServiceType;
  title: string;
  category: string;
  diagnosisFee: number;
  repairPriceNote: string;
  estimatedCostRange: string;
  defaultRole: string;
  names: {
    en: string;
    ta: string;
    'ta-en': string;
  };
}

export const CANONICAL_SERVICES: Record<CanonicalServiceType, CanonicalServiceInfo> = {
  AC_REPAIR: {
    code: 'AC_REPAIR',
    title: 'AC Diagnostics & Cooling Repair',
    category: 'HVAC & Cooling',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'AC technician',
    names: {
      en: 'AC technician / repair',
      ta: 'AC டெக்னீஷியன் / ரிப்பேர்',
      'ta-en': 'AC technician / repair',
    },
  },
  AC_SERVICE: {
    code: 'AC_SERVICE',
    title: 'AC Deep Cleaning & Foam Service',
    category: 'HVAC & Cooling',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'AC technician',
    names: {
      en: 'AC deep cleaning service',
      ta: 'AC சர்வீஸ்',
      'ta-en': 'AC service',
    },
  },
  AC_INSTALLATION: {
    code: 'AC_INSTALLATION',
    title: 'AC Installation & Uninstallation',
    category: 'HVAC & Cooling',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'AC installation specialist',
    names: {
      en: 'AC installation',
      ta: 'AC பொருத்துதல்',
      'ta-en': 'AC installation',
    },
  },
  ELECTRICAL: {
    code: 'ELECTRICAL',
    title: 'Electrical Wiring & Power Diagnostics',
    category: 'Electrical',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'electrician',
    names: {
      en: 'electrical service',
      ta: 'எலக்ட்ரிக்கல் வேலை',
      'ta-en': 'electrical work',
    },
  },
  ELECTRICIAN: {
    code: 'ELECTRICIAN',
    title: 'Verified Electrician Visit',
    category: 'Electrical',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'electrician',
    names: {
      en: 'electrician',
      ta: 'எலக்ட்ரீஷியன்',
      'ta-en': 'electrician',
    },
  },
  PLUMBING: {
    code: 'PLUMBING',
    title: 'Plumbing Leakage & Pipe Repair',
    category: 'Plumbing',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'plumber',
    names: {
      en: 'plumbing repair',
      ta: 'பிளம்பிங் வேலை',
      'ta-en': 'plumbing work',
    },
  },
  PLUMBER: {
    code: 'PLUMBER',
    title: 'Verified Plumber Visit',
    category: 'Plumbing',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'plumber',
    names: {
      en: 'plumber',
      ta: 'பிளம்பர்',
      'ta-en': 'plumber',
    },
  },
  FAN_REPAIR: {
    code: 'FAN_REPAIR',
    title: 'Ceiling Fan Repair & Regulator Replacement',
    category: 'Electrical',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'electrician',
    names: {
      en: 'ceiling fan repair',
      ta: 'ஃபேன் சர்வீஸ் / ரிப்பேர்',
      'ta-en': 'fan repair',
    },
  },
  REFRIGERATOR_REPAIR: {
    code: 'REFRIGERATOR_REPAIR',
    title: 'Refrigerator Cooling & Compressor Check',
    category: 'Appliances',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'appliance technician',
    names: {
      en: 'refrigerator repair',
      ta: 'பிரிட்ஜ் ரிப்பேர்',
      'ta-en': 'fridge repair',
    },
  },
  WASHING_MACHINE_REPAIR: {
    code: 'WASHING_MACHINE_REPAIR',
    title: 'Washing Machine Drum & Motor Diagnostics',
    category: 'Appliances',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'appliance technician',
    names: {
      en: 'washing machine repair',
      ta: 'வாஷிங் மெஷின் ரிப்பேர்',
      'ta-en': 'washing machine repair',
    },
  },
  TV_REPAIR: {
    code: 'TV_REPAIR',
    title: 'Television Display & Board Repair',
    category: 'Appliances',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'electronics technician',
    names: {
      en: 'TV repair',
      ta: 'டிவி ரிப்பேர்',
      'ta-en': 'TV repair',
    },
  },
  MICROWAVE_REPAIR: {
    code: 'MICROWAVE_REPAIR',
    title: 'Microwave Magnetron & Heating Repair',
    category: 'Appliances',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'appliance technician',
    names: {
      en: 'microwave repair',
      ta: 'மைக்ரோவேவ் ரிப்பேர்',
      'ta-en': 'microwave repair',
    },
  },
  GEYSER_REPAIR: {
    code: 'GEYSER_REPAIR',
    title: 'Water Heater & Geyser Element Replacement',
    category: 'Appliances',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'plumber / electrician',
    names: {
      en: 'geyser repair',
      ta: 'கீசர் ரிப்பேர்',
      'ta-en': 'geyser repair',
    },
  },
  APPLIANCE_REPAIR: {
    code: 'APPLIANCE_REPAIR',
    title: 'Home Appliance Diagnostics',
    category: 'Appliances',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'appliance technician',
    names: {
      en: 'home appliance repair',
      ta: 'வீட்டு உபயோகப் பொருட்கள் பழுது',
      'ta-en': 'appliance repair',
    },
  },
  CAR_REPAIR: {
    code: 'CAR_REPAIR',
    title: 'Car Diagnostics & Breakdown Support',
    category: 'Automotive',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'car mechanic',
    names: {
      en: 'car repair',
      ta: 'கார் மெக்கானிக்',
      'ta-en': 'car repair',
    },
  },
  BIKE_REPAIR: {
    code: 'BIKE_REPAIR',
    title: 'Two-Wheeler Starting & Quick Tuneup',
    category: 'Automotive',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'two-wheeler mechanic',
    names: {
      en: 'bike repair',
      ta: 'டூ-வீலர் மெக்கானிக்',
      'ta-en': 'bike repair',
    },
  },
  CLEANING: {
    code: 'CLEANING',
    title: 'Deep Home Cleaning & Sanitization',
    category: 'Cleaning',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'cleaning specialist',
    names: {
      en: 'home cleaning',
      ta: 'வீடு சுத்தம் செய்தல்',
      'ta-en': 'home cleaning',
    },
  },
  GENERAL_HOME_MAINTENANCE: {
    code: 'GENERAL_HOME_MAINTENANCE',
    title: 'General Home Maintenance',
    category: 'General Repair',
    diagnosisFee: 149,
    repairPriceNote: 'Decided after diagnosis',
    estimatedCostRange: 'Diagnosis Fee ₹149 (Repair price decided after diagnosis)',
    defaultRole: 'maintenance technician',
    names: {
      en: 'general home maintenance',
      ta: 'பொது வீட்டுப் பராமரிப்பு',
      'ta-en': 'general home maintenance',
    },
  },
};
