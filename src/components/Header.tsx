import React, { useState } from 'react';
import { VillaLogo } from './VillaLogo';
import { 
  Compass, 
  PhoneCall, 
  Menu, 
  X, 
  Phone,
  Calendar,
  Sparkles
} from 'lucide-react';

import { NavigationTab } from '../types';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isAdminLoggedIn: boolean;
  onBookNow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onBookNow,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'explore', label: 'Explore Rooms', icon: Compass },
    { id: 'private-villa', label: 'Private Villa', icon: Sparkles },
    { id: 'contact', label: 'Contact Us', icon: PhoneCall },
  ];

  const handleSelectTab = (id: NavigationTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E6D7C3]/80 shadow-xs transition-all duration-300">
      {/* Top micro-bar for direct contact & location in elegant Brown & Gold */}
      <div className="bg-gradient-to-r from-[#180F09] via-[#2A1A0F] to-[#180F09] text-[#F9F3E5] text-xs py-1.5 px-4 hidden md:block border-b border-[#D4AF37]/25">
        <div className="max-w-7xl mx-auto flex justify-between items-center tracking-wide">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-pulse"></span>
              24/7 Front Gate &amp; Assistance: Diversion Road, Brgy CabalangeGan, Vigan City
            </span>
            <span className="text-[#8B6B10]">|</span>
            <span className="text-[#FFF2CC]">5-8 Mins from Calle Crisologo &amp; Plaza Salcedo</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="tel:+639178901234" 
              className="flex items-center gap-1 text-[#E5C158] hover:text-white transition-colors font-medium"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline: +63 917 890 1234</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Property Brand */}
          <div 
            onClick={() => handleSelectTab('explore')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <VillaLogo size={54} variant="gold" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span 
                  style={{ fontSize: '20px' }}
                  className="font-brand font-black sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#2C1E15] via-[#785423] to-[#B8860B] tracking-[0.14em] uppercase drop-shadow-sm group-hover:brightness-110 transition-all"
                >
                  Diversion Vigan
                </span>
                <span 
                  style={{ fontSize: '12px' }}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline-block font-monogram shadow-sm"
                >
                  Ilocos Sur
                </span>
              </div>
              <span 
                style={{ fontStyle: 'normal', height: '2px' }}
                className="text-xs sm:text-sm font-serif tracking-[0.2em] text-[#8B6B10] font-bold"
              >
                Transient &amp; Private Villa
              </span>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#1F140C] text-[#FFFDF7] shadow-md shadow-[#1F140C]/20 border border-[#D4AF37]/50 scale-[1.02]'
                      : 'text-[#4A3222] hover:bg-[#F6EFE5] hover:text-[#1F140C]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5C158]' : 'text-[#8B6B10]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header: Book Now button + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {onBookNow && (
              <button
                type="button"
                onClick={onBookNow}
                className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:from-[#A67908] hover:to-[#B8860B] text-white px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-950/20 hover:shadow-lg transition-all cursor-pointer border border-white/20 group active:scale-95"
                title="Reserve &amp; Calculate Your Stay"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFF2CC] group-hover:rotate-12 transition-transform" />
                <span>Book Now</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#2C1E15] hover:bg-[#F6EFE5] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FDFBF7]/95 backdrop-blur-xl border-b border-[#E6D7C3] px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1F140C] text-white border border-[#D4AF37]/40'
                      : 'text-[#2C1E15] hover:bg-[#F6EFE5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#E5C158]' : 'text-[#8B6B10]'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            {onBookNow && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBookNow();
                }}
                className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Room Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
