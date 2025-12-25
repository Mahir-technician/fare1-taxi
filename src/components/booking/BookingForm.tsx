
import React, { useRef } from 'react';
import { BookingState, SuggestionItem, Vehicle } from '@/types';
import { VEHICLES, MAX_STOPS } from '@/lib/constants';
import { useClickOutside } from '@/hooks/useClickOutside';

interface BookingFormProps {
  form: BookingState;
  setForm: React.Dispatch<React.SetStateAction<BookingState>>;
  selectedVehicleIndex: number;
  onSelectVehicle: (index: number) => void;
  suggestions: { [key: string]: SuggestionItem[] };
  onType: (type: string, value: string) => void;
  onSelectLocation: (type: string, name: string, coords: [number, number]) => void;
  onSwapLocations: () => void;
  onAddReturn: () => void;
  onRemoveReturn: () => void;
}

const BookingForm = ({
  form, setForm, selectedVehicleIndex, onSelectVehicle, suggestions, onType, onSelectLocation, onSwapLocations, onAddReturn, onRemoveReturn
}: BookingFormProps) => {
  
  const suggestionsRef = useClickOutside(() => {
    // Hacky but effective way to clear all suggestions when clicking outside form
    onType('clear-all', ''); 
  });

  const filteredVehicles = VEHICLES.filter(v => v.passengers >= form.pax && v.luggage >= form.bags);

  const renderLocationInput = (type: string, placeholder: string, value: string, icon: React.ReactNode, isReturn = false) => (
    <div className="location-field-wrapper group relative" ref={suggestionsRef}>
      <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
        <div className="mr-3 flex-shrink-0 text-brand-gold">{icon}</div>
        <input 
          type="text" 
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            if (type === 'pickup') setForm(s => ({...s, pickup: e.target.value}));
            if (type === 'dropoff') setForm(s => ({...s, dropoff: e.target.value}));
            if (type === 'return-pickup') setForm(s => ({...s, returnPickup: e.target.value}));
            if (type === 'return-dropoff') setForm(s => ({...s, returnDropoff: e.target.value}));
            onType(type, e.target.value);
          }}
          className="text-[15px] font-medium w-full"
        />
        {type === 'pickup' && (
          <button onClick={onSwapLocations} className="ml-2 p-1.5 rounded-full hover:bg-white/10 transition">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
          </button>
        )}
      </div>
      {/* Suggestions Dropdown */}
      {(suggestions[type]?.length || 0) > 0 && (
        <ul className="suggestions-list block absolute w-full left-0 top-full">
          {suggestions[type]?.map((item, i) => (
            item.isHeader ?
              <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
              <li key={i} onClick={() => onSelectLocation(type, item.text, item.center)}>{item.text}</li>
          ))}
        </ul>
      )}
      {type === 'pickup' && <div className="connector-line"></div>}
    </div>
  );

  return (
    <div className="w-[90%] mx-auto max-w-5xl space-y-5 pt-1 px-1 mb-20">
      <div className="space-y-3 relative">
        {/* Outbound Pickup */}
        {renderLocationInput('pickup', 'Enter pickup location', form.pickup, 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
        )}
        
        {/* Outbound Dropoff */}
        {renderLocationInput('dropoff', 'Enter destination', form.dropoff,
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        )}
      </div>

      <div className="h-[1px] w-full bg-white/5"></div>

      {/* Date/Time/Flight/Meet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Date</label>
            <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
              <input type="date" value={form.date} onChange={e => setForm(s => ({...s, date: e.target.value}))} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
            </div>
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Time</label>
            <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
              <input type="time" value={form.time} onChange={e => setForm(s => ({...s, time: e.target.value}))} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] text-brand-gold uppercase ml-1 mb-1 font-bold tracking-widest">Flight No.</label>
            <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
              <input type="text" placeholder="e.g. EZY410" value={form.flightNumber} onChange={e => setForm(s => ({...s, flightNumber: e.target.value}))} className="uppercase text-sm placeholder-gray-600 bg-transparent border-none outline-none text-white w-full" />
            </div>
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Meet & Greet</label>
            <label className="checkbox-wrapper unified-input rounded-xl h-[50px] px-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
              <span className="text-xs font-bold text-brand-gold">£5.00</span>
              <input type="checkbox" checked={form.meetGreet} onChange={() => setForm(s => ({...s, meetGreet: !s.meetGreet}))} className="hidden" />
              <div className={`w-4 h-4 border border-gray-600 rounded flex items-center justify-center transition-all ${form.meetGreet ? 'bg-brand-gold border-brand-gold' : ''}`}>
                <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </label>
          </div>
        </div>
        
        {/* Pax & Bags */}
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
           <div>
             <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Passengers</label>
             <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
               <select value={form.pax} onChange={e => setForm(s => ({...s, pax: parseInt(e.target.value)}))} className="text-sm cursor-pointer appearance-none bg-transparent w-full text-white">
                 {[...Array(8)].map((_, i) => <option key={i+1} value={i+1} className="bg-black">{i+1} {i+1 === 1 ? 'Person' : 'People'}</option>)}
               </select>
               <div className="absolute right-3 pointer-events-none text-brand-gold text-[10px]">▼</div>
             </div>
           </div>
           <div>
             <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Luggage</label>
             <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
               <select value={form.bags} onChange={e => setForm(s => ({...s, bags: parseInt(e.target.value)}))} className="text-sm cursor-pointer appearance-none bg-transparent w-full text-white">
                 <option value="0" className="bg-black">No Luggage</option>
                 {[...Array(8)].map((_, i) => <option key={i+1} value={i+1} className="bg-black">{i+1} Bag{i+1 > 1 ? 's' : ''}</option>)}
               </select>
               <div className="absolute right-3 pointer-events-none text-brand-gold text-[10px]">▼</div>
             </div>
           </div>
        </div>

        {/* Return Trip Section */}
        <div className="sm:col-span-2">
            {!form.hasReturnTrip ? (
               form.pickup && form.dropoff && (
                <button onClick={onAddReturn} className="w-full py-3.5 bg-gradient-to-r from-secondary-black to-black border border-brand-gold/40 text-brand-gold font-bold rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all duration-300 flex items-center justify-center uppercase tracking-widest text-xs">
                  Add Return Trip +
                </button>
               )
            ) : (
                <div className="space-y-4 border-t border-brand-gold/20 pt-6 mt-2 relative bg-white/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-brand-gold uppercase tracking-widest">Return Trip Details</h3>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">5% Discount Applied</span>
                  </div>
                  
                  {renderLocationInput('return-pickup', 'Return Pickup', form.returnPickup, <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>, true)}
                  {renderLocationInput('return-dropoff', 'Return Dropoff', form.returnDropoff, <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, true)}

                  <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Return Date</label>
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                          <input type="date" value={form.returnDate} onChange={e => setForm(s => ({...s, returnDate: e.target.value}))} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Return Time</label>
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                          <input type="time" value={form.returnTime} onChange={e => setForm(s => ({...s, returnTime: e.target.value}))} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
                        </div>
                      </div>
                  </div>

                  <button onClick={onRemoveReturn} className="w-full py-2 bg-red-500/10 text-red-400 font-bold rounded-lg hover:bg-red-500/20 transition text-xs uppercase tracking-wider">
                    Remove Return Trip
                  </button>
                </div>
            )}
        </div>
      </div>

      {/* Vehicle Selection */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest mt-2">Select Class</h3>
        <div className="vehicle-scroll flex overflow-x-auto gap-3 snap-x pb-4 px-1">
          {filteredVehicles.map((v, i) => (
            <div key={i} onClick={() => onSelectVehicle(i)} className={`vehicle-card min-w-[130px] w-[130px] p-3 rounded-2xl cursor-pointer snap-center flex flex-col justify-between ${selectedVehicleIndex === i ? 'selected' : ''}`}>
              <div className="selected-badge absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{opacity: selectedVehicleIndex === i ? 1 : 0}}>Selected</div>
              <div><h4 className="text-white font-bold text-xs mb-0.5">{v.name}</h4><p className="text-[9px] text-gray-400">{v.description}</p></div>
              <div className="flex-1 flex items-center justify-center py-2"><img src={v.image} className="w-full object-contain" /></div>
              <div className="flex justify-between items-end border-t border-white/10 pt-1.5"><div className="flex gap-1.5 text-gray-400 text-[10px]"><span>👤{v.passengers}</span><span>🧳{v.luggage}</span></div><span className="text-brand-gold font-bold text-[10px]">£{v.perMile}/mi</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(BookingForm);
