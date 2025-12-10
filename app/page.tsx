'use client';

import React, { useEffect, useState, useRef } from 'react';

// --- Types ---
declare global {
  interface Window {
    mapboxgl: any;
    google: any;
  }
}

// --- Constants ---
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmFyZTFsdGQiLCJhIjoiY21pcnN4MWZlMGhtcDU2c2dyMTlvODJoNSJ9.fyUV4gMDcEBgWZnQfxS7XA';

const PRESET_DATA: Record<string, {name: string, center: [number, number]}[]> = {
    'Airports': [
        { name: 'Southampton Airport', center: [-1.3568, 50.9503] },
        { name: 'Heathrow Airport Terminal 2', center: [-0.4497, 51.4696] },
        { name: 'Heathrow Airport Terminal 3', center: [-0.4597, 51.4708] },
        { name: 'Heathrow Airport Terminal 4', center: [-0.4455, 51.4594] },
        { name: 'Heathrow Airport Terminal 5', center: [-0.4899, 51.4719] },
        { name: 'Exeter Airport', center: [-3.4139, 50.7341] },
        { name: 'Gatwick Airport', center: [-0.1821, 51.1537] },
        { name: 'Gatwick Airport South Terminal', center: [-0.1619, 51.1561] },
        { name: 'Gatwick Airport North Terminal', center: [-0.1760, 51.1620] },
        { name: 'London City Airport', center: [0.0553, 51.5048] },
        { name: 'London Luton Airport', center: [-0.3718, 51.8763] },
        { name: 'Brighton City Airport (Shoreham Airport)', center: [-0.2967, 50.8354] },
        { name: 'Bournemouth Airport', center: [-1.8425, 50.7800] },
        { name: 'Bristol Airport', center: [-2.7190, 51.3827] },
        { name: 'London Stansted Airport', center: [0.2353, 51.8853] }
    ],
    'Cruise Terminals': [
        { name: 'QE II Cruise Terminal', center: [-1.4147, 50.8872] },
        { name: 'Ocean Cruise Terminal', center: [-1.4030, 50.8930] },
        { name: 'City Cruise Terminal', center: [-1.4172, 50.8932] },
        { name: 'Horizon Cruise Terminal', center: [-1.4230, 50.8950] },
        { name: 'Mayflower Cruise Terminal', center: [-1.4195, 50.8965] },
        { name: 'Portsmouth International Port', center: [-1.0895, 50.8123] }
    ],
    'Ferry Terminals': [
        { name: 'Wightlink Ferries', center: [-1.0963, 50.7953] },
        { name: 'Red Funnel Ferry terminals', center: [-1.4037, 50.8970] },
        { name: 'Southampton Town Quay', center: [-1.4060, 50.8960] }
    ]
};

