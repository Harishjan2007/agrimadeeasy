/**
 * AgriME Platform — Location & Geographic Services
 * Haversine distance, realistic agricultural transit ETA, external directions, and manual district presets.
 * STRICT DATA HONESTY: Never fabricates distances or coordinates.
 */

export interface DistrictPreset {
  id: string;
  name: string;
  nameTa: string;
  state: string;
  latitude: number;
  longitude: number;
}

/**
 * Reference districts for manual location selection fallback
 */
export const TAMIL_NADU_DISTRICTS: DistrictPreset[] = [
  {
    id: 'dist-vellore',
    name: 'Vellore',
    nameTa: 'வேலூர்',
    state: 'Tamil Nadu',
    latitude: 12.9165,
    longitude: 79.1325
  },
  {
    id: 'dist-katpadi',
    name: 'Katpadi (Vellore)',
    nameTa: 'காட்பாடி (வேலூர்)',
    state: 'Tamil Nadu',
    latitude: 12.9698,
    longitude: 79.1384
  },
  {
    id: 'dist-thiruvannamalai',
    name: 'Thiruvannamalai',
    nameTa: 'திருவண்ணாமலை',
    state: 'Tamil Nadu',
    latitude: 12.2253,
    longitude: 79.0747
  },
  {
    id: 'dist-kanchipuram',
    name: 'Kanchipuram',
    nameTa: 'காஞ்சிபுரம்',
    state: 'Tamil Nadu',
    latitude: 12.8342,
    longitude: 79.7036
  },
  {
    id: 'dist-ranipet',
    name: 'Ranipet',
    nameTa: 'ராணிப்பேட்டை',
    state: 'Tamil Nadu',
    latitude: 12.9280,
    longitude: 79.3330
  },
  {
    id: 'dist-salem',
    name: 'Salem',
    nameTa: 'சேலம்',
    state: 'Tamil Nadu',
    latitude: 11.6643,
    longitude: 78.1460
  },
  {
    id: 'dist-coimbatore',
    name: 'Coimbatore',
    nameTa: 'கோயம்புத்தூர்',
    state: 'Tamil Nadu',
    latitude: 11.0168,
    longitude: 76.9558
  },
  {
    id: 'dist-thanjavur',
    name: 'Thanjavur',
    nameTa: 'தஞ்சாவூர்',
    state: 'Tamil Nadu',
    latitude: 10.7870,
    longitude: 79.1378
  },
  {
    id: 'dist-madurai',
    name: 'Madurai',
    nameTa: 'மதுரை',
    state: 'Tamil Nadu',
    latitude: 9.9252,
    longitude: 78.1198
  },
  {
    id: 'dist-trichy',
    name: 'Tiruchirappalli',
    nameTa: 'திருச்சிராப்பள்ளி',
    state: 'Tamil Nadu',
    latitude: 10.7905,
    longitude: 78.7047
  },
  {
    id: 'dist-erode',
    name: 'Erode',
    nameTa: 'ஈரோடு',
    state: 'Tamil Nadu',
    latitude: 11.3410,
    longitude: 77.7172
  },
  {
    id: 'dist-dindigul',
    name: 'Dindigul',
    nameTa: 'திண்டுக்கல்',
    state: 'Tamil Nadu',
    latitude: 10.3673,
    longitude: 77.9803
  },
  {
    id: 'dist-namakkal',
    name: 'Namakkal',
    nameTa: 'நாமக்கல்',
    state: 'Tamil Nadu',
    latitude: 11.2189,
    longitude: 78.1674
  },
  {
    id: 'dist-cuddalore',
    name: 'Cuddalore',
    nameTa: 'கடலூர்',
    state: 'Tamil Nadu',
    latitude: 11.7753,
    longitude: 79.5537
  },
  {
    id: 'dist-dharmapuri',
    name: 'Dharmapuri',
    nameTa: 'தர்மபுரி',
    state: 'Tamil Nadu',
    latitude: 12.1211,
    longitude: 78.1582
  },
  {
    id: 'dist-tirunelveli',
    name: 'Tirunelveli',
    nameTa: 'திருநெல்வேலி',
    state: 'Tamil Nadu',
    latitude: 8.7139,
    longitude: 77.7567
  },
  {
    id: 'dist-tiruppur',
    name: 'Tiruppur',
    nameTa: 'திருப்பூர்',
    state: 'Tamil Nadu',
    latitude: 11.1085,
    longitude: 77.3411
  },
  {
    id: 'dist-villupuram',
    name: 'Villupuram',
    nameTa: 'விழுப்புரம்',
    state: 'Tamil Nadu',
    latitude: 11.9401,
    longitude: 79.4861
  },
  {
    id: 'dist-chennai',
    name: 'Chennai',
    nameTa: 'சென்னை',
    state: 'Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707
  },
  {
    id: 'dist-guntur',
    name: 'Guntur',
    nameTa: 'குண்டூர்',
    state: 'Andhra Pradesh',
    latitude: 16.3067,
    longitude: 80.4365
  },
  {
    id: 'dist-kurnool',
    name: 'Kurnool',
    nameTa: 'கர்நூல்',
    state: 'Andhra Pradesh',
    latitude: 15.8281,
    longitude: 78.0373
  }
];

