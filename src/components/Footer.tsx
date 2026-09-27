import React from 'react';
import { VillaLogo } from './VillaLogo';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { NavigationTab } from '../types';

interface FooterProps {
  onNavigate: (tab: NavigationTab) => void;
  onBookNow?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavigate, 
  onBookNow,
  isAdminLoggedIn = false 
}) => {
  const handleNav = (tab: NavigationTab) => {
    onNavigate(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-b from-[#180F09] via-[#24150A] to-[#120B06] text-[#FAF7F2] border-t border-[#E6D7C3]/20 overflow-hidden">
      {/* Subtle gold grid/watermark background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[radial-gradient(#E5C158_1px,transparent_1px)] [background-size:28px_28px]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info & Monogram */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <VillaLogo size={52} variant="gold" />
              <div className="flex flex-col select-none py-0.5 w-[200px] sm:w-[230px]">
                <div className="flex justify-between font-serif font-black text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF7] via-[#F6EBD3] to-[#D4AF37] uppercase tracking-tight">
                  <span>DIVERSION</span>
                  <span>VIGAN</span>
                </div>
                <div className="flex justify-between font-brand font-medium text-[7.5px] sm:text-[8.5px] text-transparent bg-clip-text bg-gradient-to-r from-[#E6D7C3] via-[#FAF7F2] to-[#D4AF37] uppercase tracking-[0.05em] mt-0.5">
                  <span>TRANSIENT</span>
                  <span>&</span>
                  <span>PRIVATE</span>
                  <span>VILLA</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#E6D7C3]/80 leading-relaxed font-light">
              Your tranquil, heritage-inspired sanctuary along Vigan Diversion Road. Offering premium transient rooms, private poolside villas, and event spaces just minutes from Calle Crisologo.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E5C158]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-serif">Modern Villa Luxury in Ilocos Sur</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-[#D4AF37]/30 pb-1.5 inline-block">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-[#E6D7C3]/80">
              <li>
                <button 
                  onClick={() => handleNav('explore')} 
                  className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-[#D4AF37]">›</span> Explore Rooms &amp; Rates
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('private-villa')} 
                  className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-[#D4AF37]">›</span> Exclusive Private Villa
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('contact')} 
                  className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-[#D4AF37]">›</span> Contact &amp; Location Map
                </button>
              </li>
              {onBookNow && (
                <li>
                  <button 
                    onClick={onBookNow} 
                    className="hover:text-[#E5C158] transition-colors cursor-pointer font-bold text-[#E5C158] flex items-center gap-1.5"
                  >
                    <span className="text-[#E5C158]">›</span> Instant Online Reservation
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-[#D4AF37]/30 pb-1.5 inline-block">
              Front Desk Hotline
            </h4>
            <div className="space-y-2 text-xs text-[#E6D7C3]/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E5C158] shrink-0 mt-0.5" />
                <span>Diversion Road, Brgy CabalangeGan, Vigan City, Ilocos Sur</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
                <a href="tel:+639178901234" className="hover:text-white transition-colors">
                  +63 9175681408 / +63 9171562062 / +63 9912960718
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
                <a href="mailto:reservations@diversionvigan.ph" className="hover:text-white transition-colors">
                  reservations@diversionvigan.ph
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
                <span>24/7 Front Gate &amp; Security Assistance</span>
              </div>
            </div>
          </div>

          {/* Reservation Policy & Guarantee */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-[#D4AF37]/30 pb-1.5 inline-block">
              Guest Security &amp; Safety
            </h4>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-[#E6D7C3]/20 space-y-2 text-xs text-[#E6D7C3]/90">
              <div className="flex items-center gap-2 text-[#E5C158] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Official Direct Booking</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#E6D7C3]/75">
                Instant SMS &amp; Digital Voucher confirmation. Direct Gcash, Maya &amp; Bank Transfer verification on arrival.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright, Front Desk button with padlock, & disclaimer */}
        <div className="pt-8 border-t border-[#E6D7C3]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E6D7C3]/60">
          <div className="space-y-1 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Diversion Vigan Transient &amp; Events Place. All rights reserved.</p>
            <p className="text-[10px] text-[#E6D7C3]/50 font-medium tracking-wide">
              Developed &amp; Designed by James Mait
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Front Desk Button with small Padlock Icon */}
            <button
              onClick={() => handleNav('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#E6D7C3]/20 hover:border-[#D4AF37]/60 text-[#E6D7C3] hover:text-[#E5C158] text-xs font-medium transition-all cursor-pointer group shadow-xs"
              title="Staff &amp; Management Front Desk Portal"
            >
              <Lock className="w-3 h-3 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              <span>Front Desk</span>
              {isAdminLoggedIn && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Admin Active"></span>
              )}
            </button>

            <span>•</span>
            <span className="text-[#E5C158] font-serif">Luxury Heritage Hospitality</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
