import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  RoomUnit, 
  StayType, 
  BookingAddonItem, 
  PaymentOption, 
  PaymentMethod, 
  BookingRecord 
} from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus, 
  Minus, 
  Check, 
  Copy, 
  Upload, 
  AlertCircle, 
  CreditCard, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Receipt,
  DollarSign,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Waves,
  Sparkles,
  Wind,
  Wifi,
  Car,
  UtensilsCrossed,
  Lock
} from 'lucide-react';
import { VillaLogo } from './VillaLogo';
import { INITIAL_BOOKINGS } from '../data/roomsData';

interface BookingEngineTabProps {
  rooms: RoomUnit[];
  availableAddons: BookingAddonItem[];
  existingBookings?: BookingRecord[];
  preselectedRoomId?: string;
  preselectedStayType?: StayType;
  onBookingCreated: (booking: BookingRecord) => void;
  onBack?: () => void;
}

export const BookingEngineTab: React.FC<BookingEngineTabProps> = ({
  rooms,
  availableAddons,
  existingBookings,
  preselectedRoomId,
  preselectedStayType,
  onBookingCreated,
  onBack,
}) => {
  // Step 1: Room Selection
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    preselectedRoomId || rooms[0]?.id || ''
  );
  const [preferredRoomNumber, setPreferredRoomNumber] = useState<string>('Any Available');

  // Step 2: Stay Type & Schedule
  const [stayType, setStayType] = useState<StayType>(
    preselectedStayType || 'nightly'
  );

  // Today and Tomorrow default dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);

  const [hourlyDate, setHourlyDate] = useState<string>(todayStr);
  const [hourlyStartTime, setHourlyStartTime] = useState<string>('14:00');
  const [hourlyDuration, setHourlyDuration] = useState<3 | 6 | 12>(3);

  // Availability Calendar state: Current viewing month
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());
  const [calendarNotice, setCalendarNotice] = useState<string>('');

  // Guest Count
  const [adultGuests, setAdultGuests] = useState<number>(2);
  const [childGuests, setChildGuests] = useState<number>(0);

  // Step 3: Add-ons state with quantity map
  const [addonQuantities, setAddonQuantities] = useState<{ [addonId: string]: number }>({
    breakfast_set: 0,
    extra_pad: 0,
    extra_pax: 0,
    billiards_darts: 0,
    tour_van: 0,
  });

  // Step 4: Guest Contact Details
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ [field: string]: string }>({});

  // Step 5: Payment Option (100% Full vs 40% Partial Downpayment)
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('partial_40');

  // Step 6: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');

  // Step 7: Mandatory Payment Slip Upload
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);
  const [slipUploadError, setSlipUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Update room when preselected props change
  useEffect(() => {
    if (preselectedRoomId) {
      setSelectedRoomId(preselectedRoomId);
    }
    if (preselectedStayType) {
      setStayType(preselectedStayType);
    }
  }, [preselectedRoomId, preselectedStayType]);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  // Total pax headcount
  const totalPax = useMemo(() => {
    return Math.max(1, adultGuests + childGuests);
  }, [adultGuests, childGuests]);

  // Compute booked dates for currently selected room unit
  const bookedDatesSet = useMemo(() => {
    const set = new Set<string>();
    const list = existingBookings && existingBookings.length > 0 ? existingBookings : INITIAL_BOOKINGS;

    list.forEach((b) => {
      if (b.roomId === selectedRoomId && b.status !== 'Cancelled') {
        if (b.stayType === 'nightly' && b.checkInDate && b.checkOutDate) {
          const cur = new Date(b.checkInDate);
          const end = new Date(b.checkOutDate);
          while (cur < end) {
            set.add(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }
        } else if (b.hourlyDate) {
          set.add(b.hourlyDate);
        }
      }
    });

    return set;
  }, [existingBookings, selectedRoomId]);

  // Compute number of nights for nightly stays
  const calculatedNights = useMemo(() => {
    if (stayType !== 'nightly') return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [stayType, checkInDate, checkOutDate]);

  // Helper: Get exact rate for a single night given date, room, and pax
  const getNightlyRateForDate = (date: Date, room: RoomUnit, pax: number): number => {
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    // Mon to Thu: 1, 2, 3, 4 | Fri to Sun: 5, 6, 0
    const isWeekend = day === 0 || day === 5 || day === 6;

    if (room.id === 'private-villa-pool') {
      const baseRate = isWeekend ? 8000 : 7000;
      const extraPax = Math.max(0, pax - 10);
      const extraFee = extraPax * (room.extraPaxFee || 500);
      return baseRate + extraFee;
    }

    if (room.paxRates && room.paxRates.length > 0) {
      // Find matching tier where pax fits
      const tier = room.paxRates.find((t) => pax <= t.pax) || room.paxRates[room.paxRates.length - 1];
      return isWeekend ? tier.weekendRate : tier.weekdayRate;
    }

    return room.pricing.nightly;
  };

  // Night-by-night breakdown with day names and rates
  const nightlyBreakdown = useMemo(() => {
    if (!selectedRoom || stayType !== 'nightly') return [];
    const list: { dateStr: string; label: string; isWeekend: boolean; rate: number }[] = [];
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    const cur = new Date(start);
    while (cur < end) {
      const dateStr = cur.toISOString().split('T')[0];
      const day = cur.getDay();
      const isWeekend = day === 0 || day === 5 || day === 6;
      const label = cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const rate = getNightlyRateForDate(cur, selectedRoom, totalPax);
      list.push({ dateStr, label, isWeekend, rate });
      cur.setDate(cur.getDate() + 1);
    }

    // Safety fallback if checkInDate >= checkOutDate
    if (list.length === 0) {
      const cur = new Date(checkInDate);
      const day = cur.getDay();
      const isWeekend = day === 0 || day === 5 || day === 6;
      const label = cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const rate = getNightlyRateForDate(cur, selectedRoom, totalPax);
      list.push({ dateStr: checkInDate, label, isWeekend, rate });
    }

    return list;
  }, [selectedRoom, stayType, checkInDate, checkOutDate, totalPax]);

  // Base stay cost computation
  const baseStayRate = useMemo(() => {
    if (!selectedRoom) return 0;
    if (stayType === 'nightly') {
      return nightlyBreakdown.reduce((sum, item) => sum + item.rate, 0);
    } else {
      if (hourlyDuration === 3) return selectedRoom.pricing.hourly3hr || 500;
      if (hourlyDuration === 6) return selectedRoom.pricing.hourly6hr || 800;
      return selectedRoom.pricing.hourly12hr || 1100;
    }
  }, [selectedRoom, stayType, nightlyBreakdown, hourlyDuration]);

  // Add-ons total cost computation
  const addonsTotal = useMemo(() => {
    let sum = 0;
    availableAddons.forEach((addon) => {
      const qty = addonQuantities[addon.id] || 0;
      if (qty > 0) {
        if (addon.isPerNight && stayType === 'nightly') {
          sum += addon.price * qty * calculatedNights;
        } else {
          sum += addon.price * qty;
        }
      }
    });
    return sum;
  }, [availableAddons, addonQuantities, stayType, calculatedNights]);

  // Grand Total & Payment Split
  const grandTotal = useMemo(() => {
    const total = baseStayRate + addonsTotal;
    return total > 0 ? total : 0;
  }, [baseStayRate, addonsTotal]);

  const amountPayableNow = useMemo(() => {
    if (paymentOption === 'full') {
      return grandTotal;
    } else {
      // 40% partial downpayment
      return Math.round(grandTotal * 0.4);
    }
  }, [paymentOption, grandTotal]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, grandTotal - amountPayableNow);
  }, [grandTotal, amountPayableNow]);

  // Addon adjust helper
  const handleAdjustAddon = (addonId: string, delta: number) => {
    setAddonQuantities((prev) => {
      const current = prev[addonId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [addonId]: next };
    });
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Mandatory Slip File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlipUploadError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (< 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSlipUploadError('Payment slip file exceeds 10MB limit. Please upload a smaller image.');
        return;
      }

      setSlipFile(file);
      const preview = URL.createObjectURL(file);
      setSlipPreviewUrl(preview);
      
      if (formErrors.paymentSlip) {
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next.paymentSlip;
          return next;
        });
      }
    }
  };

  const handleRemoveSlip = () => {
    setSlipFile(null);
    if (slipPreviewUrl) {
      URL.revokeObjectURL(slipPreviewUrl);
      setSlipPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calendar Day Status Logic
  const getDateClassification = (dateStr: string) => {
    // 1. Past dates
    if (dateStr < todayStr) {
      return {
        type: 'past',
        bg: 'bg-gray-200 text-gray-400 cursor-not-allowed line-through',
        badge: 'Past',
      };
    }

    // 2. Currently Selected Date(s) -> Green
    if (stayType === 'nightly') {
      if (dateStr === checkInDate || dateStr === checkOutDate) {
        return {
          type: 'selected',
          bg: 'bg-emerald-600 text-white font-black ring-2 ring-emerald-300 shadow-md',
          badge: dateStr === checkInDate ? 'Check-in' : 'Check-out',
        };
      }
      if (checkInDate && checkOutDate && dateStr > checkInDate && dateStr < checkOutDate) {
        return {
          type: 'selected_range',
          bg: 'bg-emerald-500 text-white font-bold ring-1 ring-emerald-300',
          badge: 'Stay',
        };
      }
    } else {
      if (dateStr === hourlyDate) {
        return {
          type: 'selected',
          bg: 'bg-emerald-600 text-white font-black ring-2 ring-emerald-300 shadow-md',
          badge: 'Selected',
        };
      }
    }

    // 3. Booked Date -> Red
    if (bookedDatesSet.has(dateStr)) {
      return {
        type: 'booked',
        bg: 'bg-red-500 text-white font-bold shadow-xs',
        badge: 'Booked',
      };
    }

    // 4. Otherwise -> Orange (Available)
    return {
      type: 'available',
      bg: 'bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-xs cursor-pointer',
      badge: 'Available',
    };
  };

  // Calendar Date Click Handler
  const handleCalendarDateClick = (dateStr: string) => {
    if (dateStr < todayStr) return;

    if (bookedDatesSet.has(dateStr)) {
      setCalendarNotice(`Date ${dateStr} is booked for ${selectedRoom.title}. Please pick an orange (available) date.`);
      setTimeout(() => setCalendarNotice(''), 4500);
      return;
    }

    setCalendarNotice('');

    if (stayType === 'nightly') {
      if (checkInDate && checkOutDate) {
        // Start fresh range
        setCheckInDate(dateStr);
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(nextDay.toISOString().split('T')[0]);
      } else if (checkInDate && !checkOutDate) {
        if (dateStr > checkInDate) {
          setCheckOutDate(dateStr);
        } else {
          setCheckInDate(dateStr);
          const nextDay = new Date(dateStr);
          nextDay.setDate(nextDay.getDate() + 1);
          setCheckOutDate(nextDay.toISOString().split('T')[0]);
        }
      } else {
        setCheckInDate(dateStr);
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(nextDay.toISOString().split('T')[0]);
      }
    } else {
      setHourlyDate(dateStr);
    }
  };

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    const padding = Array.from({ length: firstDayIndex }, (_, i) => null);
    const days = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return { dayNum, dateStr };
    });

    return { padding, days, year, month };
  }, [calendarViewDate]);

  const monthLabel = useMemo(() => {
    return calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarViewDate]);

  // Handle Form Submission
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!guestName.trim()) {
      errors.guestName = 'Please enter guest full name';
    }

    if (!guestPhone.trim()) {
      errors.guestPhone = 'Compulsory: Active mobile phone number is required for SMS check-in details';
    } else if (guestPhone.trim().length < 7) {
      errors.guestPhone = 'Please enter a valid phone number (e.g. 0917 568 1408)';
    }

    // MANDATORY SLIP VALIDATION
    if (!slipFile && !slipPreviewUrl) {
      errors.paymentSlip = 'MANDATORY: You must upload a screenshot or photo of your payment deposit slip before submitting.';
      setSlipUploadError('Payment slip is required to lock this reservation.');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setFormErrors({});

    const formattedRoomTitle = preferredRoomNumber && preferredRoomNumber !== 'Any Available'
      ? `${selectedRoom.title} (${preferredRoomNumber})`
      : selectedRoom.title;

    // Build confirmed booking record
    const newBooking: BookingRecord = {
      id: `DV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      roomId: selectedRoom.id,
      roomTitle: formattedRoomTitle,
      stayType: stayType,
      checkInDate: stayType === 'nightly' ? checkInDate : undefined,
      checkOutDate: stayType === 'nightly' ? checkOutDate : undefined,
      numberOfNights: stayType === 'nightly' ? calculatedNights : undefined,
      hourlyDate: stayType === 'hourly' ? hourlyDate : undefined,
      hourlyStartTime: stayType === 'hourly' ? hourlyStartTime : undefined,
      hourlyDurationHours: stayType === 'hourly' ? hourlyDuration : undefined,
      adultGuests: adultGuests,
      childGuests: childGuests,
      addons: availableAddons
        .filter((addon) => (addonQuantities[addon.id] || 0) > 0)
        .map((addon) => {
          const qty = addonQuantities[addon.id];
          const cost = addon.isPerNight && stayType === 'nightly' 
            ? addon.price * qty * calculatedNights 
            : addon.price * qty;
          return {
            id: addon.id,
            name: addon.name,
            quantity: qty,
            cost: cost,
          };
        }),
      baseRatePerUnit: Math.round(baseStayRate / (stayType === 'nightly' ? calculatedNights : 1)),
      baseStayTotal: baseStayRate,
      addonsTotal: addonsTotal,
      discountAmount: 0,
      grandTotal: grandTotal,
      paymentOption: paymentOption,
      amountPaidNow: amountPayableNow,
      remainingBalance: remainingBalance,
      paymentMethod: paymentMethod,
      paymentSlipUrl: slipPreviewUrl || undefined,
      paymentSlipFileName: slipFile?.name || 'payment_slip.jpg',
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim() || undefined,
      status: 'Pending Slip Review',
      staffNotes: `Online reservation for ${formattedRoomTitle}. Occupancy: ${totalPax} pax. Payment: ${paymentOption === 'partial_40' ? '40% Partial Downpayment' : '100% Full Payment'}. Slip attached.`,
    };

    onBookingCreated(newBooking);
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] hover:bg-[#F5EBE6] shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Explore Rooms</span>
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 bg-[#E6D7C3]/40 border border-[#E6D7C3] px-3.5 py-1 rounded-full text-xs font-bold text-[#2C1E15] uppercase tracking-wider">
          <VillaLogo size={18} variant="dark" />
          <span>Real-time Rate Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C1E15]">
          Enjoy Your Stay
        </h2>
        <p className="text-sm sm:text-base text-[#786150]">
          Instant price computation based on guest count and day of week, 40% partial downpayment option, transparent add-ons, and immediate booking voucher generation.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Booking Engine Form */}
        <div className="lg:col-span-8 space-y-8">
          
          <form onSubmit={handleSubmitBooking} className="space-y-8">
            
            {/* STEP 1: Select Accommodation Unit (Dropdown Option for all rooms) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D7C3]/60 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#2C1E15] text-white font-bold flex items-center justify-center text-sm">
                    1
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Select Accommodation Unit</h3>
                    <p className="text-xs text-[#786150]">Choose your preferred room from the dropdown menu</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {selectedRoom.category}
                </span>
              </div>

              {/* Room Selection Dropdown */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] uppercase tracking-wider mb-1.5">
                    Accommodation Unit (All Rooms)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRoomId}
                      onChange={(e) => {
                        setSelectedRoomId(e.target.value);
                        setPreferredRoomNumber('Any Available');
                      }}
                      className="w-full appearance-none px-4 py-3.5 pr-11 rounded-2xl border-2 border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-bold focus:border-[#2C1E15] focus:ring-2 focus:ring-[#2C1E15]/20 outline-none shadow-xs transition-all cursor-pointer"
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id} className="text-sm py-2 text-[#2C1E15]">
                          {room.title} — {room.capacity.recommended} | Mon–Thu {room.weekdayRateDisplay} • Fri–Sun {room.weekendRateDisplay}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#786150]">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Specific Room Preference (if unit includes multiple rooms) */}
                {selectedRoom.roomNumbers && selectedRoom.roomNumbers.length > 1 && (
                  <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E6D7C3] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#2C1E15]">
                        Specific Room Preference:
                      </label>
                      <span className="text-[11px] text-[#786150]">
                        Subject to availability at check-in
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Any Available', ...selectedRoom.roomNumbers].map((rn) => (
                        <button
                          key={rn}
                          type="button"
                          onClick={() => setPreferredRoomNumber(rn)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            preferredRoomNumber === rn
                              ? 'bg-[#2C1E15] text-white shadow-xs'
                              : 'bg-white border border-[#E6D7C3] text-[#523A2A] hover:bg-[#F5EBE6]'
                          }`}
                        >
                          {rn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Room Highlight Summary */}
                <div className="p-4.5 rounded-2xl bg-[#F5EBE6] border border-[#E6D7C3] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2C1E15] uppercase tracking-wide">
                          {selectedRoom.title}
                        </span>
                        {selectedRoom.hasPool && (
                          <span className="bg-[#FAF7F2] text-[#2C1E15] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D4AF37]/50 flex items-center gap-1 shadow-xs">
                            <Waves className="w-3 h-3 text-[#D4AF37]" />
                            <span>With Swimming Pool</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#786150]">
                        {selectedRoom.beds} • {selectedRoom.capacity.recommended} • {selectedRoom.sizeSqM} sq.m.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E6D7C3]">
                        <span className="text-[#786150]">Mon–Thu: </span>
                        <span className="font-bold text-[#2C1E15]">{selectedRoom.weekdayRateDisplay}</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#E6D7C3]">
                        <span className="text-[#786150]">Fri–Sun: </span>
                        <span className="font-bold text-amber-800">{selectedRoom.weekendRateDisplay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Standard Amenities List */}
                  <div className="pt-2 border-t border-[#E6D7C3]/50">
                    <span className="text-[11px] font-bold text-[#523A2A] uppercase tracking-wider block mb-1.5">
                      Included Room & Property Amenities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRoom.amenities.map((amenity, idx) => (
                        <span
                          key={`amenity-${idx}`}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                            amenity.includes('Swimming Pool')
                              ? 'bg-[#FAF7F2] border-[#D4AF37] text-[#2C1E15] font-bold shadow-xs'
                              : 'bg-white border-[#E6D7C3]/80 text-[#2C1E15]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#8B6B10] shrink-0" />
                          <span>{amenity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Official Pax Rate Sheet Table for Selected Room */}
                  {selectedRoom.paxRates && selectedRoom.paxRates.length > 0 && (
                    <div className="pt-2 border-t border-[#E6D7C3]/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-[#523A2A] uppercase tracking-wider">
                          Rate Breakdown by Guest Count (Pax):
                        </span>
                        <span className="text-[10px] text-[#786150]">
                          Current selection: <strong>{totalPax} Pax</strong>
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#E6D7C3] bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#2C1E15] text-white text-[11px] uppercase tracking-wider">
                            <tr>
                              <th className="py-2 px-3 font-bold">Occupancy / Pax</th>
                              <th className="py-2 px-3 font-bold">Rate (Mon to Thu)</th>
                              <th className="py-2 px-3 font-bold">Rate (Fri to Sun)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6D7C3]/40">
                            {selectedRoom.paxRates.map((tier, idx) => {
                              const isActive = 
                                (idx === 0 && totalPax <= tier.pax) ||
                                (totalPax === tier.pax) ||
                                (idx === selectedRoom.paxRates!.length - 1 && totalPax >= tier.pax);
                              return (
                                <tr
                                  key={`tier-${idx}`}
                                  className={`transition-colors ${
                                    isActive ? 'bg-amber-100/70 font-bold text-[#2C1E15]' : 'text-[#523A2A] hover:bg-gray-50'
                                  }`}
                                >
                                  <td className="py-2 px-3 flex items-center gap-1.5">
                                    {isActive && <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>}
                                    <span>{tier.paxLabel}</span>
                                  </td>
                                  <td className="py-2 px-3 text-[#2C1E15]">₱{tier.weekdayRate.toLocaleString()}</td>
                                  <td className="py-2 px-3 text-amber-900">₱{tier.weekendRate.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {selectedRoom.id === 'private-villa-pool' && (
                        <p className="text-[11px] text-[#786150] mt-1.5 italic">
                          * Base rate covers 1 to 10 pax. Extra guests beyond 10 pax: +₱500 per extra pax / night. Extra pad: +₱400.
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* STEP 2: Stay Type, Schedule & Availability Calendar */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D7C3]/60 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#2C1E15] text-white font-bold flex items-center justify-center text-sm">
                    2
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Stay Type & Availability Calendar</h3>
                    <p className="text-xs text-[#786150]">Check live room availability calendar and choose your dates</p>
                  </div>
                </div>
              </div>

              {/* Stay Type Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStayType('nightly')}
                  className={`p-3.5 rounded-2xl font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 cursor-pointer ${
                    stayType === 'nightly'
                      ? 'border-[#2C1E15] bg-[#2C1E15] text-white shadow-md'
                      : 'border-[#E6D7C3] bg-[#FDFBF7] text-[#523A2A] hover:bg-[#F5EBE6]'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Nightly Stay (Overnight)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStayType('hourly')}
                  className={`p-3.5 rounded-2xl font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 cursor-pointer ${
                    stayType === 'hourly'
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-md'
                      : 'border-[#E6D7C3] bg-[#FDFBF7] text-[#523A2A] hover:bg-[#F5EBE6]'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Hourly / Short Stay</span>
                </button>
              </div>

              {/* Availability Calendar Section with requested color coding */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FDFBF7] border-2 border-[#E6D7C3] space-y-4">
                
                {/* Calendar Header with Legend & Month Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/50 pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#2C1E15]" />
                      <span>Availability Calendar — {selectedRoom.title}</span>
                    </h4>
                    <p className="text-xs text-[#786150]">
                      Click an orange date below to set your stay schedule
                    </p>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg border border-[#E6D7C3] bg-white hover:bg-[#F5EBE6] text-[#2C1E15] transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-xs text-[#2C1E15] px-2 min-w-28 text-center">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg border border-[#E6D7C3] bg-white hover:bg-[#F5EBE6] text-[#2C1E15] transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Color Legend (Orange: Available, Red: Booked, Green: Selected Date) */}
                <div className="bg-white p-3 rounded-xl border border-[#E6D7C3]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-[#2C1E15] uppercase text-[11px] tracking-wider">
                    Calendar Legend:
                  </span>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                    {/* Orange Available */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-md bg-orange-500 shadow-xs"></span>
                      <span className="font-bold text-orange-950">Orange: Available</span>
                    </div>
                    {/* Red Booked */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-md bg-red-500 shadow-xs"></span>
                      <span className="font-bold text-red-950">Red: Booked</span>
                    </div>
                    {/* Green Selected Date */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 ring-2 ring-emerald-300 shadow-xs"></span>
                      <span className="font-bold text-emerald-950">Green: Selected Date</span>
                    </div>
                  </div>
                </div>

                {/* Notice message if user clicks booked date */}
                {calendarNotice && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{calendarNotice}</span>
                  </div>
                )}

                {/* Calendar Grid */}
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E6D7C3]">
                  {/* Days of week */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#786150] pb-2 border-b border-[#E6D7C3]/40 mb-2">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Padding empty slots */}
                    {calendarDays.padding.map((_, idx) => (
                      <div key={`pad-${idx}`} className="h-10 sm:h-12 rounded-lg bg-gray-50/50"></div>
                    ))}

                    {/* Month Days */}
                    {calendarDays.days.map(({ dayNum, dateStr }) => {
                      const status = getDateClassification(dateStr);
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleCalendarDateClick(dateStr)}
                          disabled={status.type === 'past'}
                          className={`h-10 sm:h-12 rounded-xl text-xs flex flex-col items-center justify-center transition-all cursor-pointer relative ${status.bg}`}
                          title={`${dateStr}: ${status.badge}`}
                        >
                          <span className="text-xs sm:text-sm leading-tight">{dayNum}</span>
                          <span className="text-[9px] uppercase tracking-tighter opacity-90 hidden sm:block">
                            {status.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Nightly Schedule Inputs */}
              {stayType === 'nightly' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                        Check-in Date (2:00 PM standard)
                      </label>
                      <input
                        type="date"
                        value={checkInDate}
                        min={todayStr}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium focus:ring-2 focus:ring-[#2C1E15] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                        Check-out Date (12:00 PM standard)
                      </label>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={checkInDate || todayStr}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium focus:ring-2 focus:ring-[#2C1E15] outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-[#F5EBE6] p-3 rounded-xl border border-[#E6D7C3]/60 flex items-center justify-between text-xs text-[#2C1E15]">
                    <span className="font-semibold">Calculated Duration:</span>
                    <span className="font-bold bg-white px-3 py-1 rounded-lg border border-[#E6D7C3]">
                      {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Hourly Schedule Inputs */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Date of Stay</label>
                      <input
                        type="date"
                        value={hourlyDate}
                        min={todayStr}
                        onChange={(e) => setHourlyDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Target Start Time</label>
                      <input
                        type="time"
                        value={hourlyStartTime}
                        onChange={(e) => setHourlyStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">Duration Block</label>
                      <select
                        value={hourlyDuration}
                        onChange={(e) => setHourlyDuration(Number(e.target.value) as 3 | 6 | 12)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-semibold outline-none"
                      >
                        <option value={3}>3 Hours Wash-up</option>
                        <option value={6}>6 Hours Short Stay</option>
                        <option value={12}>12 Hours Extended</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <span>Selected Rate for {hourlyDuration} Hours:</span>
                    <span className="font-bold text-sm">
                      ₱{(hourlyDuration === 3 
                        ? selectedRoom.pricing.hourly3hr 
                        : hourlyDuration === 6 
                        ? selectedRoom.pricing.hourly6hr 
                        : selectedRoom.pricing.hourly12hr || 1100)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Guest Headcount Selector */}
              <div className="pt-3 border-t border-[#E6D7C3]/40 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">Adult Guests</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdultGuests((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-[#F5EBE6] text-[#2C1E15] font-bold flex items-center justify-center hover:bg-[#E6D7C3] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-[#2C1E15]">{adultGuests}</span>
                    <button
                      type="button"
                      onClick={() => setAdultGuests((prev) => Math.min(selectedRoom.capacity.maxGuests, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-[#F5EBE6] text-[#2C1E15] font-bold flex items-center justify-center hover:bg-[#E6D7C3] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">Children (Under 7 Free)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setChildGuests((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-[#F5EBE6] text-[#2C1E15] font-bold flex items-center justify-center hover:bg-[#E6D7C3] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-[#2C1E15]">{childGuests}</span>
                    <button
                      type="button"
                      onClick={() => setChildGuests((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-[#F5EBE6] text-[#2C1E15] font-bold flex items-center justify-center hover:bg-[#E6D7C3] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* STEP 3: Add-Ons (Renamed from Add-Ons & Custom Extras, with Breakfast ₱120 per head) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D7C3]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#2C1E15] text-white font-bold flex items-center justify-center text-sm">
                    3
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Add-Ons</h3>
                    <p className="text-xs text-[#786150]">Breakfast ₱120 per head, extra pad / mattresses, and travel extras</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#E6D7C3]/40">
                {availableAddons.map((addon) => {
                  const qty = addonQuantities[addon.id] || 0;
                  return (
                    <div key={`addon-row-${addon.id}`} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2C1E15]">{addon.name}</span>
                          <span className="bg-[#F5EBE6] text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {addon.unitLabel}
                          </span>
                        </div>
                        <p className="text-xs text-[#786150] max-w-md">{addon.description}</p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleAdjustAddon(addon.id, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-xl bg-[#F5EBE6] text-[#2C1E15] font-bold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E6D7C3] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-[#2C1E15]">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustAddon(addon.id, 1)}
                          className="w-8 h-8 rounded-xl bg-[#2C1E15] text-white font-bold flex items-center justify-center hover:bg-[#523A2A] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: Guest Contact Details (Without special requests column) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D7C3]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#2C1E15] text-white font-bold flex items-center justify-center text-sm">
                    4
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Guest Contact Details</h3>
                    <p className="text-xs text-[#786150]">Required for booking confirmation and arrival check-in</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan De La Cruz"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#2C1E15]"
                  />
                  {formErrors.guestName && (
                    <span className="text-xs text-rose-600 font-medium block mt-1">
                      {formErrors.guestName}
                    </span>
                  )}
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                      Active Mobile Phone <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0917 123 4567"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#2C1E15]"
                    />
                    {formErrors.guestPhone && (
                      <span className="text-xs text-rose-600 font-medium block mt-1">
                        {formErrors.guestPhone}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. juandelacruz@gmail.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#2C1E15]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5: Payment Option (Full vs 40% Partial Downpayment) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D7C3]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#2C1E15] text-white font-bold flex items-center justify-center text-sm">
                    5
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Payment Option</h3>
                    <p className="text-xs text-[#786150]">Select 40% partial downpayment or 100% full settlement</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 40% Partial Downpayment Card */}
                <div
                  onClick={() => setPaymentOption('partial_40')}
                  className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    paymentOption === 'partial_40'
                      ? 'border-[#2C1E15] bg-[#F5EBE6] shadow-md'
                      : 'border-[#E6D7C3] bg-[#FDFBF7] hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Recommended
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentOption === 'partial_40' ? 'border-[#2C1E15] bg-[#2C1E15]' : 'border-gray-400'
                      }`}>
                        {paymentOption === 'partial_40' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-[#2C1E15]">40% Partial Downpayment</h4>
                    <p className="text-xs text-[#786150]">
                      Lock your reservation date today. Pay the remaining 60% balance upon physical check-in at front desk.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#E6D7C3]/60 flex items-baseline justify-between">
                    <span className="text-xs text-[#786150]">Pay Now (40%):</span>
                    <span className="font-bold text-base text-[#2C1E15]">
                      ₱{Math.round(grandTotal * 0.4).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 100% Full Payment Card */}
                <div
                  onClick={() => setPaymentOption('full')}
                  className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    paymentOption === 'full'
                      ? 'border-[#2C1E15] bg-[#F5EBE6] shadow-md'
                      : 'border-[#E6D7C3] bg-[#FDFBF7] hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#786150] uppercase tracking-wider">
                        Express Fast Track
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentOption === 'full' ? 'border-[#2C1E15] bg-[#2C1E15]' : 'border-gray-400'
                      }`}>
                        {paymentOption === 'full' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-[#2C1E15]">100% Full Settlement</h4>
                    <p className="text-xs text-[#786150]">
                      Pay the complete stay amount today for a zero-balance, instant-key check-in upon arrival.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#E6D7C3]/60 flex items-baseline justify-between">
                    <span className="text-xs text-[#786150]">Pay Now (100%):</span>
                    <span className="font-bold text-base text-[#2C1E15]">
                      ₱{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 6: Payment Details & Verified Merchant Accounts */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6D7C3]/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#2C1E15] text-white font-bold flex items-center justify-center text-sm">
                    6
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Payment Mode & Details</h3>
                    <p className="text-xs text-[#786150]">Send deposit to our verified merchant accounts</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'gcash', label: 'GCash', icon: Smartphone },
                  { id: 'bdo', label: 'BDO Bank Transfer', icon: Building2 },
                  { id: 'card', label: 'Debit / Credit', icon: CreditCard },
                  { id: 'front_desk', label: 'Front Desk Cash', icon: DollarSign },
                ].map((m) => {
                  const Icon = m.icon;
                  const isCurrent = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[#2C1E15] bg-[#2C1E15] text-white shadow-sm'
                          : 'border-[#E6D7C3] bg-[#FDFBF7] text-[#523A2A] hover:bg-[#F5EBE6]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* GCash Details Card */}
              {paymentMethod === 'gcash' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0055EE]/5 border border-[#0055EE]/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#0055EE] text-white font-black flex items-center justify-center text-xs">
                        G
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#2C1E15]">Official GCash Account</h4>
                        <p className="text-[11px] text-[#786150]">Instant transfer via GCash Express Send or QR</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#8B6B10] bg-[#FAF7F2] border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full shadow-xs">
                      Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#786150] uppercase font-semibold">Account Name</span>
                        <div className="text-sm font-bold text-[#2C1E15]">Mark benedict Apelin</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('Mark benedict Apelin', 'gcash_name')}
                        className="p-1.5 text-xs text-[#8B6B10] hover:bg-[#FAF7F2] rounded-lg flex items-center gap-1 cursor-pointer font-medium transition-colors"
                      >
                        {copiedField === 'gcash_name' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#786150] uppercase font-semibold">GCash Mobile Number</span>
                        <div className="text-sm font-mono font-bold text-[#2C1E15]">09175681408</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('09175681408', 'gcash_num')}
                        className="p-1.5 text-xs text-[#8B6B10] hover:bg-[#FAF7F2] rounded-lg flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                      >
                        {copiedField === 'gcash_num' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BDO Bank Details Card */}
              {paymentMethod === 'bdo' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6D7C3] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#3D2616] text-[#FAF7F2] font-black flex items-center justify-center text-xs shadow-xs">
                        BDO
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#2C1E15]">BDO (Banco de Oro) Savings Account</h4>
                        <p className="text-[11px] text-[#786150]">Online Bank Transfer, InstaPay, or Over-the-counter</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#8B6B10] bg-[#FAF7F2] border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full shadow-xs">
                      Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#786150] uppercase font-semibold">Account Holder</span>
                        <div className="text-sm font-bold text-[#2C1E15]">mark benedict v. apelin</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('mark benedict v. apelin', 'bdo_name')}
                        className="p-1.5 text-xs text-[#8B6B10] hover:bg-[#FAF7F2] rounded-lg flex items-center gap-1 cursor-pointer font-medium transition-colors"
                      >
                        {copiedField === 'bdo_name' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#786150] uppercase font-semibold">BDO Account Number</span>
                        <div className="text-sm font-mono font-bold text-[#2C1E15]">0082 2007 7587</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('008220077587', 'bdo_acc')}
                        className="p-1.5 text-xs text-[#8B6B10] hover:bg-[#FAF7F2] rounded-lg flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                      >
                        {copiedField === 'bdo_acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Card / Front Desk Notice */}
              {(paymentMethod === 'card' || paymentMethod === 'front_desk') && (
                <div className="p-4 rounded-2xl bg-[#F5EBE6] border border-[#E6D7C3] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2C1E15]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Front Desk Settlement Guarantee</span>
                  </div>
                  <p className="text-xs text-[#786150] leading-relaxed">
                    For card payments or direct front desk cash settlement, an initial security deposit of at least <strong>₱500</strong> or booking guarantee slip is requested to prevent no-shows. Alternatively, please upload an ID or reservation authorization image below.
                  </p>
                </div>
              )}
            </div>

            {/* STEP 7: MANDATORY Payment Slip / Receipt Upload */}
            <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 shadow-lg space-y-4 ${
              formErrors.paymentSlip ? 'border-rose-400 bg-rose-50/20' : 'border-[#E6D7C3]/60'
            }`}>
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-rose-700 text-white font-bold flex items-center justify-center text-sm">
                    7
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15] flex items-center gap-2">
                      <span>Mandatory Payment Slip / Receipt Upload</span>
                      <span className="text-rose-600 text-xs font-sans font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    </h3>
                    <p className="text-xs text-[#786150]">Upload a clear photo or screenshot of your GCash/Bank transfer confirmation</p>
                  </div>
                </div>
              </div>

              {/* Upload Drop Zone */}
              {!slipPreviewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E6D7C3] hover:border-[#2C1E15] rounded-2xl p-6 sm:p-8 text-center bg-[#FDFBF7] hover:bg-[#F5EBE6] transition-all cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#E6D7C3]/50 text-[#2C1E15] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-[#2C1E15]">
                    Click or Drag & Drop Payment Deposit Slip
                  </div>
                  <p className="text-xs text-[#786150] mt-1">
                    Supports PNG, JPG, JPEG, or WebP screenshot (Max: 10MB)
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[11px] font-semibold mt-3 border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Submission will be blocked without this slip</span>
                  </div>
                </div>
              ) : (
                /* Uploaded Thumbnail Preview */
                <div className="p-4 bg-[#F5EBE6] rounded-2xl border border-[#E6D7C3] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={slipPreviewUrl}
                      alt="Uploaded Payment Slip"
                      className="w-20 h-20 object-cover rounded-xl border border-white shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-[#2C1E15]">
                          Receipt Attached
                        </span>
                      </div>
                      <p className="text-xs text-[#786150] mt-0.5 truncate max-w-xs">
                        {slipFile?.name || 'payment_receipt.jpg'}
                      </p>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Ready for Front-Desk verification
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
                    >
                      Replace File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveSlip}
                      className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {slipUploadError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{slipUploadError}</span>
                </div>
              )}
            </div>

            {/* Mobile Submit Trigger Button */}
            <div className="lg:hidden">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#2C1E15] via-[#523A2A] to-[#2C1E15] text-white text-base font-bold rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 text-amber-300" />
                <span>Confirm & Book Reservation</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right Column: Live Stay Summary Card (Sticky) */}
        <div className="lg:col-span-4 sticky top-28 space-y-4">
          
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#E6D7C3] shadow-2xl space-y-5">
            
            {/* Summary Header */}
            <div className="flex items-center justify-between border-b border-[#E6D7C3]/60 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#2C1E15]" />
                <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Stay Summary</h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                Live Calculator
              </span>
            </div>

            {/* Selected Room Info */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-[#786150] font-bold">Selected Unit</div>
              <div className="font-serif font-bold text-base text-[#2C1E15]">{selectedRoom.title}</div>
              {preferredRoomNumber && preferredRoomNumber !== 'Any Available' && (
                <div className="text-xs font-bold text-amber-800">
                  Assigned: {preferredRoomNumber}
                </div>
              )}
              <div className="text-xs text-[#786150]">
                {stayType === 'nightly' ? (
                  <span>{calculatedNights} Night(s) • {checkInDate} to {checkOutDate}</span>
                ) : (
                  <span>{hourlyDuration} Hours • {hourlyDate} at {hourlyStartTime}</span>
                )}
              </div>
              <div className="text-xs text-[#786150]">
                Guests: <strong>{totalPax} Pax</strong> ({adultGuests} Adults{childGuests > 0 ? `, ${childGuests} Children` : ''})
              </div>
            </div>

            {/* Itemized Breakdown Table */}
            <div className="space-y-2 pt-3 border-t border-[#E6D7C3]/40 text-xs">
              
              {/* Base Rate */}
              <div className="flex items-center justify-between">
                <span className="text-[#523A2A] font-medium">
                  Base Accommodation ({stayType === 'nightly' ? `${calculatedNights} night(s)` : `${hourlyDuration} hrs`})
                </span>
                <span className="font-semibold text-[#2C1E15]">₱{baseStayRate.toLocaleString()}</span>
              </div>

              {/* Night-by-night breakdown */}
              {stayType === 'nightly' && nightlyBreakdown.length > 0 && (
                <div className="pl-2 border-l-2 border-[#E6D7C3] space-y-1 py-1">
                  {nightlyBreakdown.map((item, idx) => (
                    <div key={`breakdown-${idx}`} className="flex items-center justify-between text-[11px] text-[#786150]">
                      <span>
                        {item.label} ({item.isWeekend ? 'Fri–Sun' : 'Mon–Thu'}):
                      </span>
                      <span className="font-medium text-[#2C1E15]">₱{item.rate.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add-ons line items */}
              {availableAddons.map((addon) => {
                const qty = addonQuantities[addon.id] || 0;
                if (qty === 0) return null;
                const cost = addon.isPerNight && stayType === 'nightly' 
                  ? addon.price * qty * calculatedNights 
                  : addon.price * qty;
                return (
                  <div key={`summary-addon-${addon.id}`} className="flex items-center justify-between text-[#786150]">
                    <span>{addon.name} (x{qty})</span>
                    <span className="font-medium text-[#2C1E15]">₱{cost.toLocaleString()}</span>
                  </div>
                );
              })}

              {/* Grand Total Row */}
              <div className="flex items-baseline justify-between pt-3 border-t border-[#E6D7C3] text-sm">
                <span className="font-serif font-bold text-[#2C1E15] text-base">Grand Total</span>
                <span className="font-bold text-xl text-[#2C1E15]">₱{grandTotal.toLocaleString()}</span>
              </div>

            </div>

            {/* Payment Split Highlight Box - 'Partial:' as requested */}
            <div className="bg-[#2C1E15] text-white p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#E6D7C3]">
                <span>Partial:</span>
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  {paymentOption === 'partial_40' ? '40% Downpayment' : '100% Full Payment'}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1 border-t border-white/20">
                <span className="text-xs font-semibold text-[#F5EBE6]">Payable Now:</span>
                <span className="text-2xl font-bold text-emerald-400">
                  ₱{amountPayableNow.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#E6D7C3] pt-1 border-t border-white/10">
                <span>Remaining Balance at Check-in:</span>
                <span className="font-semibold text-white">
                  ₱{remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Slip Status Indicator */}
            <div className="text-xs">
              {slipPreviewUrl ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payment Deposit Slip attached</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Attach payment slip in Step 7 to submit</span>
                </div>
              )}
            </div>

            {/* Desktop Submit Button */}
            <div className="hidden lg:block pt-2">
              <button
                type="button"
                onClick={handleSubmitBooking}
                className="w-full py-4 bg-gradient-to-r from-[#2C1E15] via-[#523A2A] to-[#2C1E15] text-white text-base font-bold rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 text-amber-300" />
                <span>Confirm & Book Reservation</span>
              </button>
            </div>

            <div className="text-[11px] text-[#786150] text-center">
              Instant printable booking voucher issued immediately upon submission.
            </div>

            {/* Cancellation Policy Banner */}
            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E6D7C3] text-[11px] text-[#786150] space-y-1">
              <span className="font-bold text-[#2C1E15] block">Cancellation & Rebooking Policy:</span>
              <p>• Free cancellation up to 48 hrs before check-in (100% refund of deposit).</p>
              <p>• Within 48 hrs: deposit is non-refundable, but can be rescheduled once within 6 months.</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
