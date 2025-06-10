// infractions.ts

export interface InfractionType {
  id: number;
  code: string;
  type: string;
  icon: string;
  category: 'stationary' | 'moving';
}

export const infractionTypes: InfractionType[] = [
  { id: 1,  code: 'P0001', type: 'Expired Meter',           icon: 'clock-outline',               category: 'stationary' },
  { id: 2,  code: 'P0002', type: 'No Parking Zone',         icon: 'car-brake-parking',                 category: 'stationary' },
  { id: 3,  code: 'P0003', type: 'No Stopping Zone',        icon: 'stop-circle-outline',         category: 'stationary' },
  { id: 4,  code: 'P0004', type: 'No Standing Zone',        icon: 'swap-horizontal',             category: 'stationary' },
  { id: 5,  code: 'P0005', type: 'Tow-Away Zone',           icon: 'tow-truck',                   category: 'stationary' },
  { id: 6,  code: 'P0006', type: 'Handicapped Space',       icon: 'wheelchair-accessibility',    category: 'stationary' },
  { id: 7,  code: 'P0007', type: 'Fire Hydrant Blockage',   icon: 'fire-hydrant',                category: 'stationary' },
  { id: 8,  code: 'P0008', type: 'Bus Stop Obstruction',     icon: 'bus-stop',                    category: 'stationary' },
  { id: 9,  code: 'P0009', type: 'Crosswalk Blocking',      icon: 'walk',                        category: 'stationary' },
  { id: 10, code: 'P0010', type: 'Double Parking',          icon: 'car-multiple',                category: 'stationary' },
  { id: 11, code: 'P0011', type: 'Loading Zone Violation',  icon: 'truck-fast',                  category: 'stationary' },
  { id: 12, code: 'P0012', type: 'Overnight Parking Ban',   icon: 'weather-snowy',               category: 'stationary' },
  { id: 13, code: 'P0013', type: 'Residential Permit Only', icon: 'home-city-outline',           category: 'stationary' },
  { id: 14, code: 'P0014', type: 'Expired Registration',    icon: 'card-account-details',        category: 'stationary' },
  { id: 15, code: 'P0015', type: 'Blocked Driveway',        icon: 'garage',                      category: 'stationary' },

  { id: 16, code: 'P0016', type: 'Speeding',                icon: 'speedometer',                 category: 'moving'     },
  { id: 17, code: 'P0017', type: 'Red-Light Running',       icon: 'traffic-light',               category: 'moving'     },
  { id: 18, code: 'P0018', type: 'Stop-Sign Violation',     icon: 'hand-pointing-up',            category: 'moving'     },
  { id: 19, code: 'P0019', type: 'Illegal Turn',            icon: 'arrow-u-down-left',            category: 'moving'     },
  { id: 20, code: 'P0020', type: 'Failure to Yield',        icon: 'arrow-left-bold',             category: 'moving'     },
  { id: 21, code: 'P0021', type: 'Reckless Driving',        icon: 'speedometer-medium',          category: 'moving'     },
  { id: 22, code: 'P0022', type: 'Careless Driving',        icon: 'car-off',                     category: 'moving'     },
  { id: 23, code: 'P0023', type: 'Following Too Closely',   icon: 'car-multiple',               category: 'moving'     },
  { id: 24, code: 'P0024', type: 'Distracted Driving',      icon: 'cellphone-off',               category: 'moving'     },
  { id: 25, code: 'P0025', type: 'Seat-Belt Violation',      icon: 'seatbelt',                    category: 'moving'     },
  { id: 26, code: 'P0026', type: 'DUI / Impaired Driving',  icon: 'glass-cocktail-off',          category: 'moving'     },
  { id: 27, code: 'P0027', type: 'Expired Driver’s License',icon: 'card-account-details-outline',category: 'moving'     },
  { id: 28, code: 'P0028', type: 'No Insurance',            icon: 'card-bulleted-off-outline', category: 'moving'     },
  { id: 29, code: 'P0029', type: 'Obstructing Traffic',      icon: 'traffic-cone',                category: 'moving'     },
  { id: 30, code: 'P0030', type: 'Unsafe Lane Change',      icon: 'align-horizontal-distribute',                       category: 'moving'     },
  { id: 31, code: 'P0031', type: 'Illegal Use of HOV Lane', icon: 'cards-diamond-outline',                     category: 'moving'     },
  { id: 32, code: 'P0032', type: 'Blocking Intersection',    icon: 'gamepad',                      category: 'moving'     },
];
