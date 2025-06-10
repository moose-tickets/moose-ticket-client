// ticket.ts

import { infractionTypes, InfractionType } from './infractionTypes';

// --- 1. TypeScript Interfaces ---

export interface Infraction {
  id: number;
  code: string;
  type: string;
  description: string;
  icon: string;
  category: 'stationary' | 'moving';
}

export interface Vehicle {
  plate: string;
  province: string;
  make: string;
  model: string;
  color: string;
}

export interface Address {
  street: string;
  city: string;
  postal_code: string;
}

export interface Contact {
  email: string;
  phone: string;
}

export interface Owner {
  name: string;
  address: Address;
  contact: Contact;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  street: string;
  between: [string, string];
  coordinates: Coordinates;
}

export interface EarlyPaymentDiscount {
  amount: number;
  deadline: string;  // YYYY-MM-DD
}

export interface LatePaymentPenalty {
  percentage: number;
  after_date: string; // YYYY-MM-DD
}

export interface Fine {
  amount: number;
  currency: string;
  early_payment_discount: EarlyPaymentDiscount;
  late_payment_penalty: LatePaymentPenalty;
}

export interface PaymentHistoryEntry {
  date: string; // YYYY-MM-DD
  amount: number;
  type: string;
  transaction_id: string;
}

export interface Dispute {
  is_disputed: boolean;
  dispute_date: string | null;
  outcome: string | null;
}

export interface Enforcement {
  officer_id: string;
  agency: string;
  notes: string;
}

export interface Links {
  pay_url: string;
  dispute_url: string;
}

export interface Ticket {
  ticket_id: string;
  issue_date: string;   // ISO 8601
  infraction: Infraction;
  vehicle: Vehicle;
  owner: Owner;
  location: Location;
  fine: Fine;
  status: 'Outstanding' | 'Paid' | 'Cancelled' | 'Disputed';
  due_date: string;     // YYYY-MM-DD
  payment_history: PaymentHistoryEntry[];
  dispute: Dispute;
  enforcement: Enforcement;
  links: Links;
}

// --- 2. Random Data Generator ---

// const rnd = (min: number, max: number) =>
//   Math.floor(Math.random() * (max - min + 1)) + min;

// const pick = <T>(arr: T[]): T =>
//   arr[Math.floor(Math.random() * arr.length)];

// const pad = (n: number, width = 2) =>
//   n.toString().padStart(width, '0');

// const randomDate = (start: Date, end: Date): string => {
//   const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//   return d.toISOString();
// };

// function generateRandomTicket(): Ticket {
//   // Issue date within last week
//   const issueDate = randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
//   // Due date 30 days after issue
//   const dueObj = new Date(issueDate);
//   dueObj.setDate(dueObj.getDate() + 30);
//   const dueDate = `${dueObj.getFullYear()}-${pad(dueObj.getMonth() + 1)}-${pad(dueObj.getDate())}`;

//   // Pick a random infraction
//   const inf: InfractionType = pick(infractionTypes);

//   // Fine amounts
//   const fineAmount = rnd(40, 120);
//   const earlyDisc = rnd(10, 20);
//   const latePct = rnd(5, 15);

