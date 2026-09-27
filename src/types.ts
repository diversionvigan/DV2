export type NavigationTab = 'explore' | 'private-villa' | 'contact' | 'admin';

export type StayType = 'nightly' | 'hourly';

export type RoomCategory = 
  | 'All'
  | 'Family Rooms' 
  | 'Big Family Rooms'
  | 'Loft Family Suites' 
  | 'Standard Rooms' 
  | 'Private Villa'
  | 'Transient Rooms' 
  | 'Private Villa Units' 
  | 'Whole Property Express';

export interface PaxRateTier {
  paxLabel: string;
  pax: number;
  weekdayRate: number; // Mon to Thu
  weekendRate: number; // Fri to Sun
}

export interface RoomUnit {
  id: string;
  roomNumber?: string; // e.g. 'Room 14', 'Room 0', 'Private Villa'
  title: string;
  subtitle: string;
  category: RoomCategory;
  roomNumbers: string[]; // e.g. ['Room 14']
  capacity: {
    minGuests: number;
    maxGuests: number;
    recommended: string;
  };
  pricing: {
    nightly: number; // in PHP
    hourly3hr?: number;
    hourly6hr?: number;
    hourly12hr?: number;
  };
  paxRates?: PaxRateTier[];
  extraPaxFee?: number; // e.g. 500 for extra guest
  extraPadFee?: number; // e.g. 400 for extra pad
  weekdayRateDisplay: string;
  weekendRateDisplay: string;
  beds: string;
  sizeSqM: number;
  description: string;
  amenities: string[];
  hasPool?: boolean;
  images: string[];
  featured?: boolean;
}

export interface BookingAddonItem {
  id: string;
  name: string;
  price: number;
  unitLabel: string;
  isPerNight?: boolean;
  quantity: number;
  description: string;
}

export type PaymentOption = 'full' | 'partial_40';

export type PaymentMethod = 'gcash' | 'bdo' | 'card' | 'front_desk';

export type BookingStatus = 'Confirmed' | 'Pending Slip Review' | 'Checked-In' | 'Completed' | 'Cancelled';

export interface BookingRecord {
  id: string; // e.g. DV-2026-8941
  createdAt: string;
  roomId: string;
  roomTitle: string;
  stayType: StayType;
  // Nightly details
  checkInDate?: string;
  checkOutDate?: string;
  numberOfNights?: number;
  // Hourly details
  hourlyDate?: string;
  hourlyStartTime?: string;
  hourlyDurationHours?: number;
  // Guests
  adultGuests: number;
  childGuests: number;
  // Add-ons
  addons: {
    id: string;
    name: string;
    quantity: number;
    cost: number;
  }[];
  // Pricing breakdown
  baseRatePerUnit: number;
  baseStayTotal: number;
  addonsTotal: number;
  promoCode?: string;
  discountAmount: number;
  grandTotal: number;
  // Payment
  paymentOption: PaymentOption;
  amountPaidNow: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  paymentSlipUrl?: string; // base64 or object URL
  paymentSlipFileName?: string;
  // Guest Details
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  // Admin & Operational Status
  status: BookingStatus;
  staffNotes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rebookedAt?: string;
  rebookingHistory?: {
    date: string;
    staffName: string;
    previousDates?: string;
    previousRoom?: string;
    previousTotal?: number;
    notes?: string;
  }[];
}

export type StaffRole = 
  | 'Super Admin' 
  | 'Front Desk Supervisor' 
  | 'Front Desk Officer' 
  | 'Reservations Clerk' 
  | 'Night Auditor';

export interface StaffPermissions {
  canApproveSlips: boolean;
  canRebook: boolean;
  canCancel: boolean;
  canWalkin: boolean;
  canManageStaff: boolean;
  canViewFinancials: boolean;
  canCheckInOut: boolean;
}

export interface StaffAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: StaffRole;
  email?: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  permissions: StaffPermissions;
  createdBy?: string;
}

export interface InquiryRecord {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email: string;
  roomInterest: string;
  targetDates?: string;
  message: string;
  status: 'New' | 'Replied' | 'Archived';
}

