import { Capability } from '../types/account';

export interface ServiceDomain {
  id: string;
  code: string;
  name: string;
  nameTamil: string;
  description: string;
  category: string;
  iconName: string;
}

export const SERVICE_DOMAINS: ServiceDomain[] = [
  {
    id: 'domain_electrical',
    code: 'ELECTRICAL',
    name: 'Electrical',
    nameTamil: 'மின்சார வேலைகள்',
    description: 'Wiring, MCB switches, ceiling & exhaust fan repair, lighting, and inverter setup.',
    category: 'Electrical',
    iconName: 'Zap',
  },
  {
    id: 'domain_plumbing',
    code: 'PLUMBING',
    name: 'Plumbing',
    nameTamil: 'பிளம்பிங் மற்றும் குழாய்',
    description: 'Pipe leaks, taps, sanitary fittings, water motor installations, and drainage repairs.',
    category: 'Plumbing',
    iconName: 'Droplet',
  },
  {
    id: 'domain_ac_appliances',
    code: 'AC_APPLIANCE_REPAIR',
    name: 'AC & Appliance Repair',
    nameTamil: 'ஏசி & வீட்டு உபகரணங்கள்',
    description: 'AC servicing, gas refilling, refrigerator, washing machine, and microwave repairs.',
    category: 'Appliances & Cooling',
    iconName: 'Wrench',
  },
  {
    id: 'domain_cleaning',
    code: 'CLEANING_HOME_MAINTENANCE',
    name: 'Cleaning & Home Maintenance',
    nameTamil: 'வீடு சுத்தம் மற்றும் பராமரிப்பு',
    description: 'Deep home cleaning, bathroom sanitization, painting, pest control, and handyman maintenance.',
    category: 'Home Care',
    iconName: 'Sparkles',
  },
  {
    id: 'domain_beauty',
    code: 'BEAUTY_SALON',
    name: 'Beauty & Salon',
    nameTamil: 'பியூட்டி & சலூன்',
    description: 'Doorstep haircuts, personal grooming, styling, facials, and wellness treatments.',
    category: 'Personal Care',
    iconName: 'Scissors',
  },
  {
    id: 'domain_transport',
    code: 'TRANSPORT_CAB',
    name: 'Transport & Cab',
    nameTamil: 'போக்குவரத்து & கேப்',
    description: 'On-demand rides, driver services, vehicle breakdown help, and point-to-point transit.',
    category: 'Transportation',
    iconName: 'Car',
  },
  {
    id: 'domain_food',
    code: 'FOOD_GROCERY',
    name: 'Food & Grocery',
    nameTamil: 'உணவு & மளிகை',
    description: 'Fresh groceries delivery, meal pickup, essential provisions, and quick delivery.',
    category: 'Delivery',
    iconName: 'ShoppingBag',
  },
  {
    id: 'domain_personal',
    code: 'PERSONAL_ASSISTANCE',
    name: 'Personal Assistance',
    nameTamil: 'தனிப்பட்ட உதவி',
    description: 'Elderly assistance, essential errand running, document pickup, and companion coordination.',
    category: 'Assistance',
    iconName: 'HeartHandshake',
  },
  {
    id: 'domain_other',
    code: 'OTHER',
    name: 'Other',
    nameTamil: 'இதர சேவைகள்',
    description: 'Custom doorstep assistance and household coordination tailored to individual needs.',
    category: 'General',
    iconName: 'MoreHorizontal',
  },
];

export const ALL_AVAILABLE_CAPABILITIES: Omit<Capability, 'active' | 'experienceLevel' | 'isCertified'>[] = [
  // AC & Appliance Repair
  { id: 'cap_ac_rep', code: 'AC_REPAIR', name: 'AC Repair & Diagnostics', category: 'AC & Appliance Repair' },
  { id: 'cap_ac_srv', code: 'AC_SERVICE', name: 'AC Deep Cleaning & Gas Refill', category: 'AC & Appliance Repair' },
  { id: 'cap_fridge', code: 'REFRIGERATOR_REPAIR', name: 'Refrigerator Gas & Cooling Fix', category: 'AC & Appliance Repair' },
  { id: 'cap_wm', code: 'WASHING_MACHINE', name: 'Washing Machine Drum & Motor', category: 'AC & Appliance Repair' },
  { id: 'cap_ro', code: 'RO_PURIFIER', name: 'RO Water Filter & Membrane Service', category: 'AC & Appliance Repair' },
  { id: 'cap_tv', code: 'TV_INSTALLATION', name: 'Smart TV Wall Mount & Setup', category: 'AC & Appliance Repair' },

  // Electrical
  { id: 'cap_fan_rep', code: 'FAN_REPAIR', name: 'Ceiling & Exhaust Fan Repair', category: 'Electrical' },
  { id: 'cap_elec_gen', code: 'ELECTRICAL_WORK', name: 'Wiring, MCB & Switchboard Work', category: 'Electrical' },

  // Plumbing
  { id: 'cap_plumb', code: 'PLUMBING_LEAK', name: 'Plumbing, Taps & Pipe Leakage', category: 'Plumbing' },
  { id: 'cap_motor', code: 'WATER_MOTOR', name: 'Water Motor & Pump Installation', category: 'Plumbing' },

  // Cleaning & Home Maintenance
  { id: 'cap_clean', code: 'HOME_CLEANING', name: 'Deep Home Cleaning & Sanitization', category: 'Cleaning & Home Maintenance' },
  { id: 'cap_paint', code: 'PAINTING', name: 'Wall Touchup & Waterproofing', category: 'Cleaning & Home Maintenance' },

  // Beauty & Salon
  { id: 'cap_beauty', code: 'BEAUTY_SALON', name: 'Haircut & Doorstep Salon Care', category: 'Beauty & Salon' },

  // Transport & Cab
  { id: 'cap_transport', code: 'TRANSPORT_CAB', name: 'Local Rides & Driver Assistance', category: 'Transport & Cab' },
  { id: 'cap_bike', code: 'BIKE_REPAIR', name: 'Two-Wheeler Service & Starting Fix', category: 'Transport & Cab' },
  { id: 'cap_car', code: 'CAR_MECHANIC', name: 'Car Battery & Minor Mechanical Fix', category: 'Transport & Cab' },

  // Food & Grocery
  { id: 'cap_food', code: 'FOOD_GROCERY', name: 'Grocery & Food Delivery Assistance', category: 'Food & Grocery' },

  // Personal Assistance
  { id: 'cap_assist', code: 'PERSONAL_ASSISTANCE', name: 'Personal Errands & Care Assistance', category: 'Personal Assistance' },

  // Other
  { id: 'cap_other', code: 'OTHER', name: 'General Handyman & Custom Tasks', category: 'Other' },
];
