
import React, { useEffect, useRef, memo } from 'react';
import { LngLat, RouteWaypoints } from '@/types';
import { MAPBOX_TOKEN } from '@/lib/constants';

interface MapContainerProps {
  userLocation: LngLat | null;
  waypointsOut: RouteWaypoints;
  waypointsRet: RouteWaypoints;
  outboundRoute: any; // GeoJSON geometry
  returnRoute: any; // GeoJSON geometry
  hasReturnTrip: boolean;
  onRefreshLocation: () => void;
}

const MapContainer = memo(({ 
  userLocation, 
  waypointsOut, 
  waypointsRet, 
  outboundRoute, 
  returnRoute, 
  hasReturnTrip,
  onRefreshLocation 
}: MapContainerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pulseMarkerRef = useRef<any>(null);

  // --- Initialize Map ---
  useEffect(() => {
    if (!window.mapboxgl) return;
    window.mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-1.4043, 50.9097],
      zoom: 11,
      attributionControl: false,
      pitchWithRotate: false
    });

    mapRef.current.scrollZoom.disable();
    mapRef.current.on('touchstart', () => mapRef.current?.dragPan.enable());
    
    mapRef.current.on('load', () => {
        mapRef.current.resize();
        if (userLocation && !waypointsOut.pickup) {
            mapRef.current.flyTo({ center: userLocation, zoom: 14 });
        }
    });

    // Resize handler
    const handleResize = () => mapRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        mapRef.current?.remove();
    };
  }, []); // Only run once

  // --- Handle Markers ---
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Clear existing journey markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 2. Handle Golden Pulse Marker (User Location)
    const isPickupSet = !!waypointsOut.pickup;
    
    if (isPickupSet) {
        if (pulseMarkerRef.current) {
            pulseMarkerRef.current.remove();
            pulseMarkerRef.current = null;
        }
    } else if (userLocation) {
        if (!pulseMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'marker-pulse';
            pulseMarkerRef.current = new window.mapboxgl.Marker(el)
                .setLngLat(userLocation)
                .addTo(mapRef.current);
        } else {
            pulseMarkerRef.current.setLngLat(userLocation);
            if (!pulseMarkerRef.current.getElement().parentElement) {
                pulseMarkerRef.current.addTo(mapRef.current);
            }
        }
    }

    // 3. Add Journey Markers
    const add = (coords: LngLat | null, color: string) => {
        if (!coords) return;
        const m = new window.mapboxgl.Marker({ color }).setLngLat(coords).addTo(mapRef.current);
        markersRef.current.push(m);
    };

    add(waypointsOut.pickup, '#22c55e'); // Green
    add(waypointsOut.dropoff, '#ef4444'); // Red
    waypointsOut.stops.forEach(s => add(s, '#3b82f6'));

    if (hasReturnTrip) {
        add(waypointsRet.pickup, '#3b82f6');
        add(waypointsRet.dropoff, '#ef4444');
        waypointsRet.stops.forEach(s => add(s, '#3b82f6'));
    }

    // 4. Fly to pickup if it's the only point set
    if (waypointsOut.pickup && !waypointsOut.dropoff) {
        mapRef.current.flyTo({ center: waypointsOut.pickup, zoom: 14 });
    }

  }, [waypointsOut, waypointsRet, userLocation, hasReturnTrip]);

  // --- Handle Routes & Bounds ---
  useEffect(() => {
    if (!mapRef.current) return;

    // Helper to add/update layer
    const updateLayer = (id: string, data: any, color: string, isDashed = false) => {
        if (mapRef.current.getSource(id)) {
            mapRef.current.getSource(id).setData(data);
        } else {
            if (!mapRef.current.getLayer(id)) {
                mapRef.current.addLayer({
                    id, type: 'line', source: { type: 'geojson', data },
                    paint: { 
                        'line-color': color, 
                        'line-width': isDashed ? 4 : 5, 
                        'line-opacity': 0.9,
                        ...(isDashed ? { 'line-dasharray': [2, 1] } : {})
                    }
                });
            }
        }
    };

    // Outbound
    if (outboundRoute) {
        updateLayer('route-outbound', outboundRoute, '#D4AF37');
    } else if (mapRef.current.getLayer('route-outbound')) {
         // Optionally clear
         // mapRef.current.setLayoutProperty('route-outbound', 'visibility', 'none'); 
         // For now, we assume if null passed, we might want to keep previous or clear logic. 
         // Ideally clear source data to empty feature collection.
         if (mapRef.current.getSource('route-outbound')) {
             mapRef.current.getSource('route-outbound').setData({type: 'FeatureCollection', features: []});
         }
    }

    // Return
    if (returnRoute && hasReturnTrip) {
        updateLayer('route-return', returnRoute, '#60a5fa', true);
    } else if (mapRef.current.getLayer('route-return')) {
         if (mapRef.current.getSource('route-return')) {
             mapRef.current.getSource('route-return').setData({type: 'FeatureCollection', features: []});
         }
    }

    // Bounds Logic
    const bounds = new window.mapboxgl.LngLatBounds();
    let hasPoints = false;
    const addPt = (p: LngLat | null) => { if (p) { bounds.extend(p); hasPoints = true; } };

    addPt(waypointsOut.pickup);
    addPt(waypointsOut.dropoff);
    waypointsOut.stops.forEach(addPt);
    
    if (hasReturnTrip) {
        addPt(waypointsRet.pickup);
        addPt(waypointsRet.dropoff);
        waypointsRet.stops.forEach(addPt);
    }

    if (hasPoints && (outboundRoute || (waypointsOut.pickup && waypointsOut.dropoff))) {
         mapRef.current.fitBounds(bounds, { padding: 80, animate: true });
    }

  }, [outboundRoute, returnRoute, hasReturnTrip]);

  return (
    <div className="fixed inset-0 h-[45vh] z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-primary-black pointer-events-none"></div>
      <button 
          onClick={onRefreshLocation}
          className="absolute bottom-6 right-6 pointer-events-auto bg-black/80 backdrop-blur-md p-3 rounded-full border border-brand-gold/30 hover:bg-brand-gold hover:text-black transition-all duration-300 shadow-xl group z-20"
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
      </button>
    </div>
  );
});

MapContainer.displayName = 'MapContainer';
export default MapContainer;
