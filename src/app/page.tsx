
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Header from '../components/Header';
import MapContainer from '../components/booking/MapContainer';
import BookingForm from '../components/booking/BookingForm';
import { useBookingLogic } from '../hooks/useBookingLogic';
import { VEHICLES, DISCOUNT_MESSAGES } from '../lib/constants';

export default function Home() {
  gsap.registerPlugin(ScrollTrigger);

  const {
    form, setForm, pricing, selectedVehicleIndex, setSelectedVehicleIndex,
    userLocation, handleTyping, selectLocation, suggestions,
    swapLocations, addReturnTrip, removeReturnTrip,
    outboundRouteGeoJson, returnRouteGeoJson, waypointsOut, waypointsRet,
    setUserLocation
  } = useBookingLogic();

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [discountMsgIndex, setDiscountMsgIndex] = useState(0);

  const mainSheetRef = useRef<HTMLDivElement>(null);
  const offersSectionRef = useRef<HTMLDivElement>(null);
  const bookingFormRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  useEffect(() => {
    // Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      touchMultiplier: 1.5,
      infinite: false,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Discount Message Rotator
    const msgInterval = setInterval(() => {
      setDiscountMsgIndex(prev => (prev + 1) % DISCOUNT_MESSAGES.length);
    }, 4000);

    return () => {
      lenis.destroy();
      clearInterval(msgInterval);
    };
  }, []);

  // GSAP Animation - Mobile Optimized
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
        const fadeElements = [bookingFormRef.current, offersSectionRef.current];
        fadeElements.forEach(el => {
          if (el) {
            gsap.fromTo(el, 
              { opacity: 0, y: 50 },
              {
                opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
                scrollTrigger: {
                  trigger: el, start: 'top 85%', end: 'bottom 20%', toggleActions: 'play none none reverse'
                }
              }
            );
          }
        });
    });
    return () => mm.revert();
  }, []);

  const handleRefreshLocation = () => {
     if (!navigator.geolocation) return;
     navigator.geolocation.getCurrentPosition((pos) => {
         const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
         setUserLocation(coords);
         document.cookie = `fare1_user_loc=${JSON.stringify(coords)};path=/;max-age=604800`;
     });
  };

  const goToBooking = () => {
    let url = `https://booking.fare1.co.uk?pickup=${encodeURIComponent(form.pickup)}&dropoff=${encodeURIComponent(form.dropoff)}&vehicle=${encodeURIComponent(VEHICLES[selectedVehicleIndex].name)}&price=${pricing.totalPrice.toFixed(2)}&date=${form.date}&time=${form.time}&flight=${form.flightNumber}&meet=${form.meetGreet}&pax=${form.pax}&bags=${form.bags}`;
    if (form.hasReturnTrip) {
      url += `&returnPickup=${encodeURIComponent(form.returnPickup)}&returnDropoff=${encodeURIComponent(form.returnDropoff)}`;
    }
    window.location.href = url;
  };

  return (
    <div className="bg-primary-black text-gray-200 font-sans min-h-screen flex flex-col overflow-hidden selection:bg-brand-gold selection:text-black">
      <Header />

      {/* Map is now purely presentational and memoized */}
      <MapContainer 
        userLocation={userLocation}
        waypointsOut={waypointsOut}
        waypointsRet={waypointsRet}
        outboundRoute={outboundRouteGeoJson}
        returnRoute={returnRouteGeoJson}
        hasReturnTrip={form.hasReturnTrip}
        onRefreshLocation={handleRefreshLocation}
      />

      <div id="main-sheet" ref={mainSheetRef} className={`relative z-10 mt-[38vh] floating-sheet rounded-t-[2rem] border-t border-brand-gold/20 shadow-2xl flex-1 overflow-y-auto pb-40 ${sheetExpanded ? 'sheet-expanded' : ''}`}>
        
        <div className="drag-handle w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5" onClick={() => setSheetExpanded(!sheetExpanded)}></div>
        
        <div className={`close-sheet-btn absolute top-4 right-4 z-50 cursor-pointer p-2 ${sheetExpanded ? 'block' : 'hidden'}`} onClick={() => setSheetExpanded(false)}>
           <div className="bg-black/50 rounded-full p-2 border border-brand-gold/30">✕</div>
        </div>

        <div ref={bookingFormRef}>
            <BookingForm 
              form={form}
              setForm={setForm}
              selectedVehicleIndex={selectedVehicleIndex}
              onSelectVehicle={setSelectedVehicleIndex}
              suggestions={suggestions}
              onType={handleTyping}
              onSelectLocation={selectLocation}
              onSwapLocations={swapLocations}
              onAddReturn={addReturnTrip}
              onRemoveReturn={removeReturnTrip}
            />
        </div>

        {/* Offers Section Placeholder (Modularized) */}
        <div ref={offersSectionRef} className="bg-brand-gold py-20 relative text-primary-black rounded-t-3xl">
           <div className="text-center max-w-5xl mx-auto px-4">
              <h2 className="text-4xl font-heading font-black mb-6 uppercase">Why Choose Fare 1 Taxi?</h2>
              <div className="h-10 mb-8 flex items-center justify-center">
                  <span className="text-xl font-black bg-primary-black text-white px-4 py-2 transform -skew-x-6">
                    {DISCOUNT_MESSAGES[discountMsgIndex]}
                  </span>
              </div>
           </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      {pricing.distanceHidden === false && (
        <div className="bottom-bar fixed bottom-0 left-0 w-full bg-black/95 border-t border-brand-gold/20 py-3 px-5 z-[80] visible">
            <div className="flex justify-between items-center max-w-5xl mx-auto gap-4">
            <div className="flex flex-col justify-center min-w-0">
                <div className={`text-[9px] font-black ${pricing.promoClass} mb-0.5 tracking-wider uppercase truncate`}>{pricing.promoText}</div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                {pricing.oldPriceVisible && <span className="text-[10px] font-bold text-red-500 line-through opacity-70">£{pricing.oldPrice.toFixed(2)}</span>}
                <p className="text-3xl font-heading font-black text-white tracking-tight leading-none flex items-baseline gap-2">
                    £<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#fff5cc]">{pricing.totalPrice.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 font-medium tracking-normal">{pricing.distanceDisplay}</span>
                </p>
                </div>
            </div>
            <button onClick={goToBooking} className="bg-brand-gold text-black font-extrabold py-3 px-8 rounded-xl hover:bg-[#e6c355] transition text-sm uppercase">
                Book Now
            </button>
            </div>
        </div>
      )}
    </div>
  );
}
