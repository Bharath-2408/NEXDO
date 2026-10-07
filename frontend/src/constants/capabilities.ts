import { Capability } from '../types/account';

export const ALL_AVAILABLE_CAPABILITIES: Omit<Capability, 'active' | 'experienceLevel' | 'isCertified'>[] = [
  { id: 'cap_ac_rep', code: 'AC_REPAIR', name: 'AC Repair & Diagnostics', category: 'HVAC & Cooling' },
  { id: 'cap_ac_srv', code: 'AC_SERVICE', name: 'AC Deep Cleaning & Gas Refill', category: 'HVAC & Cooling' },
  { id: 'cap_fan_rep', code: 'FAN_REPAIR', name: 'Ceiling & Exhaust Fan Repair', category: 'Electrical' },
  { id: 'cap_elec_gen', code: 'ELECTRICAL_WORK', name: 'Wiring, MCB & Switchboard Work', category: 'Electrical' },
  { id: 'cap_fridge', code: 'REFRIGERATOR_REPAIR', name: 'Refrigerator Gas & Cooling Fix', category: 'Appliances' },
  { id: 'cap_wm', code: 'WASHING_MACHINE', name: 'Washing Machine Drum & Motor', category: 'Appliances' },
  { id: 'cap_ro', code: 'RO_PURIFIER', name: 'RO Water Filter & Membrane Service', category: 'Appliances' },
  { id: 'cap_plumb', code: 'PLUMBING_LEAK', name: 'Plumbing, Taps & Pipe Leakage', category: 'Plumbing' },
  { id: 'cap_bike', code: 'BIKE_REPAIR', name: 'Two-Wheeler Service & Starting Fix', category: 'Automotive' },
  { id: 'cap_car', code: 'CAR_MECHANIC', name: 'Car Battery & Minor Mechanical Fix', category: 'Automotive' },
  { id: 'cap_tv', code: 'TV_INSTALLATION', name: 'Smart TV Wall Mount & Setup', category: 'Electronics' },
  { id: 'cap_paint', code: 'PAINTING', name: 'Wall Touchup & Waterproofing', category: 'Home Care' },
];
