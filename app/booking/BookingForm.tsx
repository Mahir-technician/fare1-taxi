
import React from 'react';
import { BookingState, SuggestionItem, Vehicle, RouteData } from '../../types';
import { MAX_STOPS } from '../../lib/constants';

interface BookingFormProps {
  form: BookingState;
  setForm: React.Dispatch<React.SetStateAction<BookingState>>;
  suggestions: SuggestionItem[];
  activeField: string | null;
  onType: (field: string, val: string) => void;
  onSelect: (field: string, item: SuggestionItem) => void;
  onAddReturn: () => void;
  filteredVehicles: Vehicle[];
  selectedVehicleIndex: number | null;
  onSelectVehicle: (index: number) => void;
  outRoute: RouteData | null;
  swapLocations: () => void; // Needs to be passed or implemented
}

export default function BookingForm({
  form, setForm, suggestions, activeField, onType, onSelect, onAddReturn, 
  filteredVehicles, selectedVehicleIndex, onSelectVehicle, outRoute, swapLocations
}: BookingFormProps) {
  
  // Helper to render suggestion list
  const renderSuggestions = (field: string) => {
    if (activeField !== field || suggestions.length === 0) return null;
    return (
      <ul className="suggestions-list block">
        {suggestions.map((item, i) => (
          item.isHeader ? 
            <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
            <li key={i} onClick={() => onSelect(field, item)}>{item.text}</li>
        ))}
      </ul>
    );
  };

  // Derived Visibility Logic
  const isRouteCalculated = !!outRoute;
  const isDateTimeFilled = isRouteCalculated && !!form.date && !!form.time;

  return (
    <div className="w-[90%] mx-auto max-w-5xl space-y-5 pt-1 px-1 mb-20">
      
      {/* STEP 1: LOCATIONS */}
      <div className="space-y-3 relative">
        {/* PICKUP */}
        <div className="location-field-wrapper group">
            <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                <span className="mr-3 text-brand-gold">📍</span>
                <input 
                    type="text" placeholder="Enter pickup location" 
                    value={form.pickup} 
                    onChange={(e) => onType('pickup', e.target.value)}
                    onFocus={() => onType('pickup', form.pickup)} // Trigger suggestions
                    className="text-[15px] font-medium w-full"
                />
                <button onClick={swapLocations} className="ml-2 hover:bg-white/10 p-1 rounded">⇅</button>
            </div>
            {renderSuggestions('pickup')}
            <div className="connector-line"></div>
        </div>

        {/* STOPS */}
        {form.stops.map((stop, index) => (
            <div key={index} className="location-field-wrapper pl-5">
                <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                    <span className="mr-3 text-blue-400">⦿</span>
                    <input 
                        type="text" placeholder={`Stop ${index + 1}`}
                        value={stop}
                        onChange={(e) => onType(`stop-${index+1}`, e.target.value)}
                        className="text-[15px] font-medium w-full bg-transparent outline-none text-white"
                    />
                    <button onClick={() => {
                        const newStops = form.stops.filter((_, i) => i !== index);
                        setForm(prev => ({...prev, stops: newStops}));
                    }} className="ml-2 text-red-500">✕</button>
                </div>
                {renderSuggestions(`stop-${index+1}`)}
            </div>
        ))}

        {/* DROPOFF */}
        <div className="location-field-wrapper group">
            <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                <span className="mr-3 text-brand-gold">🏁</span>
                <input 
                    type="text" placeholder="Enter destination" 
                    value={form.dropoff} 
                    onChange={(e) => onType('dropoff', e.target.value)}
                    className="text-[15px] font-medium w-full"
                />
            </div>
            {renderSuggestions('dropoff')}
        </div>

        {/* Add Stop Button */}
        {form.stops.length < MAX_STOPS && (
            <div className="flex justify-end">
                <button onClick={() => setForm(prev => ({...prev, stops: [...prev.stops, '']}))} className="text-[10px] font-bold text-brand-gold border border-brand-gold/30 rounded px-2 py-1 uppercase hover:text-white transition">
                    + Add Stop
                </button>
            </div>
        )}
      </div>

      <div className="h-[1px] w-full bg-white/5"></div>

      {/* STEP 2: SUMMARY & DATE/TIME */}
      {isRouteCalculated && (
        <div className="animate-fade-in">
            <div className="text-[10px] text-gray-400 font-medium mb-3 pl-2 flex items-center gap-2">
                <span>{outRoute.distanceMiles.toFixed(1)} mi</span>
                <span className="text-gray-600">|</span>
                <span>Est: {outRoute.durationText}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="text-sm bg-transparent w-full text-white uppercase" />
                </div>
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="text-sm bg-transparent w-full text-white" />
                </div>
            </div>
        </div>
      )}

      {/* STEP 3: DETAILS & RETURN */}
      {isDateTimeFilled && (
        <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                    <input type="text" placeholder="Flight No (Optional)" value={form.flightNumber} onChange={e => setForm({...form, flightNumber: e.target.value})} className="text-sm bg-transparent w-full text-white placeholder-gray-600" />
                </div>
                <label className="checkbox-wrapper unified-input rounded-xl h-[50px] px-3 flex items-center justify-between cursor-pointer hover:bg-white/5">
                    <span className="text-xs font-bold text-brand-gold">Meet & Greet (+£5)</span>
                    <input type="checkbox" checked={form.meetGreet} onChange={() => setForm({...form, meetGreet: !form.meetGreet})} className="hidden" />
                    <div className={`w-4 h-4 border border-gray-600 rounded flex items-center justify-center ${form.meetGreet ? 'bg-brand-gold border-brand-gold' : ''}`}>✓</div>
                </label>
            </div>

            {/* Return Trip Section */}
            {!form.hasReturnTrip ? (
                <button onClick={onAddReturn} className="w-full py-3.5 bg-gradient-to-r from-secondary-black to-black border border-brand-gold/40 text-brand-gold font-bold rounded-xl text-xs uppercase tracking-widest hover:shadow-gold-glow transition">
                    Add Return Trip +
                </button>
            ) : (
                <div className="bg-white/5 p-4 rounded-xl border border-brand-gold/20 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-brand-gold uppercase">Return Details</h3>
                        <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/30">5% OFF</span>
                    </div>
                    {/* Simplified Return Inputs for brevity - assuming logic mirrors outbound */}
                    <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                        <input type="date" value={form.returnDate} onChange={e => setForm({...form, returnDate: e.target.value})} className="text-sm bg-transparent w-full text-white uppercase" />
                    </div>
                    <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                        <input type="time" value={form.returnTime} onChange={e => setForm({...form, returnTime: e.target.value})} className="text-sm bg-transparent w-full text-white" />
                    </div>
                    <button onClick={() => setForm({...form, hasReturnTrip: false})} className="w-full py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded hover:bg-red-500/20 uppercase">Remove Return Trip</button>
                </div>
            )}

            {/* PAX & BAGS */}
            <div className="grid grid-cols-2 gap-3">
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
                    <select value={form.pax} onChange={e => setForm({...form, pax: parseInt(e.target.value)})} className="text-sm bg-transparent w-full text-white appearance-none cursor-pointer">
                        {[...Array(8)].map((_, i) => <option key={i} value={i+1} className="bg-black">{i+1} Passengers</option>)}
                    </select>
                </div>
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
                    <select value={form.bags} onChange={e => setForm({...form, bags: parseInt(e.target.value)})} className="text-sm bg-transparent w-full text-white appearance-none cursor-pointer">
                        <option value="0" className="bg-black">No Luggage</option>
                        {[...Array(8)].map((_, i) => <option key={i} value={i+1} className="bg-black">{i+1} Bags</option>)}
                    </select>
                </div>
            </div>
        </div>
      )}

      {/* STEP 4: VEHICLES */}
      {isDateTimeFilled && (
        <div className="animate-fade-in">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest mt-2">Select Class</h3>
            <div className="vehicle-scroll flex overflow-x-auto gap-3 snap-x pb-4 px-1">
                {filteredVehicles.length > 0 ? filteredVehicles.map((v, i) => (
                    <div key={i} onClick={() => onSelectVehicle(i)} className={`vehicle-card min-w-[130px] w-[130px] p-3 rounded-2xl cursor-pointer snap-center flex flex-col justify-between ${selectedVehicleIndex !== null && filteredVehicles[selectedVehicleIndex].name === v.name ? 'selected' : ''}`}>
                        <div className="selected-badge absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{opacity: selectedVehicleIndex !== null && filteredVehicles[selectedVehicleIndex].name === v.name ? 1 : 0}}>Selected</div>
                        <div><h4 className="text-white font-bold text-xs mb-0.5">{v.name}</h4><p className="text-[9px] text-gray-400">{v.description}</p></div>
                        <div className="flex-1 flex items-center justify-center py-2"><img src={v.image} className="w-full object-contain" alt={v.name} /></div>
                        <div className="flex justify-between items-end border-t border-white/10 pt-1.5"><div className="flex gap-1.5 text-gray-400 text-[10px]"><span>👤{v.passengers}</span><span>🧳{v.luggage}</span></div><span className="text-brand-gold font-bold text-[10px]">£{v.perMile}/mi</span></div>
                    </div>
                )) : <div className="text-xs text-gray-500">No vehicles available for {form.pax} passengers.</div>}
            </div>
        </div>
      )}
    </div>
  );
}
