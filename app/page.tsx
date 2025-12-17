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

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [bottomBarVisible, setBottomBarVisible] = useState(false);
  const [bottomBarHiddenScroll, setBottomBarHiddenScroll] = useState(false);
  const [sheetOverlayOpen, setSheetOverlayOpen] = useState(true);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [currentDistanceMiles, setCurrentDistanceMiles] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [oldPriceVisible, setOldPriceVisible] = useState(false);
  const [oldPrice, setOldPrice] = useState(0);
  const [promoText, setPromoText] = useState("REACH £130 & GET 15% OFF");
  const [promoClass, setPromoClass] = useState('text-brand-gold');

  // Inputs
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetGreet, setMeetGreet] = useState(false);
  const [pax, setPax] = useState(1);
  const [bags, setBags] = useState(0);

  // Return Trip
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [returnPickup, setReturnPickup] = useState('');
  const [returnDropoff, setReturnDropoff] = useState('');
  const [returnFlightNumber, setReturnFlightNumber] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [returnMeetGreet, setReturnMeetGreet] = useState(false);

  // Suggestions
  const [filteredVehicles, setFilteredVehicles] = useState<typeof vehicles>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<SuggestionItem[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<SuggestionItem[]>([]);
  const [stopSuggestions, setStopSuggestions] = useState<{ [key: string]: SuggestionItem[] }>({});
  const [returnPickupSuggestions, setReturnPickupSuggestions] = useState<SuggestionItem[]>([]);
  const [returnDropoffSuggestions, setReturnDropoffSuggestions] = useState<SuggestionItem[]>([]);

  // Reviews & UI
  const [reviews, setReviews] = useState<any[]>([]);
  const [headerStars, setHeaderStars] = useState('★★★★★');
  const [totalRatings, setTotalRatings] = useState('Loading...');
  const [distanceDisplay, setDistanceDisplay] = useState('0 mi');
  const [distanceHidden, setDistanceHidden] = useState(true);
  const [returnDistanceMiles, setReturnDistanceMiles] = useState(0);
  const [returnDistanceDisplay, setReturnDistanceDisplay] = useState('0 mi');

  // Refs
  const mapRef = useRef<any>(null);
  const returnMapRef = useRef<any>(null);
  const mainSheetRef = useRef<HTMLDivElement>(null);
  const vehicleContainerRef = useRef<HTMLDivElement>(null);
  const googleReviewsContainerRef = useRef<HTMLDivElement>(null);
  const offersRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const startMarker = useRef<any>(null);
  const endMarker = useRef<any>(null);
  const returnStartMarker = useRef<any>(null);
  const returnEndMarker = useRef<any>(null);
  const stopMarkers = useRef<{ [key: string]: any }>({});
  const routeWaypoints = useRef<{ pickup: LngLat | null, dropoff: LngLat | null, stops: (LngLat | null)[] }>({ pickup: null, dropoff: null, stops: [] });
  const returnRouteWaypoints = useRef<{ pickup: LngLat | null, dropoff: LngLat | null }>({ pickup: null, dropoff: null });
  const lastScrollTop = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Lenis Init for Premium Smooth Scrolling
    // FIX: Using 'any' type to bypass strict option checking if types mismatch
    const lenisOptions: any = {
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    };
    const lenis = new Lenis(lenisOptions);

    function raf(time: number) {
      lenis.raf(time);
      ScrollTrigger.update();
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Set Date/Time on Client
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().substring(0, 5));

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 50);
      if (currentScroll > 50 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Init Mapbox Outbound
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

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (sheet) sheet.removeEventListener('scroll', () => {});
      lenis.destroy();
    };
  }, []);

  // Init Return Map when needed
  useEffect(() => {
    if (isReturnTrip && window.mapboxgl && !returnMapRef.current) {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      returnMapRef.current = new window.mapboxgl.Map({
        container: 'return-map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-0.1276, 51.5074],
        zoom: 11,
        attributionControl: false,
        pitchWithRotate: false
      });
      returnMapRef.current.scrollZoom.disable();
      returnMapRef.current.on('touchstart', () => returnMapRef.current.dragPan.enable());
    }
  }, [isReturnTrip]);

  // GSAP Animations for Sections
  useEffect(() => {
    if (offersRef.current) {
      gsap.fromTo(offersRef.current, { y: 50, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: offersRef.current,
          start: 'top 80%',
          end: 'top 50%',
          scrub: true,
        }
      });
    }

    if (feedbackRef.current) {
      gsap.fromTo(feedbackRef.current, { y: 50, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: feedbackRef.current,
          start: 'top 80%',
          end: 'top 50%',
          scrub: true,
        }
      });
    }
  }, []);

  useEffect(() => {
    const filtered = vehicles.filter(v => v.passengers >= pax && v.luggage >= bags);
    setFilteredVehicles(filtered);
    if (filtered.length > 0 && !filtered.some((v, i) => i === selectedVehicleIndex)) {
      setSelectedVehicleIndex(0);
    }
  }, [pax, bags]);

  useEffect(() => {
    updatePrice();
  }, [currentDistanceMiles, returnDistanceMiles, selectedVehicleIndex, meetGreet, returnMeetGreet]);

  useEffect(() => {
    checkVisibility();
  }, [routeWaypoints.current.pickup, routeWaypoints.current.dropoff]);

  const initReviews = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);
      const request = {
        placeId: 'ChIJ9caM2nkSsYsRzNAS6kVqn2k',
        fields: ['reviews', 'rating', 'user_ratings_total']
      };
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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const collapseSheet = () => {
    setSheetExpanded(false);
  };

  const expandSheetAndCloseOthers = (id: string) => {
    setPickupSuggestions([]);
    setDropoffSuggestions([]);
    setStopSuggestions({});
    setReturnPickupSuggestions([]);
    setReturnDropoffSuggestions([]);
    if (window.innerWidth < 768) {
      setSheetExpanded(true);
      window.scrollTo(0, 0);
    }
    handleTyping(id, (document.getElementById(id) as HTMLInputElement)?.value || '');
  };

  const showPresets = (type: string) => {
    let list: SuggestionItem[] = [];
    Object.keys(PRESET_DATA).forEach(category => {
      list.push({ isHeader: true, text: category, center: [0,0] }); // Dummy center for header
      PRESET_DATA[category].forEach((p) => list.push({ text: p.name, center: p.center }));
    });
    if (type === 'pickup') setPickupSuggestions(list);
    if (type === 'dropoff') setDropoffSuggestions(list);
    if (type.startsWith('stop-')) setStopSuggestions(prev => ({ ...prev, [type]: list }));
    if (type === 'return-pickup') setReturnPickupSuggestions(list);
    if (type === 'return-dropoff') setReturnDropoffSuggestions(list);
  };

  const handleTyping = (type: string, value: string) => {
    let waypointsRef = routeWaypoints;
    let setSuggestions: any;

    if (type === 'pickup') {
      waypointsRef.current.pickup = null;
      setSuggestions = setPickupSuggestions;
    } else if (type === 'dropoff') {
      waypointsRef.current.dropoff = null;
      setSuggestions = setDropoffSuggestions;
    } else if (type.startsWith('stop-')) {
      const idx = parseInt(type.split('-')[1]) - 1;
      waypointsRef.current.stops[idx] = null;
      setSuggestions = (list: SuggestionItem[]) => setStopSuggestions(prev => ({ ...prev, [type]: list }));
    } else if (type === 'return-pickup') {
      returnRouteWaypoints.current.pickup = null;
      setSuggestions = setReturnPickupSuggestions;
      waypointsRef = returnRouteWaypoints;
    } else if (type === 'return-dropoff') {
      returnRouteWaypoints.current.dropoff = null;
      setSuggestions = setReturnDropoffSuggestions;
      waypointsRef = returnRouteWaypoints;
    } else {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (value.length === 0) {
      showPresets(type);
      return;
    }
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    
    debounceTimer.current = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=5&types=poi,address`)
        .then(r => r.json()).then(data => {
          let list: SuggestionItem[] = [];
          if (data.features?.length) {
            data.features.forEach((f: any) => list.push({ text: f.place_name, center: f.center as LngLat }));
          }
          setSuggestions(list);
        });
    }, 300);
  };

  const selectLocation = (type: string, name: string, coords: LngLat) => {
    let map = mapRef.current;
    let waypoints = routeWaypoints.current;
    let startM = startMarker;
    let endM = endMarker;
    let setSuggestions: any;
    let calculate = calculateRoute;

    if (type === 'pickup') {
      setPickup(name);
      waypoints.pickup = coords;
      if (startM.current) startM.current.remove();
      startM.current = new window.mapboxgl.Marker({ color: '#D4AF37' }).setLngLat(coords).addTo(map);
      map.flyTo({ center: coords, zoom: 13 });
      setSuggestions = setPickupSuggestions;
    } else if (type === 'dropoff') {
      setDropoff(name);
      waypoints.dropoff = coords;
      if (endM.current) endM.current.remove();
      endM.current = new window.mapboxgl.Marker({ color: '#ef4444' }).setLngLat(coords).addTo(map);
      setSuggestions = setDropoffSuggestions;
    } else if (type.startsWith('stop-')) {
      const idx = parseInt(type.split('-')[1]) - 1;
      setStops(prev => prev.map((val, i) => i === idx ? name : val));
      waypoints.stops[idx] = coords;
      if (stopMarkers.current[type]) stopMarkers.current[type].remove();
      stopMarkers.current[type] = new window.mapboxgl.Marker({ color: '#3b82f6', scale: 0.8 }).setLngLat(coords).addTo(map);
      setSuggestions = (list: SuggestionItem[]) => setStopSuggestions(prev => ({ ...prev, [type]: list }));
    } else if (type === 'return-pickup') {
      setReturnPickup(name);
      waypoints = returnRouteWaypoints.current;
      waypoints.pickup = coords;
      map = returnMapRef.current;
      startM = returnStartMarker;
      if (startM.current) startM.current.remove();
      startM.current = new window.mapboxgl.Marker({ color: '#D4AF37' }).setLngLat(coords).addTo(map);
      map.flyTo({ center: coords, zoom: 13 });
      setSuggestions = setReturnPickupSuggestions;
      calculate = calculateReturnRoute;
    } else if (type === 'return-dropoff') {
      setReturnDropoff(name);
      waypoints = returnRouteWaypoints.current;
      waypoints.dropoff = coords;
      map = returnMapRef.current;
      endM = returnEndMarker;
      if (endM.current) endM.current.remove();
      endM.current = new window.mapboxgl.Marker({ color: '#ef4444' }).setLngLat(coords).addTo(map);
      setSuggestions = setReturnDropoffSuggestions;
      calculate = calculateReturnRoute;
    } else {
      return;
    }

    setSuggestions([]);
    collapseSheet();
    calculate();
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
      setCurrentDistanceMiles(distMiles);
      setDistanceDisplay(distMiles.toFixed(1) + ' mi');
      setDistanceHidden(false);
      
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

  const calculateReturnRoute = () => {
    if (!returnRouteWaypoints.current.pickup || !returnRouteWaypoints.current.dropoff || !returnMapRef.current) return;
    
    const coords: LngLat[] = [returnRouteWaypoints.current.pickup, returnRouteWaypoints.current.dropoff];
    
    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    fetch(url).then(r => r.json()).then(data => {
      if (!data.routes?.length) return;
      const r = data.routes[0];
      const distMiles = r.distance / 1609.34;
      setReturnDistanceMiles(distMiles);
      setReturnDistanceDisplay(distMiles.toFixed(1) + ' mi');
      
      if (returnMapRef.current.getSource('return-route')) {
        returnMapRef.current.getSource('return-route').setData(r.geometry);
      } else {
        returnMapRef.current.addLayer({ 
            id: 'return-route', type: 'line', 
            source: { type: 'geojson', data: r.geometry }, 
            paint: { 'line-color': '#D4AF37', 'line-width': 4, 'line-opacity': 0.8 } 
        });
      }
      
      const bounds = new window.mapboxgl.LngLatBounds();
      coords.forEach(c => bounds.extend(c));
      returnMapRef.current.fitBounds(bounds, { padding: 80 });
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

  const updatePrice = () => {
    let outboundPrice = 0;
    if (currentDistanceMiles > 0) {
      outboundPrice = currentDistanceMiles * vehicles[selectedVehicleIndex].perMile;
      if (outboundPrice < 5) outboundPrice = 5;
      if (meetGreet) outboundPrice += 5;
    }

    let returnPrice = 0;
    if (isReturnTrip && returnDistanceMiles > 0) {
      returnPrice = returnDistanceMiles * vehicles[selectedVehicleIndex].perMile;
      if (returnPrice < 5) returnPrice = 5;
      if (returnMeetGreet) returnPrice += 5;
    }

    let p = outboundPrice + returnPrice;

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
  };

  const checkVisibility = () => {
    const p = routeWaypoints.current.pickup;
    const d = routeWaypoints.current.dropoff;
    setBottomBarVisible(!!p && !!d);
  };

  const swapLocations = () => {
    const tempPickup = pickup;
    setPickup(dropoff);
    setDropoff(tempPickup);
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

  const closeSheet = () => {
    setSheetOverlayOpen(false);
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
      if (routeWaypoints.current.stops[i]) {
        url += `&stop${i + 1}=${encodeURIComponent(stop)}`;
      }
    });

    if (isReturnTrip) {
      url += `&returnPickup=${encodeURIComponent(returnPickup)}&returnDropoff=${encodeURIComponent(returnDropoff)}&returnDate=${returnDate}&returnTime=${returnTime}&returnFlight=${returnFlightNumber}&returnMeet=${returnMeetGreet}`;
    }

    window.location.href = url;
  };

  const showReturnAdd = pickup && dropoff && date && time;
  const showSplitMap = isReturnTrip && returnPickup && returnDropoff;

  return (
    <div className="bg-primary-black text-gray-200 font-sans min-h-screen flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header id="site-header" className={`fixed z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'is-scrolled' : ''}`}>
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
      {/* MAP BACKGROUND */}
      <div className="fixed inset-0 h-[45vh] z-0 flex">
        {!showSplitMap ? (
          <div id="map" className="w-full h-full"></div>
        ) : (
          <>
            <div id="map" className="w-1/2 h-full"></div>
            <div id="return-map" className="w-1/2 h-full"></div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-primary-black pointer-events-none"></div>
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
        <div className="w-[90%] mx-auto max-w-5xl space-y-5 pt-1 px-1 mb-20">
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

            {/* STOPS */}
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
              <button onClick={addStop} className="text-[10px] font-bold text-brand-gold uppercase tracking-widest hover:text-white transition py-1 px-2 border border-brand-gold/30 rounded">
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
          </div>

          {showReturnAdd && !isReturnTrip && (
            <div className="my-6 flex justify-center">
              <button onClick={() => { setIsReturnTrip(true); setReturnPickup(dropoff); setReturnDropoff(pickup); }} className="flex items-center gap-2 text-brand-gold font-bold text-sm uppercase tracking-widest hover:text-white transition py-2 px-4 border border-brand-gold/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Return Trip
              </button>
            </div>
          )}
          {isReturnTrip && (
            <div className="space-y-3 relative mt-6 border-t border-white/10 pt-6">
              <h3 className="text-center text-brand-gold font-bold text-lg">Return Trip</h3>
              {/* RETURN PICKUP INPUT */}
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
              {/* RETURN DROPOFF INPUT */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 mt-4">
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
        <div ref={offersRef} className="bg-brand-gold py-20 md:py-28 relative font-sans text-primary-black overflow-hidden z-0 rounded-t-3xl">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-brand-gold-dark/10 via-transparent to-brand-gold-dark/20 pointer-events-none"></div>
          <div className="w-[90%] mx-auto max-w-7xl relative z-10">
            <div className="text-center max-w-5xl mx-auto mb-16 md:mb-20">
              <p className="text-base md:text-xl font-bold uppercase tracking-[0.2em] mb-3 text-primary-black/80">
                Why Choose Fare 1 Taxi?
              </p>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight uppercase drop-shadow-xl text-primary-black">
                Unbeatable <br className="md:hidden"/>
                <span className="relative inline-block">
                  Airport Taxi Transfers UK
                  <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-primary-black/90 hidden md:block"></span>
                </span>
              </h2>
              <p className="text-lg md:text-2xl font-bold mb-6 text-primary-black">
                Why pay more? We guarantee the <span class="bg-primary-black text-brand-gold px-3 py-1 shadow-lg transform -skew-x-6 inline-block">lowest fixed fares</span> in the market.
              </p>
              <p className="text-base md:text-lg font-medium leading-relaxed max-w-3xl mx-auto opacity-90 text-primary-black">
                At <strong>FARE 1 TAXI</strong>, we’ve optimized our fleet to provide the most competitive <strong>Airport Taxi Transfers in the UK</strong> and Cruise Port & Long-Distance Taxi Service. Premium Mercedes-Benz comfort shouldn't break the bank. We monitor competitor pricing daily to ensure you secure a deal that simply cannot be matched.
              </p>
            </div>
            <div className="mb-20">
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-12">
                <div className="h-[2px] w-12 md:w-16 bg-primary-black/40 rounded-full"></div>
                <h3 className="text-xl md:text-3xl font-heading font-black uppercase tracking-wider text-center text-primary-black drop-shadow-sm">
                  Exclusive Rates for Airport Taxi Transfers UK from Southampton
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Heathrow%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Gatwick%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Bristol%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Bournemouth%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <div className="text-white font-heading font-black text-xl md:text-2xl leading-none">Luton / Exeter</div>
                  </div>
                  <div className="text-center py-5 border-t border-white/10 border-b border-white/10 bg-primary-black/30 -mx-6 md:-mx-8">
                    <span className="text-5xl md:text-6xl font-black text-brand-gold tracking-tighter drop-shadow-md">£170</span>
                  </div>
                  <div className="mt-8 text-center">
                    <a href="https://booking.fare1.co.uk?pickup=Southampton" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Stansted%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=London%20City%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
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
                    <a href="https://booking.fare1.co.uk?pickup=Southampton&dropoff=Brighton%20City%20Airport" className="inline-block w-full py-3.5 bg-brand-gold text-primary-black font-black uppercase text-sm rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">Book This Deal</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-primary-black/20 pt-16">
              <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-heading font-black uppercase mb-4 text-primary-black drop-shadow-sm">Local Service, Nationwide Reach</h3>
                <p className="text-lg font-medium max-w-3xl mx-auto opacity-80 leading-relaxed text-primary-black">
                  We are local to you. Fare 1 operates a vast network of dedicated <strong>airport taxi transfer</strong> hubs across the UK. Book directly from your local area for the fastest service.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center">
                <a href="https://southampton.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">📍</span> Southampton Taxis
                </a>
                <a href="https://heathrow.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">✈️</span> Heathrow Transfers
                </a>
                <a href="https://gatwick.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">✈️</span> Gatwick Transfers
                </a>
                <a href="https://stansted.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">✈️</span> Stansted Taxis
                </a>
                <a href="https://luton.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">✈️</span> Luton Transfers
                </a>
                <a href="https://londoncity.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🏙️</span> London City Airport
                </a>
                <a href="https://bournemouth.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🌊</span> Bournemouth Taxis
                </a>
                <a href="https://bristol.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🌉</span> Bristol Transfers
                </a>
                <a href="https://brighton.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🎡</span> Brighton Taxis
                </a>
                <a href="https://manchester.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🐝</span> Manchester Taxis
                </a>
                <a href="https://birmingham.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🏙️</span> Birmingham Taxis
                </a>
                <a href="https://leeds.airporttaxis24-7.com" className="group bg-primary-black/5 hover:bg-secondary-black hover:text-brand-gold text-primary-black font-bold py-4 px-4 rounded-xl transition-all border border-primary-black/10 text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-lg duration-300 flex items-center justify-center">
                  <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">🦉</span> Leeds Transfers
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* FEEDBACK SECTION */}
        <div ref={feedbackRef} className="bg-primary-black py-20 border-t border-brand-gold/10 relative overflow-hidden font-sans">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-brand-gold/5 to-transparent pointer-events-none"></div>
          <div className="w-[90%] mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="text-center md:text-left"><h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-2 uppercase tracking-tight">Feedback</h2></div>
                <div className="flex items-center gap-4 bg-secondary-black border border-brand-gold/20 px-6 py-3 rounded-full shadow-lg"><span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{totalRatings}</span></div>
            </div>
            <div ref={googleReviewsContainerRef} className="review-scroll flex overflow-x-auto gap-5 snap-x pb-10 px-1">
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

      {/* BOTTOM BAR */}
      <div id="bottom-bar" className={`bottom-bar fixed bottom-0 left-0 w-full bg-black/95 border-t border-brand-gold/20 py-2 px-5 z-[80] safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,1)] ${bottomBarVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-center max-w-5xl mx-auto gap-4">
          <div className="flex flex-col justify-center min-w-0">
            <div className={`text-[9px] font-black ${promoClass} mb-0.5 tracking-wider uppercase truncate`}>{promoText}</div>
            <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Fare Estimate</div>
            <p className="text-3xl font-heading font-black text-white">£<span className="text-brand-gold">{totalPrice.toFixed(2)}</span><span className={`text-[10px] text-gray-400 font-medium tracking-normal ${currentDistanceMiles.current > 0 ? '' : 'hidden'}`}>{distanceDisplay}</span></p>
          </div>
          <button onClick={goToBooking} className="bg-brand-gold text-black font-extrabold py-2 px-6 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">Book Now</button>
        </div>
      </div>

      {/* LOCATION SHEET OVERLAY */}
      {sheetOverlayOpen && (
        <div className="fixed inset-0 bg-black/90 z-[90] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#121212] w-full max-w-md p-6 rounded-t-[2rem] sm:rounded-[2rem] border border-white/10">
                <h2 className="text-2xl font-black text-white text-center mb-4">Where to?</h2>
                <button onClick={getUserLocation} className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl mb-3">Use Current Location</button>
                <button onClick={closeSheet} className="w-full bg-white/5 text-gray-400 font-semibold py-3.5 rounded-xl border border-white/5">Enter Address Manually</button>
            </div>
        </div>
      )}
    </div>
  );
}