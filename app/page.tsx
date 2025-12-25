
'use client';
import React, { useEffect, useState } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useBookingLogic } from '../hooks/useBookingLogic';
import Header from '../components/Header';
import MapContainer from '../components/booking/MapContainer';
import BookingForm from '../components/booking/BookingForm';
// import Offers from '../components/sections/Offers'; // Assuming extracted
// import Feedback from '../components/sections/Feedback'; // Assuming extracted

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const {
    form, setForm,
    userLocation,
    suggestions, activeField, handleTyping, selectLocation,
    filteredVehicles, selectedVehicleIndex, setSelectedVehicleIndex,
    outRoute, retRoute,
    routeWaypointsOut, routeWaypointsRet,
    priceData,
    addReturnTrip
  } = useBookingLogic();

  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Smooth Scroll (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // GSAP Animations (Mobile safe)
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
       // Only animate on desktop to save mobile resources
       gsap.fromTo("#main-sheet", { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 });
    });
    return () => mm.revert();
  }, []);

  // Swap logic helper
  const swapLocations = () => {
    const tempP = form.pickup;
    const tempD = form.dropoff;
    setForm(prev => ({...prev, pickup: tempD, dropoff: tempP}));
    
    const tempWpP = routeWaypointsOut.current.pickup;
    routeWaypointsOut.current.pickup = routeWaypointsOut.current.dropoff;
    routeWaypointsOut.current.dropoff = tempWpP;
    
    // Trigger re-calc logic via handleTyping simulation or useEffect in hook
    // Ideally hook handles this, but for now we manually swap refs
  };

  const goToBooking = () => {
    if (selectedVehicleIndex === null || !filteredVehicles[selectedVehicleIndex]) return;
    const vName = filteredVehicles[selectedVehicleIndex].name;
    const url = `https://booking.fare1.co.uk?pickup=${encodeURIComponent(form.pickup)}&dropoff=${encodeURIComponent(form.dropoff)}&vehicle=${encodeURIComponent(vName)}&price=${priceData.total.toFixed(2)}&date=${form.date}&time=${form.time}`;
    window.location.href = url;
  };

  const bottomBarVisible = !!outRoute && !!form.date && !!form.time && selectedVehicleIndex !== null;

  return (
    <div className="bg-primary-black text-gray-200 font-sans min-h-screen flex flex-col overflow-hidden selection:bg-brand-gold selection:text-black">
      
      <Header />

      {/* Map Layer (Fixed Background) */}
      <MapContainer 
        userLocation={userLocation}
        outGeometry={outRoute?.geometry}
        retGeometry={retRoute?.geometry}
        waypointsOut={routeWaypointsOut}
        waypointsRet={routeWaypointsRet}
        hasReturnTrip={form.hasReturnTrip}
      />

      {/* Refresh Button - Now part of page layout or MapContainer */}
      
      {/* Draggable Sheet */}
      <div id="main-sheet" className={`relative z-10 mt-[38vh] floating-sheet rounded-t-[2rem] border-t border-brand-gold/20 shadow-2xl flex-1 overflow-y-auto pb-40 ${sheetExpanded ? 'sheet-expanded' : ''}`}>
        <div className="drag-handle w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5" onClick={() => setSheetExpanded(!sheetExpanded)}></div>
        
        <BookingForm 
            form={form}
            setForm={setForm}
            suggestions={suggestions}
            activeField={activeField}
            onType={handleTyping}
            onSelect={selectLocation}
            onAddReturn={addReturnTrip}
            filteredVehicles={filteredVehicles}
            selectedVehicleIndex={selectedVehicleIndex}
            onSelectVehicle={setSelectedVehicleIndex}
            outRoute={outRoute}
            swapLocations={swapLocations}
        />

        {/* Static Sections would go here (Offers, Feedback) */}
        {/* <Offers /> */}
        {/* <Feedback /> */}
      </div>

      {/* Bottom Bar */}
      <div id="bottom-bar" className={`bottom-bar fixed bottom-0 left-0 w-full bg-black/95 border-t border-brand-gold/20 py-3 px-5 z-[80] safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,1)] ${bottomBarVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-center max-w-5xl mx-auto gap-4">
          <div className="flex flex-col justify-center min-w-0">
            <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Fare Estimate</div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className={`text-[10px] font-bold text-red-500 line-through opacity-70 ${priceData.showOld ? '' : 'hidden'}`}>£{priceData.old.toFixed(2)}</span>
              <p className="text-3xl font-heading font-black text-white tracking-tight leading-none flex items-baseline gap-2">
                £<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#fff5cc]">{priceData.total.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button onClick={goToBooking} className="bg-brand-gold text-black font-extrabold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#e6c355] transition-transform active:scale-95 text-sm uppercase tracking-wide whitespace-nowrap">
            Book Now
          </button>
        </div>
      </div>

    </div>
  );
}
