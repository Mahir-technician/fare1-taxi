
import { PresetItem, Vehicle } from '../types';

export const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmFyZTFsdGQiLCJhIjoiY21pcnN4MWZlMGhtcDU2c2dyMTlvODJoNSJ9.fyUV4gMDcEBgWZnQfxS7XA';

export const MAX_STOPS = 3;

export const DISCOUNT_MESSAGES = [
  "15% Discount on bills over £130",
  "5% Off on Return Trips",
  "Special Offer: Southampton to Airport Transfers"
];

export const VEHICLES: Vehicle[] = [
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

export const PRESET_DATA: Record<string, PresetItem[]> = {
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
