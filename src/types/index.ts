export type LngLat = [number, number];

export interface PresetItem {
  name: string;
  center: LngLat;
}

export interface SuggestionItem {
  text: string;
  center: LngLat;
  isHeader?: boolean;
  name?: string;
}

export interface RouteWaypoints {
  pickup: LngLat | null;
  dropoff: LngLat | null;
  stops: (LngLat | null)[];
}

export interface Vehicle {
  name: string;
  image: string;
  perMile: number;
  hourly: number;
  passengers: number;
  luggage: number;
  description: string;
}

export interface BookingState {
  pickup: string;
  dropoff: string;
  stops: string[];
  date: string;
  time: string;
  flightNumber: string;
  meetGreet: boolean;
  pax: number;
  bags: number;
  
  // Return Trip
  hasReturnTrip: boolean;
  returnPickup: string;
  returnDropoff: string;
  returnStops: string[];
  returnDate: string;
  returnTime: string;
  returnFlightNumber: string;
  returnMeetGreet: boolean;
}

export interface PricingState {
  outDistanceMiles: number;
  retDistanceMiles: number;
  totalPrice: number;
  oldPrice: number;
  oldPriceVisible: boolean;
  promoText: string;
  promoClass: string;
  distanceDisplay: string;
  distanceHidden: boolean;
}

// Global window extension for Mapbox/Google
declare global {
  interface Window {
    mapboxgl: any;
    google: any;
  }
}
