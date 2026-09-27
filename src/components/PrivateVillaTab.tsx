import React, { useState } from 'react';
import { RoomUnit, StayType } from '../types';
import { 
  Users, 
  Wifi, 
  Wind, 
  Waves, 
  UtensilsCrossed, 
  Car, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Info,
  CheckCircle2,
  Lock,
  ShieldCheck,
  X,
  MapPin,
  Calendar
} from 'lucide-react';
import { VillaLogo } from './VillaLogo';

interface PrivateVillaTabProps {
  rooms: RoomUnit[];
  onSelectRoomForBooking: (roomId: string, preferredStayType?: StayType) => void;
}

export const PrivateVillaTab: React.FC<PrivateVillaTabProps> = ({
  rooms,
  onSelectRoomForBooking,
}) => {
  const [stayTypePreference, setStayTypePreference] = useState<StayType>('nightly');
  const [inspectRoom, setInspectRoom] = useState<RoomUnit | null>(null);

  // Filter for Private Villa category exclusively
  const privateVilla = rooms.find(r => r.category === 'Private Villa') || rooms[rooms.length - 1];

  const getAmenityIcon = (amenityText: string) => {
    const text = amenityText.toLowerCase();
    if (text.includes('pool')) return <Waves className="w-3.5 h-3.5 text-[#D4AF37]" />;
    if (text.includes('aircon') || text.includes('ac')) return <Wind className="w-3.5 h-3.5 text-[#8B6B10]" />;
    if (text.includes('private cr') || text.includes('cr')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
    if (text.includes('wi-fi') || text.includes('wifi')) return <Wifi className="w-3.5 h-3.5 text-amber-600" />;
    if (text.includes('parking')) return <Car className="w-3.5 h-3.5 text-[#8B6B10]" />;
    if (text.includes('kitchen')) return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-800" />;
    if (text.includes('billard') || text.includes('darts')) return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
    if (text.includes('cctv')) return <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />;
    if (text.includes('double lock') || text.includes('door')) return <Lock className="w-3.5 h-3.5 text-[#3D2616]" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-[#8B6B10]" />;
  };

  return (
    <div className="space-y-12">
      
      {/* Hero-style Section Header for Private Villa */}
      <div className="relative rounded-[40px] overflow-hidden bg-[#1A1009] text-white p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute inset-0 opacity-20 monogram-pattern-dark"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-amber-900/20">
              <Sparkles size={14} className="animate-pulse" />
              <span>Premium Exclusive Experience</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] tracking-tight">
              Your Private <span className="gold-text-light">Oasis</span> In Vigan
            </h2>
            
            <p className="text-lg text-amber-50/80 font-light leading-relaxed max-w-xl">
              Experience unparalleled privacy and luxury at Diversion Vigan's Private Villa. Designed for large families, group reunions, and exclusive retreats with your own dedicated swimming pool.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl">
                <Users className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-100/60 font-bold">Capacity</div>
                  <div className="text-sm font-bold">Up to 20 Guests</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl">
                <Waves className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-100/60 font-bold">Feature</div>
                  <div className="text-sm font-bold">Exclusive Pool</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-video sm:aspect-square rounded-3xl overflow-hidden border-2 border-[#D4AF37]/30 shadow-2xl rotate-2">
              <img 
                src={privateVilla.images[0]} 
                alt={privateVilla.title} 
                className="w-full h-full object-cover"
              />
            </div>
            {privateVilla.images.length > 1 && (
              <div className="absolute -bottom-6 -left-6 aspect-square w-32 sm:w-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl -rotate-6 hidden sm:block">
                <img 
                  src={privateVilla.images[1]} 
                  alt={`${privateVilla.title} detail`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Features */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Villa Highlight Card */}
          <div className="bg-white rounded-[32px] border border-[#E6D7C3] p-6 sm:p-10 shadow-xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6D7C3]/50 pb-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1E15]">{privateVilla.title}</h3>
                <p className="text-[#8B6B10] font-semibold flex items-center gap-2 mt-1">
                  <MapPin size={16} />
                  Main Property • Exclusive Wing
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#6E5544] uppercase tracking-widest mb-1">Starting From</div>
                <div className="text-3xl font-bold gold-text">₱{privateVilla.pricing.nightly.toLocaleString()}</div>
                <div className="text-[11px] text-[#6E5544]">per night (base pax)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-lg text-[#2C1E15] flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#B8860B]" />
                  What's Included
                </h4>
                <p className="text-sm text-[#4A3222] leading-relaxed">
                  {privateVilla.description}
                </p>
                <ul className="grid grid-cols-1 gap-2.5">
                  {privateVilla.amenities.map((amenity, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs text-[#2C1E15] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E6D7C3]/50">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm border border-[#E6D7C3]/30">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="font-medium">{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-lg text-[#2C1E15] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#B8860B]" />
                    Stay Options
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E6D7C3]/50">
                      <div className="text-xs font-bold text-[#8B6B10] mb-1">Nightly Stay (2:00 PM Check-in)</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6E5544]">Weekday (Mon-Thu)</span>
                        <span className="font-bold">{privateVilla.weekdayRateDisplay}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[#6E5544]">Weekend (Fri-Sun)</span>
                        <span className="font-bold">{privateVilla.weekendRateDisplay}</span>
                      </div>
                    </div>
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E6D7C3]/50">
                      <div className="text-xs font-bold text-[#8B6B10] mb-1">Short Stay (Day/Night Use)</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-white rounded-lg border border-[#E6D7C3]/40">
                          <div className="text-[10px] text-[#6E5544]">3 Hours</div>
                          <div className="text-xs font-bold">₱{privateVilla.pricing.hourly3hr?.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-[#E6D7C3]/40">
                          <div className="text-[10px] text-[#6E5544]">6 Hours</div>
                          <div className="text-xs font-bold">₱{privateVilla.pricing.hourly6hr?.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-[#E6D7C3]/40">
                          <div className="text-[10px] text-[#6E5544]">12 Hours</div>
                          <div className="text-xs font-bold">₱{privateVilla.pricing.hourly12hr?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <h5 className="text-xs font-bold text-[#8B6B10] uppercase tracking-wider mb-2">Pax Policy</h5>
                  <p className="text-[11px] text-[#6E5544] leading-relaxed">
                    Base rate includes 1-{privateVilla.paxRates?.[0]?.pax || 10} pax. Additional guests beyond base capacity are charged ₱{privateVilla.extraPaxFee || 500} per head. Maximum capacity is {privateVilla.capacity.maxGuests} guests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Gallery & Booking CTA */}
        <div className="space-y-8">
          {/* Vertical Gallery */}
          <div className="space-y-4">
            {privateVilla.images.map((img, i) => (
              <div key={i} className="aspect-[4/3] rounded-3xl overflow-hidden border border-[#E6D7C3] shadow-md group">
                <img 
                  src={img} 
                  alt={`Villa Gallery ${i+1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
            ))}
          </div>

          {/* Floating Booking Box */}
          <div className="bg-gradient-to-br from-[#2A1A0F] to-[#1A1009] p-8 rounded-[32px] text-white shadow-2xl border border-[#D4AF37]/30 sticky top-24">
            <VillaLogo size={32} variant="gold" className="mb-4" />
            <h4 className="text-xl font-serif font-bold mb-2 text-amber-50">Reserve the Villa</h4>
            <p className="text-xs text-amber-100/60 mb-6 leading-relaxed">
              Book your exclusive stay today. Due to high demand, we recommend reserving at least 1-2 weeks in advance.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => onSelectRoomForBooking(privateVilla.id, 'nightly')}
                className="w-full py-4 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:from-[#A67908] hover:to-[#B8860B] text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Book Overnight Stay
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => onSelectRoomForBooking(privateVilla.id, 'hourly')}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Book Short Stay
                <Clock size={16} />
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/30">
                <ShieldCheck size={20} className="text-[#D4AF37]" />
              </div>
              <div className="text-[10px] text-amber-100/50 leading-tight">
                Secure your booking with a <span className="text-amber-100 font-bold">40% Downpayment</span> via GCash, BDO, or Card.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