/**
 * Calculates geodesic distance between two coordinate pairs using the Haversine formula.
 * Returns distance in kilometers (rounded to 1 decimal place).
 * Returns null if any coordinate is missing or invalid.
 */
export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  // Validate range
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return null;
  }
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) return null;
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) return null;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Formats distance with honest localization
 */
export function formatDistance(
  distanceKm: number | null,
  isTa: boolean = false
): string {
  if (distanceKm === null || distanceKm === undefined) {
    return isTa ? 'தூரம் கிடைக்கவில்லை' : 'Distance unavailable';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return isTa ? `${meters} மீ தொலைவில்` : `${meters} m away`;
  }

  return isTa ? `${distanceKm} கி.மீ தொலைவில்` : `${distanceKm} km away`;
}

/**
 * Estimates machinery transit ETA based on realistic average tractor/harvester rural transit speed.
 * Typical rural equipment transit speed is ~25 km/h.
 * Returns null if distance is unavailable.
 * NEVER fabricates an ETA when coordinates are missing.
 */
export function calculateMachineryETA(
  distanceKm: number | null,
  speedKmh: number = 25,
  isTa: boolean = false
): { minutes: number; formatted: string } | null {
  if (distanceKm === null || distanceKm === undefined || distanceKm <= 0) {
    return null;
  }

  const travelHours = distanceKm / speedKmh;
  const minutes = Math.max(1, Math.round(travelHours * 60));

  if (minutes < 60) {
    return {
      minutes,
      formatted: isTa ? `~${minutes} நிமிடம்` : `~${minutes} min`
    };
  }

  const hrs = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  const formatted = isTa 
    ? `~${hrs} மணி ${remMin > 0 ? `${remMin} நிமிடம்` : ''}` 
    : `~${hrs} hr ${remMin > 0 ? `${remMin} min` : ''}`;

  return { minutes, formatted };
}

/**
 * Generates universal external navigation URL (Google Maps / Apple Maps).
 * Prefers exact coordinates; falls back to formatted address string.
 */
export function getDirectionsUrl(
  latitude?: number | null,
  longitude?: number | null,
  address?: string
): string {
  if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  if (address && address.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * Generates universal Google Maps Search URL.
 * Prefers exact latitude and longitude; falls back to formatted address or place name.
 * Uses Google's standard Maps search format: https://www.google.com/maps/search/?api=1&query=...
 * Returns null if location information is missing or invalid.
 */
export function getGoogleMapsUrl(
  latitude?: number | null,
  longitude?: number | null,
  addressOrName?: string | null
): string | null {
  if (
    latitude !== undefined &&
    latitude !== null &&
    !isNaN(latitude) &&
    longitude !== undefined &&
    longitude !== null &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  if (addressOrName && addressOrName.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrName.trim())}`;
  }

  return null;
}

/**
 * Helper to calculate time elapsed since a timestamp in a readable format.
 */
export function formatTimeElapsed(timestamp?: string | null, isTa: boolean = false): string {
  if (!timestamp) return isTa ? 'நேரம் தெரியவில்லை' : 'Time unknown';

  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (diffMs < 0) return isTa ? 'இப்போது' : 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 30) return isTa ? 'சமீபத்தில்' : 'Just now';
  if (seconds < 60) return isTa ? `${seconds} வினாடிகளுக்கு முன்` : `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return isTa ? `${minutes} நிமிடங்களுக்கு முன்` : `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isTa ? `${hours} மணிநேரத்திற்கு முன்` : `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return isTa ? `${days} நாட்களுக்கு முன்` : `${days}d ago`;
}
