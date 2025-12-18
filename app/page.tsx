'use client';
import React, { useEffect, useState, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- TypeScript Definitions ---
type LngLat = [number, number];
interface PresetItem {
  name: string;
  center: LngLat;
}
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

const PRESET_DATA: Record<string, PresetItem[]> = {
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
const DISCOUNT_MESSAGES = [
  "15% Discount on bills over £130",
  "5% Off on Return Trips",
  "Special Offer: Southampton to Airport Transfers"
];

export default function Home() {
  gsap.registerPlugin(ScrollTrigger);
  
  // UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [bottomBarVisible, setBottomBarVisible] = useState(false);
  const [bottomBarHiddenScroll, setBottomBarHiddenScroll] = useState(false);
  const [sheetOverlayOpen, setSheetOverlayOpen] = useState(true);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [discountMsgIndex, setDiscountMsgIndex] = useState(0);
  const [accordionOpen, setAccordionOpen] = useState<number | null>(0);

  // Business Logic State
  const [outDistanceMiles, setOutDistanceMiles] = useState(0);
  const [retDistanceMiles, setRetDistanceMiles] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [oldPriceVisible, setOldPriceVisible] = useState(false);
  const [oldPrice, setOldPrice] = useState(0);
  const [promoText, setPromoText] = useState("REACH £130 & GET 15% OFF");
  const [promoClass, setPromoClass] = useState('text-brand-gold');

  // Booking Inputs
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetGreet, setMeetGreet] = useState(false);
  const [pax, setPax] = useState(1);
  const [bags, setBags] = useState(0);

  // Return Trip State
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [showReturnButton, setShowReturnButton] = useState(false);
  const [returnPickup, setReturnPickup] = useState('');
  const [returnDropoff, setReturnDropoff] = useState('');
  const [returnStops, setReturnStops] = useState<string[]>([]);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [returnFlightNumber, setReturnFlightNumber] = useState('');
  const [returnMeetGreet, setReturnMeetGreet] = useState(false);

  // Suggestions & Reviews
  const [filteredVehicles, setFilteredVehicles] = useState<typeof vehicles>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<SuggestionItem[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<SuggestionItem[]>([]);
  const [stopSuggestions, setStopSuggestions] = useState<{ [key: string]: SuggestionItem[] }>({});
  const [returnPickupSuggestions, setReturnPickupSuggestions] = useState<SuggestionItem[]>([]);
  const [returnDropoffSuggestions, setReturnDropoffSuggestions] = useState<SuggestionItem[]>([]);
  const [returnStopSuggestions, setReturnStopSuggestions] = useState<{ [key: string]: SuggestionItem[] }>({});

  const [reviews, setReviews] = useState<any[]>([]);
  const [headerStars, setHeaderStars] = useState('★★★★★');
  const [totalRatings, setTotalRatings] = useState('Loading...');
  const [distanceDisplay, setDistanceDisplay] = useState('0 mi');
  const [distanceHidden, setDistanceHidden] = useState(true);

  // Refs
  const outboundMapContainerRef = useRef<HTMLDivElement>(null);
  const returnMapContainerRef = useRef<HTMLDivElement>(null);
  const outboundMapRef = useRef<any>(null);
  const returnMapRef = useRef<any>(null);
  const mainSheetRef = useRef<HTMLDivElement>(null);
  const vehicleContainerRef = useRef<HTMLDivElement>(null);
  const googleReviewsContainerRef = useRef<HTMLDivElement>(null);
  const bookingFormRef = useRef<HTMLDivElement>(null);
  const offersSectionRef = useRef<HTMLDivElement>(null);
  const feedbackSectionRef = useRef<HTMLDivElement>(null);
  const chooseJourneyRef = useRef<HTMLDivElement>(null);
  
  // Markers & Waypoints
  const outStartMarker = useRef<any>(null);
  const outEndMarker = useRef<any>(null);
  const outStopMarkers = useRef<{ [key: string]: any }>({});
  const retStartMarker = useRef<any>(null);
  const retEndMarker = useRef<any>(null);
  const retStopMarkers = useRef<{ [key: string]: any }>({});
  
  const routeWaypointsOut = useRef<{ pickup: LngLat | null, dropoff: LngLat | null, stops: (LngLat | null)[] }>({ pickup: null, dropoff: null, stops: [] });
  const routeWaypointsRet = useRef<{ pickup: LngLat | null, dropoff: LngLat | null, stops: (LngLat | null)[] }>({ pickup: null, dropoff: null, stops: [] });
  
  const lastScrollTop = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Initialization & Effects ---

  useEffect(() => {
    // Client-side date init
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().substring(0, 5));

    // Scroll Listener
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 20);
      if (currentScroll > 20 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Initialize Outbound Map
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      if (outboundMapContainerRef.current) {
        outboundMapRef.current = new window.mapboxgl.Map({
          container: outboundMapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-0.1276, 51.5074],
          zoom: 11,
          attributionControl: false,
          pitchWithRotate: false
        });
        outboundMapRef.current.scrollZoom.disable();
        outboundMapRef.current.on('touchstart', () => outboundMapRef.current?.dragPan.enable());
      }
    }

    // Sheet Scroll Logic
    const sheet = mainSheetRef.current;
    if (sheet) {
      const handleSheetScroll = throttle(() => {
        const st = sheet.scrollTop;
        if (bottomBarVisible) {
          if (st > lastScrollTop.current && st > 50) setBottomBarHiddenScroll(true);
          else setBottomBarHiddenScroll(false);
        }
        lastScrollTop.current = st <= 0 ? 0 : st;
      }, 100);
      sheet.addEventListener('scroll', handleSheetScroll);
    }

    enableDragScroll(vehicleContainerRef.current);
    enableDragScroll(googleReviewsContainerRef.current);
    initReviews();

    // Discount Message Rotator
    const msgInterval = setInterval(() => {
      setDiscountMsgIndex(prev => (prev + 1) % DISCOUNT_MESSAGES.length);
    }, 4000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (sheet) sheet.removeEventListener('scroll', () => {});
      lenis.destroy();
      clearInterval(msgInterval);
    };
  }, []);

  // Return Map Initialization & Resizing
  useEffect(() => {
    if (hasReturnTrip && window.mapboxgl) {
      // Small delay to ensure container is rendered
      setTimeout(() => {
        if (returnMapContainerRef.current && !returnMapRef.current) {
          window.mapboxgl.accessToken = MAPBOX_TOKEN;
          returnMapRef.current = new window.mapboxgl.Map({
            container: returnMapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-0.1276, 51.5074],
            zoom: 11,
            attributionControl: false,
            pitchWithRotate: false
          });
          returnMapRef.current.scrollZoom.disable();
          returnMapRef.current.on('touchstart', () => returnMapRef.current.dragPan.enable());
        }
        
        // Resize both maps to fit new layout (50/50 split)
        outboundMapRef.current?.resize();
        returnMapRef.current?.resize();
        
        // Re-center/fit bounds after resize
        calculateRouteOut();
        calculateRouteReturn();
      }, 100);
    } else {
        // If return trip removed, resize outbound map back to full
        setTimeout(() => {
            outboundMapRef.current?.resize();
            calculateRouteOut();
        }, 100);
    }
  }, [hasReturnTrip]);

  // Vehicle Filtering
  useEffect(() => {
    const filtered = vehicles.filter(v => v.passengers >= pax && v.luggage >= bags);
    setFilteredVehicles(filtered);
    if (filtered.length > 0 && !filtered.some((v, i) => i === selectedVehicleIndex)) {
      setSelectedVehicleIndex(0);
    }
  }, [pax, bags]);

  // Price Calculation
  useEffect(() => {
    updatePrice();
  }, [outDistanceMiles, retDistanceMiles, selectedVehicleIndex, meetGreet, returnMeetGreet, hasReturnTrip]);

  // Visibility Logic for Bottom Bar & Return Button
  useEffect(() => {
    checkVisibility();
  }, [routeWaypointsOut.current.pickup, routeWaypointsOut.current.dropoff, routeWaypointsRet.current.pickup, routeWaypointsRet.current.dropoff, hasReturnTrip, date, time, flightNumber]);

  // GSAP Animations
  useEffect(() => {
    const fadeElements = [bookingFormRef.current, offersSectionRef.current, feedbackSectionRef.current, chooseJourneyRef.current];
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
  }, []);

  // --- Logic Functions ---

  const initReviews = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);
      const request = { placeId: 'ChIJ9caM2nkSsYsRzNAS6kVqn2k', fields: ['reviews', 'rating', 'user_ratings_total'] };
      service.getDetails(request, (place: any, status: any) => {
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

  const expandSheetAndCloseOthers = (id: string) => {
    setPickupSuggestions([]); setDropoffSuggestions([]); setStopSuggestions({});
    setReturnPickupSuggestions([]); setReturnDropoffSuggestions([]); setReturnStopSuggestions({});
    if (window.innerWidth < 768) {
      setSheetExpanded(true);
      window.scrollTo(0, 0);
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
    else if (type === 'dropoff') setDropoffSuggestions(list);
    else if (type.startsWith('stop-')) setStopSuggestions(prev => ({ ...prev, [type]: list }));
    else if (type === 'return-pickup') setReturnPickupSuggestions(list);
    else if (type === 'return-dropoff') setReturnDropoffSuggestions(list);
    else if (type.startsWith('stop-return-')) setReturnStopSuggestions(prev => ({ ...prev, [type]: list }));
  };

  const handleTyping = (type: string, value: string) => {
    // Reset coords on typing
    if (type === 'pickup') routeWaypointsOut.current.pickup = null;
    if (type === 'dropoff') routeWaypointsOut.current.dropoff = null;
    if (type.startsWith('stop-') && !type.includes('return')) {
      const idx = parseInt(type.split('-')[1]) - 1;
      routeWaypointsOut.current.stops[idx] = null;
    }
    if (type === 'return-pickup') routeWaypointsRet.current.pickup = null;
    if (type === 'return-dropoff') routeWaypointsRet.current.dropoff = null;
    if (type.startsWith('stop-return-')) {
        const idx = parseInt(type.split('-')[2]) - 1;
        routeWaypointsRet.current.stops[idx] = null;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.length === 0) {
      showPresets(type);
      return;
    }
    if (value.length < 3) {
      setPickupSuggestions([]); setDropoffSuggestions([]); setStopSuggestions({});
      setReturnPickupSuggestions([]); setReturnDropoffSuggestions([]); setReturnStopSuggestions({});
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
          else if (type === 'dropoff') setDropoffSuggestions(list);
          else if (type.startsWith('stop-') && !type.includes('return')) setStopSuggestions(prev => ({ ...prev, [type]: list }));
          else if (type === 'return-pickup') setReturnPickupSuggestions(list);
          else if (type === 'return-dropoff') setReturnDropoffSuggestions(list);
          else if (type.startsWith('stop-return-')) setReturnStopSuggestions(prev => ({ ...prev, [type]: list }));
        });
    }, 300);
  };

  const selectLocation = (type: string, name: string, coords: LngLat) => {
    let map: any;
    let startMarker: React.MutableRefObject<any>;
    let endMarker: React.MutableRefObject<any>;
    let routeWaypoints: React.MutableRefObject<{ pickup: LngLat | null; dropoff: LngLat | null; stops: (LngLat | null)[]; }>;
    let setSuggestions: any;

    const isReturn = type.includes('return');

    if (isReturn) {
      map = returnMapRef.current;
      startMarker = retStartMarker;
      endMarker = retEndMarker;
      routeWaypoints = routeWaypointsRet;
    } else {
      map = outboundMapRef.current;
      startMarker = outStartMarker;
      endMarker = outEndMarker;
      routeWaypoints = routeWaypointsOut;
    }

    // Determine specific setters
    if (type === 'pickup') { setPickup(name); setSuggestions = setPickupSuggestions; }
    else if (type === 'dropoff') { setDropoff(name); setSuggestions = setDropoffSuggestions; }
    else if (type.startsWith('stop-') && !isReturn) { setSuggestions = (prev:any) => ({...prev, [type]: []}); }
    else if (type === 'return-pickup') { setReturnPickup(name); setSuggestions = setReturnPickupSuggestions; }
    else if (type === 'return-dropoff') { setReturnDropoff(name); setSuggestions = setReturnDropoffSuggestions; }
    else if (type.startsWith('stop-return-')) { setSuggestions = (prev:any) => ({...prev, [type]: []}); }

    if (!map && !hasReturnTrip && isReturn) {
        // Just set state if map isn't ready (e.g., just opened return)
        // Handled by generic update, but map logic skipped
    } 

    if (type.includes('pickup')) {
      routeWaypoints.current.pickup = coords;
      if (startMarker.current) startMarker.current.remove();
      if(map) {
          startMarker.current = new window.mapboxgl.Marker({ color: '#D4AF37' }).setLngLat(coords).addTo(map);
          map.flyTo({ center: coords, zoom: 13 });
      }
      setSuggestions([]);
    } else if (type.includes('dropoff')) {
      routeWaypoints.current.dropoff = coords;
      if (endMarker.current) endMarker.current.remove();
      if(map) endMarker.current = new window.mapboxgl.Marker({ color: '#ef4444' }).setLngLat(coords).addTo(map);
      setSuggestions([]);
    } else if (type.includes('stop')) {
      // Handles both stop-1 and stop-return-1
      const parts = type.split('-');
      // idx is last part - 1
      const idx = parseInt(parts[parts.length - 1]) - 1;
      
      if(isReturn) {
          setReturnStops(prev => prev.map((val, i) => i === idx ? name : val));
          routeWaypoints.current.stops[idx] = coords;
          if (retStopMarkers.current[type]) retStopMarkers.current[type].remove();
          if(map) retStopMarkers.current[type] = new window.mapboxgl.Marker({ color: '#3b82f6', scale: 0.8 }).setLngLat(coords).addTo(map);
      } else {
          setStops(prev => prev.map((val, i) => i === idx ? name : val));
          routeWaypoints.current.stops[idx] = coords;
          if (outStopMarkers.current[type]) outStopMarkers.current[type].remove();
          if(map) outStopMarkers.current[type] = new window.mapboxgl.Marker({ color: '#3b82f6', scale: 0.8 }).setLngLat(coords).addTo(map);
      }
      setSuggestions([]);
    }

    collapseSheet();
    if (isReturn) calculateRouteReturn();
    else calculateRouteOut();
  };

  const calculateRouteOut = () => {
    if (!routeWaypointsOut.current.pickup || !routeWaypointsOut.current.dropoff || !outboundMapRef.current) return;
    let coords: LngLat[] = [routeWaypointsOut.current.pickup];
    routeWaypointsOut.current.stops.forEach(s => { if (s) coords.push(s); });
    coords.push(routeWaypointsOut.current.dropoff);
    
    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    fetch(url).then(r => r.json()).then(data => {
      if (!data.routes?.length) return;
      const r = data.routes[0];
      const distMiles = r.distance / 1609.34;
      setOutDistanceMiles(distMiles);
      setDistanceDisplay((distMiles + retDistanceMiles).toFixed(1) + ' mi');
      setDistanceHidden(false);
      
      if (outboundMapRef.current.getSource('route')) {
        outboundMapRef.current.getSource('route').setData(r.geometry);
      } else {
        outboundMapRef.current.addLayer({
            id: 'route', type: 'line', source: { type: 'geojson', data: r.geometry },
            paint: { 'line-color': '#D4AF37', 'line-width': 4, 'line-opacity': 0.8 }
        });
      }
      const bounds = new window.mapboxgl.LngLatBounds();
      coords.forEach(c => bounds.extend(c));
      outboundMapRef.current.fitBounds(bounds, { padding: 80 });
    });
  };

  const calculateRouteReturn = () => {
    if (!routeWaypointsRet.current.pickup || !routeWaypointsRet.current.dropoff) return;
    
    let coords: LngLat[] = [routeWaypointsRet.current.pickup];
    routeWaypointsRet.current.stops.forEach(s => { if (s) coords.push(s); });
    coords.push(routeWaypointsRet.current.dropoff);
   
    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
   
    fetch(url).then(r => r.json()).then(data => {
      if (!data.routes?.length) return;
      const r = data.routes[0];
      const distMiles = r.distance / 1609.34;
      setRetDistanceMiles(distMiles);
      setDistanceDisplay((outDistanceMiles + distMiles).toFixed(1) + ' mi');
      
      if (returnMapRef.current) {
          if (returnMapRef.current.getSource('route')) {
            returnMapRef.current.getSource('route').setData(r.geometry);
          } else {
            returnMapRef.current.addLayer({
                id: 'route', type: 'line', source: { type: 'geojson', data: r.geometry },
                paint: { 'line-color': '#D4AF37', 'line-width': 4, 'line-opacity': 0.8 }
            });
          }
          const bounds = new window.mapboxgl.LngLatBounds();
          coords.forEach(c => bounds.extend(c));
          returnMapRef.current.fitBounds(bounds, { padding: 80 });
      }
    });
  };

  // Stops Logic
  const addStop = (isReturn = false) => {
    if (isReturn) {
        if (returnStops.length >= MAX_STOPS) return;
        setReturnStops([...returnStops, '']);
        routeWaypointsRet.current.stops.push(null);
    } else {
        if (stops.length >= MAX_STOPS) return;
        setStops([...stops, '']);
        routeWaypointsOut.current.stops.push(null);
    }
  };

  const removeStop = (index: number, isReturn = false) => {
    if (isReturn) {
        setReturnStops(prev => prev.filter((_, i) => i !== index));
        routeWaypointsRet.current.stops.splice(index, 1);
        const type = `stop-return-${index + 1}`;
        if (retStopMarkers.current[type]) {
            retStopMarkers.current[type].remove();
            delete retStopMarkers.current[type];
        }
        calculateRouteReturn();
    } else {
        setStops(prev => prev.filter((_, i) => i !== index));
        routeWaypointsOut.current.stops.splice(index, 1);
        const type = `stop-${index + 1}`;
        if (outStopMarkers.current[type]) {
            outStopMarkers.current[type].remove();
            delete outStopMarkers.current[type];
        }
        calculateRouteOut();
    }
  };

  const handleStopChange = (index: number, value: string, isReturn = false) => {
    if (isReturn) {
        setReturnStops(prev => prev.map((val, i) => i === index ? value : val));
        handleTyping(`stop-return-${index + 1}`, value);
    } else {
        setStops(prev => prev.map((val, i) => i === index ? value : val));
        handleTyping(`stop-${index + 1}`, value);
    }
  };

  const updatePrice = () => {
    if (outDistanceMiles <= 0) return;
    let outP = outDistanceMiles * vehicles[selectedVehicleIndex].perMile;
    if (outP < 5) outP = 5;
    if (meetGreet) outP += 5;
    
    let retP = 0;
    if (hasReturnTrip && retDistanceMiles > 0) {
      retP = retDistanceMiles * vehicles[selectedVehicleIndex].perMile;
      if (retP < 5) retP = 5;
      if (returnMeetGreet) retP += 5;
      retP *= 0.95; // 5% discount logic strictly preserved
    }
    
    let p = outP + retP;
    if (p >= 130) {
      setOldPriceVisible(true);
      setOldPrice(p);
      p = p * 0.85; // 15% discount over £130 logic preserved
      setPromoText("15% DISCOUNT APPLIED");
      setPromoClass('text-green-400');
    } else {
      setOldPriceVisible(false);
      setPromoText("REACH £130 & GET 15% OFF");
      setPromoClass('text-brand-gold');
    }
    setTotalPrice(p);
  };

  const checkVisibility = () => {
    const p = routeWaypointsOut.current.pickup;
    const d = routeWaypointsOut.current.dropoff;
    const basicFieldsFilled = !!p && !!d && !!date && !!time && !!flightNumber;
    
    setShowReturnButton(basicFieldsFilled);
    setBottomBarVisible(basicFieldsFilled && (!hasReturnTrip || (!!routeWaypointsRet.current.pickup && !!routeWaypointsRet.current.dropoff)));
  };

  const swapLocations = () => {
    const tempPickup = pickup; setPickup(dropoff); setDropoff(tempPickup);
    const temp = routeWaypointsOut.current.pickup;
    routeWaypointsOut.current.pickup = routeWaypointsOut.current.dropoff;
    routeWaypointsOut.current.dropoff = temp;
    
    if (outStartMarker.current && outEndMarker.current) {
      const tLoc = outStartMarker.current.getLngLat();
      outStartMarker.current.setLngLat(outEndMarker.current.getLngLat());
      outEndMarker.current.setLngLat(tLoc);
    }
    calculateRouteOut();

    if (hasReturnTrip) {
      // If swapped outbound, return trip defaults (drop->pick, pick->drop) are also inherently swapped
      setReturnPickup(dropoff); setReturnDropoff(tempPickup);
      routeWaypointsRet.current.pickup = routeWaypointsOut.current.dropoff;
      routeWaypointsRet.current.dropoff = routeWaypointsOut.current.pickup;
      calculateRouteReturn();
    }
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

  const enableDragScroll = (s: HTMLElement | null) => {
    if (!s) return;
    let isDown = false, startX = 0, scrollLeft = 0;
    s.addEventListener('mousedown', e => { isDown = true; startX = e.pageX - s.offsetLeft; scrollLeft = s.scrollLeft; });
    s.addEventListener('mouseup', () => isDown = false);
    s.addEventListener('mouseleave', () => isDown = false);
    s.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); s.scrollLeft = scrollLeft - (e.pageX - s.offsetLeft - startX) * 2; });
  };

  const throttle = (func: Function, limit: number) => {
    let inThrottle = false;
    return function (this: any) {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };

  const goToBooking = () => {
    let url = `https://booking.fare1.co.uk?pickup=${encodeURIComponent(pickup)}&dropoff=${encodeURIComponent(dropoff)}&vehicle=${encodeURIComponent(vehicles[selectedVehicleIndex].name)}&price=${totalPrice.toFixed(2)}&date=${date}&time=${time}&flight=${flightNumber}&meet=${meetGreet}&pax=${pax}&bags=${bags}`;
    stops.forEach((stop, i) => {
      if (routeWaypointsOut.current.stops[i]) url += `&stop${i + 1}=${encodeURIComponent(stop)}`;
    });
    if (hasReturnTrip) {
      url += `&returnPickup=${encodeURIComponent(returnPickup)}&returnDropoff=${encodeURIComponent(returnDropoff)}&returnDate=${returnDate}&returnTime=${returnTime}&returnFlight=${returnFlightNumber}&returnMeet=${returnMeetGreet}`;
      returnStops.forEach((stop, i) => {
          if (routeWaypointsRet.current.stops[i]) url += `&returnStop${i + 1}=${encodeURIComponent(stop)}`;
      });
    }
    window.location.href = url;
  };

  const addReturnTrip = () => {
    setHasReturnTrip(true);
    setReturnPickup(dropoff);
    setReturnDropoff(pickup);
    // Logic: Return Pickup = Outbound Dropoff. Return Dropoff = Outbound Pickup.
    routeWaypointsRet.current.pickup = routeWaypointsOut.current.dropoff;
    routeWaypointsRet.current.dropoff = routeWaypointsOut.current.pickup;
    
    // Trigger map update
    if (routeWaypointsRet.current.pickup && routeWaypointsRet.current.dropoff) {
        calculateRouteReturn();
    }
  };

  return (
    <div className="bg-primary-black text-gray-200 font-sans min-h-screen flex flex-col overflow-hidden selection:bg-brand-gold selection:text-black">
     
      {/* HEADER */}
      <header id="site-header" className={`fixed z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="glow-wrapper mx-auto">
          <div className="glow-content flex items-center justify-between px-4 sm:px-6 h-16 md:h-[70px] transition-all">
            <div className="collapsible-element flex-shrink-0 flex items-center mr-4">
              <a href="/" className="group block py-2">
                <div className="font-serif font-bold tracking-widest text-gradient-gold drop-shadow-md group-hover:opacity-90 transition flex items-center gap-2">
                  <span className="text-xl">FARE</span>
                  <span className="text-2xl pt-1">1</span>
                  <span className="text-xl">TAXI</span>
                </div>
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
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-brand hover:text-white focus:outline-none transition-colors">
                <div className={`hamburger ${menuOpen ? 'active' : ''}`}>
                    <span></span><span></span><span></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Premium Hamburger Menu */}
        <div id="mobile-menu" className={`fixed inset-0 top-[70px] bg-black/90 backdrop-blur-xl border-t border-brand-gold/10 z-[49] flex flex-col justify-between pb-10 transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center justify-center space-y-4 pt-10 px-6">
            <a href="https://fare1.co.uk/airport-taxi-transfers-uk-cruise-port-long-distance" className="text-xl font-bold text-white hover:text-brand-gold transition-colors tracking-wide">Home</a>
            <a href="https://airporttaxis24-7.com/" className="text-xl font-bold text-white hover:text-brand-gold transition-colors tracking-wide">Airport Transfers</a>
            
            <div className="w-full text-center">
                <button onClick={() => setServicesOpen(!servicesOpen)} className="text-xl font-bold text-white hover:text-brand-gold transition-colors tracking-wide flex items-center justify-center gap-2 mx-auto">
                    Services
                    <svg className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${servicesOpen ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <a href="https://airporttaxis24-7.com/" className="text-sm text-gray-300 hover:text-brand-gold">Airport Transfers</a>
                        <a href="https://fare1.co.uk/cruise-transfer" className="text-sm text-gray-300 hover:text-brand-gold">Cruise Ship Transfers</a>
                        <a href="https://fare1.co.uk/chauffeur-service" className="text-sm text-gray-300 hover:text-brand-gold">Chauffeur Services</a>
                        <a href="https://booking.fare1.co.uk/" className="text-sm text-gray-300 hover:text-brand-gold">Taxi Journeys</a>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
                <a href="tel:+442381112682" className="text-brand-gold font-mono text-lg">+44 2381 112682</a>
                <a href="https://wa.me/442381112682" className="text-green-400 text-sm font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp Us
                </a>
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mt-auto">
            {['Facebook', 'Tiktok', 'Instagram', 'Google'].map(social => (
                <div key={social} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-black transition-colors cursor-pointer">
                    <span className="text-xs font-bold">{social[0]}</span>
                </div>
            ))}
          </div>
        </div>

      </header>

      {/* SPLIT MAP VIEW */}
      <div className="fixed inset-0 h-[45vh] z-0 flex">
        {/* Left: Return Map (Visible only when return active) */}
        {hasReturnTrip && (
            <div className="w-1/2 h-full relative border-r-2 border-brand-gold/50 shadow-xl z-10">
                 <div ref={returnMapContainerRef} className="w-full h-full"></div>
                 <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Return Leg</span>
                 </div>
            </div>
        )}
        {/* Right: Outbound Map */}
        <div className={`${hasReturnTrip ? 'w-1/2' : 'w-full'} h-full relative transition-all duration-500 ease-in-out`}>
            <div ref={outboundMapContainerRef} className="w-full h-full"></div>
            {hasReturnTrip && (
                 <div className="absolute top-4 right-4 bg-black/70 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">Outbound</span>
                 </div>
            )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-primary-black pointer-events-none"></div>
      </div>

      {/* MAIN APP SHEET */}
      <div id="main-sheet" ref={mainSheetRef} className={`relative z-10 mt-[38vh] floating-sheet rounded-t-[2rem] border-t border-brand-gold/20 shadow-2xl flex-1 overflow-y-auto pb-40 ${sheetExpanded ? 'sheet-expanded' : ''}`}>
       
        <div className="drag-handle w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5"></div>
       
        <div className={`close-sheet-btn absolute top-4 right-4 z-50 cursor-pointer p-2 ${sheetExpanded ? 'block' : 'hidden'}`} onClick={collapseSheet}>
          <div className="bg-black/50 rounded-full p-2 border border-brand-gold/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* BOOKING FORM */}
        <div ref={bookingFormRef} className="w-[90%] mx-auto max-w-5xl space-y-5 pt-1 px-1 mb-20">
          <div className="space-y-3 relative">
           
            {/* PICKUP INPUT */}
            <div className="location-field-wrapper group">
              <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                <div className="mr-3 flex-shrink-0 text-brand-gold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <input type="text" id="pickup" placeholder="Enter pickup location"
                       onFocus={() => expandSheetAndCloseOthers('pickup')}
                       onChange={(e) => {
                         setPickup(e.target.value);
                         handleTyping('pickup', e.target.value);
                       }}
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

            {/* STOPS (Outbound) */}
            <div id="stops-container" className="space-y-3 pl-2">
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
            </div>

            {/* DROPOFF INPUT */}
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
                       onChange={(e) => {
                         setDropoff(e.target.value);
                         handleTyping('dropoff', e.target.value);
                       }}
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
              <button onClick={() => addStop(false)} className="text-[10px] font-bold text-brand-gold uppercase tracking-widest hover:text-white transition py-1 px-2 border border-brand-gold/30 rounded">
                + Add Stop
              </button>
            </div>
          </div>
          
          <div className="h-[1px] w-full bg-white/5"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Date</label>
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Time</label>
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-brand-gold uppercase ml-1 mb-1 font-bold tracking-widest">Flight No.</label>
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                  <input type="text" placeholder="e.g. EZY410" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} className="uppercase text-sm placeholder-gray-600 bg-transparent border-none outline-none text-white w-full" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Meet & Greet</label>
                <label className="checkbox-wrapper unified-input rounded-xl h-[50px] px-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
                  <span className="text-xs font-bold text-brand-gold">£5.00</span>
                  <input type="checkbox" checked={meetGreet} onChange={() => setMeetGreet(!meetGreet)} className="hidden" />
                  <div className={`w-4 h-4 border border-gray-600 rounded flex items-center justify-center transition-all ${meetGreet ? 'bg-brand-gold border-brand-gold' : ''}`}>
                    <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </label>
              </div>
            </div>

            {/* RETURN TRIP LOGIC */}
            <div className="sm:col-span-2">
              {!hasReturnTrip ? (
                showReturnButton && (
                    <button onClick={addReturnTrip} className="w-full py-3.5 bg-secondary-black border border-brand-gold/30 text-brand-gold font-bold rounded-xl hover:bg-brand-gold hover:text-black transition-all duration-300 flex items-center justify-center uppercase tracking-widest text-xs shadow-lg transform active:scale-95">
                      Add Return Trip +
                    </button>
                )
              ) : (
                <div className="space-y-4 border-t border-brand-gold/20 pt-6 mt-2 relative bg-white/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-brand-gold uppercase tracking-widest">Return Trip Details</h3>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">5% Discount Applied</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="location-field-wrapper group">
                      <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                        <div className="mr-3 flex-shrink-0 text-brand-gold">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <input type="text" id="return-pickup" placeholder="Enter return pickup location"
                               onFocus={() => expandSheetAndCloseOthers('return-pickup')}
                               onChange={(e) => {
                                 setReturnPickup(e.target.value);
                                 handleTyping('return-pickup', e.target.value);
                               }}
                               value={returnPickup}
                               className="text-[15px] font-medium"/>
                      </div>
                      <ul className="suggestions-list" style={{display: returnPickupSuggestions.length > 0 ? 'block' : 'none'}}>
                        {returnPickupSuggestions.map((item, i) => (
                          item.isHeader ?
                            <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                            <li key={i} onClick={() => selectLocation('return-pickup', item.text, item.center)}>{item.text}</li>
                        ))}
                      </ul>
                      <div className="connector-line"></div>
                    </div>

                    {/* Return Stops */}
                    <div className="col-span-1 sm:col-span-2 space-y-3 pl-2">
                        {returnStops.map((stop, index) => {
                            const type = `stop-return-${index + 1}`;
                            return (
                            <div key={index} className="location-field-wrapper group animate-fade-in pl-5">
                                <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                                <div className="mr-3 text-blue-400 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                                </div>
                                <input type="text" placeholder={`Return Stop ${index + 1}`}
                                        onFocus={() => expandSheetAndCloseOthers(type)}
                                        onChange={(e) => handleStopChange(index, e.target.value, true)}
                                        value={stop}
                                        className="text-[15px] font-medium placeholder-gray-500 bg-transparent w-full h-full outline-none text-white"/>
                                <button className="ml-2 text-gray-600 hover:text-red-500" onClick={() => removeStop(index, true)}>✕</button>
                                </div>
                                <ul className="suggestions-list" style={{display: returnStopSuggestions[type]?.length > 0 ? 'block' : 'none'}}>
                                {returnStopSuggestions[type]?.map((item, i) => (
                                    item.isHeader ?
                                    <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                                    <li key={i} onClick={() => selectLocation(type, item.text, item.center)}>{item.text}</li>
                                ))}
                                </ul>
                            </div>
                            );
                        })}
                        <div className="flex justify-end" style={{display: returnStops.length >= MAX_STOPS ? 'none' : 'flex'}}>
                            <button onClick={() => addStop(true)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-brand-gold transition py-1 px-2 border border-white/10 rounded">
                                + Add Return Stop
                            </button>
                        </div>
                    </div>


                    <div className="location-field-wrapper group">
                      <div className="unified-input rounded-xl flex items-center h-[54px] px-4 relative z-10 bg-black">
                        <div className="mr-3 flex-shrink-0 text-brand-gold">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <input type="text" id="return-dropoff" placeholder="Enter return destination"
                               onFocus={() => expandSheetAndCloseOthers('return-dropoff')}
                               onChange={(e) => {
                                 setReturnDropoff(e.target.value);
                                 handleTyping('return-dropoff', e.target.value);
                               }}
                               value={returnDropoff}
                               className="text-[15px] font-medium"/>
                      </div>
                      <ul className="suggestions-list" style={{display: returnDropoffSuggestions.length > 0 ? 'block' : 'none'}}>
                        {returnDropoffSuggestions.map((item, i) => (
                          item.isHeader ?
                            <div key={i} className="text-[10px] text-brand-gold uppercase px-4 py-2 bg-[#111] font-bold">{item.text}</div> :
                            <li key={i} onClick={() => selectLocation('return-dropoff', item.text, item.center)}>{item.text}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Return Date</label>
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                          <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Return Time</label>
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                          <input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="uppercase text-sm cursor-pointer bg-transparent border-none outline-none text-white w-full" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-brand-gold uppercase ml-1 mb-1 font-bold tracking-widest">Return Flight No.</label>
                        <div className="unified-input rounded-xl h-[50px] px-3 flex items-center">
                          <input type="text" placeholder="e.g. EZY410" value={returnFlightNumber} onChange={e => setReturnFlightNumber(e.target.value)} className="uppercase text-sm placeholder-gray-600 bg-transparent border-none outline-none text-white w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Return Meet & Greet</label>
                        <label className="checkbox-wrapper unified-input rounded-xl h-[50px] px-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
                          <span className="text-xs font-bold text-brand-gold">£5.00</span>
                          <input type="checkbox" checked={returnMeetGreet} onChange={() => setReturnMeetGreet(!returnMeetGreet)} className="hidden" />
                          <div className={`w-4 h-4 border border-gray-600 rounded flex items-center justify-center transition-all ${returnMeetGreet ? 'bg-brand-gold border-brand-gold' : ''}`}>
                            <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setHasReturnTrip(false)} className="w-full py-2 bg-red-500/10 text-red-400 font-bold rounded-lg hover:bg-red-500/20 transition text-xs uppercase tracking-wider">
                    Remove Return Trip
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Passengers</label>
                <div className="unified-input rounded-xl h-[50px] px-3 flex items-center relative">
                  <select value={pax} onChange={e => setPax(parseInt(e.target.value))} className="text-sm cursor-pointer appearance-none bg-transparent w-full text-white">
                    {[...Array(8)].map((_, i) => <option key={i+1} value={i+1} className="bg-black">{i+1} {i+1 === 1 ? 'Person' : 'People'}</option>)}
                  </select>
                  <div className="absolute right-3 pointer-events-none text-brand-gold text-[10px]">▼</div>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-gray-500 uppercase ml-1 mb-1 font-bold tracking-widest">Luggage</label>
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
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest mt-2">Select Class</h3>
            <div ref={vehicleContainerRef} className="vehicle-scroll flex overflow-x-auto gap-3 snap-x pb-4 px-1">
              {filteredVehicles.map((v, i) => (
                <div key={i} onClick={() => selectVehicle(i)} className={`vehicle-card min-w-[130px] w-[130px] p-3 rounded-2xl cursor-pointer snap-center flex flex-col justify-between ${selectedVehicleIndex === i ? 'selected' : ''}`}>
                  <div className="selected-badge absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{opacity: selectedVehicleIndex === i ? 1 : 0}}>Selected</div>
                  <div><h4 className="text-white font-bold text-xs mb-0.5">{v.name}</h4><p className="text-[9px] text-gray-400">{v.description}</p></div>
                  <div className="flex-1 flex items-center justify-center py-2"><img src={v.image} className="w-full object-contain" /></div>
                  <div className="flex justify-between items-end border-t border-white/10 pt-1.5"><div className="flex gap-1.5 text-gray-400 text-[10px]"><span>👤{v.passengers}</span><span>🧳{v.luggage}</span></div><span className="text-brand-gold font-bold text-[10px]">£{v.perMile}/mi</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OFFERS SECTION */}
        <div ref={offersSectionRef} className="bg-brand-gold py-20 md:py-28 relative font-sans text-primary-black overflow-hidden z-0 rounded-t-3xl">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-brand-gold-dark/10 via-transparent to-brand-gold-dark/20 pointer-events-none"></div>
          <div className="w-[90%] mx-auto max-w-7xl relative z-10">
            <div className="text-center max-w-5xl mx-auto mb-16 md:mb-20">
              <p className="text-base md:text-xl font-bold uppercase tracking-[0.2em] mb-3 text-primary-black/80">
                Why Choose Fare 1 Taxi?
              </p>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight uppercase drop-shadow-xl text-primary-black">
                Airport Taxi Transfers UK <br className="md:hidden"/>
                <span className="relative inline-block text-3xl md:text-5xl lg:text-6xl opacity-80">
                   Cruise Port & Long-Distance Taxi Service
                  <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-primary-black/90 hidden md:block"></span>
                </span>
              </h2>

              {/* Sequential Text Animation */}
              <div className="h-10 mb-8 flex items-center justify-center">
                  <span key={discountMsgIndex} className="text-xl md:text-2xl font-black bg-primary-black text-white px-4 py-2 transform -skew-x-6 animate-fade-in-up">
                    {DISCOUNT_MESSAGES[discountMsgIndex]}
                  </span>
              </div>

              {/* Accordion */}
              <div className="max-w-3xl mx-auto space-y-2 mb-10 text-left">
                  {[
                      { title: "Competitive Pricing", content: "We offer unbeatable fixed fares including 15% off bills over £130 and 5% off return trips. No hidden meters, just transparent quotes." },
                      { title: "Reliability & Punctuality", content: "Flight tracking is standard. We monitor your arrival to ensure your driver is waiting, regardless of delays. 99.9% on-time record." },
                      { title: "24/7 Availability", content: "Our fleet operates round the clock. Whether it's a 3 AM airport run or a late-night cruise terminal pickup, Fare 1 is ready." }
                  ].map((item, idx) => (
                      <div key={idx} className="bg-white/10 border border-primary-black/10 rounded-xl overflow-hidden backdrop-blur-sm">
                          <button onClick={() => setAccordionOpen(accordionOpen === idx ? null : idx)} className="w-full flex justify-between items-center p-4 font-bold text-primary-black hover:bg-white/20 transition-colors">
                              <span>{item.title}</span>
                              <span className="text-2xl">{accordionOpen === idx ? '−' : '+'}</span>
                          </button>
                          <div className={`overflow-hidden transition-all duration-300 ${accordionOpen === idx ? 'max-h-40 p-4 pt-0' : 'max-h-0'}`}>
                              <p className="text-primary-black/80 font-medium leading-relaxed">{item.content}</p>
                          </div>
                      </div>
                  ))}
              </div>
            </div>

            <div className="mb-20">
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-12">
                <div className="h-[2px] w-12 md:w-16 bg-primary-black/40 rounded-full"></div>
                <h3 className="text-xl md:text-3xl font-heading font-black uppercase tracking-wider text-center text-primary-black drop-shadow-sm">
                  Exclusive Rates from Southampton
                </h3>
                <div className="h-[2px] w-12 md:w-16 bg-primary-black/40 rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-2">
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-gold to-[#ffeead] text-primary-black text-[10px] font-extrabold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest z-10 shadow-md">Popular Choice</div>
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Heathrow Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£99</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/heathrow-airport/?pickup=Southampton&dropoff=Heathrow%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Gatwick Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£130</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/gatwick-airport/?pickup=Southampton&dropoff=Gatwick%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Bristol Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£160</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/bristol-airport/?pickup=Southampton&dropoff=Bristol%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-br-2xl uppercase tracking-widest z-10 shadow-md">Best Value</div>
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Bournemouth Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£65</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/bournemouth-airport/?pickup=Southampton&dropoff=Bournemouth%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                {/* SPLIT LUTON/EXETER */}
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Luton Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£170</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/luton-airport/?pickup=Southampton&dropoff=Luton%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Exeter Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£170</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/exeter-airport/?pickup=Southampton&dropoff=Exeter%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>

                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Stansted Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£220</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/stansted-airport/?pickup=Southampton&dropoff=Stansted%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">London City Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£190</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/london-city-airport/?pickup=Southampton&dropoff=London%20City%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
                <div className="price-card bg-secondary-black p-6 md:p-8 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-2xl hover:shadow-gold-glow">
                  <div className="flex justify-between items-end mb-6 opacity-70">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Direct Route</div>
                    <div className="text-brand-gold text-xs font-bold uppercase tracking-widest">Fixed Fare</div>
                  </div>
                  <div className="flex flex-col gap-1 mb-8 text-center">
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Southampton</div>
                    <div className="text-brand-gold text-sm my-1">to</div>
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Brighton City Airport</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£100</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://southampton.airporttaxis24-7.com/brighton-city-airport/?pickup=Southampton&dropoff=Brighton%20City%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHOOSE YOUR JOURNEY SECTION */}
        <div ref={chooseJourneyRef} className="bg-[#050505] py-20 relative font-sans border-t border-brand-gold/10">
            <div className="w-[90%] mx-auto max-w-6xl relative z-10">
                <h2 className="text-3xl md:text-5xl font-heading font-black text-center text-white mb-16 uppercase drop-shadow-lg">
                    Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200">Journey</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Airport Transfer", desc: "Reliable connections to all major UK airports.", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", link: "https://airporttaxis24-7.com/" },
                        { title: "Cruise Transport", desc: "Start your voyage with our premium port transfers.", img: "https://images.unsplash.com/photo-1548286979-4592a884f378?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", link: "https://fare1.co.uk/cruise-transfer" },
                        { title: "Taxi Journeys", desc: "Long-distance travel in executive comfort.", img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", link: "https://booking.fare1.co.uk/" }
                    ].map((s, i) => (
                        <a key={i} href={s.link} className="group relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                            <img src={s.img} alt={s.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 p-8">
                                <h3 className="text-2xl font-bold text-white mb-2">{s.title}</h3>
                                <p className="text-gray-300 text-sm mb-4">{s.desc}</p>
                                <span className="text-brand-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                    Book Now <span className="text-lg">→</span>
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>

        {/* FEEDBACK SECTION */}
        <div ref={feedbackSectionRef} className="bg-primary-black py-20 border-t border-brand-gold/10 relative overflow-hidden font-sans">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-brand-gold/5 to-transparent pointer-events-none"></div>
          <div className="w-[90%] mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-2 uppercase tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#F3E5AB]">Feedback</span>
                </h2>
                <p className="text-gray-400 text-sm font-medium tracking-wide">Real experiences from our travelers.</p>
              </div>
              <div className="flex items-center gap-4 bg-secondary-black border border-brand-gold/20 px-6 py-3 rounded-full shadow-lg">
                <div className="bg-white p-1.5 rounded-full flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex text-brand-gold text-sm" dangerouslySetInnerHTML={{__html: headerStars}}></div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{totalRatings}</span>
                </div>
              </div>
            </div>
            <div ref={googleReviewsContainerRef} className="review-scroll flex overflow-x-auto gap-5 snap-x pb-10 px-1">
              {reviews.length > 0 ? reviews.map((r, i) => (
                <div key={i} className="review-card min-w-[300px] md:min-w-[350px] p-6 rounded-2xl snap-center flex flex-col justify-between relative select-none">
                  <div className="absolute top-4 right-6 text-brand-gold/10 text-6xl font-serif leading-none">”</div>
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={r.profile_photo_url} alt={r.author_name} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                      <div>
                        <h4 className="text-white font-bold text-sm font-heading">{r.author_name}</h4>
                        <p className="text-[10px] text-gray-500 font-sans">{r.relative_time_description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3 text-sm tracking-wide">
                      {[...Array(5)].map((_, starI) => <span key={starI} className={starI < r.rating ? 'text-brand-gold' : 'text-gray-700'}>★</span>)}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed font-sans font-light opacity-90 border-t border-white/5 pt-3">
                      "{r.text.length > 150 ? r.text.substring(0, 150) + '...' : r.text}"
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 opacity-40">
                    <div className="w-4 h-4 grayscale opacity-70">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">Verified Review</span>
                  </div>
                </div>
              )) : <div className="text-gray-500 w-full text-center text-sm">No reviews available via API yet.</div>}
            </div>
            <div className="flex justify-center mt-6">
              <a href="https://search.google.com/local/writereview?placeid=ChIJ9caM2nkSsYsRzNAS6kVqn2k" target="_blank" className="group relative bg-transparent border border-brand-gold text-brand-gold font-bold py-3.5 px-8 rounded-xl overflow-hidden transition-all hover:text-black hover:bg-brand-gold">
                <span className="relative text-sm uppercase tracking-widest flex items-center gap-2">
                  Write a Review
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* BOTTOM BAR */}
      <div id="bottom-bar" className={`bottom-bar fixed bottom-0 left-0 w-full bg-black/95 border-t border-brand-gold/20 py-3 px-5 z-[80] safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,1)] ${bottomBarVisible ? 'visible' : ''} ${bottomBarHiddenScroll ? 'hidden-scroll' : ''}`}>
        <div className="flex justify-between items-center max-w-5xl mx-auto gap-4">
          <div className="flex flex-col justify-center min-w-0">
            <div id="promo-text" className={`text-[9px] font-black ${promoClass} mb-0.5 tracking-wider uppercase truncate animate-pulse-custom`}>{promoText}</div>
            <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Fare Estimate</div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className={`text-[10px] font-bold text-red-500 line-through opacity-70 ${oldPriceVisible ? '' : 'hidden'}`}>£{oldPrice.toFixed(2)}</span>
              <p className="text-3xl font-heading font-black text-white tracking-tight leading-none flex items-baseline gap-2">
                £<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-[#fff5cc]">{totalPrice.toFixed(2)}</span>
                <span className={`text-[10px] text-gray-400 font-medium tracking-normal ${distanceHidden ? 'hidden' : ''}`}>{distanceDisplay}</span>
                {hasReturnTrip && <span className="text-[10px] text-green-500 font-medium bg-green-900/20 px-1 rounded">Return Leg -5% Applied</span>}
              </p>
            </div>
          </div>
          <button onClick={goToBooking} className="bg-brand-gold text-black font-extrabold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:bg-[#e6c355] transition-transform active:scale-95 text-sm uppercase tracking-wide whitespace-nowrap">
            Book Now
          </button>
        </div>
      </div>

      {/* LOCATION SHEET */}
      <div id="sheet-overlay" className={`fixed inset-0 bg-black/90 z-[90] flex items-end sm:items-center justify-center transition-opacity duration-300 backdrop-blur-sm ${sheetOverlayOpen ? '' : 'hidden'}`}>
        <div id="location-sheet" className="bg-[#121212] w-full max-w-md p-6 rounded-t-[2rem] sm:rounded-[2rem] border border-white/10 shadow-2xl pb-10">
          <div className="w-12 h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold border border-brand-gold/20">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2 font-heading">Where to?</h2>
          <button onClick={getUserLocation} className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl mb-3 mt-6 shadow-lg">Use My Current Location</button>
          <button onClick={closeSheet} className="w-full bg-white/5 text-gray-400 font-semibold py-3.5 rounded-xl border border-white/5">Enter Address Manually</button>
        </div>
      </div>
    </div>
  );
} 