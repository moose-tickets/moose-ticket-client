import { ITicket } from './api';
// Core ticket-related types
interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Evidence {
  photos: string[];
  videoUrl?: string;
  officerNotes?: string;
}

type PaymentStatus = 'completed' | 'failed' | 'pending';
interface PaymentHistoryItem {
  transactionId: string;
  amount: number;
  paymentDate: Date;
  status: PaymentStatus;
}

type NotificationType = 'initial' | 'reminder' | 'final_notice';
type NotificationMethod = 'email' | 'sms' | 'push';
interface Notification {
  type: NotificationType;
  sentAt: Date;
  method: NotificationMethod;
}

interface TicketMetadata {
  issuingAuthority: string;
  officerId?: string;
  zone?: string;
  speedLimit?: number | null;
  actualSpeed?: number | null;
}

// Populated sub-documents
interface PopulatedUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface PopulatedVehicle {
  _id: string;
  licensePlate: string;
  make: string;
  // you could expand with model, year, etc.
}

interface PopulatedInfractionType {
  _id: string;
  code: string;
  type: {
      en: string;
      es: string;
      fr: string;
      ar: string;
    };
    violation:{
      en: string;
      es: string;
      fr: string;
      ar: string;
    };
  icon: string;
}

//All Tickets
export interface ITicketListResponse {
  _id: string;
  ticketNumber: string;
  location: {
    address: Address;
  },
  status: string;
  vehicle:{
    licensePlate: string;
  },
  infractionType: {
    type: {
      en: string;
      es: string;
      fr: string;
      ar: string;
    };
    violation:{
      en: string;
      es: string;
      fr: string;
      ar: string;
    };
    icon: string;
  },
  amount: number;
  currency: string;
}

// Main Ticket type
export interface ITicket {
  _id: string;
  ticketNumber: string;
  userId: string;
  vehicleId: string;
  violationType: 'parking' | 'speeding' | 'traffic' | 'other';
  infractionId: string;
  amount: number;
  currency: string;
  status:
    | 'paid'
    | 'disputed'
    | 'cancelled'
    | 'outstanding'
    | 'pending'
    | 'unpaid'
    | 'overdue';
  location: {
    address: Address;
    coordinates: Coordinates;
  };
  violationDate: Date;
  dueDate: Date;
  description: string;
  evidence?: Evidence;
  paymentHistory: PaymentHistoryItem[];
  dispute?: {
    disputeId: string;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected';
    submittedAt: Date;
  };
  notifications: Notification[];
  metadata: TicketMetadata;
  createdAt: Date;
  updatedAt: Date;

  // Populated fields
  user: PopulatedUser;
  vehicle: PopulatedVehicle;
  infractionType: PopulatedInfractionType;
}
