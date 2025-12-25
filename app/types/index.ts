
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

export interface Vehicle {
  name: string;
  image: string;
  perMile: number;
  hourly: number;
  passengers: number;
  luggage: number;
  description: string;
}

export interface RouteWaypoints {
  pickup: LngLat | null;
  dropoff: LngLat | null;
  stops: (LngLat | null)[];
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

export interface RouteData {
  distanceMiles: number;
  durationSeconds: number;
  durationText: string;
  geometry: any; // GeoJSON
}