const vehicles = [
    { name: "Standard Saloon", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Saloon-2.png", perMile: 1.67, hourly: 25, passengers: 4, luggage: 2, description: "Economic" },
    { name: "Executive Saloon", image: "https://www.fareone.co.uk/wp-content/uploads/2025/12/executive-saloon.png", perMile: 2.25, hourly: 25, passengers: 3, luggage: 2, description: "Mercedes E-Class" },
    { name: "Standard Estate", image: "https://www.fareone.co.uk/wp-content/uploads/2025/12/standard-estate.png", perMile: 2.03, hourly: 25, passengers: 4, luggage: 4, description: "Extra Space" },
    { name: "Executive Estate", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Estate-2.png", perMile: 2.54, hourly: 25, passengers: 4, luggage: 4, description: "Premium Estate" },
    { name: "Standard MPV", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/People-Carrier-3.png", perMile: 2.37, hourly: 25, passengers: 6, luggage: 8, description: "Group Travel" },
    { name: "Executive MPV", image: "https://www.fareone.co.uk/wp-content/uploads/2025/12/Executive-People-Carrier-Pic.png", perMile: 2.72, hourly: 25, passengers: 6, luggage: 8, description: "V-Class Luxury" },
    { name: "8 Seater", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Executive-Mini-Bus.png", perMile: 2.57, hourly: 25, passengers: 8, luggage: 16, description: "Mini Bus" },
    { name: "Executive 8 Seater", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/People-Carrier-2.png", perMile: 3.22, hourly: 25, passengers: 8, luggage: 16, description: "Mini Bus" },
    { name: "Accessible", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Accessible-2.png", perMile: 3.57, hourly: 25, passengers: 3, luggage: 2, description: "WAV" }
];

export default function Home() {
  // State
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(true);
  
  // Booking State
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [stops, setStops] = useState<{id: number, value: string}[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [meetGreet, setMeetGreet] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [distance, setDistance] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Maps State
  const [suggestions, setSuggestions] = useState<{type: string, items: any[]}>({ type: '', items: [] });
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any>({ start: null, end: null, stops: {} });
  const routeWaypoints = useRef<any>({ pickup: null, dropoff: null, stops: [] });

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [placeRating, setPlaceRating] = useState<any>(null);

  // Initialize
  useEffect(() => {
    // Set default date/time
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().substring(0, 5));

    // Initialize Mapbox
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-0.1276, 51.5074],
        zoom: 11,
        attributionControl: false,
        pitchWithRotate: false
      });
      map.current.scrollZoom.disable();
      map.current.on('touchstart', () => map.current.dragPan.enable());
    }

    // Scroll Listener
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
      if(scrollY > 50 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);

    // Initialize Google Reviews
    initReviews();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to calculate price when dependencies change
  useEffect(() => {
    calculatePrice();
  }, [distance, selectedVehicleIndex, meetGreet]);

  // Logic Functions
  const initReviews = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);
      service.getDetails({
        placeId: 'ChIJ9caM2nkSsYsRzNAS6kVqn2k',
        fields: ['reviews', 'rating', 'user_ratings_total']
      }, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          setReviews(place.reviews || []);
          setPlaceRating({ rating: place.rating, total: place.user_ratings_total });
        }
      });
    }
  };

  const calculateRoute = () => {
    if (!routeWaypoints.current.pickup || !routeWaypoints.current.dropoff) return;

    let coords = [routeWaypoints.current.pickup];
    routeWaypoints.current.stops.forEach((s: any) => { if(s) coords.push(s); });
    coords.push(routeWaypoints.current.dropoff);

    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    fetch(url).then(r=>r.json()).then(data => {
        if(!data.routes?.length) return;
        const r = data.routes[0];
        const distMiles = r.distance / 1609.34;
        setDistance(distMiles);

        if (map.current.getSource('route')) {
            map.current.getSource('route').setData(r.geometry);
        } else {
            map.current.addLayer({ 
                id: 'route', type: 'line', 
                source: { type: 'geojson', data: r.geometry }, 
                paint: { 'line-color': '#D4AF37', 'line-width': 4, 'line-opacity': 0.8 }
            });
        }
        
        const bounds = new window.mapboxgl.LngLatBounds();
        coords.forEach(c => bounds.extend(c));
        map.current.fitBounds(bounds, { padding: 80 });
    });
  };

  const calculatePrice = () => {
    if (distance <= 0) return;
    let p = distance * vehicles[selectedVehicleIndex].perMile;
    if(p < 5) p = 5;
    if(meetGreet) p += 5;
    setTotalPrice(p);
  };

  const handleLocationInput = (type: string, value: string, id?: number) => {
    if(type === 'pickup') setPickup(value);
    if(type === 'dropoff') setDropoff(value);
    if(type === 'stop' && id !== undefined) {
        const newStops = [...stops];
        const idx = newStops.findIndex(s => s.id === id);
        if(idx > -1) newStops[idx].value = value;
        setStops(newStops);
    }

    if(value.length === 0) {
        // Show presets
        setSuggestions({ type: type, items: Object.keys(PRESET_DATA).map(k => ({ isHeader: true, text: k })).concat(Object.values(PRESET_DATA).flat() as any) }); // Simplified preset logic for React
        return;
    }
    
    // In a real app, debounce this
    if(value.length > 2) {
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=5&types=poi,address`)
        .then(r=>r.json()).then(data => {
            if(data.features) {
                setSuggestions({ 
                    type: id !== undefined ? `stop-${id}` : type, 
                    items: data.features.map((f:any) => ({ text: f.place_name, center: f.center })) 
                });
            }
        });
    } else {
        setSuggestions({ type: '', items: [] });
    }
  };

  const selectLocation = (type: string, name: string, center: [number, number], stopId?: number) => {
    if(type === 'pickup') {
        setPickup(name);
        routeWaypoints.current.pickup = center;
        if(markers.current.start) markers.current.start.remove();
        markers.current.start = new window.mapboxgl.Marker({ color: '#D4AF37' }).setLngLat(center).addTo(map.current);
        map.current.flyTo({ center, zoom: 13 });
    } else if(type === 'dropoff') {
        setDropoff(name);
        routeWaypoints.current.dropoff = center;
        if(markers.current.end) markers.current.end.remove();
        markers.current.end = new window.mapboxgl.Marker({ color: '#ef4444' }).setLngLat(center).addTo(map.current);
    } else if(type.startsWith('stop-') && stopId !== undefined) {
        const newStops = [...stops];
        const idx = newStops.findIndex(s => s.id === stopId);
        if(idx > -1) newStops[idx].value = name;
        setStops(newStops);
        
        // Handle stop markers logic here (simplified)
        routeWaypoints.current.stops[idx] = center;
    }

    setSuggestions({ type: '', items: [] });
    setSheetExpanded(false);
    if(type === 'pickup') setShowLocationSheet(false);
    calculateRoute();
  };

  const getUserLocation = () => {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            selectLocation('pickup', 'Current Location', [pos.coords.longitude, pos.coords.latitude]);
        });
    }
  };

  const swapLocations = () => {
    const tempP = pickup; setPickup(dropoff); setDropoff(tempP);
    const tempW = routeWaypoints.current.pickup; routeWaypoints.current.pickup = routeWaypoints.current.dropoff; routeWaypoints.current.dropoff = tempW;
    
    // Swap markers visual
    if(markers.current.start && markers.current.end) {
        const pLoc = markers.current.start.getLngLat();
        markers.current.start.setLngLat(markers.current.end.getLngLat());
        markers.current.end.setLngLat(pLoc);
    }
    calculateRoute();
  };

  const goToBooking = () => {
    const url = `https://booking.fare1.co.uk?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}&vehicle=${encodeURIComponent(vehicles[selectedVehicleIndex].name)}&price=${totalPrice.toFixed(2)}&date=${date}&time=${time}`;
    window.location.href = url;
  };

  return (
    <div className="bg-primary-black text-gray-200 font-sans min-h-screen flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header id="site-header" className={`fixed z-[60] transition-all duration-500 ease-in-out ${isScrolled ? 'is-scrolled' : ''}`}>
            <div className="glow-wrapper mx-auto">
                <div className="glow-content flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">
                    <div className="collapsible-element flex-shrink-0 flex items-center mr-4">
                        <a href="/" className="group block py-2">
                            <span className="font-serif text-xl md:text-2xl font-bold tracking-widest text-gradient-gold drop-shadow-md group-hover:opacity-90 transition">
                                FARE 1 TAXI
                            </span>
                        </a>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <a href="tel:+442381112682" className="flex items-center gap-2 bg-secondaryBg/80 border border-brand/40 text-brand hover:bg-brand hover:text-primaryBg px-3 py-2 rounded-full transition-all duration-300 group backdrop-blur-sm">
                            <span className="hidden sm:inline font-semibold text-sm tracking-wide">+44 2381 112682</span>
                        </a>
                        <button onClick={() => setMenuOpen(!menuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-brand hover:text-white focus:outline-none transition-colors collapsible-element ml-4">
                            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            <div id="mobile-menu" className={`absolute left-0 w-full bg-secondaryBg border-b border-brand/20 shadow-xl ${menuOpen ? 'open' : 'closed'}`}>
                <div className="px-4 py-4 space-y-1">
                    <a href="/" className="block text-brand/80 hover:text-brand hover:bg-primaryBg/50 px-3 py-3 text-base font-medium rounded-lg">Home</a>
                    <a href="/airport-transfers" className="block text-brand/80 hover:text-brand hover:bg-primaryBg/50 px-3 py-3 text-base font-medium rounded-lg">Airport Transfers</a>
                </div>
            </div>
        </header>

        {/* MAP BACKGROUND */}
        <div className="fixed inset-0 h-[45vh] z-0">
            <div ref={mapContainer} className="w-full h-full"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-primary-black pointer-events-none"></div>
        </div>

        {/* MAIN SHEET */}
        <div id="main-sheet" className={`relative z-10 mt-[38vh] floating-sheet rounded-t-[2rem] border-t border-brand-gold/20 shadow-2xl flex-1 overflow-y-auto pb-40 ${sheetExpanded ? 'sheet-expanded' : ''}`}>
            
            <div className="drag-handle w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5"></div>
            
            {/* Close Btn */}
            <div className={`close-sheet-btn absolute top-4 right-4 z-50 cursor-pointer p-2 ${sheetExpanded ? 'block' : 'hidden'}`} onClick={() => setSheetExpanded(false)}>
                <div className="bg-black/50 rounded-full p-2 border border-brand-gold/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* BOOKING FORM */}
            <div className="w-[90%] mx-auto max-w-5xl space-y-5 pt-1 px-1 mb-20">
                <div className="space-y-3 relative">
                    {/* Pickup */}
                    <div className="location-field-wrapper group">
                        <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                            <div className="mr-3 flex-shrink-0 text-brand-gold">●</div>
                            <input type="text" value={pickup} onChange={(e) => handleLocationInput('pickup', e.target.value)} onFocus={() => setSheetExpanded(true)} placeholder="Enter pickup location" className="text-[15px] font-medium w-full bg-transparent outline-none text-white"/>
                            <button onClick={swapLocations} className="ml-2 p-1.5 rounded-full hover:bg-white/10">⇅</button>
                        </div>
                        {suggestions.type === 'pickup' && (
                            <ul className="suggestions-list block">
                                {suggestions.items.map((item, i) => (
                                    item.isHeader ? 
                                    <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                                    <li key={i} onClick={() => selectLocation('pickup', item.name || item.text, item.center)}>{item.name || item.text}</li>
                                ))}
                            </ul>
                        )}
                        <div className="connector-line"></div>
                    </div>

                    {/* Stops */}
                    {stops.map((stop, i) => (
                        <div key={stop.id} className="location-field-wrapper group pl-5">
                            <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                                <span className="mr-3 text-blue-400">●</span>
                                <input type="text" value={stop.value} onChange={(e) => handleLocationInput('stop', e.target.value, stop.id)} placeholder={`Stop ${i+1}`} className="text-[15px] font-medium w-full bg-transparent outline-none text-white"/>
                                <button onClick={() => {
                                    const newStops = stops.filter(s => s.id !== stop.id);
                                    setStops(newStops);
                                    // Remove from map logic here simplified
                                }} className="ml-2 text-gray-600 hover:text-red-500">✕</button>
                            </div>
                        </div>
                    ))}

                    {/* Dropoff */}
                    <div className="location-field-wrapper group">
                        <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                            <div className="mr-3 flex-shrink-0 text-brand-gold">■</div>
                            <input type="text" value={dropoff} onChange={(e) => handleLocationInput('dropoff', e.target.value)} onFocus={() => setSheetExpanded(true)} placeholder="Enter destination" className="text-[15px] font-medium w-full bg-transparent outline-none text-white"/>
                        </div>
                        {suggestions.type === 'dropoff' && (
                            <ul className="suggestions-list block">
                                {suggestions.items.map((item, i) => (
                                    item.isHeader ? 
                                    <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                                    <li key={i} onClick={() => selectLocation('dropoff', item.name || item.text, item.center)}>{item.name || item.text}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button onClick={() => setStops([...stops, {id: Date.now(), value: ''}])} className="text-[10px] font-bold text-brand-gold uppercase border border-brand-gold/30 rounded px-2 py-1">+ Add Stop</button>
                    </div>
                </div>

                {/* Date/Time/Flight Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="uppercase text-sm cursor-pointer w-full bg-transparent text-white outline-none"/></div>
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center"><input type="time" value={time} onChange={e => setTime(e.target.value)} className="uppercase text-sm cursor-pointer w-full bg-transparent text-white outline-none"/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center"><input type="text" placeholder="Flight No." value={flightNo} onChange={e => setFlightNo(e.target.value)} className="uppercase text-sm bg-transparent text-white outline-none w-full"/></div>
                        <label className="checkbox-wrapper unified-input rounded-xl h-[50px] px-3 flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-brand-gold">Meet & Greet £5</span>
                            <input type="checkbox" checked={meetGreet} onChange={() => setMeetGreet(!meetGreet)} className="hidden"/>
                            <div className={`w-4 h-4 border border-gray-600 rounded flex items-center justify-center ${meetGreet ? 'bg-brand-gold border-brand-gold' : ''}`}>✓</div>
                        </label>
                    </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest mt-2">Select Class</h3>
                    <div className="vehicle-scroll flex overflow-x-auto gap-3 snap-x pb-4 px-1">
                        {vehicles.map((v, i) => (
                            <div key={i} onClick={() => setSelectedVehicleIndex(i)} className={`vehicle-card min-w-[130px] w-[130px] p-3 rounded-2xl cursor-pointer snap-center flex flex-col justify-between ${selectedVehicleIndex === i ? 'selected' : ''}`}>
                                <div className="selected-badge absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{opacity: selectedVehicleIndex === i ? 1 : 0}}>Selected</div>
                                <div><h4 className="text-white font-bold text-xs mb-0.5">{v.name}</h4><p className="text-[9px] text-gray-400">{v.description}</p></div>
                                <div className="flex-1 flex items-center justify-center py-2"><img src={v.image} className="w-full object-contain"/></div>
                                <div className="flex justify-between items-end border-t border-white/10 pt-1.5"><div className="flex gap-1.5 text-gray-400 text-[10px]"><span>👤{v.passengers}</span><span>🧳{v.luggage}</span></div><span className="text-brand-gold font-bold text-[10px]">£{v.perMile}/mi</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* OFFERS SECTION */}
            <div className="bg-brand-gold py-20 md:py-28 relative font-sans text-primary-black overflow-hidden z-0 rounded-t-3xl">
                <div className="w-[90%] mx-auto max-w-7xl relative z-10">
                    <div className="text-center max-w-5xl mx-auto mb-16 md:mb-20">
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight uppercase drop-shadow-xl text-primary-black">Unbeatable Airport Taxi Transfers UK</h2>
                    </div>
                    {/* Offers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2">
                        {['Heathrow', 'Gatwick', 'Bristol'].map((airport, i) => (
                            <div key={i} className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                                <div className="flex flex-col gap-1 mb-8 text-center">
                                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                                    <div className="text-brand-gold text-sm my-1">to</div>
                                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">{airport} Airport</div>
                                </div>
                                <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£{99 + (i*30)}</span>
                                </div>
                                <div className="mt-8 text-center">
                                    <a href={`https://booking.fare1.co.uk?pickup=Southampton&dropoff=${airport}%20Airport`} className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white transition">Book This Deal</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-primary-black py-20 border-t border-brand-gold/10 relative overflow-hidden font-sans">
                <div className="w-[90%] mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                        <div className="text-center md:text-left"><h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-2 uppercase tracking-tight"><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#F3E5AB]">Feedback</span></h2></div>
                        <div className="flex items-center gap-4 bg-secondary-black border border-brand-gold/20 px-6 py-3 rounded-full shadow-lg">
                            <div className="flex flex-col"><div className="flex text-brand-gold text-sm">★★★★★</div><span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{placeRating ? `${placeRating.rating} Rating (${placeRating.total} Reviews)` : 'Loading...'}</span></div>
                        </div>
                    </div>
                    <div className="review-scroll flex overflow-x-auto gap-5 snap-x pb-10 px-1">
                        {reviews.length > 0 ? reviews.map((r, i) => (
                            <div key={i} className="review-card min-w-[300px] md:min-w-[350px] p-6 rounded-2xl snap-center flex flex-col justify-between relative select-none">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src={r.profile_photo_url} alt={r.author_name} className="w-12 h-12 rounded-full border border-white/10 object-cover"/>
                                        <div><h4 className="text-white font-bold text-sm font-heading">{r.author_name}</h4><p className="text-[10px] text-gray-500 font-sans">{r.relative_time_description}</p></div>
                                    </div>
                                    <div className="flex gap-1 mb-3 text-sm tracking-wide text-brand-gold">★★★★★</div>
                                    <p className="text-gray-300 text-sm leading-relaxed font-sans font-light opacity-90 border-t border-white/5 pt-3">"{r.text.length > 150 ? r.text.substring(0, 150)+'...' : r.text}"</p>
                                </div>
                            </div>
                        )) : <div className="text-gray-500">Loading Google Reviews...</div>}
                    </div>
                </div>
            </div>

        </div>

        {/* BOTTOM BAR */}
        <div id="bottom-bar" className={`bottom-bar fixed bottom-0 left-0 w-full bg-black/95 border-t border-brand-gold/20 py-2 px-5 z-[80] safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,1)] ${distance > 0 ? 'visible' : ''}`}>
            <div className="flex justify-between items-center max-w-5xl mx-auto gap-4">
                <div className="flex flex-col justify-center min-w-0">
                    <div className="text-[9px] font-black text-brand-gold mb-0.5 tracking-wider uppercase truncate animate-pulse-custom">{totalPrice >= 130 ? "15% DISCOUNT APPLIED" : "REACH £130 & GET 15% OFF"}</div>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        {totalPrice >= 130 && <span className="text-[10px] font-bold text-red-500 line-through opacity-70">£{(totalPrice / 0.85).toFixed(2)}</span>}
                        <p className="text-3xl font-heading font-black text-white tracking-tight leading-none flex items-baseline gap-2">£<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#fff5cc]">{totalPrice.toFixed(2)}</span></p>
                    </div>
                </div>
                <button onClick={goToBooking} className="bg-brand-gold text-black font-extrabold py-2 px-6 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#e6c355] transition-transform active:scale-95 text-sm uppercase tracking-wide whitespace-nowrap">Book Now</button>
            </div>
        </div>

        {/* LOCATION SHEET OVERLAY */}
        {showLocationSheet && (
            <div className="fixed inset-0 bg-black/90 z-[90] flex items-end sm:items-center justify-center transition-opacity duration-300 backdrop-blur-sm">
                <div className="bg-[#121212] w-full max-w-md p-6 rounded-t-[2rem] sm:rounded-[2rem] border border-white/10 shadow-2xl pb-10">
                    <div className="w-12 h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold border border-brand-gold/20">📍</div>
                    <h2 className="text-2xl font-black text-white text-center mb-2 font-heading">Where to?</h2>
                    <button onClick={getUserLocation} className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl mb-3 mt-6 shadow-lg">Use My Current Location</button>
                    <button onClick={() => setShowLocationSheet(false)} className="w-full bg-white/5 text-gray-400 font-semibold py-3.5 rounded-xl border border-white/5">Enter Address Manually</button>
                </div>
            </div>
        )}
    </div>
  );
}