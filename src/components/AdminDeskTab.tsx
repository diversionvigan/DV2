import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookingRecord, 
  BookingStatus, 
  InquiryRecord, 
  RoomUnit, 
  StaffAccount, 
  StaffRole, 
  StaffPermissions,
  BookingAddonItem
} from '../types';
import { VillaLogo } from './VillaLogo';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Eye, 
  FileText, 
  Search, 
  Filter, 
  LogOut, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Check, 
  X, 
  Ban, 
  RotateCcw, 
  XCircle, 
  Info,
  CalendarCheck,
  UserCheck,
  ShieldAlert,
  UserPlus,
  KeyRound,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckSquare,
  Layers,
  FileCheck,
  LayoutGrid,
  List,
  Building2,
  Trash2
} from 'lucide-react';

interface AdminDeskTabProps {
  bookings: BookingRecord[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus, notes?: string) => void;
  onRebookBooking?: (bookingId: string, updatedFields: Partial<BookingRecord>, note: string) => void;
  onOpenVoucher: (booking: BookingRecord) => void;
  onOpenSlipLightbox: (booking: BookingRecord) => void;
  onAddWalkinBooking: (booking: BookingRecord) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  rooms: RoomUnit[];
  onInventoryRoomsUpdate?: (rooms: RoomUnit[]) => void;
}

const DEFAULT_SUPER_ADMIN_PERMISSIONS: StaffPermissions = {
  canApproveSlips: true,
  canRebook: true,
  canCancel: true,
  canWalkin: true,
  canManageStaff: true,
  canViewFinancials: true,
  canCheckInOut: true,
};

const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-master-001',
    username: 'admin',
    password: 'apelin@123',
    fullName: 'Mark Benedict Apelin (Estate Manager)',
    role: 'Super Admin',
    email: 'admin@diversionvigan.ph',
    phone: '0917 888 1234',
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
    permissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
    createdBy: 'System Root',
  },
  {
    id: 'staff-fd-002',
    username: 'frontdesk1',
    password: 'vigan@desk2026',
    fullName: 'Maria Santos (Front Desk Lead)',
    role: 'Front Desk Supervisor',
    email: 'maria@diversionvigan.ph',
    phone: '0917 555 2201',
    createdAt: '2026-02-15T00:00:00.000Z',
    isActive: true,
    permissions: {
      canApproveSlips: true,
      canRebook: true,
      canCancel: true,
      canWalkin: true,
      canManageStaff: false, // Restricted area
      canViewFinancials: true,
      canCheckInOut: true,
    },
    createdBy: 'admin',
  },
  {
    id: 'staff-clerk-003',
    username: 'reception_night',
    password: 'night@desk2026',
    fullName: 'Carlo Reyes (Night Auditor)',
    role: 'Night Auditor',
    email: 'carlo@diversionvigan.ph',
    phone: '0917 555 9933',
    createdAt: '2026-03-01T00:00:00.000Z',
    isActive: true,
    permissions: {
      canApproveSlips: false, // Restricted
      canRebook: false, // Restricted
      canCancel: false,
      canWalkin: true,
      canManageStaff: false, // Restricted
      canViewFinancials: false, // Restricted
      canCheckInOut: true,
    },
    createdBy: 'admin',
  }
];

