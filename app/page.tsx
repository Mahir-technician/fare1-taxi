'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

// --- TypeScript Definitions ---
type LngLat = [number, number];

interface SuggestionItem {
  text: string;
  center: LngLat;
  isHeader?: boolean;
  name?: string;
}

declare global {
  interface Window {
    mapboxgl: any;
    google: any;
  }
}

// --- Constants ---
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmFyZTFsdGQiLCJhIjoiY21pcnN4MWZlMGhtcDU2c2dyMTlvODJoNSJ9.fyUV4gMDcEBgWZnQfxS7XA';

const PRESET_DATA: Record<string, {name: string, center: LngLat}[]> = {
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

const MAX_STOPS = 3;

export default function Home() {
  // --- UI State (Non-Scroll) ---
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetOverlayOpen, setSheetOverlayOpen] = useState(true);
  
  // --- Booking Data ---
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetGreet, setMeetGreet] = useState(false);
  const [pax, setPax] = useState(1);
  const [bags, setBags] = useState(0);
  
  // --- Computed/Data ---
  const [filteredVehicles, setFilteredVehicles] = useState<typeof vehicles>([]);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [distanceDisplay, setDistanceDisplay] = useState('0 mi');
  const [promoText, setPromoText] = useState("REACH £130 & GET 15% OFF");
  const [promoClass, setPromoClass] = useState('text-brand-gold');
  const [oldPriceVisible, setOldPriceVisible] = useState(false);
  const [oldPrice, setOldPrice] = useState(0);
  
  // --- Suggestions & Reviews ---
  const [pickupSuggestions, setPickupSuggestions] = useState<SuggestionItem[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<SuggestionItem[]>([]);
  const [stopSuggestions, setStopSuggestions] = useState<{ [key: string]: SuggestionItem[] }>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [headerStars, setHeaderStars] = useState('★★★★★');
  const [totalRatings, setTotalRatings] = useState('Loading...');

  // --- Refs (Direct DOM Access for Performance) ---
  const headerRef = useRef<HTMLElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const mainSheetRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const isBottomBarVisible = useRef(false); // Ref to track visibility logic without re-render

  // --- Map Refs ---
  const mapRef = useRef<any>(null);
  const startMarker = useRef<any>(null);
  const endMarker = useRef<any>(null);
  const stopMarkers = useRef<{ [key: string]: any }>({});
  const routeWaypoints = useRef<{ pickup: LngLat | null, dropoff: LngLat | null, stops: (LngLat | null)[] }>({ pickup: null, dropoff: null, stops: [] });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // --- Scroll Handler (Optimized: No React Re-renders) ---
  const handleSheetScroll = useCallback(() => {
    const sheet = mainSheetRef.current;
    const header = headerRef.current;
    const bottomBar = bottomBarRef.current;
    
    if (!sheet) return;

    const st = sheet.scrollTop;

    // 1. Header Logic (Direct Class Toggle)
    if (st > 50) {
        header?.classList.add('is-scrolled');
    } else {
        header?.classList.remove('is-scrolled');
    }

    // 2. Bottom Bar Logic (Direct Class Toggle)
    if (isBottomBarVisible.current && bottomBar) {
        if (st > lastScrollTop.current && st > 50) {
            bottomBar.classList.add('hidden-scroll');
        } else {
            bottomBar.classList.remove('hidden-scroll');
        }
    }

    lastScrollTop.current = st <= 0 ? 0 : st;
  }, []);

  // --- Initialization ---
  useEffect(() => {
    // Set Date/Time
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().substring(0, 5));

    // Mapbox Init
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      mapRef.current = new window.mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-0.1276, 51.5074],
        zoom: 11,
        attributionControl: false,
        pitchWithRotate: false
      });
      mapRef.current.scrollZoom.disable();
      mapRef.current.on('touchstart', () => mapRef.current.dragPan.enable());
    }

    // Attach Optimized Scroll Listener
    const sheet = mainSheetRef.current;
    if (sheet) {
        sheet.addEventListener('scroll', handleSheetScroll, { passive: true });
    }

    // Init Reviews
    initReviews();

    return () => {
        if (sheet) sheet.removeEventListener('scroll', handleSheetScroll);
    };
  }, [handleSheetScroll]);

  // --- Pricing & Logic ---
  const currentDistanceMiles = useRef(0);

  useEffect(() => {
    const filtered = vehicles.filter(v => v.passengers >= pax && v.luggage >= bags);
    setFilteredVehicles(filtered);
    if (filtered.length > 0 && !filtered.some((v, i) => i === selectedVehicleIndex)) {
      setSelectedVehicleIndex(0);
    }
  }, [pax, bags]);

  const updatePrice = useCallback(() => {
    if (currentDistanceMiles.current <= 0) return;
    let p = currentDistanceMiles.current * vehicles[selectedVehicleIndex].perMile;
    if (p < 5) p = 5;
    if (meetGreet) p += 5;
    
    if (p >= 130) {
      setOldPriceVisible(true);
      setOldPrice(p);
      p = p * 0.85;
      setPromoText("15% DISCOUNT APPLIED");
      setPromoClass('text-green-400');
    } else {
      setOldPriceVisible(false);
      setPromoText("REACH £130 & GET 15% OFF");
      setPromoClass('text-brand-gold');
    }
    setTotalPrice(p);
  }, [selectedVehicleIndex, meetGreet]);

  useEffect(() => {
    updatePrice();
  }, [selectedVehicleIndex, meetGreet, updatePrice]);

  const checkVisibility = () => {
    const p = routeWaypoints.current.pickup;
    const d = routeWaypoints.current.dropoff;
    const visible = !!p && !!d;
    
    isBottomBarVisible.current = visible; // Update ref for scroll handler
    
    // Update DOM directly for visibility to avoid re-render loop
    const bottomBar = bottomBarRef.current;
    if (bottomBar) {
        if (visible) bottomBar.classList.add('visible');
        else bottomBar.classList.remove('visible');
    }
  };

  const initReviews = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);
      service.getDetails({
        placeId: 'ChIJ9caM2nkSsYsRzNAS6kVqn2k',
        fields: ['reviews', 'rating', 'user_ratings_total']
      }, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let hStars = '';
          for (let i = 0; i < 5; i++) {
            hStars += i < Math.round(place.rating) ? '★' : '<span class="text-gray-700">★</span>';
          }
          setHeaderStars(hStars);
          setTotalRatings(`${place.rating} Rating (${place.user_ratings_total} Reviews)`);
          setReviews(place.reviews || []);
        } else {
          setTotalRatings('Unable to load reviews.');
        }
      });
    }
  };

  // --- Interaction Handlers ---
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const collapseSheet = () => setSheetExpanded(false);
  
  const expandSheetAndCloseOthers = (id: string) => {
    setPickupSuggestions([]);
    setDropoffSuggestions([]);
    setStopSuggestions({});
    if (window.innerWidth < 768) {
      setSheetExpanded(true);
      if (mainSheetRef.current) mainSheetRef.current.scrollTo(0, 0);
    }
    handleTyping(id, (document.getElementById(id) as HTMLInputElement)?.value || '');
  };

  const showPresets = (type: string) => {
    let list: SuggestionItem[] = [];
    Object.keys(PRESET_DATA).forEach(category => {
      list.push({ isHeader: true, text: category, center: [0,0] });
      PRESET_DATA[category].forEach((p) => list.push({ text: p.name, center: p.center }));
    });
    if (type === 'pickup') setPickupSuggestions(list);
    if (type === 'dropoff') setDropoffSuggestions(list);
    if (type.startsWith('stop-')) setStopSuggestions(prev => ({ ...prev, [type]: list }));
  };

  const handleTyping = (type: string, value: string) => {
    if (type === 'pickup') routeWaypoints.current.pickup = null;
    if (type === 'dropoff') routeWaypoints.current.dropoff = null;
    if (type.startsWith('stop-')) {
      const idx = parseInt(type.split('-')[1]) - 1;
      routeWaypoints.current.stops[idx] = null;
    }
    checkVisibility(); // Update visibility immediately on clear

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (value.length === 0) {
      showPresets(type);
      return;
    }
    if (value.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      if (type === 'dropoff') setDropoffSuggestions([]);
      if (type.startsWith('stop-')) setStopSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }
    
    debounceTimer.current = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=5&types=poi,address`)
        .then(r => r.json()).then(data => {
          let list: SuggestionItem[] = [];
          if (data.features?.length) {
            data.features.forEach((f: any) => list.push({ text: f.place_name, center: f.center as LngLat }));
          }
          if (type === 'pickup') setPickupSuggestions(list);
          if (type === 'dropoff') setDropoffSuggestions(list);
          if (type.startsWith('stop-')) setStopSuggestions(prev => ({ ...prev, [type]: list }));
        });
    }, 300);
  };

  const selectLocation = (type: string, name: string, coords: LngLat) => {
    if (!mapRef.current) return;

    if (type === 'pickup') {
      setPickup(name);
      routeWaypoints.current.pickup = coords;
      if (startMarker.current) startMarker.current.remove();
      startMarker.current = new window.mapboxgl.Marker({ color: '#D4AF37' }).setLngLat(coords).addTo(mapRef.current);
      mapRef.current.flyTo({ center: coords, zoom: 13 });
      setPickupSuggestions([]);
    } else if (type === 'dropoff') {
      setDropoff(name);
      routeWaypoints.current.dropoff = coords;
      if (endMarker.current) endMarker.current.remove();
      endMarker.current = new window.mapboxgl.Marker({ color: '#ef4444' }).setLngLat(coords).addTo(mapRef.current);
      setDropoffSuggestions([]);
    } else if (type.startsWith('stop-')) {
      const idx = parseInt(type.split('-')[1]) - 1;
      setStops(prev => prev.map((val, i) => i === idx ? name : val));
      routeWaypoints.current.stops[idx] = coords;
      if (stopMarkers.current[type]) stopMarkers.current[type].remove();
      stopMarkers.current[type] = new window.mapboxgl.Marker({ color: '#3b82f6', scale: 0.8 }).setLngLat(coords).addTo(mapRef.current);
      setStopSuggestions(prev => ({ ...prev, [type]: [] }));
    }
    collapseSheet();
    calculateRoute();
    checkVisibility();
  };

  const calculateRoute = () => {
    if (!routeWaypoints.current.pickup || !routeWaypoints.current.dropoff || !mapRef.current) return;
    
    let coords: LngLat[] = [routeWaypoints.current.pickup];
    routeWaypoints.current.stops.forEach(s => { if (s) coords.push(s); });
    coords.push(routeWaypoints.current.dropoff);
    
    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    fetch(url).then(r => r.json()).then(data => {
      if (!data.routes?.length) return;
      const r = data.routes[0];
      const distMiles = r.distance / 1609.34;
      currentDistanceMiles.current = distMiles;
      setDistanceDisplay(distMiles.toFixed(1) + ' mi');
      updatePrice();
      
      if (mapRef.current.getSource('route')) {
        mapRef.current.getSource('route').setData(r.geometry);
      } else {
        mapRef.current.addLayer({ 
            id: 'route', type: 'line', 
            source: { type: 'geojson', data: r.geometry }, 
            paint: { 'line-color': '#D4AF37', 'line-width': 4, 'line-opacity': 0.8 } 
        });
      }
      const bounds = new window.mapboxgl.LngLatBounds();
      coords.forEach(c => bounds.extend(c));
      mapRef.current.fitBounds(bounds, { padding: 80 });
    });
  };

  const addStop = () => {
    if (stops.length >= MAX_STOPS) return;
    setStops([...stops, '']);
    routeWaypoints.current.stops.push(null);
  };

  const removeStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
    routeWaypoints.current.stops.splice(index, 1);
    const type = `stop-${index + 1}`;
    if (stopMarkers.current[type]) {
      stopMarkers.current[type].remove();
      delete stopMarkers.current[type];
    }
    calculateRoute();
  };

  const handleStopChange = (index: number, value: string) => {
    setStops(prev => prev.map((val, i) => i === index ? value : val));
    handleTyping(`stop-${index + 1}`, value);
  };

  const selectVehicle = (index: number) => {
    setSelectedVehicleIndex(index);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            selectLocation('pickup', 'Current Location', [pos.coords.longitude, pos.coords.latitude]);
            setSheetOverlayOpen(false);
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
  };

  const swapLocations = () => {
    const tempPickup = pickup; setPickup(dropoff); setDropoff(tempPickup);
    const temp = routeWaypoints.current.pickup;
    routeWaypoints.current.pickup = routeWaypoints.current.dropoff;
    routeWaypoints.current.dropoff = temp;
    if (startMarker.current && endMarker.current) {
      const tLoc = startMarker.current.getLngLat();
      startMarker.current.setLngLat(endMarker.current.getLngLat());
      endMarker.current.setLngLat(tLoc);
    }
    calculateRoute();
  };

  const goToBooking = () => {
    let url = `https://booking.fare1.co.uk?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}&vehicle=${encodeURIComponent(vehicles[selectedVehicleIndex].name)}&price=${totalPrice.toFixed(2)}&date=${date}&time=${time}&flight=${flightNumber}&meet=${meetGreet}&pax=${pax}&bags=${bags}`;
    stops.forEach((stop, i) => {
      if (routeWaypoints.current.stops[i]) url += `&stop${i + 1}=${encodeURIComponent(stop)}`;
    });
    window.location.href = url;
  };

  return (
    <div className="bg-primary-black text-gray-200 font-sans min-h-screen flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header id="site-header" ref={headerRef} className="fixed z-50 transition-all duration-500 ease-in-out">
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.91 15.91 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.12.44 2.33.68 3.58.68.55 0 1 .45 1 1V20c0 .55-.45 1-1 1A17 17 0 013 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.24 2.46.68 3.58.27.4.27.81-.27 1.11l-2.29 2.1z"/>
                </svg>
                <span className="hidden sm:inline font-semibold text-sm tracking-wide">+44 2381 112682</span>
              </a>
              <a href="https://wa.me/442381112682" target="_blank" className="flex items-center gap-2 bg-secondaryBg/80 border border-brand/40 text-brand hover:bg-[#25D366] hover:text-white hover:border-[#25D366] px-3 py-2 rounded-full transition-all duration-300 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 0C5.396 0 0 5.396 0 12.031c0 2.124.554 4.168 1.605 5.986L.057 24l6.19-1.625c1.748.954 3.741 1.456 5.784 1.456 6.635 0 12.031-5.396 12.031-12.031C24.062 5.396 18.666 0 12.031 0zm0 21.86c-1.845 0-3.647-.49-5.234-1.416l-.375-.22-3.878 1.018 1.035-3.78-.245-.388c-1.035-1.64-1.583-3.548-1.583-5.513 0-5.696 4.635-10.331 10.331-10.331 5.696 0 10.331 4.635 10.331 10.331 0 5.696-4.635 10.331-10.331 10.331z"/>
                </svg>
                <span className="hidden sm:inline font-semibold text-sm tracking-wide">Chat</span>
              </a>
            </div>
            <div className="collapsible-element ml-4">
              <button type="button" onClick={toggleMenu} className="inline-flex items-center justify-center p-2 rounded-md text-brand hover:text-white focus:outline-none transition-colors">
                <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div id="mobile-menu" className={`absolute left-0 w-full bg-secondaryBg border-b border-brand/20 shadow-xl ${menuOpen ? 'open' : 'closed'}`}>
          <div className="px-4 py-4 space-y-1">
            <a href="/" className="block text-brand/80 hover:text-brand hover:bg-primaryBg/50 px-3 py-3 text-base font-medium rounded-lg transition-all">Home</a>
            <a href="/airport-transfers" className="block text-brand/80 hover:text-brand hover:bg-primaryBg/50 px-3 py-3 text-base font-medium rounded-lg transition-all">Airport Transfers</a>
            <a href="/pricing" className="block text-brand/80 hover:text-brand hover:bg-primaryBg/50 px-3 py-3 text-base font-medium rounded-lg transition-all">Pricing</a>
            <a href="/contact" className="block text-brand/80 hover:text-brand hover:bg-primaryBg/50 px-3 py-3 text-base font-medium rounded-lg transition-all">Contact</a>
          </div>
        </div>
      </header>

      {/* MAP */}
      <div className="fixed inset-0 h-[45vh] z-0">
        <div id="map" className="w-full h-full"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-primary-black pointer-events-none"></div>
      </div>

      {/* SCROLLING SHEET */}
      <div id="main-sheet" ref={mainSheetRef} className={`relative z-10 mt-[38vh] floating-sheet rounded-t-[2rem] border-t border-brand-gold/20 shadow-2xl flex-1 overflow-y-auto pb-40 ${sheetExpanded ? 'sheet-expanded' : ''}`}>
        
        <div className="drag-handle w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5"></div>
        
        <div className={`close-sheet-btn absolute top-4 right-4 z-50 cursor-pointer p-2 ${sheetExpanded ? 'block' : 'hidden'}`} onClick={collapseSheet}>
          <div className="bg-black/50 rounded-full p-2 border border-brand-gold/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* BOOKING FORM CONTENT */}
        <div className="w-[90%] mx-auto max-w-5xl space-y-5 pt-1 px-1 mb-20">
          <div className="space-y-3 relative">
            <div className="location-field-wrapper group">
              <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                <div className="mr-3 flex-shrink-0 text-brand-gold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <input type="text" id="pickup" placeholder="Enter pickup location"
                       onFocus={() => expandSheetAndCloseOthers('pickup')}
                       onChange={(e) => { setPickup(e.target.value); handleTyping('pickup', e.target.value); }}
                       value={pickup}
                       className="text-[15px] font-medium"/>
                <button onClick={swapLocations} className="ml-2 p-1.5 rounded-full hover:bg-white/10 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                </button>
              </div>
              <ul id="list-pickup" className="suggestions-list" style={{display: pickupSuggestions.length > 0 ? 'block' : 'none'}}>
                {pickupSuggestions.map((item, i) => (
                  item.isHeader ?
                    <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                    <li key={i} onClick={() => selectLocation('pickup', item.text, item.center)}>{item.text}</li>
                ))}
              </ul>
              <div className="connector-line"></div>
            </div>

            {stops.map((stop, index) => {
                const type = `stop-${index + 1}`;
                return (
                  <div key={index} className="location-field-wrapper group animate-fade-in pl-5">
                    <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                      <div className="mr-3 text-blue-400 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                      </div>
                      <input type="text" placeholder={`Stop ${index + 1}`}
                             onFocus={() => expandSheetAndCloseOthers(type)}
                             onChange={(e) => handleStopChange(index, e.target.value)}
                             value={stop}
                             className="text-[15px] font-medium placeholder-gray-500 bg-transparent w-full h-full outline-none text-white"/>
                      <button className="ml-2 text-gray-600 hover:text-red-500" onClick={() => removeStop(index)}>✕</button>
                    </div>
                    <ul className="suggestions-list" style={{display: stopSuggestions[type]?.length > 0 ? 'block' : 'none'}}>
                      {stopSuggestions[type]?.map((item, i) => (
                        item.isHeader ?
                          <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                          <li key={i} onClick={() => selectLocation(type, item.text, item.center)}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                );
            })}

            <div className="location-field-wrapper group">
              <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                <div className="mr-3 flex-shrink-0 text-brand-gold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input type="text" id="dropoff" placeholder="Enter destination"
                       onFocus={() => expandSheetAndCloseOthers('dropoff')}
                       onChange={(e) => { setDropoff(e.target.value); handleTyping('dropoff', e.target.value); }}
                       value={dropoff}
                       className="text-[15px] font-medium"/>
              </div>
              <ul id="list-dropoff" className="suggestions-list" style={{display: dropoffSuggestions.length > 0 ? 'block' : 'none'}}>
                {dropoffSuggestions.map((item, i) => (
                  item.isHeader ?
                    <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                    <li key={i} onClick={() => selectLocation('dropoff', item.text, item.center)}>{item.text}</li>
                ))}
              </ul>
            </div>

            <div id="add-stop-area" className="flex justify-end" style={{display: stops.length >= MAX_STOPS ? 'none' : 'flex'}}>
              <button onClick={addStop} className="text-[10px] font-bold text-brand-gold uppercase tracking-widest hover:text-white transition py-1 px-2 border border-brand-gold/30 rounded">
                + Add Stop
              </button>
            </div>
          </div>

          <div className="h-[1px] w-full bg-white/5"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
              </div>
              <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                <input type="text" placeholder="Flight No." value={flightNumber} onChange={e => setFlightNumber(e.target.value)} className="uppercase text-sm placeholder-gray-600 bg-transparent border-none outline-none text-white w-full" />
              </div>
              <label className="checkbox-wrapper unified-input rounded-xl h-[50px] px-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
                <span className="text-xs font-bold text-brand-gold">£5.00</span>
                <input type="checkbox" checked={meetGreet} onChange={() => setMeetGreet(!meetGreet)} className="hidden" />
                <div className={`w-4 h-4 border border-gray-600 rounded flex items-center justify-center transition-all ${meetGreet ? 'bg-brand-gold border-brand-gold' : ''}`}>
                  <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
                <select value={pax} onChange={e => setPax(parseInt(e.target.value))} className="text-sm cursor-pointer appearance-none bg-transparent w-full text-white">
                  {[...Array(8)].map((_, i) => <option key={i+1} value={i+1} className="bg-black">{i+1} {i+1 === 1 ? 'Person' : 'People'}</option>)}
                </select>
                <div className="absolute right-3 pointer-events-none text-brand-gold text-[10px]">▼</div>
              </div>
              <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
                <select value={bags} onChange={e => setBags(parseInt(e.target.value))} className="text-sm cursor-pointer appearance-none bg-transparent w-full text-white">
                  <option value="0" className="bg-black">No Luggage</option>
                  {[...Array(8)].map((_, i) => <option key={i+1} value={i+1} className="bg-black">{i+1} Bag{i+1 > 1 ? 's' : ''}</option>)}
                  <option value="9" className="bg-black">8+ Bags</option>
                </select>
                <div className="absolute right-3 pointer-events-none text-brand-gold text-[10px]">▼</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest mt-2">Select Class</h3>
            <div className="vehicle-scroll flex overflow-x-auto gap-3 snap-x pb-4 px-1">
              {filteredVehicles.map((v, i) => (
                <div key={i} onClick={() => setSelectedVehicleIndex(i)} className={`vehicle-card min-w-[130px] w-[130px] p-3 rounded-2xl cursor-pointer snap-center flex flex-col justify-between ${selectedVehicleIndex === i ? 'selected' : ''}`}>
                  <div className="selected-badge absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{opacity: selectedVehicleIndex === i ? 1 : 0}}>Selected</div>
                  <div><h4 className="text-white font-bold text-xs mb-0.5">{v.name}</h4><p className="text-[9px] text-gray-400">{v.description}</p></div>
                  <div className="flex-1 flex items-center justify-center py-2"><img src={v.image} className="w-full object-contain" /></div>
                  <div className="flex justify-between items-end border-t border-white/10 pt-1.5"><div className="flex gap-1.5 text-gray-400 text-[10px]"><span>👤{v.passengers}</span><span>🧳{v.luggage}</span></div><span className="text-brand-gold font-bold text-[10px]">£{v.perMile}/mi</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OFFERS */}
        <div className="bg-brand-gold py-20 md:py-28 relative font-sans text-primary-black overflow-hidden z-0 rounded-t-3xl">
          <div className="w-[90%] mx-auto max-w-7xl relative z-10">
            <div className="text-center max-w-5xl mx-auto mb-16 md:mb-20">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight uppercase drop-shadow-xl text-primary-black">Unbeatable Airport Taxi Transfers UK</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2">
                {/* Example Offer 1 */}
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Heathrow Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£99</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Heathrow%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                {/* Example Offer 2 */}
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Gatwick Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£130</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Gatwick%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* FEEDBACK */}
        <div className="bg-primary-black py-20 border-t border-brand-gold/10 relative overflow-hidden font-sans">
          <div className="w-[90%] mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-2 uppercase tracking-tight">Feedback</h2>
                </div>
                <div className="flex items-center gap-4 bg-secondary-black border border-brand-gold/20 px-6 py-3 rounded-full shadow-lg">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{totalRatings}</span>
                </div>
            </div>
            <div className="review-scroll flex overflow-x-auto gap-5 snap-x pb-10 px-1">
              {reviews.length > 0 ? reviews.map((r, i) => (
                <div key={i} className="review-card min-w-[300px] md:min-w-[350px] p-6 rounded-2xl snap-center flex flex-col justify-between relative select-none">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={r.profile_photo_url} alt={r.author_name} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                      <div><h4 className="text-white font-bold text-sm font-heading">{r.author_name}</h4></div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed font-sans font-light opacity-90 border-t border-white/5 pt-3">"{r.text.substring(0, 150)}..."</p>
                  </div>
                </div>
              )) : <div className="text-gray-500 w-full text-center text-sm">Loading Reviews...</div>}
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM BAR (Managed via Ref for Perf) */}
      <div id="bottom-bar" ref={bottomBarRef} className="bottom-bar fixed bottom-0 left-0 w-full bg-black/95 border-t border-brand-gold/20 py-2 px-5 z-[80] safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center max-w-5xl mx-auto gap-4">
          <div className="flex flex-col justify-center min-w-0">
            <div id="promo-text" className={`text-[9px] font-black ${promoClass} mb-0.5 tracking-wider uppercase truncate animate-pulse-custom`}>{promoText}</div>
            <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Fare Estimate</div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className={`text-[10px] font-bold text-red-500 line-through opacity-70 ${oldPriceVisible ? '' : 'hidden'}`}>£{oldPrice.toFixed(2)}</span>
              <p className="text-3xl font-heading font-black text-white tracking-tight leading-none flex items-baseline gap-2">
                £<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#fff5cc]">{totalPrice.toFixed(2)}</span>
                <span className={`text-[10px] text-gray-400 font-medium tracking-normal ${currentDistanceMiles.current > 0 ? '' : 'hidden'}`}>{distanceDisplay}</span>
              </p>
            </div>
          </div>
          <button onClick={goToBooking} className="bg-brand-gold text-black font-extrabold py-2 px-6 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#e6c355] transition-transform active:scale-95 text-sm uppercase tracking-wide whitespace-nowrap">
            Book Now
          </button>
        </div>
      </div>

      <div id="sheet-overlay" className={`fixed inset-0 bg-black/90 z-[90] flex items-end sm:items-center justify-center transition-opacity duration-300 backdrop-blur-sm ${sheetOverlayOpen ? '' : 'hidden'}`}>
        <div id="location-sheet" className="bg-[#121212] w-full max-w-md p-6 rounded-t-[2rem] sm:rounded-[2rem] border border-white/10 shadow-2xl pb-10">
          <div className="w-12 h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold border border-brand-gold/20">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2 font-heading">Where to?</h2>
          <button onClick={getUserLocation} className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl mb-3 mt-6 shadow-lg">Use My Current Location</button>
          <button onClick={collapseSheet} className="w-full bg-white/5 text-gray-400 font-semibold py-3.5 rounded-xl border border-white/5">Enter Address Manually</button>
        </div>
      </div>
    </div>
  );
}