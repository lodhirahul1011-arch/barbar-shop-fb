export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed'
}

export enum UserRole {
  CUSTOMER = 'customer',
  OWNER = 'owner',
  ADMIN = 'admin'
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  role: UserRole;
  whatsappEnabled: boolean;
  profileImage?: string;
  createdAt: number;
}

export interface BarberService {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  image?: string;
}

export interface ShopSettings {
  workingHours: {
    [key: string]: { // mon, tue, etc.
      open: string;
      close: string;
      isClosed: boolean;
    }
  };
  slotDuration: number;
  breakTimes: Array<{ start: string; end: string }>;
  blockedDates: string[];
  minimumBookingNoticeMinutes?: number; // Added
  maxAdvanceBookingDays?: number; // Added
}

export interface Appointment {
  id: string;
  shopId: string;
  customerId: string;
  serviceId: string;
  serviceName?: string; // Added for easy notifications
  serviceDuration: number; // Added
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  changeRequested?: boolean;
  changeRequestedAt?: number;
}