export const AdminDeskTab: React.FC<AdminDeskTabProps> = ({
  bookings,
  onUpdateBookingStatus,
  onRebookBooking,
  onOpenVoucher,
  onOpenSlipLightbox,
  onAddWalkinBooking,
  isLoggedIn,
  setIsLoggedIn,
  rooms,
  onInventoryRoomsUpdate,
}) => {
  // Login credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Staff accounts persistent state
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_staff_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_STAFF_ACCOUNTS;
  });

  // Current logged in user object
  const [currentUser, setCurrentUser] = useState<StaffAccount | null>(() => {
    try {
      const saved = localStorage.getItem('diversion_current_staff_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Sync staff accounts to storage
  useEffect(() => {
    localStorage.setItem('diversion_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  // Sync logged in user
  useEffect(() => {
    if (currentUser && isLoggedIn) {
      localStorage.setItem('diversion_current_staff_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('diversion_current_staff_user');
    }
  }, [currentUser, isLoggedIn]);

  // Clean-up & cache reset when user leaves the Front Desk section
  useEffect(() => {
    return () => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUsername('');
      setPassword('');
      setAuthError('');
      setSearchQuery('');
      try {
        localStorage.removeItem('diversion_admin_session');
        localStorage.removeItem('diversion_current_staff_user');
      } catch {
        // ignore
      }
    };
  }, [setIsLoggedIn]);

  // Admin filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'screening' | 'rebook' | 'inquiries' | 'walkin' | 'staff' | 'inventory'>('bookings');

  // Room Inventory State for Admin Desk Customization
  const [inventoryRooms, setInventoryRooms] = useState<RoomUnit[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_admin_inventory_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return rooms;
  });

  const onInventoryRoomsUpdateRef = useRef(onInventoryRoomsUpdate);
  useEffect(() => {
    onInventoryRoomsUpdateRef.current = onInventoryRoomsUpdate;
  }, [onInventoryRoomsUpdate]);

  const isInitialInventoryMount = useRef(true);
  useEffect(() => {
    localStorage.setItem('diversion_admin_inventory_rooms', JSON.stringify(inventoryRooms));
    if (isInitialInventoryMount.current) {
      isInitialInventoryMount.current = false;
      return;
    }
    if (onInventoryRoomsUpdateRef.current) {
      onInventoryRoomsUpdateRef.current(inventoryRooms);
    }
  }, [inventoryRooms]);

  // Specific Date Rates: { [roomId: string]: { [dateStr: string]: number } }
  const [dateRates, setDateRates] = useState<{ [roomId: string]: { [dateStr: string]: number } }>(() => {
    try {
      const saved = localStorage.getItem('diversion_admin_date_rates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('diversion_admin_date_rates', JSON.stringify(dateRates));
  }, [dateRates]);

  // Custom Addons: BookingAddonItem[]
  const [customAddons, setCustomAddons] = useState<BookingAddonItem[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_admin_custom_addons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 'breakfast_set', name: 'Breakfast Set', price: 120, unitLabel: '₱120 per head', isPerNight: true, quantity: 0, description: 'Fresh hot breakfast set' },
      { id: 'extra_pad', name: 'Extra Mattress / Pad', price: 400, unitLabel: '₱400 / night', isPerNight: true, quantity: 0, description: 'Thick mattress with linens' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('diversion_admin_custom_addons', JSON.stringify(customAddons));
  }, [customAddons]);

  const [editingRoomId, setEditingRoomId] = useState<string>(rooms[0]?.id || '');
  const selectedInventoryRoom = useMemo(() => {
    return inventoryRooms.find((r) => r.id === editingRoomId) || inventoryRooms[0];
  }, [inventoryRooms, editingRoomId]);

  const [newRateDate, setNewRateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newRateAmount, setNewRateAmount] = useState<string>('1500');
  const [coverUrlInput, setCoverUrlInput] = useState<string>('');

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('150');
  const [newAddonUnitLabel, setNewAddonUnitLabel] = useState('₱150 per pax');
  const [newAddonDesc, setNewAddonDesc] = useState('');

  // Grid and Table View Option States
  const [bookingsViewMode, setBookingsViewMode] = useState<'table' | 'grid'>('table');
  const [screeningViewMode, setScreeningViewMode] = useState<'grid' | 'table'>('grid');
  const [inquiriesViewMode, setInquiriesViewMode] = useState<'table' | 'grid'>('table');
  const [staffViewMode, setStaffViewMode] = useState<'table' | 'grid'>('table');
  const [walkinViewMode, setWalkinViewMode] = useState<'grid' | 'table'>('grid');
  const [rebookViewMode, setRebookViewMode] = useState<'table' | 'grid'>('table');

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState<BookingRecord | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>('Guest Requested Cancellation');
  const [cancelRefundNotes, setCancelRefundNotes] = useState<string>('');
  const [viewingCancellationBooking, setViewingCancellationBooking] = useState<BookingRecord | null>(null);

  // Review Screening Modal & State
  const [screeningBooking, setScreeningBooking] = useState<BookingRecord | null>(null);
  const [checkImageVerified, setCheckImageVerified] = useState(false);
  const [checkAmountVerified, setCheckAmountVerified] = useState(false);
  const [checkRefNumberVerified, setCheckRefNumberVerified] = useState(false);
  const [screeningStaffNotes, setScreeningStaffNotes] = useState('');

  // Rebooking State
  const [rebookRefInput, setRebookRefInput] = useState('');
  const [selectedRebookBooking, setSelectedRebookBooking] = useState<BookingRecord | null>(null);
  const [rebookRoomId, setRebookRoomId] = useState('');
  const [rebookCheckIn, setRebookCheckIn] = useState('');
  const [rebookCheckOut, setRebookCheckOut] = useState('');
  const [rebookHourlyDate, setRebookHourlyDate] = useState('');
  const [rebookHourlyTime, setRebookHourlyTime] = useState('14:00');
  const [rebookHourlyHours, setRebookHourlyHours] = useState(3);
  const [rebookAdults, setRebookAdults] = useState(2);
  const [rebookChildren, setRebookChildren] = useState(0);
  const [rebookReason, setRebookReason] = useState('Guest Requested Schedule Adjustment');
  const [rebookSuccessMsg, setRebookSuccessMsg] = useState('');

  // Create Staff Account Form State
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('Front Desk Officer');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<StaffPermissions>({
    canApproveSlips: true,
    canRebook: true,
    canCancel: false,
    canWalkin: true,
    canManageStaff: false,
    canViewFinancials: false,
    canCheckInOut: true,
  });
  const [staffCreateSuccess, setStaffCreateSuccess] = useState(false);
  const [staffActionError, setStaffActionError] = useState('');

  // Inquiries from localStorage
  const inquiries: InquiryRecord[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('diversion_vigan_inquiries') || '[]');
    } catch {
      return [];
    }
  }, [activeSubTab]);

  // Walk-in form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinRoomId, setWalkinRoomId] = useState(rooms[0]?.id || '');
  const [walkinNights, setWalkinNights] = useState(1);
  const [walkinPaymentOption, setWalkinPaymentOption] = useState<'full' | 'partial_40'>('full');
  const [walkinSuccess, setWalkinSuccess] = useState(false);

  // Active permissions for current user (defaults to superadmin if legacy session)
  const currentPermissions = currentUser ? currentUser.permissions : DEFAULT_SUPER_ADMIN_PERMISSIONS;

  // Authentication submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const matched = staffAccounts.find(
      (acc) => acc.username.toLowerCase() === cleanUser && acc.password === password
    );

    // Also support root master fallback if not in list
    if (cleanUser === 'admin' && password === 'apelin@123') {
      const rootAcc: StaffAccount = staffAccounts.find(a => a.username === 'admin') || DEFAULT_STAFF_ACCOUNTS[0];
      setCurrentUser(rootAcc);
      setIsLoggedIn(true);
      setAuthError('');
      localStorage.setItem('diversion_admin_session', 'true');
      return;
    }

    if (matched) {
      if (!matched.isActive) {
        setAuthError('This staff account is deactivated. Contact estate manager.');
        return;
      }
      setCurrentUser(matched);
      setIsLoggedIn(true);
      setAuthError('');
      localStorage.setItem('diversion_admin_session', 'true');
    } else {
      setAuthError('Invalid username or password. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('diversion_admin_session');
    localStorage.removeItem('diversion_current_staff_user');
    setUsername('');
    setPassword('');
  };

  // Analytics Computation
  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
    const totalCollected = activeBookings.reduce((sum, b) => sum + (b.amountPaidNow || 0), 0);
    const totalPendingBalance = activeBookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
    const pendingSlips = bookings.filter((b) => b.status === 'Pending Slip Review').length;
    const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = activeBookings.filter((b) => b.checkInDate === today || b.hourlyDate === today).length;

    return {
      totalBookings,
      totalCollected,
      totalPendingBalance,
      pendingSlips,
      todayCheckins,
      cancelledCount,
    };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'All' && b.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.guestName.toLowerCase().includes(q);
        const matchesPhone = b.guestPhone.includes(q);
        const matchesId = b.id.toLowerCase().includes(q);
        const matchesRoom = b.roomTitle.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId || matchesRoom;
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  // List of bookings requiring review screening
  const pendingScreeningBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'Pending Slip Review');
  }, [bookings]);

  // Open screening drawer/modal
  const handleStartScreening = (booking: BookingRecord) => {
    setScreeningBooking(booking);
    setCheckImageVerified(false);
    setCheckAmountVerified(false);
    setCheckRefNumberVerified(false);
    setScreeningStaffNotes(
      `Deposit verified by ${currentUser?.fullName || 'Front Desk'} on ${new Date().toLocaleDateString()}`
    );
  };

  // Approve slip via screening
  const handleApproveScreening = () => {
    if (!screeningBooking) return;
    onUpdateBookingStatus(screeningBooking.id, 'Confirmed', screeningStaffNotes || 'Deposit slip verified and approved.');
    setScreeningBooking(null);
  };

  // Reject slip via screening
  const handleRejectScreening = (reason: string) => {
    if (!screeningBooking) return;
    onUpdateBookingStatus(screeningBooking.id, 'Cancelled', `[SLIP REJECTED] ${reason}`);
    setScreeningBooking(null);
  };

  // Preset role permissions helper
  const applyRolePreset = (role: StaffRole) => {
    setNewStaffRole(role);
    switch (role) {
      case 'Super Admin':
        setNewStaffPermissions(DEFAULT_SUPER_ADMIN_PERMISSIONS);
        break;
      case 'Front Desk Supervisor':
        setNewStaffPermissions({
          canApproveSlips: true,
          canRebook: true,
          canCancel: true,
          canWalkin: true,
          canManageStaff: false,
          canViewFinancials: true,
          canCheckInOut: true,
        });
        break;
      case 'Front Desk Officer':
        setNewStaffPermissions({
          canApproveSlips: true,
          canRebook: true,
          canCancel: false,
          canWalkin: true,
          canManageStaff: false,
          canViewFinancials: true,
          canCheckInOut: true,
        });
        break;
      case 'Reservations Clerk':
        setNewStaffPermissions({
          canApproveSlips: true,
          canRebook: true,
          canCancel: false,
          canWalkin: false,
          canManageStaff: false,
          canViewFinancials: false,
          canCheckInOut: false,
        });
        break;
      case 'Night Auditor':
        setNewStaffPermissions({
          canApproveSlips: false,
          canRebook: false,
          canCancel: false,
          canWalkin: true,
          canManageStaff: false,
          canViewFinancials: false,
          canCheckInOut: true,
        });
        break;
    }
  };

  // Create staff account submit
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffActionError('');

    const cleanUsername = newStaffUsername.trim().toLowerCase();
    if (!cleanUsername || !newStaffPassword || !newStaffFullName) {
      setStaffActionError('Please fill in username, password, and full name.');
      return;
    }

    if (staffAccounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      setStaffActionError(`Username "${cleanUsername}" is already in use. Please choose another.`);
      return;
    }

    const newAcc: StaffAccount = {
      id: `staff-${Date.now()}`,
      username: cleanUsername,
      password: newStaffPassword,
      fullName: newStaffFullName,
      role: newStaffRole,
      email: newStaffEmail,
      phone: newStaffPhone,
      createdAt: new Date().toISOString(),
      isActive: true,
      permissions: newStaffPermissions,
      createdBy: currentUser?.username || 'admin',
    };

    setStaffAccounts((prev) => [...prev, newAcc]);
    setStaffCreateSuccess(true);
    setNewStaffUsername('');
    setNewStaffFullName('');
    setNewStaffPassword('');
    setNewStaffEmail('');
    setNewStaffPhone('');

    setTimeout(() => {
      setStaffCreateSuccess(false);
    }, 3000);
  };

  // Toggle staff active status
  const handleToggleStaffStatus = (id: string) => {
    const target = staffAccounts.find((a) => a.id === id);
    if (target?.username === 'admin') {
      setStaffActionError('The primary super admin account cannot be deactivated.');
      return;
    }
    setStaffAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  // Delete staff account
  const handleDeleteStaff = (id: string) => {
    const target = staffAccounts.find((a) => a.id === id);
    if (target?.username === 'admin') {
      setStaffActionError('The primary super admin account cannot be removed.');
      return;
    }
    if (confirm(`Remove staff account for ${target?.fullName}?`)) {
      setStaffAccounts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Handle Load Booking for Rebooking
  const handleLoadBookingForRebook = (booking: BookingRecord) => {
    setSelectedRebookBooking(booking);
    setRebookRefInput(booking.id);
    setRebookRoomId(booking.roomId);
    setRebookCheckIn(booking.checkInDate || new Date().toISOString().split('T')[0]);
    setRebookCheckOut(booking.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setRebookHourlyDate(booking.hourlyDate || new Date().toISOString().split('T')[0]);
    setRebookHourlyTime(booking.hourlyStartTime || '14:00');
    setRebookHourlyHours(booking.hourlyDurationHours || 3);
    setRebookAdults(booking.adultGuests || 2);
    setRebookChildren(booking.childGuests || 0);
    setRebookSuccessMsg('');
    setActiveSubTab('rebook');
  };

  // Search booking ref to rebook
  const handleSearchBookingToRebook = (e: React.FormEvent) => {
    e.preventDefault();
    const query = rebookRefInput.trim().toUpperCase();
    const found = bookings.find((b) => b.id.toUpperCase() === query || b.id.toUpperCase().includes(query));
    if (found) {
      handleLoadBookingForRebook(found);
    } else {
      alert(`No reservation found with reference "${rebookRefInput}". Please verify the booking ID.`);
    }
  };

  // Calculate new rebooking totals
  const rebookingCalculation = useMemo(() => {
    if (!selectedRebookBooking) return null;
    const targetRoom = rooms.find((r) => r.id === rebookRoomId) || rooms[0];

    let newStayTotal = 0;
    let nightsCount = 1;

    if (selectedRebookBooking.stayType === 'nightly') {
      if (rebookCheckIn && rebookCheckOut) {
        const start = new Date(rebookCheckIn).getTime();
        const end = new Date(rebookCheckOut).getTime();
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        nightsCount = diffDays;
        newStayTotal = targetRoom.pricing.nightly * diffDays;
      }
    } else {
      const baseHourRate = rebookHourlyHours === 3 ? (targetRoom.pricing.hourly3hr || 1500) :
        rebookHourlyHours === 6 ? (targetRoom.pricing.hourly6hr || 2500) : (targetRoom.pricing.hourly12hr || 4000);
      newStayTotal = baseHourRate;
    }

    const addonsCost = selectedRebookBooking.addonsTotal || 0;
    const discount = selectedRebookBooking.discountAmount || 0;
    const newGrandTotal = Math.max(0, newStayTotal + addonsCost - discount);
    const amountAlreadyPaid = selectedRebookBooking.amountPaidNow;
    const newRemainingBalance = Math.max(0, newGrandTotal - amountAlreadyPaid);
    const extraCharge = newGrandTotal > selectedRebookBooking.grandTotal ? newGrandTotal - selectedRebookBooking.grandTotal : 0;
    const creditAdjustment = newGrandTotal < selectedRebookBooking.grandTotal ? selectedRebookBooking.grandTotal - newGrandTotal : 0;

    return {
      targetRoom,
      nightsCount,
      newStayTotal,
      addonsCost,
      newGrandTotal,
      amountAlreadyPaid,
      newRemainingBalance,
      extraCharge,
      creditAdjustment,
    };
  }, [selectedRebookBooking, rebookRoomId, rebookCheckIn, rebookCheckOut, rebookHourlyHours, rooms]);

  // Execute Rebooking
  const handleExecuteRebooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRebookBooking || !onRebookBooking || !rebookingCalculation) return;

    const { targetRoom, nightsCount, newGrandTotal, newRemainingBalance, newStayTotal } = rebookingCalculation;

    const updatedFields: Partial<BookingRecord> = {
      roomId: targetRoom.id,
      roomTitle: targetRoom.title,
      checkInDate: selectedRebookBooking.stayType === 'nightly' ? rebookCheckIn : undefined,
      checkOutDate: selectedRebookBooking.stayType === 'nightly' ? rebookCheckOut : undefined,
      numberOfNights: selectedRebookBooking.stayType === 'nightly' ? nightsCount : undefined,
      hourlyDate: selectedRebookBooking.stayType === 'hourly' ? rebookHourlyDate : undefined,
      hourlyStartTime: selectedRebookBooking.stayType === 'hourly' ? rebookHourlyTime : undefined,
      hourlyDurationHours: selectedRebookBooking.stayType === 'hourly' ? rebookHourlyHours : undefined,
      adultGuests: rebookAdults,
      childGuests: rebookChildren,
      baseRatePerUnit: selectedRebookBooking.stayType === 'nightly' ? targetRoom.pricing.nightly : newStayTotal,
      baseStayTotal: newStayTotal,
      grandTotal: newGrandTotal,
      remainingBalance: newRemainingBalance,
      status: selectedRebookBooking.status === 'Cancelled' ? 'Confirmed' : selectedRebookBooking.status,
    };

    const note = `Rebooked by ${currentUser?.fullName || 'Staff'}: ${rebookReason}`;
    onRebookBooking(selectedRebookBooking.id, updatedFields, note);

    setRebookSuccessMsg(`Booking ${selectedRebookBooking.id} successfully updated to ${targetRoom.title}!`);
    setTimeout(() => {
      setSelectedRebookBooking(null);
      setActiveSubTab('bookings');
    }, 1500);
  };

  // Walk-in submit
  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName || !walkinPhone) return;

    const room = rooms.find((r) => r.id === walkinRoomId) || rooms[0];
    const total = room.pricing.nightly * walkinNights;
    const paid = walkinPaymentOption === 'full' ? total : Math.round(total * 0.4);
    const bal = total - paid;

    const walkinBooking: BookingRecord = {
      id: `DV-WALK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      roomId: room.id,
      roomTitle: room.title,
      stayType: 'nightly',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + walkinNights * 86400000).toISOString().split('T')[0],
      numberOfNights: walkinNights,
      adultGuests: 2,
      childGuests: 0,
      addons: [],
      baseRatePerUnit: room.pricing.nightly,
      baseStayTotal: total,
      addonsTotal: 0,
      discountAmount: 0,
      grandTotal: total,
      paymentOption: walkinPaymentOption,
      amountPaidNow: paid,
      remainingBalance: bal,
      paymentMethod: 'front_desk',
      guestName: walkinName,
      guestPhone: walkinPhone,
      status: 'Checked-In',
      staffNotes: `Front Desk Walk-in registered by ${currentUser?.fullName || 'Front Desk'} on-site.`,
    };

    onAddWalkinBooking(walkinBooking);
    setWalkinSuccess(true);
    setWalkinName('');
    setWalkinPhone('');
    setTimeout(() => {
      setWalkinSuccess(false);
      setActiveSubTab('bookings');
    }, 1500);
  };

  // If NOT Logged In: Show Frosted Glass Gate
  if (!isLoggedIn) {
    return (
      <div className="py-12 px-4 flex items-center justify-center">
        <div className="relative max-w-md w-full">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#EAA89B]/25 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#B76E79]/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-[#E6D7C3] shadow-2xl space-y-6 text-[#2C1E15]">
            
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <VillaLogo size={56} variant="rosegold" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#2C1E15]">Front Desk Console</h3>
              <p className="text-xs text-[#8A5A66] max-w-xs mx-auto">
                Authorized staff portal for Diversion Staycation & Events Place operations.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C1E15] uppercase tracking-wider mb-1.5">
                  Staff Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6D7C3] bg-[#FAF4F2] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#B76E79] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E15] uppercase tracking-wider mb-1.5">
                  Password Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6D7C3] bg-[#FAF4F2] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#B76E79] transition-all"
                />
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#240F16] via-[#B76E79] to-[#240F16] text-white text-sm font-bold rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-[#FDE3DD]" />
                <span>Unlock Management Desk</span>
              </button>

              <p className="text-center text-[11px] text-[#8A5A66] pt-1">
                Restricted portal. Contact estate management if you need staff credentials.
              </p>
            </form>

          </div>
        </div>
      </div>
    );
  }

  // LOGGED-IN ADMIN DESK VIEW
  return (
    <div className="space-y-8">
      
      {/* Admin Top Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6D7C3]/70 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <VillaLogo size={42} variant="rosegold" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-[#2C1E15]">Front Desk Management</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-300">
                Live Console
              </span>
            </div>
            <div className="text-xs text-[#8A5A66] flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>Logged in as:</span>
              <strong className="text-[#2C1E15]">{currentUser?.fullName || 'Admin Manager'}</strong>
              <span className="bg-[#FAF4F2] text-[#B76E79] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#E6D7C3]">
                {currentUser?.role || 'Super Admin'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Sub-tab navigation */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F5EBE6] p-1 rounded-2xl border border-[#E6D7C3]/60">
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'bookings' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              Bookings ({bookings.length})
            </button>

            {/* Review Screening Tab */}
            <button
              onClick={() => setActiveSubTab('screening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'screening' 
                  ? 'bg-amber-800 text-white shadow-sm' 
                  : 'text-[#523A2A] hover:bg-white/60'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Review Screening</span>
              {analytics.pendingSlips > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {analytics.pendingSlips}
                </span>
              )}
            </button>

            {/* Rebook Under Ref Tab */}
            <button
              onClick={() => setActiveSubTab('rebook')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'rebook' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Rebook</span>
            </button>

            {/* Inquiries */}
            <button
              onClick={() => setActiveSubTab('inquiries')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'inquiries' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              Inquiries ({inquiries.length})
            </button>

            {/* Walk-in */}
            <button
              onClick={() => setActiveSubTab('walkin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'walkin' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              + Walk-In
            </button>

            {/* Room Inventory & Customization */}
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'inventory' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Room Inventory &amp; Custom</span>
            </button>

            {/* Staff Accounts (Restricted Area) */}
            <button
              onClick={() => setActiveSubTab('staff')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'staff' 
                  ? 'bg-[#2C1E15] text-white shadow-sm' 
                  : 'text-[#523A2A] hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Accounts</span>
              {!currentPermissions.canManageStaff && (
                <Lock className="w-2.5 h-2.5 text-amber-700 ml-0.5" />
              )}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer ml-auto lg:ml-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Total Bookings</span>
            <Users className="w-4 h-4 text-[#2C1E15]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1E15]">
            {analytics.totalBookings}
          </div>
          <div className="text-[11px] text-[#786150]">All active & completed records</div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Collected Deposits</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">
            {currentPermissions.canViewFinancials ? (
              `₱${analytics.totalCollected.toLocaleString()}`
            ) : (
              <span className="text-gray-400 font-mono text-xl">•••••• [Restricted]</span>
            )}
          </div>
          <div className="text-[11px] text-[#786150]">Verified downpayments / full pays</div>
        </div>

        {/* Pending Balance to Collect */}
        <div className="bg-white p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Balance Due at Desk</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-900">
            {currentPermissions.canViewFinancials ? (
              `₱${analytics.totalPendingBalance.toLocaleString()}`
            ) : (
              <span className="text-gray-400 font-mono text-xl">•••••• [Restricted]</span>
            )}
          </div>
          <div className="text-[11px] text-[#786150]">Balance payable at check-in</div>
        </div>

        {/* Pending Slips Audit */}
        <button
          onClick={() => setActiveSubTab('screening')}
          className="bg-white hover:bg-amber-50/50 p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Review Screening</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-700 group-hover:scale-105 transition-transform origin-left">
            {analytics.pendingSlips}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold flex items-center justify-between">
            <span>Click to screen slips</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
          </div>
        </button>

      </div>

      {/* SUB-TAB: ROOM INVENTORY & CUSTOMIZATION */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6D7C3]/60 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F5EBE6] text-[#8B6B10] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-[#E6D7C3]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Inventory &amp; Rates Management</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2C1E15]">
                Room Inventory &amp; Customization Console
              </h3>
              <p className="text-xs text-[#786150] mt-1">
                Customize room pricing by days, specific calendar dates, cover photos (upload/URL), and custom add-ons by pax and price.
              </p>
            </div>

            {/* Room Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#2C1E15] shrink-0">Select Room:</label>
              <select
                value={editingRoomId}
                onChange={(e) => setEditingRoomId(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-bold text-[#2C1E15] outline-none focus:ring-2 focus:ring-[#B76E79]"
              >
                {inventoryRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomNumber || room.title} ({room.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedInventoryRoom && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Cover Photo & Basic Rates */}
              <div className="space-y-6">
                
                {/* Room Pictures & Gallery Section */}
                <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#E6D7C3] space-y-4">
                  <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8B6B10]" />
                    <span>Room Pictures &amp; Gallery ({selectedInventoryRoom.images.length})</span>
                  </h4>

                  {/* Thumbnail Gallery Grid with Delete */}
                  <div className="grid grid-cols-3 gap-2">
                    {selectedInventoryRoom.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden bg-stone-200 border border-[#E6D7C3] group">
                        <img src={imgUrl} alt={`Room photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                          {imgIdx === 0 ? 'Cover' : `#${imgIdx + 1}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedInventoryRoom.images.length <= 1) {
                              alert('Room must have at least one photo.');
                              return;
                            }
                            const updatedImages = selectedInventoryRoom.images.filter((_, idx) => idx !== imgIdx);
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id ? { ...r, images: updatedImages } : r
                              )
                            );
                          }}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-xs shadow cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#E6D7C3]/60">
                    {/* Upload Multiple Pictures */}
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                        Upload Multiple Pictures
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          
                          const newBase64Images: string[] = [];
                          let loadedCount = 0;

                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              if (base64) {
                                newBase64Images.push(base64);
                              }
                              loadedCount++;
                              if (loadedCount === files.length) {
                                setInventoryRooms((prev) =>
                                  prev.map((r) =>
                                    r.id === selectedInventoryRoom.id
                                      ? { ...r, images: [...r.images, ...newBase64Images] }
                                      : r
                                  )
                                );
                                alert(`${newBase64Images.length} picture(s) uploaded successfully!`);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="w-full text-xs text-[#786150] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#2C1E15] file:text-white hover:file:bg-[#3D2616] cursor-pointer"
                      />
                    </div>

                    {/* Or URL */}
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                        Or Add Picture by Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          value={coverUrlInput}
                          onChange={(e) => setCoverUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!coverUrlInput.trim()) return;
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id
                                  ? { ...r, images: [...r.images, coverUrlInput.trim()] }
                                  : r
                              )
                            );
                            setCoverUrlInput('');
                            alert('Picture added via URL successfully!');
                          }}
                          className="px-4 py-2 bg-[#2C1E15] hover:bg-[#3D2616] text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Base Rates by Days */}
                <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#E6D7C3] space-y-4">
                  <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>Editable Room Rate by Days</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Base Nightly Rate (₱)</label>
                      <input
                        type="number"
                        value={selectedInventoryRoom.pricing.nightly}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setInventoryRooms((prev) =>
                            prev.map((r) =>
                              r.id === selectedInventoryRoom.id
                                ? { ...r, pricing: { ...r.pricing, nightly: val } }
                                : r
                            )
                          );
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Weekday Rate Display Text</label>
                      <input
                        type="text"
                        value={selectedInventoryRoom.weekdayRateDisplay}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInventoryRooms((prev) =>
                            prev.map((r) =>
                              r.id === selectedInventoryRoom.id
                                ? { ...r, weekdayRateDisplay: val }
                                : r
                            )
                          );
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Weekend Rate Display Text</label>
                      <input
                        type="text"
                        value={selectedInventoryRoom.weekendRateDisplay}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInventoryRooms((prev) =>
                            prev.map((r) =>
                              r.id === selectedInventoryRoom.id
                                ? { ...r, weekendRateDisplay: val }
                                : r
                            )
                          );
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Specific Date Rates & Custom Add-ons */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Specific Date Rate Overrides */}
                <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E6D7C3] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-[#8B6B10]" />
                        <span>Room Rate by Specific Date (Overrides)</span>
                      </h4>
                      <p className="text-xs text-[#786150]">Set custom rates for holidays, weekends, or peak event dates for {selectedInventoryRoom.title}.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-[#E6D7C3]">
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Target Date</label>
                      <input
                        type="date"
                        value={newRateDate}
                        onChange={(e) => setNewRateDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Specific Rate (₱)</label>
                      <input
                        type="number"
                        value={newRateAmount}
                        onChange={(e) => setNewRateAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs font-bold text-[#2C1E15] outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRateDate || !newRateAmount) return;
                          const amount = Number(newRateAmount);
                          setDateRates((prev) => ({
                            ...prev,
                            [selectedInventoryRoom.id]: {
                              ...(prev[selectedInventoryRoom.id] || {}),
                              [newRateDate]: amount,
                            },
                          }));
                          alert(`Rate override of ₱${amount.toLocaleString()} for ${newRateDate} saved for ${selectedInventoryRoom.roomNumber}!`);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-[#B8860B] to-[#997A15] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:brightness-105"
                      >
                        + Save Date Rate
                      </button>
                    </div>
                  </div>

                  {/* Existing Date Overrides List */}
                  {dateRates[selectedInventoryRoom.id] && Object.keys(dateRates[selectedInventoryRoom.id]).length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-[#2C1E15]">Saved Date Overrides:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(dateRates[selectedInventoryRoom.id]).map(([dt, rt]) => (
                          <div key={dt} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E6D7C3] text-xs">
                            <span className="font-mono text-[#786150]">{dt}</span>
                            <div className="flex items-center gap-2">
                              <strong className="text-emerald-700">₱{rt.toLocaleString()}</strong>
                              <button
                                onClick={() => {
                                  setDateRates((prev) => {
                                    const copy = { ...prev };
                                    if (copy[selectedInventoryRoom.id]) {
                                      delete copy[selectedInventoryRoom.id][dt];
                                    }
                                    return copy;
                                  });
                                }}
                                className="text-rose-600 hover:text-rose-800 font-bold p-1"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-500 italic">No specific date rate overrides configured yet for this unit.</div>
                  )}
                </div>

                {/* Custom Add-ons by Pax and Price */}
                <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E6D7C3] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#8B6B10]" />
                        <span>Custom Add-ons by Pax and Price</span>
                      </h4>
                      <p className="text-xs text-[#786150]">Configure extra guest add-ons, meal packages, amenities, or extra pads by pax and pricing.</p>
                    </div>
                  </div>

                  {/* Add New Add-on Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-[#E6D7C3]">
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Add-on Name</label>
                      <input
                        type="text"
                        placeholder="e.g. VIP Breakfast Set"
                        value={newAddonName}
                        onChange={(e) => setNewAddonName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Price (₱)</label>
                      <input
                        type="number"
                        placeholder="150"
                        value={newAddonPrice}
                        onChange={(e) => setNewAddonPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Unit / Pax Label</label>
                      <input
                        type="text"
                        placeholder="₱150 per pax"
                        value={newAddonUnitLabel}
                        onChange={(e) => setNewAddonUnitLabel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAddonName.trim() || !newAddonPrice) return;
                          const newAddon: BookingAddonItem = {
                            id: `custom_${Date.now()}`,
                            name: newAddonName.trim(),
                            price: Number(newAddonPrice),
                            unitLabel: newAddonUnitLabel.trim() || `₱${newAddonPrice} per pax`,
                            isPerNight: true,
                            quantity: 0,
                            description: newAddonDesc.trim() || newAddonName.trim(),
                          };
                          setCustomAddons((prev) => [...prev, newAddon]);
                          setNewAddonName('');
                          setNewAddonPrice('150');
                          setNewAddonUnitLabel('₱150 per pax');
                          setNewAddonDesc('');
                          alert('Custom add-on created successfully!');
                        }}
                        className="w-full py-2 bg-[#2C1E15] hover:bg-[#3D2616] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                      >
                        + Add Add-on
                      </button>
                    </div>
                  </div>

                  {/* Existing Custom Add-ons List */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#2C1E15]">Configured Add-ons Catalogue:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customAddons.map((addon) => (
                        <div key={addon.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6D7C3]">
                          <div>
                            <div className="font-bold text-xs text-[#2C1E15]">{addon.name}</div>
                            <div className="text-[11px] text-[#786150]">{addon.unitLabel}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <strong className="text-emerald-700 text-xs font-mono">₱{addon.price}</strong>
                            <button
                              onClick={() => {
                                if (confirm(`Remove custom add-on "${addon.name}"?`)) {
                                  setCustomAddons((prev) => prev.filter((a) => a.id !== addon.id));
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold p-1 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 1: RESERVATIONS TABLE */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl overflow-hidden space-y-4">
          
          {/* Table / Grid Header Filter Toolbar */}
          <div className="p-5 border-b border-[#E6D7C3]/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F5EBE6] p-1.5 rounded-2xl border border-[#E6D7C3]/60">
              {(['All', 'Pending Slip Review', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-[#786150] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest, phone, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#2C1E15]"
                />
              </div>

              {/* View Mode Toggle: Table vs Grid */}
              <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setBookingsViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bookingsViewMode === 'table'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingsViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bookingsViewMode === 'grid'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>

          </div>

          {/* Table / Grid Content */}
          {bookingsViewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[11px]">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Guest Info</th>
                  <th className="py-3 px-4">Room / Unit</th>
                  <th className="py-3 px-4">Stay Schedule</th>
                  <th className="py-3 px-4">Financials (Paid / Bal)</th>
                  <th className="py-3 px-4">Deposit Slip</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D7C3]/40">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                    
                    {/* Booking ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2C1E15]">
                      {b.id}
                      <span className="block text-[10px] text-[#786150] font-sans">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                      {b.rebookedAt && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-sans text-[9px] font-bold border border-amber-300">
                          Rebooked
                        </span>
                      )}
                    </td>

                    {/* Guest Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2C1E15] text-sm">{b.guestName}</div>
                      <div className="font-mono text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{b.guestPhone}</span>
                      </div>
                      {b.guestEmail && (
                        <div className="text-[10px] text-[#786150]">{b.guestEmail}</div>
                      )}
                    </td>

                    {/* Room */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#2C1E15]">{b.roomTitle}</div>
                      <div className="text-[10px] text-[#786150]">
                        {b.adultGuests} Adults {b.childGuests > 0 ? `, ${b.childGuests} Kids` : ''}
                      </div>
                    </td>

                    {/* Stay Schedule */}
                    <td className="py-3.5 px-4">
                      {b.stayType === 'nightly' ? (
                        <div>
                          <div className="font-semibold text-[#2C1E15]">{b.checkInDate} to {b.checkOutDate}</div>
                          <div className="text-[10px] text-amber-800 font-bold">{b.numberOfNights} Night(s)</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-[#2C1E15]">{b.hourlyDate} at {b.hourlyStartTime}</div>
                          <div className="text-[10px] text-emerald-800 font-bold">{b.hourlyDurationHours} Hours Block</div>
                        </div>
                      )}
                    </td>

                    {/* Financials */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-[#786150]">Total: <strong>₱{b.grandTotal.toLocaleString()}</strong></div>
                      <div className="text-emerald-700 font-bold">
                        Paid: ₱{b.amountPaidNow.toLocaleString()}{' '}
                        <span className="text-[10px] font-normal">
                          ({b.paymentOption === 'partial_40' ? '40%' : '100%'})
                        </span>
                      </div>
                      <div className="text-amber-900 font-semibold text-[11px]">
                        Bal: ₱{b.remainingBalance.toLocaleString()}
                      </div>
                    </td>

                    {/* Deposit Slip Thumbnail */}
                    <td className="py-3.5 px-4">
                      {b.paymentSlipUrl ? (
                        <button
                          onClick={() => onOpenSlipLightbox(b)}
                          className="group relative block rounded-xl overflow-hidden border border-[#E6D7C3] hover:border-[#2C1E15] shadow-xs cursor-pointer"
                          title="Click to zoom slip"
                        >
                          <img
                            src={b.paymentSlipUrl}
                            alt="Slip thumbnail"
                            className="w-12 h-12 object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#786150]">No file</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : b.status === 'Checked-In'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : b.status === 'Pending Slip Review'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : b.status === 'Completed'
                            ? 'bg-gray-100 text-gray-700 border border-gray-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                        }`}>
                          {b.status}
                        </span>
                        {b.status === 'Cancelled' && (b.cancellationReason || b.staffNotes) && (
                          <button
                            onClick={() => setViewingCancellationBooking(b)}
                            className="text-rose-600 hover:text-rose-800 p-0.5 rounded cursor-pointer"
                            title="View cancellation details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Review Screening Action Button */}
                        {b.status === 'Pending Slip Review' && (
                          <button
                            onClick={() => handleStartScreening(b)}
                            disabled={!currentPermissions.canApproveSlips}
                            className={`flex items-center gap-1 px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm ${
                              currentPermissions.canApproveSlips 
                                ? 'bg-amber-700 hover:bg-amber-800' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={currentPermissions.canApproveSlips ? 'Screen & Verify Deposit Slip' : 'Permission restricted'}
                          >
                            <FileCheck className="w-3 h-3" />
                            <span>Screen</span>
                          </button>
                        )}

                        {/* Rebook Button under reference */}
                        {b.status !== 'Completed' && (
                          <button
                            onClick={() => handleLoadBookingForRebook(b)}
                            disabled={!currentPermissions.canRebook}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              currentPermissions.canRebook
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                            title={currentPermissions.canRebook ? `Rebook ref ${b.id}` : 'Rebooking permission restricted'}
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Check-In */}
                        {b.status === 'Confirmed' && currentPermissions.canCheckInOut && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'Checked-In', `Guest checked in by ${currentUser?.fullName || 'Staff'}.`)}
                            className="px-2 py-1 bg-[#2C1E15] hover:bg-[#523A2A] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Check-In
                          </button>
                        )}

                        {/* Complete Stay */}
                        {b.status === 'Checked-In' && currentPermissions.canCheckInOut && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'Completed', `Stay completed & key returned.`)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}

                        {/* Cancel Booking Button */}
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              if (!currentPermissions.canCancel) {
                                alert('Restricted: You do not have permission to cancel bookings. Contact manager.');
                                return;
                              }
                              setBookingToCancel(b);
                              setCancelReasonPreset('Guest Requested Cancellation');
                              setCancelRefundNotes(
                                b.paymentOption === 'partial_40' 
                                  ? '40% downpayment forfeited as per policy' 
                                  : 'Refund processed as per terms'
                              );
                            }}
                            disabled={!currentPermissions.canCancel}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              currentPermissions.canCancel
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                            }`}
                            title={currentPermissions.canCancel ? 'Cancel Reservation' : 'Cancellation restricted'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Re-instate / Reopen button for Cancelled bookings */}
                        {b.status === 'Cancelled' && currentPermissions.canCancel && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'Confirmed', 'Reinstated and re-confirmed by front desk.')}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            title="Re-open / Reinstate reservation"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                        )}

                        {/* Print Master Voucher */}
                        <button
                          onClick={() => onOpenVoucher(b)}
                          className="p-1.5 bg-[#F5EBE6] hover:bg-[#E6D7C3] text-[#2C1E15] rounded-lg transition-colors cursor-pointer"
                          title="Print Official Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            /* Content: Grid View */
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className={`bg-[#FDFBF7] rounded-2xl border p-4 shadow-sm space-y-3.5 transition-all flex flex-col justify-between hover:shadow-md ${
                    b.status === 'Cancelled'
                      ? 'border-rose-300 bg-rose-50/20'
                      : b.status === 'Pending Slip Review'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-[#E6D7C3]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Ref, Date, and Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#E6D7C3]/50 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#2C1E15] bg-[#F5EBE6] px-2 py-0.5 rounded border border-[#E6D7C3]">
                            {b.id}
                          </span>
                          {b.rebookedAt && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-bold border border-amber-300">
                              Rebooked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#786150] block mt-1">
                          Booked: {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : b.status === 'Pending Slip Review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                            : b.status === 'Checked-In'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : b.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}>
                          {b.status}
                        </span>
                        {b.status === 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => setViewingCancellationBooking(b)}
                            className="block mt-0.5 text-[9px] text-rose-700 underline font-semibold ml-auto cursor-pointer"
                          >
                            View Reason
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Guest & Room Details */}
                    <div>
                      <h4 className="font-bold text-sm text-[#2C1E15]">{b.guestName}</h4>
                      <div className="font-mono text-emerald-800 text-xs font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{b.guestPhone}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#523A2A] mt-1 flex items-center justify-between">
                        <span>{b.roomTitle}</span>
                        <span className="text-[11px] text-[#786150] font-normal">
                          {b.adultGuests} Adults {b.childGuests > 0 ? `, ${b.childGuests} Kids` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Schedule Box */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6D7C3]/60 text-xs space-y-1">
                      <div className="text-[#786150] text-[10px] uppercase font-bold tracking-wider">Stay Schedule</div>
                      {b.stayType === 'nightly' ? (
                        <div className="flex justify-between items-center text-xs font-semibold text-[#2C1E15]">
                          <span>{b.checkInDate} → {b.checkOutDate}</span>
                          <span className="text-amber-800 font-bold font-mono">{b.numberOfNights}N</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs font-semibold text-[#2C1E15]">
                          <span>{b.hourlyDate} ({b.hourlyStartTime})</span>
                          <span className="text-emerald-800 font-bold font-mono">{b.hourlyDurationHours}h</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6D7C3]/60 text-xs space-y-1">
                      <div className="flex justify-between text-[#786150]">
                        <span>Grand Total:</span>
                        <strong className="text-[#2C1E15]">₱{b.grandTotal.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Paid Deposit:</span>
                        <span>₱{b.amountPaidNow.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#E6D7C3]/40 pt-1 text-xs">
                        <span className="text-[#786150]">Balance Due:</span>
                        {b.remainingBalance > 0 ? (
                          <strong className="text-amber-900 font-mono">₱{b.remainingBalance.toLocaleString()}</strong>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">Fully Paid</span>
                        )}
                      </div>
                    </div>

                    {/* Slip Thumbnail if present */}
                    {b.paymentSlipUrl && (
                      <div className="flex items-center justify-between p-2 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                        <div className="flex items-center gap-2">
                          <img 
                            src={b.paymentSlipUrl} 
                            alt="Slip" 
                            className="w-8 h-8 rounded-lg object-cover border border-amber-300"
                          />
                          <span className="text-[11px] font-semibold text-amber-900">Receipt Attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenSlipLightbox(b)}
                          className="px-2 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-[#E6D7C3]/50 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {/* Review Slip */}
                      {b.status === 'Pending Slip Review' && currentPermissions.canApproveSlips && (
                        <button
                          onClick={() => handleStartScreening(b)}
                          className="px-2.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Screen</span>
                        </button>
                      )}

                      {/* Check-In */}
                      {b.status === 'Confirmed' && currentPermissions.canCheckInOut && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'Checked-In', `Guest checked in by ${currentUser?.fullName || 'Staff'}.`)}
                          className="px-2.5 py-1.5 bg-[#2C1E15] hover:bg-[#523A2A] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Check-In
                        </button>
                      )}

                      {/* Complete Stay */}
                      {b.status === 'Checked-In' && currentPermissions.canCheckInOut && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'Completed', `Stay completed & key returned.`)}
                          className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      {/* Reopen */}
                      {b.status === 'Cancelled' && currentPermissions.canCancel && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'Confirmed', 'Reinstated and re-confirmed by front desk.')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Rebook */}
                      {b.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            if (!currentPermissions.canRebook) {
                              alert('Restricted: You do not have permission to rebook. Contact manager.');
                              return;
                            }
                            handleLoadBookingForRebook(b);
                          }}
                          disabled={!currentPermissions.canRebook}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            currentPermissions.canRebook
                              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                          }`}
                          title="Rebook"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Cancel */}
                      {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            if (!currentPermissions.canCancel) {
                              alert('Restricted: You do not have permission to cancel bookings. Contact manager.');
                              return;
                            }
                            setBookingToCancel(b);
                            setCancelReasonPreset('Guest Requested Cancellation');
                            setCancelRefundNotes(
                              b.paymentOption === 'partial_40' 
                                ? '40% downpayment forfeited as per policy' 
                                : 'Refund processed as per terms'
                            );
                          }}
                          disabled={!currentPermissions.canCancel}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            currentPermissions.canCancel
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                          }`}
                          title="Cancel"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Voucher */}
                      <button
                        onClick={() => onOpenVoucher(b)}
                        className="p-1.5 bg-[#F5EBE6] hover:bg-[#E6D7C3] text-[#2C1E15] rounded-lg transition-colors cursor-pointer"
                        title="Print Official Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {filteredBookings.length === 0 && (
            <div className="p-8 text-center text-xs text-[#786150]">
              No reservations found matching the current search or status filter.
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB: REVIEW SCREENING CONSOLE */}
      {activeSubTab === 'screening' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6D7C3]/40 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-amber-800" />
                <h3 className="font-serif font-bold text-xl text-[#2C1E15]">
                  Deposit Slip Review Screening
                </h3>
              </div>
              <p className="text-xs text-[#786150] mt-0.5">
                Audit pending GCash and bank transfer receipts, run verification checklist, and approve reservations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold font-mono">
                {pendingScreeningBookings.length} Pending Approval
              </span>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                <button
                  type="button"
                  onClick={() => setScreeningViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    screeningViewMode === 'grid'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreeningViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    screeningViewMode === 'table'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {pendingScreeningBookings.length === 0 ? (
            <div className="p-12 text-center bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E6D7C3] space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-serif font-bold text-base text-[#2C1E15]">All Deposit Slips Cleared!</h4>
              <p className="text-xs text-[#786150] max-w-md mx-auto">
                There are no pending deposit slips awaiting review screening at this time.
              </p>
              <button
                onClick={() => setActiveSubTab('bookings')}
                className="px-4 py-2 bg-[#2C1E15] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
              >
                Return to Bookings Table
              </button>
            </div>
          ) : screeningViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingScreeningBookings.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-[#FDFBF7] border border-[#E6D7C3] rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        {b.id}
                      </span>
                      <span className="text-[11px] text-[#786150]">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-[#2C1E15]">{b.guestName}</div>
                      <div className="text-xs text-emerald-800 font-mono font-semibold">{b.guestPhone}</div>
                      <div className="text-xs text-[#786150]">{b.roomTitle}</div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-3 bg-white rounded-xl border border-[#E6D7C3]/60 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#786150]">Total Rate:</span>
                        <strong className="text-[#2C1E15]">₱{b.grandTotal.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786150]">Deposit Required:</span>
                        <strong className="text-emerald-700 font-bold">
                          ₱{b.amountPaidNow.toLocaleString()} ({b.paymentOption === 'partial_40' ? '40%' : '100%'})
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786150]">Payment Method:</span>
                        <span className="font-semibold uppercase text-xs">{b.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Deposit Slip Preview Box */}
                    {b.paymentSlipUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#E6D7C3] bg-black/5 aspect-video flex items-center justify-center group">
                        <img 
                          src={b.paymentSlipUrl} 
                          alt="Slip" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <button
                          onClick={() => onOpenSlipLightbox(b)}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Inspect Full Slip</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center">
                        No slip image attached
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleStartScreening(b)}
                      disabled={!currentPermissions.canApproveSlips}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        currentPermissions.canApproveSlips
                          ? 'bg-amber-800 hover:bg-amber-900 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Screen & Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Screening: Table View */
            <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[11px]">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Guest Details</th>
                    <th className="py-3 px-4">Reserved Room</th>
                    <th className="py-3 px-4">Deposit Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Deposit Slip</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                  {pendingScreeningBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-950">
                        {b.id}
                        <span className="block text-[10px] text-[#786150] font-sans">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2C1E15]">{b.guestName}</div>
                        <div className="font-mono text-emerald-800 text-xs font-semibold">{b.guestPhone}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#2C1E15]">
                        {b.roomTitle}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-800 font-mono">
                          ₱{b.amountPaidNow.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#786150]">
                          of ₱{b.grandTotal.toLocaleString()} ({b.paymentOption === 'partial_40' ? '40% DP' : '100% Full'})
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold uppercase text-xs px-2 py-0.5 bg-[#F5EBE6] text-[#2C1E15] rounded-md border border-[#E6D7C3]">
                          {b.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {b.paymentSlipUrl ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={b.paymentSlipUrl} 
                              alt="Slip" 
                              className="w-9 h-9 object-cover rounded-lg border border-[#E6D7C3]"
                            />
                            <button
                              type="button"
                              onClick={() => onOpenSlipLightbox(b)}
                              className="px-2 py-1 bg-white hover:bg-gray-100 text-[#2C1E15] border border-[#E6D7C3] rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Zoom</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-rose-600 italic text-[11px]">Missing</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleStartScreening(b)}
                          disabled={!currentPermissions.canApproveSlips}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            currentPermissions.canApproveSlips
                              ? 'bg-amber-800 hover:bg-amber-900 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Screen & Approve</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: REBOOK UNDER BOOKING REFERENCE */}
      {activeSubTab === 'rebook' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-[#E6D7C3]/40 pb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-[#8B6B10]" />
              <h3 className="font-serif font-bold text-xl text-[#2C1E15]">
                Rebook Under Booking Reference
              </h3>
            </div>
            <p className="text-xs text-[#786150] mt-0.5">
              Change room, reschedule stay dates, and adjust pax under an existing reservation reference.
            </p>
          </div>

          {/* Reference Search Box */}
          <form onSubmit={handleSearchBookingToRebook} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Booking Ref (e.g. DV-2026-8941)"
              value={rebookRefInput}
              onChange={(e) => setRebookRefInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-mono font-bold text-[#2C1E15] uppercase outline-none focus:ring-2 focus:ring-[#B8860B]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#2C1E15] hover:bg-[#1A1009] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Load Booking</span>
            </button>
          </form>

          {rebookSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rebookSuccessMsg}</span>
            </div>
          )}

          {/* If Booking is Loaded */}
          {selectedRebookBooking && rebookingCalculation && (
            <form onSubmit={handleExecuteRebooking} className="space-y-5 bg-[#FDFBF7] p-5 sm:p-6 rounded-2xl border border-[#E6D7C3]">
              
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/60 pb-3">
                <div>
                  <span className="text-[11px] text-[#786150]">Active Reference:</span>
                  <div className="font-mono font-bold text-sm text-[#2C1E15]">{selectedRebookBooking.id}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#786150]">Guest:</span>
                  <div className="font-bold text-xs text-[#2C1E15]">{selectedRebookBooking.guestName}</div>
                </div>
              </div>

              {/* Room Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1.5">
                  Select Room / Villa Unit
                </label>
                <select
                  value={rebookRoomId}
                  onChange={(e) => setRebookRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} — ₱{r.pricing.nightly.toLocaleString()}/night ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nightly Dates vs Hourly */}
              {selectedRebookBooking.stayType === 'nightly' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">New Check-In Date</label>
                    <input
                      type="date"
                      required
                      value={rebookCheckIn}
                      onChange={(e) => setRebookCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">New Check-Out Date</label>
                    <input
                      type="date"
                      required
                      value={rebookCheckOut}
                      onChange={(e) => setRebookCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">Stay Date</label>
                    <input
                      type="date"
                      required
                      value={rebookHourlyDate}
                      onChange={(e) => setRebookHourlyDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={rebookHourlyTime}
                      onChange={(e) => setRebookHourlyTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">Duration</label>
                    <select
                      value={rebookHourlyHours}
                      onChange={(e) => setRebookHourlyHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    >
                      <option value={3}>3 Hours Block</option>
                      <option value={6}>6 Hours Block</option>
                      <option value={12}>12 Hours Block</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Guests Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">Adult Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={rebookAdults}
                    onChange={(e) => setRebookAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">Child Guests</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={rebookChildren}
                    onChange={(e) => setRebookChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                  />
                </div>
              </div>

              {/* Financial Recalculation Card */}
              <div className="bg-white p-4 rounded-xl border border-[#E6D7C3] space-y-2 text-xs">
                <div className="font-bold text-[#2C1E15] flex items-center justify-between border-b border-[#E6D7C3]/40 pb-1.5">
                  <span>Rate Recalculation</span>
                  <span className="text-[11px] text-indigo-700 font-sans">
                    {rebookingCalculation.nightsCount} Night(s) Stay
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">Previous Total:</span>
                  <span className="font-medium">₱{selectedRebookBooking.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">New Grand Total:</span>
                  <strong className="text-[#2C1E15]">₱{rebookingCalculation.newGrandTotal.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Already Paid Deposit:</span>
                  <strong className="font-mono font-bold">- ₱{rebookingCalculation.amountAlreadyPaid.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E6D7C3]/40 text-amber-900 font-bold">
                  <span>Adjusted Remaining Balance:</span>
                  <span className="font-mono">₱{rebookingCalculation.newRemainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1">Rebooking Reason / Remarks</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guest requested schedule adjustment due to flight change"
                  value={rebookReason}
                  onChange={(e) => setRebookReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRebookBooking(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2C1E15] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2C1E15] hover:bg-[#1A1009] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CalendarCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Confirm & Save Rebooking</span>
                </button>
              </div>

            </form>
          )}

          {/* If No Booking is Loaded: Quick Selection Directory with Grid & Table View */}
          {!selectedRebookBooking && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-2">
                <span className="text-xs font-bold text-[#2C1E15]">Or Select Active Reservation to Rebook:</span>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                  <button
                    type="button"
                    onClick={() => setRebookViewMode('table')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      rebookViewMode === 'table'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRebookViewMode('grid')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      rebookViewMode === 'grid'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                </div>
              </div>

              {rebookViewMode === 'table' ? (
                <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60 max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px] sticky top-0">
                        <th className="py-2.5 px-3">Ref</th>
                        <th className="py-2.5 px-3">Guest</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3">Schedule</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                      {bookings.filter(b => b.status !== 'Completed').map((b) => (
                        <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2C1E15]">{b.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#2C1E15]">{b.guestName}</td>
                          <td className="py-2.5 px-3 text-[#523A2A]">{b.roomTitle}</td>
                          <td className="py-2.5 px-3 text-[#786150]">
                            {b.stayType === 'nightly' ? `${b.checkInDate} to ${b.checkOutDate}` : `${b.hourlyDate}`}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleLoadBookingForRebook(b)}
                              className="px-2.5 py-1 bg-[#2C1E15] hover:bg-[#1A1009] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {bookings.filter(b => b.status !== 'Completed').map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleLoadBookingForRebook(b)}
                      className="p-3 bg-[#FDFBF7] border border-[#E6D7C3] hover:border-[#B8860B] rounded-2xl cursor-pointer transition-all space-y-1.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#2C1E15] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E6D7C3]">
                            {b.id}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800">
                            ₱{b.grandTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#2C1E15] mt-1">{b.guestName}</div>
                        <div className="text-[11px] text-[#523A2A]">{b.roomTitle}</div>
                        <div className="text-[10px] text-[#786150]">
                          {b.stayType === 'nightly' ? `${b.checkInDate} to ${b.checkOutDate}` : `${b.hourlyDate} (${b.hourlyDurationHours}h)`}
                        </div>
                      </div>
                      <div className="pt-1 border-t border-[#E6D7C3]/40 flex justify-end">
                        <span className="text-[10px] font-bold text-[#8B6B10] flex items-center gap-1">
                          <span>Rebook This</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: STAFF ACCOUNTS MANAGEMENT (RESTRICTED AREA) */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          
          {/* Permission Gate Check */}
          {!currentPermissions.canManageStaff ? (
            <div className="bg-white rounded-3xl border border-rose-300 shadow-xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-rose-900">Restricted Admin Area</h3>
              <p className="text-xs text-[#786150] leading-relaxed">
                Staff Account Management is restricted to <strong>Super Admin</strong> authorization. Your current role (<strong>{currentUser?.role || 'Staff'}</strong>) does not hold credentials to create or modify staff accounts.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveSubTab('bookings')}
                  className="px-5 py-2.5 bg-[#2C1E15] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Back to Bookings Console
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Create Staff Account Form */}
              <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-5 lg:col-span-1">
                <div className="border-b border-[#E6D7C3]/40 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#8B6B10]" />
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Create Staff Account</h3>
                  </div>
                  <p className="text-[11px] text-[#786150]">Add desk personnel with granular access controls.</p>
                </div>

                {staffCreateSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Staff account created successfully!</span>
                  </div>
                )}

                {staffActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{staffActionError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Full Staff Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan dela Cruz"
                      value={newStaffFullName}
                      onChange={(e) => setNewStaffFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-medium outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Username</label>
                      <input
                        type="text"
                        required
                        placeholder="juan_desk"
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Role Assignment</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => applyRolePreset(e.target.value as StaffRole)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-semibold text-[#2C1E15] outline-none"
                    >
                      <option value="Super Admin">Super Admin (All Access)</option>
                      <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                      <option value="Front Desk Officer">Front Desk Officer</option>
                      <option value="Reservations Clerk">Reservations Clerk</option>
                      <option value="Night Auditor">Night Auditor</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="0917 000 0000"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="staff@vigan.ph"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] outline-none"
                      />
                    </div>
                  </div>

                  {/* Permissions Checklist Area */}
                  <div className="pt-2 space-y-2 border-t border-[#E6D7C3]/40">
                    <label className="block font-bold text-[#2C1E15] uppercase text-[10px] tracking-wider">
                      Restricted Area Permissions
                    </label>
                    
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canApproveSlips}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canApproveSlips: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Review & Approve Slips</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canRebook}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canRebook: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Rebook Reservations</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canCancel}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canCancel: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Cancel Bookings & Void Slips</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canWalkin}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canWalkin: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Walk-in On-site Check-in</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canViewFinancials}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canViewFinancials: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>View Financial Totals & Reports</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-rose-800">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canManageStaff}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canManageStaff: e.target.checked }))}
                          className="rounded text-rose-800"
                        />
                        <span>Manage Staff Accounts (Restricted)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#2C1E15] hover:bg-[#1A1009] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                    <span>Create Staff Account</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Staff Accounts Directory */}
              <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-4 lg:col-span-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/40 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Active Staff Accounts</h3>
                    <p className="text-xs text-[#786150]">Manage authorized front desk and estate operations accounts.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#F5EBE6] text-[#2C1E15] rounded-full text-xs font-bold border border-[#E6D7C3]">
                      {staffAccounts.length} Registered
                    </span>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                      <button
                        type="button"
                        onClick={() => setStaffViewMode('table')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          staffViewMode === 'table'
                            ? 'bg-[#2C1E15] text-white shadow-sm'
                            : 'text-[#523A2A] hover:bg-white/60'
                        }`}
                        title="Table View"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffViewMode('grid')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          staffViewMode === 'grid'
                            ? 'bg-[#2C1E15] text-white shadow-sm'
                            : 'text-[#523A2A] hover:bg-white/60'
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                    </div>
                  </div>
                </div>

                {staffViewMode === 'table' ? (
                  <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px]">
                          <th className="py-2.5 px-3">Staff Name & User</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Contact Details</th>
                          <th className="py-2.5 px-3">Granted Permissions</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                        {staffAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-[#FDFBF7] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-[#2C1E15]">{acc.fullName}</div>
                              <div className="font-mono text-[11px] text-[#786150]">@{acc.username}</div>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                acc.role === 'Super Admin'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : acc.role === 'Front Desk Supervisor'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}>
                                {acc.role}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-[11px] text-[#523A2A]">
                              {acc.phone && <div className="font-mono">{acc.phone}</div>}
                              {acc.email && <div className="text-[#786150] text-[10px]">{acc.email}</div>}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {acc.permissions.canApproveSlips && (
                                  <span className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                                    Slips
                                  </span>
                                )}
                                {acc.permissions.canRebook && (
                                  <span className="text-[9px] bg-[#FAF7F2] text-[#2C1E15] border border-[#E6D7C3] px-1.5 py-0.2 rounded font-medium">
                                    Rebook
                                  </span>
                                )}
                                {acc.permissions.canCancel && (
                                  <span className="text-[9px] bg-rose-50 text-rose-900 border border-rose-200 px-1.5 py-0.2 rounded">
                                    Cancel
                                  </span>
                                )}
                                {acc.permissions.canWalkin && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded">
                                    Walkin
                                  </span>
                                )}
                                {acc.permissions.canManageStaff && (
                                  <span className="text-[9px] bg-[#F5EDE0] text-[#3D2616] border border-[#D9C5B0] px-1.5 py-0.2 rounded font-bold">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              {acc.isActive ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                  Active
                                </span>
                              ) : (
                                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold border border-rose-200">
                                  Deactivated
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {acc.username !== 'admin' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleStaffStatus(acc.id)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                      acc.isActive
                                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                    }`}
                                  >
                                    {acc.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(acc.id)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete account"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-[#786150] px-2 py-0.5 bg-gray-100 rounded-md">
                                  Root
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {staffAccounts.map((acc) => (
                      <div 
                        key={acc.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          acc.isActive ? 'bg-[#FDFBF7] border-[#E6D7C3]' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-sm text-[#2C1E15] block">{acc.fullName}</strong>
                              <span className="font-mono text-xs font-bold text-[#786150]">@{acc.username}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              acc.role === 'Super Admin'
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : acc.role === 'Front Desk Supervisor'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}>
                              {acc.role}
                            </span>
                          </div>

                          <div className="text-xs text-[#786150] space-y-0.5">
                            {acc.phone && <div className="flex items-center gap-1 font-mono text-[11px]"><Phone className="w-3 h-3 text-[#2C1E15]" /> {acc.phone}</div>}
                            {acc.email && <div className="flex items-center gap-1 text-[11px]"><Mail className="w-3 h-3 text-[#2C1E15]" /> {acc.email}</div>}
                          </div>

                          {/* Granted permissions badges */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {acc.permissions.canApproveSlips && (
                              <span className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                                Approve Slips
                              </span>
                            )}
                            {acc.permissions.canRebook && (
                              <span className="text-[9px] bg-[#FAF7F2] text-[#2C1E15] border border-[#E6D7C3] px-1.5 py-0.2 rounded font-medium">
                                Rebook
                              </span>
                            )}
                            {acc.permissions.canCancel && (
                              <span className="text-[9px] bg-rose-50 text-rose-900 border border-rose-200 px-1.5 py-0.2 rounded">
                                Cancel
                              </span>
                            )}
                            {acc.permissions.canWalkin && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded">
                                Walkin
                              </span>
                            )}
                            {acc.permissions.canManageStaff && (
                              <span className="text-[9px] bg-[#F5EDE0] text-[#3D2616] border border-[#D9C5B0] px-1.5 py-0.2 rounded font-bold">
                                Staff Admin
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E6D7C3]/40">
                          <div>
                            {acc.isActive ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                                Deactivated
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {acc.username !== 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleToggleStaffStatus(acc.id)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                    acc.isActive
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  {acc.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(acc.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                  title="Delete account"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-[#786150] px-2 py-0.5 bg-white rounded-lg border border-[#E6D7C3]">
                                Primary Root
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: INQUIRIES LOG */}
      {activeSubTab === 'inquiries' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/40 pb-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Direct Website Inquiries</h3>
              <p className="text-xs text-[#786150]">Submissions from the "Contact Us" form</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-[#F5EBE6] text-[#2C1E15] px-3 py-1 rounded-full border border-[#E6D7C3]">
                {inquiries.length} Total Messages
              </span>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                <button
                  type="button"
                  onClick={() => setInquiriesViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    inquiriesViewMode === 'table'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInquiriesViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    inquiriesViewMode === 'grid'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#786150]">
              No group inquiries submitted yet. Guest inquiries from the Contact tab will show up here.
            </div>
          ) : inquiriesViewMode === 'table' ? (
            <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Room Interest & Dates</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3 px-4 text-[11px] text-[#786150] whitespace-nowrap">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 font-bold text-[#2C1E15]">
                        {inq.fullName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-emerald-800 font-semibold">{inq.phone}</div>
                        {inq.email && <div className="text-[10px] text-[#786150]">{inq.email}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-amber-900 block">{inq.roomInterest}</span>
                        {inq.targetDates && (
                          <span className="text-[10px] text-[#786150]">Dates: {inq.targetDates}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-xs text-[#523A2A]">
                          "{inq.message || 'No extra message provided.'}"
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${inq.phone}`}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${inq.phone.replace(/[\s-]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#25D366] hover:brightness-105 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                          >
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E6D7C3]/70 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[#2C1E15]">{inq.fullName}</strong>
                      <span className="text-[10px] text-[#786150]">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-800 font-mono font-semibold flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{inq.phone}</span>
                      {inq.email && <span className="text-gray-500 font-sans text-[11px]">({inq.email})</span>}
                    </div>

                    <div className="text-xs font-semibold text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      Interest: {inq.roomInterest} {inq.targetDates ? `• ${inq.targetDates}` : ''}
                    </div>

                    <p className="text-xs text-[#523A2A] bg-white p-3 rounded-xl border border-[#E6D7C3]/40 leading-relaxed">
                      "{inq.message || 'No extra message provided.'}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#E6D7C3]/40">
                    <a
                      href={`tel:${inq.phone}`}
                      className="flex-1 text-center py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Call Guest
                    </a>
                    <a
                      href={`https://wa.me/${inq.phone.replace(/[\s-]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-1.5 bg-[#25D366] hover:brightness-105 text-white rounded-xl text-xs font-bold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: QUICK WALK-IN REGISTRATION & ROOM MATRIX */}
      {activeSubTab === 'walkin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Walk-in Registration Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-7 space-y-5">
              <div className="border-b border-[#E6D7C3]/40 pb-3">
                <h3 className="font-serif font-bold text-xl text-[#2C1E15]">
                  Fast Walk-in Registration
                </h3>
                <p className="text-xs text-[#786150]">
                  Register instant road transit arrivals and generate their key voucher.
                </p>
              </div>

              {walkinSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Walk-in guest successfully registered and checked in!</span>
                </div>
              )}

              <form onSubmit={handleCreateWalkin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Walk-in guest name"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-medium text-[#2C1E15] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    required
                    placeholder="0917 000 0000"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-medium text-[#2C1E15] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Room Assignment</label>
                  <select
                    value={walkinRoomId}
                    onChange={(e) => setWalkinRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-semibold text-[#2C1E15] outline-none"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — ₱{r.pricing.nightly.toLocaleString()}/night ({r.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Nights</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={walkinNights}
                      onChange={(e) => setWalkinNights(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-bold text-[#2C1E15] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Payment</label>
                    <select
                      value={walkinPaymentOption}
                      onChange={(e) => setWalkinPaymentOption(e.target.value as 'full' | 'partial_40')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-semibold text-[#2C1E15] outline-none"
                    >
                      <option value="full">100% Full Cash</option>
                      <option value="partial_40">40% Downpayment</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!currentPermissions.canWalkin}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                    currentPermissions.canWalkin
                      ? 'bg-[#2C1E15] hover:bg-[#523A2A] text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Walk-In & Check-In
                </button>
              </form>
            </div>

            {/* Room Availability Matrix with Grid & Table View Option */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/40 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Room Inventory Matrix</h3>
                  <p className="text-xs text-[#786150]">Click any unit to auto-assign into the walk-in registration</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                  <button
                    type="button"
                    onClick={() => setWalkinViewMode('grid')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      walkinViewMode === 'grid'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkinViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      walkinViewMode === 'table'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>
              </div>

              {walkinViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                  {rooms.map((r) => {
                    const isSelected = walkinRoomId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setWalkinRoomId(r.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-600/30'
                            : 'bg-[#FDFBF7] border-[#E6D7C3] hover:border-amber-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              {r.category}
                            </span>
                            <span className="font-mono font-bold text-xs text-emerald-800">
                              ₱{r.pricing.nightly.toLocaleString()}/night
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-[#2C1E15] leading-snug">{r.title}</h4>
                          <p className="text-[11px] text-[#786150] line-clamp-1">{r.beds}</p>
                          <div className="text-[10px] text-[#786150]">
                            Max {r.capacity.maxGuests} Guests • {r.capacity.recommended}
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between border-t border-[#E6D7C3]/40">
                          <span className="text-[11px] font-semibold text-emerald-700">Available Instant Key</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            isSelected ? 'bg-amber-600 text-white' : 'bg-white text-[#2C1E15] border border-[#E6D7C3]'
                          }`}>
                            {isSelected ? 'Selected' : 'Select Unit'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60 max-h-[520px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px] sticky top-0">
                        <th className="py-2.5 px-3">Room / Unit</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Capacity</th>
                        <th className="py-2.5 px-3">Nightly Rate</th>
                        <th className="py-2.5 px-3 text-right">Assign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                      {rooms.map((r) => {
                        const isSelected = walkinRoomId === r.id;
                        return (
                          <tr
                            key={r.id}
                            onClick={() => setWalkinRoomId(r.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-50/80 font-bold' : 'hover:bg-[#FDFBF7]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#2C1E15]">{r.title}</div>
                              <div className="text-[10px] text-[#786150] font-normal">{r.beds}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] bg-[#F5EBE6] text-[#2C1E15] px-2 py-0.5 rounded font-semibold">
                                {r.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#786150]">
                              Max {r.capacity.maxGuests} pax
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                              ₱{r.pricing.nightly.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWalkinRoomId(r.id);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  isSelected
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-[#F5EBE6] hover:bg-[#E6D7C3] text-[#2C1E15]'
                                }`}
                              >
                                {isSelected ? 'Assigned' : 'Assign'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REVIEW SCREENING MODAL */}
      {screeningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-3xl w-full border-2 border-amber-500 shadow-2xl overflow-hidden flex flex-col my-auto text-[#2C211A] max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-900 to-[#2C1E15] text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-amber-300" />
                <div>
                  <span className="font-serif font-bold text-base block">Deposit Slip Screening Verification</span>
                  <span className="text-[11px] text-amber-200 font-mono">Ref: {screeningBooking.id}</span>
                </div>
              </div>
              <button
                onClick={() => setScreeningBooking(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Split: Slip Preview on Left, Verification on Right */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Left: Slip Preview */}
              <div className="space-y-3">
                <label className="block font-bold text-[#2C1E15] uppercase text-[10px] tracking-wider">
                  Uploaded Payment Slip Image
                </label>
                {screeningBooking.paymentSlipUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E6D7C3] bg-black/10 aspect-[3/4] flex items-center justify-center group">
                    <img 
                      src={screeningBooking.paymentSlipUrl} 
                      alt="Slip Zoom" 
                      className="w-full h-full object-contain" 
                    />
                    <button
                      type="button"
                      onClick={() => onOpenSlipLightbox(screeningBooking)}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom View</span>
                    </button>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                    No image file uploaded
                  </div>
                )}
              </div>

              {/* Right: Verification Checklist */}
              <div className="space-y-4">
                
                {/* Booking Snapshot */}
                <div className="bg-white p-4 rounded-2xl border border-[#E6D7C3] space-y-2">
                  <div className="font-bold text-sm text-[#2C1E15] border-b border-[#E6D7C3]/50 pb-1.5">
                    {screeningBooking.guestName}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786150]">Phone Contact:</span>
                    <strong className="font-mono text-[#2C1E15]">{screeningBooking.guestPhone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786150]">Reserved Room:</span>
                    <span className="font-semibold text-[#2C1E15]">{screeningBooking.roomTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786150]">Total Stay Cost:</span>
                    <strong className="text-[#2C1E15]">₱{screeningBooking.grandTotal.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <span className="text-emerald-900 font-bold">Deposit to Verify:</span>
                    <strong className="text-emerald-900 font-mono text-sm font-bold">
                      ₱{screeningBooking.amountPaidNow.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Screening Verification Checklist */}
                <div className="space-y-2.5">
                  <label className="block font-bold text-[#2C1E15] uppercase text-[10px] tracking-wider">
                    Staff Verification Checks
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E6D7C3] bg-white hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkImageVerified}
                      onChange={(e) => setCheckImageVerified(e.target.checked)}
                      className="mt-0.5 rounded text-amber-800"
                    />
                    <div>
                      <span className="font-bold text-[#2C1E15] block text-[11px]">Legitimate & Clear Slip</span>
                      <span className="text-[10px] text-[#786150]">Confirmed transaction receipt timestamp & merchant details.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E6D7C3] bg-white hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAmountVerified}
                      onChange={(e) => setCheckAmountVerified(e.target.checked)}
                      className="mt-0.5 rounded text-amber-800"
                    />
                    <div>
                      <span className="font-bold text-[#2C1E15] block text-[11px]">Deposit Amount Matches (₱{screeningBooking.amountPaidNow.toLocaleString()})</span>
                      <span className="text-[10px] text-[#786150]">Correct downpayment or full payment received.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E6D7C3] bg-white hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkRefNumberVerified}
                      onChange={(e) => setCheckRefNumberVerified(e.target.checked)}
                      className="mt-0.5 rounded text-amber-800"
                    />
                    <div>
                      <span className="font-bold text-[#2C1E15] block text-[11px]">Ref / Trans ID Match</span>
                      <span className="text-[10px] text-[#786150]">Cross-checked with GCash or bank merchant notifications.</span>
                    </div>
                  </label>
                </div>

                {/* Staff Confirmation Remarks */}
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Approval Notes / Receipt Log</label>
                  <input
                    type="text"
                    value={screeningStaffNotes}
                    onChange={(e) => setScreeningStaffNotes(e.target.value)}
                    placeholder="e.g. GCash Ref verified, 40% downpayment posted"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                  />
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#F5EBE6] p-4 px-6 border-t border-[#E6D7C3] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleRejectScreening('Deposit slip rejected during screening verification.')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject & Void</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreeningBooking(null)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleApproveScreening}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Confirm Booking</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-lg w-full border-2 border-rose-300 shadow-2xl overflow-hidden flex flex-col my-auto text-[#2C211A]">
            
            <div className="bg-rose-700 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-200" />
                <span className="font-serif font-bold text-base">Cancel Reservation</span>
              </div>
              <button
                onClick={() => setBookingToCancel(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Release Dates & Void Reservation</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Cancelling booking <strong className="font-mono">{bookingToCancel.id}</strong> ({bookingToCancel.guestName}) will void this voucher and immediately open the reserved dates for other guests on the availability calendar.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E6D7C3] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#786150]">Reserved Room:</span>
                  <strong className="text-[#2C1E15]">{bookingToCancel.roomTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">Dates:</span>
                  <span className="font-medium text-[#2C1E15]">
                    {bookingToCancel.stayType === 'nightly'
                      ? `${bookingToCancel.checkInDate} to ${bookingToCancel.checkOutDate}`
                      : `${bookingToCancel.hourlyDate} (${bookingToCancel.hourlyDurationHours} hrs)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">Paid Amount:</span>
                  <strong className="text-emerald-700">₱{bookingToCancel.amountPaidNow.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1.5">
                  Cancellation Reason
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Guest Requested Cancellation">Guest Requested Cancellation</option>
                  <option value="Deposit Slip Rejected / Unverified">Deposit Slip Rejected / Unverified</option>
                  <option value="Guest No-Show">Guest No-Show / Did Not Arrive</option>
                  <option value="Rescheduled / Date Changed">Rescheduled / Date Changed</option>
                  <option value="Severe Weather / Force Majeure">Severe Weather / Force Majeure</option>
                  <option value="Duplicate Reservation">Duplicate Reservation</option>
                  <option value="Other Operational Reason">Other Operational Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1.5">
                  Refund Status & Policy Remarks
                </label>
                <textarea
                  rows={2}
                  value={cancelRefundNotes}
                  onChange={(e) => setCancelRefundNotes(e.target.value)}
                  placeholder="e.g. 40% downpayment forfeited as per policy, or refund processed via GCash #..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="bg-[#F5EBE6] p-4 px-6 border-t border-[#E6D7C3] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => {
                  const combinedNote = `[CANCELLED] ${cancelReasonPreset}${cancelRefundNotes ? ` — ${cancelRefundNotes}` : ''}`;
                  onUpdateBookingStatus(bookingToCancel.id, 'Cancelled', combinedNote);
                  setBookingToCancel(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Cancellation</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW CANCELLATION DETAILS MODAL */}
      {viewingCancellationBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-md w-full border border-rose-300 shadow-2xl overflow-hidden flex flex-col my-auto text-[#2C211A]">
            <div className="bg-rose-800 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-300" />
                <span className="font-serif font-bold text-base">Cancellation Audit Log</span>
              </div>
              <button
                onClick={() => setViewingCancellationBooking(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E6D7C3] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#786150]">Booking Reference:</span>
                  <strong className="font-mono text-[#2C1E15]">{viewingCancellationBooking.id}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#786150]">Guest:</span>
                  <strong className="text-[#2C1E15]">{viewingCancellationBooking.guestName}</strong>
                </div>
                {viewingCancellationBooking.cancelledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#786150]">Cancelled On:</span>
                    <span className="text-[#2C1E15]">{new Date(viewingCancellationBooking.cancelledAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#786150] uppercase tracking-wider block">
                  Recorded Cancellation Reason & Remarks
                </label>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs leading-relaxed font-medium">
                  {viewingCancellationBooking.cancellationReason || viewingCancellationBooking.staffNotes || 'No specific reason recorded.'}
                </div>
              </div>
            </div>

            <div className="bg-[#F5EBE6] p-4 px-6 border-t border-[#E6D7C3] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdateBookingStatus(viewingCancellationBooking.id, 'Confirmed', 'Reinstated and re-confirmed by front desk.');
                  setViewingCancellationBooking(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Booking</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingCancellationBooking(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
