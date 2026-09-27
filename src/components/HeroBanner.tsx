import React from 'react';
import { 
  MapPin, 
  Car, 
  Wifi, 
  Waves, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { VillaLogo } from './VillaLogo';
import { NavigationTab } from '../types';

interface HeroBannerProps {
  onNavigate: (tab: NavigationTab) => void;
  onBookNow?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onNavigate, onBookNow }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#180F09] via-[#2A1A0F] to-[#382417] text-[#FAF7F2] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 border-b border-[#E6D7C3]/25">
      {/* Background ambient lighting and subtle gold monogram lattice pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[radial-gradient(#E5C158_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      {/* Decorative Warm Gold Light Glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#B8860B]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="space-y-4">
          
          {/* Top Heritage Badge with Gold Monogram */}
          <div className="inline-flex flex-wrap items-center gap-2 bg-[#3A2515]/80 border border-[#D4AF37]/45 px-3.5 py-1 rounded-full shadow-inner backdrop-blur-sm">
            <VillaLogo size={18} variant="gold" />
            <span className="text-[11px] font-bold tracking-[0.15em] text-[#FFF2CC] uppercase font-monogram">
              UNESCO World Heritage City Gateway
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158] animate-pulse"></span>
            <span className="text-[11px] text-[#E5C158] font-medium font-serif">Vigan City, Ilocos Sur</span>
          </div>

          {/* Title & Tagline - Compact & Regal */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-snug">
              Timeless Ilocano Warmth.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF7] via-[#F9ECC4] to-[#D4AF37]">
                Modern Villa Luxury.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#F5EDE0]/90 max-w-3xl font-light leading-relaxed">
              Welcome to <strong className="font-brand font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF7] via-[#E5C158] to-[#C9982E] uppercase tracking-wider text-base drop-shadow">Diversion Vigan</strong> — your tranquil sanctuary along Vigan Diversion Road. Offering premium transient rooms, private poolside villas, and full compound bookings just 5-8 minutes from historic Calle Crisologo.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onBookNow && (
              <button
                type="button"
                onClick={onBookNow}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:from-[#A67908] hover:to-[#B8860B] text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-amber-950/30 hover:brightness-105 hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm group border border-white/25 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFF2CC]" />
                <span>Enjoy Your Stay — Book Now</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-2.5 rounded-xl border border-[#E6D7C3]/30 backdrop-blur-md transition-all text-xs sm:text-sm cursor-pointer"
            >
              <span>Contact Us</span>
            </button>
          </div>

          {/* Quick Feature Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#E6D7C3]/20">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#F5EDE0]">
              <Car className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
              <span>Wide Parking Space</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#F5EDE0]">
              <Waves className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Swimming Pool Access</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#F5EDE0]">
              <MapPin className="w-3.5 h-3.5 text-[#FFF2CC] shrink-0" />
              <span>5 Mins to Calle Crisologo</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#F5EDE0]">
              <Wifi className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
              <span>High Speed Wi-Fi</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