//   return {
//     ticket_id: `TTC-${issueDate.slice(0, 10).replace(/-/g, '')}-${pad(rnd(0, 23))}${pad(rnd(0, 59))}${pad(rnd(0, 59))}`,
//     issue_date: issueDate,
//     infraction: {
//       id: inf.id,
//       code: inf.code,
//       type: inf.type,
//       description: inf.type,
//       icon: inf.icon,
//       category: inf.category
//     },
//     vehicle: {
//       plate: `${pick(['ABC', 'DEF', 'GHI', 'JKL'])}${rnd(1000, 9999)}`,
//       province: pick(['ON', 'QC', 'BC', 'AB']),
//       make: pick(['Honda', 'Toyota', 'Ford', 'Chevrolet', 'Nissan']),
//       model: pick(['Civic', 'Corolla', 'F-150', 'Spark', 'Altima']),
//       color: pick(['Blue', 'Red', 'Black', 'White', 'Silver'])
//     },
//     owner: {
//       name: `User ${rnd(100, 999)}`,
//       address: {
//         street: `${rnd(1, 999)} ${pick(['King St W', 'Queen St E', 'Bloor St W', 'Yonge St', 'Dundas St'])}`,
//         city: 'Toronto',
//         postal_code: `${pick(['M5H','M4B','M6K'])} ${rnd(1,9)}${pick('ABCD'.split(''))}${rnd(1,9)}`
//       },
//       contact: {
//         email: `user${rnd(1000, 9999)}@example.com`,
//         phone: `(416) ${pad(rnd(100, 999))}-${pad(rnd(1000, 9999), 4)}`
//       }
//     },
//     location: {
//       street: pick(['King St W', 'Queen St E', 'Bloor St W', 'Yonge St', 'Dundas St']),
//       between: [pick(['Yonge St','Bay St','Bayview Ave','Parliament St','Spadina Ave']),
//                 pick(['Yonge St','Bay St','Bayview Ave','Parliament St','Spadina Ave'])],
//       coordinates: {
//         lat: 43.65 + Math.random() * 0.02,
//         lng: -79.38 + Math.random() * 0.02
//       }
//     },
//     fine: {
//       amount: fineAmount,
//       currency: 'CAD',
//       early_payment_discount: {
//         amount: earlyDisc,
//         deadline: dueDate
//       },
//       late_payment_penalty: {
//         percentage: latePct,
//         after_date: dueDate
//       }
//     },
//     status: pick(['Outstanding', 'Paid', 'Disputed']),
//     due_date: dueDate,
//     payment_history: Math.random() < 0.5
//       ? [{
//           date: dueDate,
//           amount: earlyDisc,
//           type: 'Early Payment Discount',
//           transaction_id: `PAY-${dueDate.replace(/-/g, '')}-${rnd(1000, 9999)}`
//         }]
//       : [],
//     dispute: {
//       is_disputed: false,
//       dispute_date: null,
//       outcome: null
//     },
//     enforcement: {
//       officer_id: pick(['OFF-1001','OFF-4521','OFF-7833','OFF-2244']),
//       agency: 'Toronto Parking Enforcement',
//       notes: 'Automatically generated test record.'
//     },
//     links: {
//       pay_url: '',
//       dispute_url: ''
//     }
//   };
// }


// export function generateRandomTickets(count: number): Ticket[] {
//   const tickets =  Array.from({ length: count }, () => generateRandomTicket());
//   // console.log(tickets)
//   return [...allTickets,...tickets];

//}


