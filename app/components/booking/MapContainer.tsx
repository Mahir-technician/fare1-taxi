
import React, { useEffect, useRef, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../lib/constants';
import { LngLat, RouteWaypoints } from '../../types';

interface MapContainerProps {
  userLocation: LngLat | null;
  outGeometry: any | null;
  retGeometry: any | null;
  waypointsOut: React.MutableRefObject<RouteWaypoints>;
  waypointsRet: React.MutableRefObject<RouteWaypoints>;
  hasReturnTrip: boolean;
}

const MapContainer = ({ 
  userLocation, 
  outGeometry, 
  retGeometry, 
  waypointsOut, 
  waypointsRet, 
  hasReturnTrip 
}: MapContainerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pulseMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-1.4043, 50.9097],
      zoom: 11,
      attributionControl: false,
      pitchWithRotate: false,
      dragPan: true, // Allow drag on init, handle touch separately if needed
    });

    // Mobile optimization: Disable scroll zoom
    mapRef.current.scrollZoom.disable();

    // Check user loc from cookie/prop for initial center
    if (userLocation) {
       mapRef.current.setCenter(userLocation);
    }

    // Cleanup
    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // Handle Markers & Routes Updates
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // 1. Clear Markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 2. Pulse Marker (Golden Pin) Logic
    const isPickupSet = !!waypointsOut.current.pickup;
    
    if (pulseMarkerRef.current) pulseMarkerRef.current.remove();
    
    if (!isPickupSet && userLocation) {
        const el = document.createElement('div');
        el.className = 'marker-pulse';
        pulseMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat(userLocation)
            .addTo(map);
    }

    // 3. Helper to add marker
    const addMarker = (coords: LngLat | null, color: string) => {
      if (coords) {
        const m = new mapboxgl.Marker({ color }).setLngLat(coords).addTo(map);
        markersRef.current.push(m);
      }
    };

    // 4. Add Journey Markers
    addMarker(waypointsOut.current.pickup, '#22c55e'); // Green
    addMarker(waypointsOut.current.dropoff, '#ef4444'); // Red
    waypointsOut.current.stops.forEach(s => addMarker(s, '#3b82f6'));

    if (hasReturnTrip) {
        addMarker(waypointsRet.current.pickup, '#3b82f6');
        addMarker(waypointsRet.current.dropoff, '#ef4444');
        waypointsRet.current.stops.forEach(s => addMarker(s, '#3b82f6'));
    }

    // 5. Handle Route Layers
    const updateLayer = (id: string, geo: any, color: string, style: any = {}) => {
        const sourceId = id;
        if (map.getSource(sourceId)) {
            (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geo);
        } else {
            if (geo && !map.getLayer(id)) {
                map.addLayer({
                    id, type: 'line', 
                    source: { type: 'geojson', data: geo },
                    paint: { 
                        'line-color': color, 
                        'line-width': 5, 
                        'line-opacity': 0.9,
                        ...style
                    }
                });
            }
        }
    };

    if (outGeometry) updateLayer('route-outbound', outGeometry, '#D4AF37');
    if (hasReturnTrip && retGeometry) {
        updateLayer('route-return', retGeometry, '#60a5fa', { 'line-dasharray': [2, 1], 'line-width': 4 });
    } else {
        if (map.getLayer('route-return')) map.removeLayer('route-return');
        if (map.getSource('route-return')) map.removeSource('route-return');
    }

    // 6. Fit Bounds
    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;
    const extend = (p: LngLat | null) => { if(p) { bounds.extend(p); hasPoints = true; }};

    extend(waypointsOut.current.pickup);
    extend(waypointsOut.current.dropoff);
    waypointsOut.current.stops.forEach(extend);
    
    if (hasReturnTrip) {
        extend(waypointsRet.current.pickup);
        extend(waypointsRet.current.dropoff);
    }

    if (hasPoints) {
        map.fitBounds(bounds, { padding: 80, animate: true });
    }

  }, [outGeometry, retGeometry, userLocation, hasReturnTrip, waypointsOut, waypointsRet]); 
  // Note: waypointsOut/Ret are refs, so this effect depends on the parent passing new logic or the geometries changing.

  return (
    <div className="fixed inset-0 h-[45vh] z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-primary-black pointer-events-none"></div>
    </div>
  );
};

export default memo(MapContainer);
