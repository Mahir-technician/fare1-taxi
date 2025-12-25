
import { useState, useRef, useEffect, useCallback } from 'react';
import { LngLat, RouteWaypoints, SuggestionItem, BookingState, PricingState, Vehicle } from '@/types';
import { MAPBOX_TOKEN, PRESET_DATA, VEHICLES, MAX_STOPS } from '@/lib/constants';

export const useBookingLogic = () => {
  // --- Core Form State ---
  const [form, setForm] = useState<BookingState>({
    pickup: '', dropoff: '', stops: [],
    date: '', time: '', flightNumber: '', meetGreet: false, pax: 1, bags: 0,
    hasReturnTrip: false, returnPickup: '', returnDropoff: '', returnStops: [],
    returnDate: '', returnTime: '', returnFlightNumber: '', returnMeetGreet: false
  });

  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  
  // --- Pricing & Logic State ---
  const [pricing, setPricing] = useState<PricingState>({
    outDistanceMiles: 0, retDistanceMiles: 0, totalPrice: 0,
    oldPrice: 0, oldPriceVisible: false,
    promoText: "REACH £130 & GET 15% OFF", promoClass: 'text-brand-gold',
    distanceDisplay: '0 mi', distanceHidden: true
  });

  // --- Map & Location State ---
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  
  // Waypoints are kept in refs to avoid re-rendering map on every keypress, 
  // but we trigger a separate state update when the map needs to redraw lines.
  const waypointsOut = useRef<RouteWaypoints>({ pickup: null, dropoff: null, stops: [] });
  const waypointsRet = useRef<RouteWaypoints>({ pickup: null, dropoff: null, stops: [] });
  
  // Map Data State (GeoJSON lines to pass to MapContainer)
  const [outboundRouteGeoJson, setOutboundRouteGeoJson] = useState<any>(null);
  const [returnRouteGeoJson, setReturnRouteGeoJson] = useState<any>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<{ [key: string]: SuggestionItem[] }>({});

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const now = new Date();
    setForm(prev => ({
      ...prev,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5)
    }));
    
    // Check for saved location
    const locCookie = document.cookie.split('; ').find(row => row.startsWith('fare1_user_loc='));
    if (locCookie) {
      try {
        const savedLoc = JSON.parse(locCookie.split('=')[1]);
        setUserLocation(savedLoc);
      } catch(e) {}
    }
  }, []);

  // --- Pricing Calculation ---
  useEffect(() => {
    const v = VEHICLES[selectedVehicleIndex];
    if (pricing.outDistanceMiles <= 0) return;

    let outP = pricing.outDistanceMiles * v.perMile;
    if (outP < 5) outP = 5;
    if (form.meetGreet) outP += 5;

    let retP = 0;
    if (form.hasReturnTrip && pricing.retDistanceMiles > 0) {
      retP = pricing.retDistanceMiles * v.perMile;
      if (retP < 5) retP = 5;
      if (form.returnMeetGreet) retP += 5;
      retP *= 0.95; // 5% Discount
    }

    let p = outP + retP;
    let promoText = "REACH £130 & GET 15% OFF";
    let promoClass = 'text-brand-gold';
    let oldPriceVisible = false;
    let oldPrice = 0;

    if (p >= 130) {
      oldPriceVisible = true;
      oldPrice = p;
      p = p * 0.85; // 15% Discount
      promoText = "15% DISCOUNT APPLIED";
      promoClass = 'text-green-400';
    }

    setPricing(prev => ({
      ...prev, totalPrice: p, oldPrice, oldPriceVisible, promoText, promoClass
    }));
  }, [pricing.outDistanceMiles, pricing.retDistanceMiles, selectedVehicleIndex, form.meetGreet, form.returnMeetGreet, form.hasReturnTrip]);

  // --- Handlers ---

  const handleTyping = useCallback((type: string, value: string) => {
    // Clear waypoints if text is cleared
    if (type === 'pickup') waypointsOut.current.pickup = null;
    if (type === 'dropoff') waypointsOut.current.dropoff = null;
    if (type === 'return-pickup') waypointsRet.current.pickup = null;
    if (type === 'return-dropoff') waypointsRet.current.dropoff = null;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.length === 0) {
       // Show presets
       let list: SuggestionItem[] = [];
       if ((type === 'pickup' || type === 'return-pickup') && userLocation) {
         list.push({ text: "📍 Use My Current Location", center: userLocation, name: "Current Location" });
       }
       Object.keys(PRESET_DATA).forEach(category => {
         list.push({ isHeader: true, text: category, center: [0,0] });
         PRESET_DATA[category].forEach((p) => list.push({ text: p.name, center: p.center }));
       });
       setSuggestions(prev => ({ ...prev, [type]: list }));
       return;
    }

    if (value.length < 3) {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
      return;
    }

    debounceTimer.current = setTimeout(() => {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=5&types=postcode,address,poi`;
      fetch(url)
        .then(r => r.json())
        .then(data => {
          let list: SuggestionItem[] = [];
          if (data.features?.length) {
            data.features.forEach((f: any) => list.push({ text: f.place_name, center: f.center as LngLat }));
          }
          setSuggestions(prev => ({ ...prev, [type]: list }));
        });
    }, 300);
  }, [userLocation]);

  const selectLocation = useCallback((type: string, name: string, coords: LngLat) => {
    const cleanName = name.replace("📍 ", "");
    const isReturn = type.includes('return');
    const wp = isReturn ? waypointsRet : waypointsOut;

    // Update Form State
    setForm(prev => {
        const newState = { ...prev };
        if (type === 'pickup') newState.pickup = cleanName;
        else if (type === 'dropoff') newState.dropoff = cleanName;
        else if (type === 'return-pickup') newState.returnPickup = cleanName;
        else if (type === 'return-dropoff') newState.returnDropoff = cleanName;
        else if (type.startsWith('stop-')) {
            const idx = parseInt(type.split('-')[type.split('-').length - 1]) - 1;
            if (isReturn) newState.returnStops[idx] = cleanName;
            else newState.stops[idx] = cleanName;
        }
        return newState;
    });

    // Update Waypoints
    if (type.includes('pickup')) wp.current.pickup = coords;
    else if (type.includes('dropoff')) wp.current.dropoff = coords;
    else if (type.includes('stop')) {
        const idx = parseInt(type.split('-')[type.split('-').length - 1]) - 1;
        wp.current.stops[idx] = coords;
    }

    // Clear suggestions
    setSuggestions(prev => ({ ...prev, [type]: [] }));

    // Calculate Route
    calculateRoute(isReturn);
  }, []);

  const calculateRoute = async (isReturn: boolean) => {
    const wp = isReturn ? waypointsRet.current : waypointsOut.current;
    
    // If only pickup is set (no dropoff), we just want to update markers on map
    if (wp.pickup && !wp.dropoff) {
        // Trigger a shallow update to force MapContainer to re-eval markers
        if (isReturn) setReturnRouteGeoJson(null); 
        else setOutboundRouteGeoJson(null);
        return;
    }

    if (!wp.pickup || !wp.dropoff) return;

    let coords: LngLat[] = [wp.pickup];
    wp.stops.forEach(s => { if (s) coords.push(s); });
    coords.push(wp.dropoff);
    
    const coordString = coords.map(c => c.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.routes?.length) return;
        
        const r = data.routes[0];
        const distMiles = r.distance / 1609.34;

        if (isReturn) {
            setPricing(prev => ({ ...prev, retDistanceMiles: distMiles }));
            setReturnRouteGeoJson(r.geometry);
        } else {
            setPricing(prev => ({ 
                ...prev, 
                outDistanceMiles: distMiles, 
                distanceHidden: false 
            }));
            setOutboundRouteGeoJson(r.geometry);
        }
        
        // Update display total distance
        setPricing(prev => ({
            ...prev,
            distanceDisplay: ((isReturn ? prev.outDistanceMiles + distMiles : distMiles + prev.retDistanceMiles).toFixed(1) + ' mi')
        }));
    } catch (e) {
        console.error("Route calc failed", e);
    }
  };

  const swapLocations = useCallback(() => {
    setForm(prev => ({ ...prev, pickup: prev.dropoff, dropoff: prev.pickup }));
    
    const temp = waypointsOut.current.pickup;
    waypointsOut.current.pickup = waypointsOut.current.dropoff;
    waypointsOut.current.dropoff = temp;

    setOutboundRouteGeoJson(null); // Clear line temporarily
    calculateRoute(false);

    if (form.hasReturnTrip) {
        setForm(prev => ({ ...prev, returnPickup: prev.returnDropoff, returnDropoff: prev.returnPickup }));
        const tempRet = waypointsRet.current.pickup;
        waypointsRet.current.pickup = waypointsRet.current.dropoff;
        waypointsRet.current.dropoff = tempRet;
        calculateRoute(true);
    }
  }, [form.hasReturnTrip]);

  const addReturnTrip = useCallback(() => {
    setForm(prev => ({
        ...prev, 
        hasReturnTrip: true,
        returnPickup: prev.dropoff,
        returnDropoff: prev.pickup
    }));
    waypointsRet.current.pickup = waypointsOut.current.dropoff;
    waypointsRet.current.dropoff = waypointsOut.current.pickup;
    calculateRoute(true);
  }, []);

  const removeReturnTrip = useCallback(() => {
      setForm(prev => ({ ...prev, hasReturnTrip: false }));
      waypointsRet.current = { pickup: null, dropoff: null, stops: [] };
      setReturnRouteGeoJson(null);
      setPricing(prev => ({ ...prev, retDistanceMiles: 0 }));
  }, []);

  return {
    form, setForm,
    pricing,
    selectedVehicleIndex, setSelectedVehicleIndex,
    userLocation, setUserLocation,
    suggestions,
    handleTyping, selectLocation,
    swapLocations, addReturnTrip, removeReturnTrip,
    outboundRouteGeoJson, returnRouteGeoJson,
    waypointsOut: waypointsOut.current,
    waypointsRet: waypointsRet.current
  };
};