export const allTickets: Ticket[] = [
    {
        "ticket_id": "TTC-20250602-140439",
        "issue_date": "2025-06-02T03:26:11.390Z",
        "infraction": {
            "id": 5,
            "code": "P0005",
            "type": "Tow-Away Zone",
            "description": "Tow-Away Zone",
            "icon": "tow-truck",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "GHI9031",
            "province": "BC",
            "make": "Toyota",
            "model": "Altima",
            "color": "Blue"
        },
        "owner": {
            "name": "User 684",
            "address": {
                "street": "790 Yonge St",
                "city": "Toronto",
                "postal_code": "M4B 4D4"
            },
            "contact": {
                "email": "user4195@example.com",
                "phone": "(416) 213-3003"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Bay St",
                "Bayview Ave"
            ],
            "coordinates": {
                "lat": 43.664818598046374,
                "lng": -79.37270680902023
            }
        },
        "fine": {
            "amount": 69,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 19,
                "deadline": "2025-07-01"
            },
            "late_payment_penalty": {
                "percentage": 9,
                "after_date": "2025-07-01"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-01",
        "payment_history": [
            {
                "date": "2025-07-01",
                "amount": 19,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250701-3167"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-2244",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250605-050345",
        "issue_date": "2025-06-05T18:18:03.452Z",
        "infraction": {
            "id": 31,
            "code": "P0031",
            "type": "Illegal Use of HOV Lane",
            "description": "Illegal Use of HOV Lane",
            "icon": "cards-diamond-outline",
            "category": "moving"
        },
        "vehicle": {
            "plate": "DEF9136",
            "province": "BC",
            "make": "Chevrolet",
            "model": "Spark",
            "color": "Silver"
        },
        "owner": {
            "name": "User 516",
            "address": {
                "street": "236 King St W",
                "city": "Toronto",
                "postal_code": "M5H 9D8"
            },
            "contact": {
                "email": "user6968@example.com",
                "phone": "(416) 151-3899"
            }
        },
        "location": {
            "street": "Queen St E",
            "between": [
                "Bayview Ave",
                "Parliament St"
            ],
            "coordinates": {
                "lat": 43.666223796301175,
                "lng": -79.36536405511866
            }
        },
        "fine": {
            "amount": 69,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 13,
                "deadline": "2025-07-05"
            },
            "late_payment_penalty": {
                "percentage": 9,
                "after_date": "2025-07-05"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-05",
        "payment_history": [
            {
                "date": "2025-07-05",
                "amount": 13,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250705-6223"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250603-142905",
        "issue_date": "2025-06-03T12:31:39.875Z",
        "infraction": {
            "id": 3,
            "code": "P0003",
            "type": "No Stopping Zone",
            "description": "No Stopping Zone",
            "icon": "stop-circle-outline",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "JKL1907",
            "province": "AB",
            "make": "Chevrolet",
            "model": "Altima",
            "color": "Silver"
        },
        "owner": {
            "name": "User 408",
            "address": {
                "street": "631 King St W",
                "city": "Toronto",
                "postal_code": "M6K 5D9"
            },
            "contact": {
                "email": "user2342@example.com",
                "phone": "(416) 195-9601"
            }
        },
        "location": {
            "street": "King St W",
            "between": [
                "Bay St",
                "Spadina Ave"
            ],
            "coordinates": {
                "lat": 43.666528360225,
                "lng": -79.37765629162585
            }
        },
        "fine": {
            "amount": 92,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 16,
                "deadline": "2025-07-03"
            },
            "late_payment_penalty": {
                "percentage": 10,
                "after_date": "2025-07-03"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-03",
        "payment_history": [
            {
                "date": "2025-07-03",
                "amount": 16,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250703-6119"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250606-203741",
        "issue_date": "2025-06-06T22:34:02.456Z",
        "infraction": {
            "id": 11,
            "code": "P0011",
            "type": "Loading Zone Violation",
            "description": "Loading Zone Violation",
            "icon": "truck-fast",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "DEF9190",
            "province": "AB",
            "make": "Honda",
            "model": "Altima",
            "color": "Silver"
        },
        "owner": {
            "name": "User 944",
            "address": {
                "street": "13 Bloor St W",
                "city": "Toronto",
                "postal_code": "M6K 5B6"
            },
            "contact": {
                "email": "user6455@example.com",
                "phone": "(416) 242-3505"
            }
        },
        "location": {
            "street": "King St W",
            "between": [
                "Yonge St",
                "Bay St"
            ],
            "coordinates": {
                "lat": 43.661177648372,
                "lng": -79.36671636329763
            }
        },
        "fine": {
            "amount": 108,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 12,
                "deadline": "2025-07-06"
            },
            "late_payment_penalty": {
                "percentage": 15,
                "after_date": "2025-07-06"
            }
        },
        "status": "Disputed",
        "due_date": "2025-07-06",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-2244",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250605-045731",
        "issue_date": "2025-06-05T17:23:50.468Z",
        "infraction": {
            "id": 12,
            "code": "P0012",
            "type": "Overnight Parking Ban",
            "description": "Overnight Parking Ban",
            "icon": "weather-snowy",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "ABC5118",
            "province": "AB",
            "make": "Chevrolet",
            "model": "Spark",
            "color": "Red"
        },
        "owner": {
            "name": "User 272",
            "address": {
                "street": "320 Bloor St W",
                "city": "Toronto",
                "postal_code": "M4B 2B8"
            },
            "contact": {
                "email": "user5114@example.com",
                "phone": "(416) 306-3530"
            }
        },
        "location": {
            "street": "Queen St E",
            "between": [
                "Bay St",
                "Bay St"
            ],
            "coordinates": {
                "lat": 43.66850034107693,
                "lng": -79.37581242121016
            }
        },
        "fine": {
            "amount": 60,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 13,
                "deadline": "2025-07-05"
            },
            "late_payment_penalty": {
                "percentage": 7,
                "after_date": "2025-07-05"
            }
        },
        "status": "Disputed",
        "due_date": "2025-07-05",
        "payment_history": [
            {
                "date": "2025-07-05",
                "amount": 13,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250705-1960"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250605-155802",
        "issue_date": "2025-06-05T20:28:54.004Z",
        "infraction": {
            "id": 12,
            "code": "P0012",
            "type": "Overnight Parking Ban",
            "description": "Overnight Parking Ban",
            "icon": "weather-snowy",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "GHI8492",
            "province": "AB",
            "make": "Ford",
            "model": "F-150",
            "color": "Black"
        },
        "owner": {
            "name": "User 405",
            "address": {
                "street": "231 Dundas St",
                "city": "Toronto",
                "postal_code": "M4B 1A6"
            },
            "contact": {
                "email": "user1790@example.com",
                "phone": "(416) 482-7150"
            }
        },
        "location": {
            "street": "Bloor St W",
            "between": [
                "Spadina Ave",
                "Bayview Ave"
            ],
            "coordinates": {
                "lat": 43.66997183926325,
                "lng": -79.37605120744576
            }
        },
        "fine": {
            "amount": 63,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 17,
                "deadline": "2025-07-05"
            },
            "late_payment_penalty": {
                "percentage": 11,
                "after_date": "2025-07-05"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-05",
        "payment_history": [
            {
                "date": "2025-07-05",
                "amount": 17,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250705-5457"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-4521",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250606-220919",
        "issue_date": "2025-06-06T03:13:49.946Z",
        "infraction": {
            "id": 5,
            "code": "P0005",
            "type": "Tow-Away Zone",
            "description": "Tow-Away Zone",
            "icon": "tow-truck",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "GHI6512",
            "province": "ON",
            "make": "Toyota",
            "model": "Civic",
            "color": "Blue"
        },
        "owner": {
            "name": "User 507",
            "address": {
                "street": "204 Dundas St",
                "city": "Toronto",
                "postal_code": "M4B 1B4"
            },
            "contact": {
                "email": "user4202@example.com",
                "phone": "(416) 382-1231"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Parliament St",
                "Bay St"
            ],
            "coordinates": {
                "lat": 43.65148327849455,
                "lng": -79.36721165525027
            }
        },
        "fine": {
            "amount": 117,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 18,
                "deadline": "2025-07-05"
            },
            "late_payment_penalty": {
                "percentage": 14,
                "after_date": "2025-07-05"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-05",
        "payment_history": [
            {
                "date": "2025-07-05",
                "amount": 18,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250705-8041"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250602-091344",
        "issue_date": "2025-06-02T22:40:34.150Z",
        "infraction": {
            "id": 19,
            "code": "P0019",
            "type": "Illegal Turn",
            "description": "Illegal Turn",
            "icon": "arrow-u-down-left",
            "category": "moving"
        },
        "vehicle": {
            "plate": "GHI7040",
            "province": "BC",
            "make": "Honda",
            "model": "Altima",
            "color": "Red"
        },
        "owner": {
            "name": "User 911",
            "address": {
                "street": "134 King St W",
                "city": "Toronto",
                "postal_code": "M4B 7D1"
            },
            "contact": {
                "email": "user5161@example.com",
                "phone": "(416) 942-3186"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Bayview Ave",
                "Parliament St"
            ],
            "coordinates": {
                "lat": 43.66181965411062,
                "lng": -79.36044782609919
            }
        },
        "fine": {
            "amount": 114,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 11,
                "deadline": "2025-07-02"
            },
            "late_payment_penalty": {
                "percentage": 8,
                "after_date": "2025-07-02"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-02",
        "payment_history": [
            {
                "date": "2025-07-02",
                "amount": 11,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250702-1864"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-4521",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250604-142507",
        "issue_date": "2025-06-04T15:11:26.440Z",
        "infraction": {
            "id": 3,
            "code": "P0003",
            "type": "No Stopping Zone",
            "description": "No Stopping Zone",
            "icon": "stop-circle-outline",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "DEF8221",
            "province": "QC",
            "make": "Nissan",
            "model": "Altima",
            "color": "Blue"
        },
        "owner": {
            "name": "User 869",
            "address": {
                "street": "866 Bloor St W",
                "city": "Toronto",
                "postal_code": "M5H 8A9"
            },
            "contact": {
                "email": "user5909@example.com",
                "phone": "(416) 580-3960"
            }
        },
        "location": {
            "street": "Bloor St W",
            "between": [
                "Bayview Ave",
                "Bay St"
            ],
            "coordinates": {
                "lat": 43.660745498598835,
                "lng": -79.36215939037974
            }
        },
        "fine": {
            "amount": 118,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 12,
                "deadline": "2025-07-04"
            },
            "late_payment_penalty": {
                "percentage": 11,
                "after_date": "2025-07-04"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-04",
        "payment_history": [
            {
                "date": "2025-07-04",
                "amount": 12,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250704-5781"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-7833",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250604-174216",
        "issue_date": "2025-06-04T14:29:58.411Z",
        "infraction": {
            "id": 2,
            "code": "P0002",
            "type": "No Parking Zone",
            "description": "No Parking Zone",
            "icon": "car-brake-parking",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "JKL9366",
            "province": "ON",
            "make": "Honda",
            "model": "Altima",
            "color": "Blue"
        },
        "owner": {
            "name": "User 892",
            "address": {
                "street": "794 Yonge St",
                "city": "Toronto",
                "postal_code": "M5H 2C9"
            },
            "contact": {
                "email": "user4866@example.com",
                "phone": "(416) 293-3450"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Yonge St",
                "Bayview Ave"
            ],
            "coordinates": {
                "lat": 43.664194751140535,
                "lng": -79.36951324909782
            }
        },
        "fine": {
            "amount": 88,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 12,
                "deadline": "2025-07-04"
            },
            "late_payment_penalty": {
                "percentage": 11,
                "after_date": "2025-07-04"
            }
        },
        "status": "Disputed",
        "due_date": "2025-07-04",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-7833",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250607-015600",
        "issue_date": "2025-06-07T23:46:41.520Z",
        "infraction": {
            "id": 9,
            "code": "P0009",
            "type": "Crosswalk Blocking",
            "description": "Crosswalk Blocking",
            "icon": "walk",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "DEF4309",
            "province": "AB",
            "make": "Toyota",
            "model": "Corolla",
            "color": "White"
        },
        "owner": {
            "name": "User 292",
            "address": {
                "street": "665 Dundas St",
                "city": "Toronto",
                "postal_code": "M4B 9D6"
            },
            "contact": {
                "email": "user2094@example.com",
                "phone": "(416) 115-9081"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Yonge St",
                "Spadina Ave"
            ],
            "coordinates": {
                "lat": 43.66499346633377,
                "lng": -79.37696357281304
            }
        },
        "fine": {
            "amount": 54,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 15,
                "deadline": "2025-07-07"
            },
            "late_payment_penalty": {
                "percentage": 6,
                "after_date": "2025-07-07"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-07",
        "payment_history": [
            {
                "date": "2025-07-07",
                "amount": 15,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250707-5908"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250608-214343",
        "issue_date": "2025-06-08T02:09:01.642Z",
        "infraction": {
            "id": 20,
            "code": "P0020",
            "type": "Failure to Yield",
            "description": "Failure to Yield",
            "icon": "arrow-left-bold",
            "category": "moving"
        },
        "vehicle": {
            "plate": "GHI7729",
            "province": "BC",
            "make": "Chevrolet",
            "model": "F-150",
            "color": "White"
        },
        "owner": {
            "name": "User 724",
            "address": {
                "street": "71 King St W",
                "city": "Toronto",
                "postal_code": "M4B 5C1"
            },
            "contact": {
                "email": "user8043@example.com",
                "phone": "(416) 803-5678"
            }
        },
        "location": {
            "street": "Bloor St W",
            "between": [
                "Bay St",
                "Parliament St"
            ],
            "coordinates": {
                "lat": 43.65356495137238,
                "lng": -79.36091440717277
            }
        },
        "fine": {
            "amount": 102,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 14,
                "deadline": "2025-07-07"
            },
            "late_payment_penalty": {
                "percentage": 8,
                "after_date": "2025-07-07"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-07",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-2244",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250604-134420",
        "issue_date": "2025-06-04T18:38:32.291Z",
        "infraction": {
            "id": 15,
            "code": "P0015",
            "type": "Blocked Driveway",
            "description": "Blocked Driveway",
            "icon": "garage",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "DEF5784",
            "province": "BC",
            "make": "Ford",
            "model": "Altima",
            "color": "Red"
        },
        "owner": {
            "name": "User 397",
            "address": {
                "street": "691 Yonge St",
                "city": "Toronto",
                "postal_code": "M4B 5C7"
            },
            "contact": {
                "email": "user5675@example.com",
                "phone": "(416) 499-5099"
            }
        },
        "location": {
            "street": "Yonge St",
            "between": [
                "Bay St",
                "Spadina Ave"
            ],
            "coordinates": {
                "lat": 43.664322015743835,
                "lng": -79.37940742841239
            }
        },
        "fine": {
            "amount": 72,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 10,
                "deadline": "2025-07-04"
            },
            "late_payment_penalty": {
                "percentage": 13,
                "after_date": "2025-07-04"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-04",
        "payment_history": [
            {
                "date": "2025-07-04",
                "amount": 10,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250704-2585"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250603-061624",
        "issue_date": "2025-06-03T22:17:54.037Z",
        "infraction": {
            "id": 14,
            "code": "P0014",
            "type": "Expired Registration",
            "description": "Expired Registration",
            "icon": "card-account-details",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "JKL6634",
            "province": "ON",
            "make": "Toyota",
            "model": "F-150",
            "color": "Silver"
        },
        "owner": {
            "name": "User 429",
            "address": {
                "street": "56 Queen St E",
                "city": "Toronto",
                "postal_code": "M4B 2B7"
            },
            "contact": {
                "email": "user1823@example.com",
                "phone": "(416) 217-1595"
            }
        },
        "location": {
            "street": "Queen St E",
            "between": [
                "Spadina Ave",
                "Parliament St"
            ],
            "coordinates": {
                "lat": 43.650814634005364,
                "lng": -79.36253926155555
            }
        },
        "fine": {
            "amount": 102,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 15,
                "deadline": "2025-07-03"
            },
            "late_payment_penalty": {
                "percentage": 5,
                "after_date": "2025-07-03"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-03",
        "payment_history": [
            {
                "date": "2025-07-03",
                "amount": 15,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250703-2028"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-2244",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250601-200513",
        "issue_date": "2025-06-01T12:49:37.845Z",
        "infraction": {
            "id": 7,
            "code": "P0007",
            "type": "Fire Hydrant Blockage",
            "description": "Fire Hydrant Blockage",
            "icon": "fire-hydrant",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "JKL4912",
            "province": "AB",
            "make": "Chevrolet",
            "model": "Spark",
            "color": "Black"
        },
        "owner": {
            "name": "User 440",
            "address": {
                "street": "634 Queen St E",
                "city": "Toronto",
                "postal_code": "M4B 6C6"
            },
            "contact": {
                "email": "user8463@example.com",
                "phone": "(416) 584-2388"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Spadina Ave",
                "Parliament St"
            ],
            "coordinates": {
                "lat": 43.66465585297994,
                "lng": -79.36991849377414
            }
        },
        "fine": {
            "amount": 72,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 13,
                "deadline": "2025-07-01"
            },
            "late_payment_penalty": {
                "percentage": 12,
                "after_date": "2025-07-01"
            }
        },
        "status": "Disputed",
        "due_date": "2025-07-01",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-7833",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250607-042512",
        "issue_date": "2025-06-07T22:29:43.979Z",
        "infraction": {
            "id": 6,
            "code": "P0006",
            "type": "Handicapped Space",
            "description": "Handicapped Space",
            "icon": "wheelchair-accessibility",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "JKL2694",
            "province": "QC",
            "make": "Honda",
            "model": "Corolla",
            "color": "Red"
        },
        "owner": {
            "name": "User 152",
            "address": {
                "street": "731 Bloor St W",
                "city": "Toronto",
                "postal_code": "M5H 4A2"
            },
            "contact": {
                "email": "user7588@example.com",
                "phone": "(416) 800-2736"
            }
        },
        "location": {
            "street": "Yonge St",
            "between": [
                "Parliament St",
                "Yonge St"
            ],
            "coordinates": {
                "lat": 43.66067655028597,
                "lng": -79.37565640931956
            }
        },
        "fine": {
            "amount": 112,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 13,
                "deadline": "2025-07-07"
            },
            "late_payment_penalty": {
                "percentage": 12,
                "after_date": "2025-07-07"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-07",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-1001",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250605-074810",
        "issue_date": "2025-06-05T18:05:19.557Z",
        "infraction": {
            "id": 16,
            "code": "P0016",
            "type": "Speeding",
            "description": "Speeding",
            "icon": "speedometer",
            "category": "moving"
        },
        "vehicle": {
            "plate": "DEF5266",
            "province": "QC",
            "make": "Honda",
            "model": "Spark",
            "color": "Blue"
        },
        "owner": {
            "name": "User 445",
            "address": {
                "street": "207 Bloor St W",
                "city": "Toronto",
                "postal_code": "M6K 4B1"
            },
            "contact": {
                "email": "user7246@example.com",
                "phone": "(416) 130-5287"
            }
        },
        "location": {
            "street": "Dundas St",
            "between": [
                "Bay St",
                "Yonge St"
            ],
            "coordinates": {
                "lat": 43.66842968697281,
                "lng": -79.3709933792603
            }
        },
        "fine": {
            "amount": 108,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 18,
                "deadline": "2025-07-05"
            },
            "late_payment_penalty": {
                "percentage": 6,
                "after_date": "2025-07-05"
            }
        },
        "status": "Outstanding",
        "due_date": "2025-07-05",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-2244",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250602-144805",
        "issue_date": "2025-06-02T12:07:19.651Z",
        "infraction": {
            "id": 15,
            "code": "P0015",
            "type": "Blocked Driveway",
            "description": "Blocked Driveway",
            "icon": "garage",
            "category": "stationary"
        },
        "vehicle": {
            "plate": "GHI8064",
            "province": "ON",
            "make": "Nissan",
            "model": "F-150",
            "color": "White"
        },
        "owner": {
            "name": "User 971",
            "address": {
                "street": "713 King St W",
                "city": "Toronto",
                "postal_code": "M5H 8A2"
            },
            "contact": {
                "email": "user3514@example.com",
                "phone": "(416) 274-4985"
            }
        },
        "location": {
            "street": "Bloor St W",
            "between": [
                "Bay St",
                "Bayview Ave"
            ],
            "coordinates": {
                "lat": 43.65343059788195,
                "lng": -79.36460737242815
            }
        },
        "fine": {
            "amount": 116,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 10,
                "deadline": "2025-07-02"
            },
            "late_payment_penalty": {
                "percentage": 13,
                "after_date": "2025-07-02"
            }
        },
        "status": "Disputed",
        "due_date": "2025-07-02",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-4521",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250603-000152",
        "issue_date": "2025-06-03T06:56:29.847Z",
        "infraction": {
            "id": 29,
            "code": "P0029",
            "type": "Obstructing Traffic",
            "description": "Obstructing Traffic",
            "icon": "traffic-cone",
            "category": "moving"
        },
        "vehicle": {
            "plate": "JKL1014",
            "province": "QC",
            "make": "Nissan",
            "model": "Civic",
            "color": "White"
        },
        "owner": {
            "name": "User 897",
            "address": {
                "street": "34 Queen St E",
                "city": "Toronto",
                "postal_code": "M5H 6C5"
            },
            "contact": {
                "email": "user1558@example.com",
                "phone": "(416) 772-4606"
            }
        },
        "location": {
            "street": "King St W",
            "between": [
                "Yonge St",
                "Bayview Ave"
            ],
            "coordinates": {
                "lat": 43.65799318672761,
                "lng": -79.37343205975147
            }
        },
        "fine": {
            "amount": 89,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 13,
                "deadline": "2025-07-03"
            },
            "late_payment_penalty": {
                "percentage": 7,
                "after_date": "2025-07-03"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-03",
        "payment_history": [
            {
                "date": "2025-07-03",
                "amount": 13,
                "type": "Early Payment Discount",
                "transaction_id": "PAY-20250703-6724"
            }
        ],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-4521",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    },
    {
        "ticket_id": "TTC-20250603-053406",
        "issue_date": "2025-06-03T07:38:14.310Z",
        "infraction": {
            "id": 28,
            "code": "P0028",
            "type": "No Insurance",
            "description": "No Insurance",
            "icon": "card-bulleted-off-outline",
            "category": "moving"
        },
        "vehicle": {
            "plate": "GHI6826",
            "province": "AB",
            "make": "Toyota",
            "model": "Corolla",
            "color": "Silver"
        },
        "owner": {
            "name": "User 646",
            "address": {
                "street": "159 Queen St E",
                "city": "Toronto",
                "postal_code": "M6K 8B2"
            },
            "contact": {
                "email": "user4961@example.com",
                "phone": "(416) 154-1039"
            }
        },
        "location": {
            "street": "Yonge St",
            "between": [
                "Bay St",
                "Bay St"
            ],
            "coordinates": {
                "lat": 43.65434986333156,
                "lng": -79.36012217197835
            }
        },
        "fine": {
            "amount": 49,
            "currency": "CAD",
            "early_payment_discount": {
                "amount": 12,
                "deadline": "2025-07-03"
            },
            "late_payment_penalty": {
                "percentage": 10,
                "after_date": "2025-07-03"
            }
        },
        "status": "Paid",
        "due_date": "2025-07-03",
        "payment_history": [],
        "dispute": {
            "is_disputed": false,
            "dispute_date": null,
            "outcome": null
        },
        "enforcement": {
            "officer_id": "OFF-2244",
            "agency": "Toronto Parking Enforcement",
            "notes": "Automatically generated test record."
        },
        "links": {
            "pay_url": "",
            "dispute_url": ""
        }
    }
]