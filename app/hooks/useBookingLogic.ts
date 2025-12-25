import { useState, useEffect, useRef, useCallback } from 'react';
import { LngLat, BookingState, RouteWaypoints, RouteData, SuggestionItem, Vehicle } from '../types';
import { VEHICLES, MAPBOX_TOKEN, MAX_STOPS, PRESET_DATA } from '../lib/constants';

export const useBookingLogic = () => {
  // --- State ---
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  
  const [form, setForm] = useState<BookingState>({
    pickup: '', dropoff: '', stops: [],
    date: '', time: '', flightNumber: '', meetGreet: false, pax: 1, bags: 0,
    hasReturnTrip: false, returnPickup: '', returnDropoff: '', returnStops: [],
    returnDate: '', returnTime: '', returnFlightNumber: '', returnMeetGreet: false
  });

  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<number | null>(null);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  
  // Route Data
  const [outRoute, setOutRoute] = useState<RouteData | null>(null);
  const [retRoute, setRetRoute] = useState<RouteData | null>(null);
  
  // Waypoints (Coordinates)
  const routeWaypointsOut = useRef<RouteWaypoints>({ pickup: null, dropoff: null, stops: [] });
  const routeWaypointsRet = useRef<RouteWaypoints>({ pickup: null, dropoff: null, stops: [] });

  // Pricing
  const [priceData, setPriceData] = useState({ total: 0, old: 0, showOld: false });

  // Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initial Setup ---
  useEffect(() => {
    // Init Date/Time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    now.setMinutes(now.getMinutes() + 30);
    const nextTime = now.toTimeString().substring(0, 5);
    
    setForm(f => ({ ...f, date: today, time: nextTime }));
    
    // Check Location Cookie
    const locCookie = document.cookie.split('; ').find(row => row.startsWith('fare1_user_loc='));
    if (locCookie) {
      try {
        const coords = JSON.parse(locCookie.split('=')[1]);
        setUserLocation(coords);
      } catch(e) {}
    }
  }, []);

  // --- Vehicle Filtering ---
  useEffect(() => {
    const filtered = VEHICLES.filter(v => v.passengers >= form.pax && v.luggage >= form.bags);
    setFilteredVehicles(filtered);
    
    if (selectedVehicleIndex !== null && filtered.length > 0) {
       // Validate selection
       const current = VEHICLES[selectedVehicleIndex];
       const isValid = filtered.some(v => v.name === current.name);
       if (!isValid) setSelectedVehicleIndex(null);
    }
  }, [form.pax, form.bags]);

  // --- Pricing Logic ---
  useEffect(() => {
    if (!outRoute || selectedVehicleIndex === null) return;

    const vehicle = VEHICLES[selectedVehicleIndex];
    let outP = outRoute.distanceMiles * vehicle.perMile;
    if (outP < 5) outP = 5;
    if (form.meetGreet) outP += 5;

    let retP = 0;
    if (form.hasReturnTrip && retRoute) {
      retP = retRoute.distanceMiles * vehicle.perMile;
      if (retP < 5) retP = 5;
      if (form.returnMeetGreet) retP += 5;
      retP *= 0.95; // 5% discount
    }

    let total = outP + retP;
    let old = 0;
    let showOld = false;

    if (total >= 130) {
      old = total;
      total = total * 0.85; // 15% discount
      showOld = true;
    }

    setPriceData({ total, old, showOld });
  }, [outRoute, retRoute, selectedVehicleIndex, form.meetGreet, form.returnMeetGreet, form.hasReturnTrip]);

  // --- Routing Helpers ---
  const calculateRoute = async (isReturn: boolean) => {
    const wps = isReturn ? routeWaypointsRet.current : routeWaypointsOut.current;
    if (!wps.pickup || !wps.dropoff) return;

    let coords: LngLat[] = [wps.pickup];
    wps.stops.forEach(s => { if(s) coords.push(s); });
    coords.push(wps.dropoff);

    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rData: RouteData = {
          distanceMiles: route.distance / 1609.34,
          durationSeconds: route.duration,
          durationText: `${Math.floor(route.duration/3600)}h ${Math.floor((route.duration%3600)/60)}m`,
          geometry: route.geometry
        };
        isReturn ? setRetRoute(rData) : setOutRoute(rData);
      }
    } catch (e) {
      console.error("Routing error", e);
    }
  };

  // --- Handlers ---
  const handleTyping = (field: string, val: string) => {
    // Clear Coordinates if clearing text
    if (field === 'pickup') routeWaypointsOut.current.pickup = null;
    if (field === 'dropoff') routeWaypointsOut.current.dropoff = null;
    // ... (Add others similarly)

    // Update Form State
    if (field.startsWith('stop-')) {
        const idx = parseInt(field.split('-')[1]) - 1;
        const newStops = [...form.stops];
        newStops[idx] = val;
        setForm(prev => ({...prev, stops: newStops}));
    } else if (field in form) {
        setForm(prev => ({ ...prev, [field]: val }));
    }

    setActiveField(field);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (val.length < 3) {
      // Show Presets logic could go here
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=5&types=postcode,address,poi`;
        fetch(url)
          .then(r => r.json())
          .then(data => {
             const list = data.features?.map((f: any) => ({ text: f.place_name, center: f.center })) || [];
             setSuggestions(list);
          });
    }, 300);
  };

  const selectLocation = (field: string, item: SuggestionItem) => {
    const cleanName = item.text.replace("📍 ", "");
    
    // Update Coordinates
    if (field === 'pickup') routeWaypointsOut.current.pickup = item.center;
    if (field === 'dropoff') routeWaypointsOut.current.dropoff = item.center;
    // ... Handle other fields logic here similar to original code

    // Update Text
    if (field.startsWith('stop-')) {
        const idx = parseInt(field.split('-')[1]) - 1;
        const newStops = [...form.stops];
        newStops[idx] = cleanName;
        setForm(prev => ({...prev, stops: newStops}));
        routeWaypointsOut.current.stops[idx] = item.center;
    } else {
        setForm(prev => ({ ...prev, [field]: cleanName }));
    }

    setSuggestions([]);
    setActiveField(null);

    // Trigger Calculation
    if (field.includes('return')) {
       calculateRoute(true);
    } else {
       calculateRoute(false);
    }
  };

  const addReturnTrip = () => {
    setForm(prev => ({ 
        ...prev, 
        hasReturnTrip: true, 
        returnPickup: prev.dropoff, 
        returnDropoff: prev.pickup 
    }));
    routeWaypointsRet.current.pickup = routeWaypointsOut.current.dropoff;
    routeWaypointsRet.current.dropoff = routeWaypointsOut.current.pickup;
    calculateRoute(true);
  };

  return {
    form, setForm,
    userLocation,
    suggestions,
    activeField, setActiveField,
    handleTyping, selectLocation,
    filteredVehicles, selectedVehicleIndex, setSelectedVehicleIndex,
    outRoute, retRoute,
    routeWaypointsOut, routeWaypointsRet,
    priceData,
    addReturnTrip
  };
};