
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 20);
      if (currentScroll > 20 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  return (
    <>
      <header id="site-header" className={`fixed z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="glow-wrapper mx-auto">
          <div className="glow-content flex items-center justify-between px-4 sm:px-6 h-[60px] transition-all">
            <div className="collapsible-element flex-shrink-0 flex items-center mr-4">
              <a href="/" className="group block py-2">
                <div className="font-serif font-bold tracking-widest text-gradient-gold drop-shadow-md group-hover:opacity-90 transition flex items-center gap-1.5">
                  <span className="text-lg">FARE</span>
                  <span className="text-xl pt-0.5 text-white">1</span>
                  <span className="text-lg">TAXI</span>
                </div>
              </a>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
               {/* Contact buttons logic preserved from original page */}
               <a href="tel:+442381112682" className="flex items-center gap-2 bg-secondaryBg/80 border border-brand/40 text-brand hover:bg-brand hover:text-primaryBg px-3 py-1.5 rounded-full transition-all duration-300 group backdrop-blur-sm">
                  <span className="text-brand-gold font-semibold text-sm">Call</span>
               </a>
            </div>
            
            <div className="collapsible-element ml-3">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-brand hover:text-white focus:outline-none transition-colors">
                <div className={`hamburger ${menuOpen ? 'active' : ''}`}>
                    <span></span><span></span><span></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`fixed inset-0 top-[60px] bg-black/95 backdrop-blur-xl border-t border-brand-gold/10 z-[49] flex flex-col justify-between pb-10 transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center justify-center space-y-6 pt-10 px-6">
            <a href="/" className="text-xl font-bold text-white hover:text-brand-gold transition-colors tracking-wide">Home</a>
            <button onClick={() => setServicesOpen(!servicesOpen)} className="text-xl font-bold text-white hover:text-brand-gold transition-colors tracking-wide flex items-center justify-center gap-2 mx-auto">
                Services
                <svg className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${servicesOpen ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 mx-auto max-w-xs text-center">
                    <a href="#" className="text-sm text-gray-300 hover:text-brand-gold">Airport Transfers</a>
                    <a href="#" className="text-sm text-gray-300 hover:text-brand-gold">Cruise Ship Transfers</a>
                </div>
            </div>
          </div>
      </div>
    </>
  );
}
