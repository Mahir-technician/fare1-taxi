"use client";

import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import Link from "next/link";
import { Car, MapPin, Phone, ShieldCheck, Star, Menu, X, Plane, Users, Briefcase } from "lucide-react";

// --- CONFIGURATION ---
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmFyZTFsdGQiLCJhIjoiY21pcnN4MWZlMGhtcDU2c2dyMTlvODJoNSJ9.fyUV4gMDcEBgWZnQfxS7XA';

// --- DATA ---
const VEHICLES = [
  { name: "Standard Saloon", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Saloon-2.png", perMile: 1.67, passengers: 4, luggage: 2, desc: "Economic" },
  { name: "Executive Saloon", image: "https://www.fareone.co.uk/wp-content/uploads/2025/12/executive-saloon.png", perMile: 2.25, passengers: 3, luggage: 2, desc: "Mercedes E-Class" },
  { name: "Standard Estate", image: "https://www.fareone.co.uk/wp-content/uploads/2025/12/standard-estate.png", perMile: 2.03, passengers: 4, luggage: 4, desc: "Extra Space" },
  { name: "Executive Estate", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Estate-2.png", perMile: 2.54, passengers: 4, luggage: 4, desc: "Premium Estate" },
  { name: "Standard MPV", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/People-Carrier-3.png", perMile: 2.37, passengers: 6, luggage: 8, desc: "Group Travel" },
  { name: "Executive MPV", image: "https://www.fareone.co.uk/wp-content/uploads/2025/12/Executive-People-Carrier-Pic.png", perMile: 2.72, passengers: 6, luggage: 8, desc: "V-Class Luxury" },
  { name: "8 Seater", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Executive-Mini-Bus.png", perMile: 2.57, passengers: 8, luggage: 16, desc: "Mini Bus" },
  { name: "Executive 8 Seater", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/People-Carrier-2.png", perMile: 3.22, passengers: 8, luggage: 16, desc: "Luxury Mini Bus" },
  { name: "Accessible", image: "https://www.fareone.co.uk/wp-content/uploads/2025/11/Accessible-2.png", perMile: 3.57, passengers: 3, luggage: 2, desc: "WAV" }
];

const AIRPORTS = [
  { name: "Heathrow", price: "£99", from: "Southampton" },
  { name: "Gatwick", price: "£130", from: "Southampton" },
  { name: "Luton", price: "£170", from: "Southampton" },
  { name: "Stansted", price: "£220", from: "Southampton" },
  { name: "London City", price: "£190", from: "Southampton" },
  { name: "Bournemouth", price: "£65", from: "Southampton" },
];

export default function Home() {
  // --- STATE ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
  // Booking Data State
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [date, setDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [meetGreet, setMeetGreet] = useState(false);
  
  const [coords, setCoords] = useState<{ pickup: any; dropoff: any }>({ pickup: null, dropoff: null });

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapMarkers = useRef<{ start: mapboxgl.Marker | null; end: mapboxgl.Marker | null }>({ start: null, end: null });

  // --- EFFECTS ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    // Set default date-time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDate(now.toISOString().slice(0, 16));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mapbox Init
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-1.4043, 50.9097], // Southampton Coordinates default
      zoom: 11,
      attributionControl: false,
    });
  }, []);

  // Price Calculation Logic
  useEffect(() => {
    if (distance > 0) {
      let basePrice = distance * VEHICLES[selectedVehicle].perMile;
      if (basePrice < 5) basePrice = 5; // Minimum fare
      
      // Add Meet & Greet fee if checked
      if (meetGreet) basePrice += 5;

      setPrice(parseFloat(basePrice.toFixed(2)));
    }
  }, [distance, selectedVehicle, meetGreet]);

  // --- LOGIC ---
  const handleSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') setPickup(query);
    else setDropoff(query);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
      setActiveInput(type);
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const selectLocation = (feature: any) => {
    const coordsArray = feature.center;
    const name = feature.place_name;

    if (activeInput === 'pickup') {
      setPickup(name);
      setCoords(prev => ({ ...prev, pickup: coordsArray }));
      if (map.current) {
        if (mapMarkers.current.start) mapMarkers.current.start.remove();
        mapMarkers.current.start = new mapboxgl.Marker({ color: '#D4AF37' }).setLngLat(coordsArray).addTo(map.current);
        map.current.flyTo({ center: coordsArray, zoom: 13 });
      }
    } else {
      setDropoff(name);
      setCoords(prev => ({ ...prev, dropoff: coordsArray }));
      if (map.current) {
        if (mapMarkers.current.end) mapMarkers.current.end.remove();
        mapMarkers.current.end = new mapboxgl.Marker({ color: '#ef4444' }).setLngLat(coordsArray).addTo(map.current);
      }
    }
    setSuggestions([]);
    setActiveInput(null);
    calculateRoute();
  };

  const calculateRoute = async () => {
    // Wait for state update to reflect in coords ref if needed, but here we depend on next render cycle or use the feature directly. 
    // Better to check if both exist in state directly.
    // NOTE: coords state update is async, so we might need a useEffect or pass values directly. 
    // For now, let's rely on the user selecting the second point triggering a re-render/effect if we put it in useEffect, 
    // OR just wait for the user to select.
    // Actually, selectLocation updates state, so calculateRoute using `coords` state immediately might use old state.
    // FIX: We will call calculateRoute inside a useEffect dependent on coords.
  };

  // Trigger route calc when coords change
  useEffect(() => {
    const fetchRoute = async () => {
        if (!coords.pickup || !coords.dropoff) return;

        try {
            const query = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords.pickup.join(',')};${coords.dropoff.join(',')}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
            const data = await query.json();
    
            if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const distMiles = route.distance / 1609.34;
            setDistance(distMiles);
    
            // Draw Route
            if (map.current) {
                const geojson: any = { type: 'Feature', properties: {}, geometry: route.geometry };
                if (map.current.getSource('route')) {
                (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
                } else {
                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: { type: 'geojson', data: geojson },
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#D4AF37', 'line-width': 4, 'line-opacity': 0.8 }
                });
                }
                
                // Fit bounds
                const bounds = new mapboxgl.LngLatBounds();
                bounds.extend(coords.pickup);
                bounds.extend(coords.dropoff);
                map.current.fitBounds(bounds, { padding: 80 });
            }
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchRoute();
  }, [coords]);

  // Handle Booking Redirect (Like original goToBooking)
  const handleBookRide = () => {
    if (!pickup || !dropoff) {
      alert("Please enter pickup and dropoff locations.");
      return;
    }

    const vehicleName = VEHICLES[selectedVehicle].name;
    const url = new URL('https://booking.fare1.co.uk');
    url.searchParams.append('pickup', pickup);
    url.searchParams.append('dropoff', dropoff);
    url.searchParams.append('vehicle', vehicleName);
    url.searchParams.append('price', price.toString());
    url.searchParams.append('date', date);
    url.searchParams.append('flight', flightNumber);
    url.searchParams.append('meet', meetGreet ? 'true' : 'false');
    url.searchParams.append('pax', passengers.toString());
    url.searchParams.append('bags', luggage.toString());

    window.location.href = url.toString();
  };

  return (
    <main className="min-h-screen bg-primary-black text-white overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed z-50 w-full transition-all duration-300 ${isScrolled ? 'top-4' : 'top-0'}`}>
        <div className={`mx-auto transition-all duration-300 ${isScrolled ? 'max-w-4xl' : 'w-full'}`}>
          <div className="glow-wrapper">
            <div className="glow-content bg-secondary-black flex items-center justify-between px-6 py-4 shadow-2xl border border-brand-gold/10 rounded-xl">
              
              <Link href="/" className="flex items-center gap-2 group">
                <Car className="text-brand-gold w-8 h-8" />
                <span className="font-heading font-bold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-white">
                  FARE 1 TAXI
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <a href="tel:+442381112682" className="flex items-center gap-2 text-sm font-semibold hover:text-brand-gold transition">
                  <Phone className="w-4 h-4 text-brand-gold" /> +44 2381 112682
                </a>
                <button className="bg-brand-gold text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-white transition shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  Book Now
                </button>
              </div>

              {/* Mobile Toggle */}
              <button className="md:hidden text-brand-gold" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-secondary-black border-b border-brand-gold/20 p-6 md:hidden animate-fade-in z-50">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-brand-gold font-bold">Home</Link>
              <Link href="/services" className="text-gray-300">Services</Link>
              <Link href="/contact" className="text-gray-300">Contact</Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION (Map & Booking) --- */}
      <section className="relative h-screen min-h-[800px] flex flex-col">
        {/* Map Background */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-2/3 md:h-full z-0 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-black/60 via-transparent to-primary-black z-0 pointer-events-none" />

        {/* Booking Interface */}
        <div className="relative z-10 mt-auto md:mt-32 w-full max-w-6xl mx-auto px-4 pb-20">
          <div className="bg-[#121212]/95 backdrop-blur-md border border-brand-gold/20 rounded-3xl p-6 shadow-2xl">
            
            {/* Inputs */}
            <div className="grid md:grid-cols-2 gap-4 mb-6 relative">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="unified-input rounded-xl flex items-center h-14 px-4 bg-black border border-white/10 focus-within:border-brand-gold transition-colors">
                    <MapPin className="text-brand-gold w-5 h-5 mr-3" />
                    <input 
                      type="text" 
                      placeholder="Pick-up Location" 
                      className="bg-transparent w-full h-full outline-none text-white font-medium"
                      value={pickup}
                      onChange={(e) => handleSearch(e.target.value, 'pickup')}
                    />
                  </div>
                  {/* Suggestions Dropdown */}
                  {activeInput === 'pickup' && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-black border border-brand-gold/30 rounded-b-xl z-50">
                      {suggestions.map((s) => (
                        <div key={s.id} onClick={() => selectLocation(s)} className="p-3 hover:bg-brand-gold/20 cursor-pointer text-sm text-gray-300 border-b border-white/5">
                          {s.place_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <div className="unified-input rounded-xl flex items-center h-14 px-4 bg-black border border-white/10 focus-within:border-brand-gold transition-colors">
                    <MapPin className="text-red-500 w-5 h-5 mr-3" />
                    <input 
                      type="text" 
                      placeholder="Drop-off Destination" 
                      className="bg-transparent w-full h-full outline-none text-white font-medium"
                      value={dropoff}
                      onChange={(e) => handleSearch(e.target.value, 'dropoff')}
                    />
                  </div>
                  {/* Suggestions Dropdown */}
                  {activeInput === 'dropoff' && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-black border border-brand-gold/30 rounded-b-xl z-50">
                      {suggestions.map((s) => (
                        <div key={s.id} onClick={() => selectLocation(s)} className="p-3 hover:bg-brand-gold/20 cursor-pointer text-sm text-gray-300 border-b border-white/5">
                          {s.place_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                {/* Passengers */}
                <div className="unified-input rounded-xl flex items-center px-4 bg-black border border-white/10">
                  <Users className="text-gray-500 w-4 h-4 mr-2" />
                  <select 
                    className="bg-transparent w-full h-full outline-none text-white text-sm appearance-none cursor-pointer"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-black">{n} Passengers</option>)}
                  </select>
                </div>
                {/* Luggage */}
                <div className="unified-input rounded-xl flex items-center px-4 bg-black border border-white/10">
                  <Briefcase className="text-gray-500 w-4 h-4 mr-2" />
                  <select 
                    className="bg-transparent w-full h-full outline-none text-white text-sm appearance-none cursor-pointer"
                    value={luggage}
                    onChange={(e) => setLuggage(parseInt(e.target.value))}
                  >
                    {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-black">{n} Bags</option>)}
                  </select>
                </div>
                {/* Flight Number */}
                <div className="unified-input rounded-xl flex items-center px-4 bg-black h-12 border border-white/10">
                  <Plane className="text-gray-500 w-4 h-4 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Flight No. (Optional)" 
                    className="bg-transparent w-full h-full outline-none text-white text-sm uppercase placeholder-gray-500"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                  />
                </div>
                {/* Meet & Greet */}
                <div 
                  className={`unified-input rounded-xl flex items-center justify-between px-4 bg-black h-12 cursor-pointer border ${meetGreet ? 'border-brand-gold' : 'border-white/10'}`}
                  onClick={() => setMeetGreet(!meetGreet)}
                >
                  <span className="text-xs text-gray-400 font-bold uppercase">Meet & Greet</span>
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${meetGreet ? 'bg-brand-gold border-brand-gold' : 'border-gray-500'}`}>
                    {meetGreet && <div className="text-black text-[10px] font-bold">✓</div>}
                  </div>
                </div>
                {/* Date Time */}
                <div className="col-span-2 unified-input rounded-xl flex items-center px-4 bg-black h-12 border border-white/10">
                  <input 
                    type="datetime-local" 
                    className="bg-transparent w-full h-full outline-none text-white text-sm uppercase" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Vehicle Class</h3>
              <div className="flex overflow-x-auto gap-4 vehicle-scroll pb-2">
                {VEHICLES.map((v, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedVehicle(i)}
                    className={`min-w-[140px] p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedVehicle === i 
                        ? 'border-brand-gold bg-brand-gold/10' 
                        : 'border-white/10 bg-black/40 hover:border-white/30'
                    }`}
                  >
                    <div className="h-16 mb-2 relative flex items-center justify-center">
                        <img src={v.image} alt={v.name} className="w-auto h-full object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{v.name}</h4>
                    <div className="flex justify-between text-[10px] text-gray-400">
                        <span>👤 {v.passengers}</span>
                        <span>🧳 {v.luggage}</span>
                    </div>
                    <div className="mt-2 text-brand-gold font-bold text-sm">£{v.perMile}/mi</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-brand-gold uppercase tracking-wider mb-1 animate-pulse">
                  {distance > 0 ? `Est. Distance: ${distance.toFixed(1)} miles` : 'Enter locations to see price'}
                </p>
                <div className="text-4xl font-heading font-black text-white">
                  £{price > 0 ? price : '0.00'}
                </div>
              </div>
              <button 
                onClick={handleBookRide}
                className="bg-brand-gold text-black font-extrabold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:bg-white hover:scale-105 transition-all uppercase tracking-wide"
              >
                Book Ride
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* --- AIRPORT TRANSFERS --- */}
      <section className="py-20 bg-brand-gold relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-primary-black mb-4 uppercase">
              Unbeatable Airport Rates
            </h2>
            <p className="text-primary-black/80 font-semibold max-w-2xl mx-auto">
              Lowest fixed fares from Southampton. Premium service, economy prices.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {AIRPORTS.map((airport, idx) => (
              <div key={idx} className="bg-secondary-black p-8 rounded-3xl border border-brand-gold/20 shadow-2xl hover:-translate-y-2 transition-transform duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <Plane className="text-brand-gold w-8 h-8" />
                  <span className="bg-brand-gold/20 text-brand-gold text-xs font-bold px-3 py-1 rounded-full uppercase">Fixed</span>
                </div>
                <div className="text-center mb-8">
                  <div className="text-white text-xl font-bold">{airport.from}</div>
                  <div className="text-gray-500 text-xs my-1">TO</div>
                  <div className="text-white text-2xl font-black">{airport.name} Airport</div>
                </div>
                <div className="bg-black/50 py-4 rounded-xl text-center mb-6 border border-white/5">
                  <span className="text-4xl font-black text-brand-gold">{airport.price}</span>
                </div>
                <button className="w-full bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-white transition">
                  Book This Deal
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- REVIEWS --- */}
      <section className="py-20 border-t border-brand-gold/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-12 bg-secondary-black w-fit px-6 py-3 rounded-full border border-white/10">
            <div className="flex text-brand-gold"><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /></div>
            <span className="text-gray-400 text-sm font-bold uppercase">Trusted by 500+ Travelers</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="review-card bg-secondary-black p-8 rounded-3xl border border-white/5 relative">
                <div className="absolute top-6 right-8 text-6xl text-brand-gold/10 font-serif">”</div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-white">Happy Traveler</h4>
                    <div className="flex text-brand-gold text-xs">★★★★★</div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  "Absolutely brilliant service. The driver was early, the car was pristine, and the journey was smooth. Will definitely use FARE 1 again for my airport runs."
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}