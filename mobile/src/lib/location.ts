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
 * Centroid coordinates and presets for all 38 Tamil Nadu districts.
 * Used for manual location selection fallback and district-level distance calculation.
 */
export const TAMIL_NADU_DISTRICTS: DistrictPreset[] = [
  { id: 'dist-ariyalur', name: 'Ariyalur', nameTa: 'அரியலூர்', state: 'Tamil Nadu', latitude: 11.1401, longitude: 79.0786 },
  { id: 'dist-chengalpattu', name: 'Chengalpattu', nameTa: 'செங்கல்பட்டு', state: 'Tamil Nadu', latitude: 12.6841, longitude: 79.9836 },
  { id: 'dist-chennai', name: 'Chennai', nameTa: 'சென்னை', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { id: 'dist-coimbatore', name: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558 },
  { id: 'dist-cuddalore', name: 'Cuddalore', nameTa: 'கடலூர்', state: 'Tamil Nadu', latitude: 11.7753, longitude: 79.5537 },
  { id: 'dist-dharmapuri', name: 'Dharmapuri', nameTa: 'தர்மபுரி', state: 'Tamil Nadu', latitude: 12.1211, longitude: 78.1582 },
  { id: 'dist-dindigul', name: 'Dindigul', nameTa: 'திண்டுக்கல்', state: 'Tamil Nadu', latitude: 10.3673, longitude: 77.9803 },
  { id: 'dist-erode', name: 'Erode', nameTa: 'ஈரோடு', state: 'Tamil Nadu', latitude: 11.3410, longitude: 77.7172 },
  { id: 'dist-kallakurichi', name: 'Kallakurichi', nameTa: 'கள்ளக்குறிச்சி', state: 'Tamil Nadu', latitude: 11.7383, longitude: 78.9639 },
  { id: 'dist-kanchipuram', name: 'Kanchipuram', nameTa: 'காஞ்சிபுரம்', state: 'Tamil Nadu', latitude: 12.8342, longitude: 79.7036 },
  { id: 'dist-kanyakumari', name: 'Kanyakumari', nameTa: 'கன்னியாகுமரி', state: 'Tamil Nadu', latitude: 8.0883, longitude: 77.5385 },
  { id: 'dist-karur', name: 'Karur', nameTa: 'கரூர்', state: 'Tamil Nadu', latitude: 10.9601, longitude: 78.0766 },
  { id: 'dist-krishnagiri', name: 'Krishnagiri', nameTa: 'கிருஷ்ணகிரி', state: 'Tamil Nadu', latitude: 12.5186, longitude: 78.2138 },
  { id: 'dist-madurai', name: 'Madurai', nameTa: 'மதுரை', state: 'Tamil Nadu', latitude: 9.9252, longitude: 78.1198 },
  { id: 'dist-mayiladuthurai', name: 'Mayiladuthurai', nameTa: 'மயிலாடுதுறை', state: 'Tamil Nadu', latitude: 11.1075, longitude: 79.6523 },
  { id: 'dist-nagapattinam', name: 'Nagapattinam', nameTa: 'நாகப்பட்டினம்', state: 'Tamil Nadu', latitude: 10.7656, longitude: 79.8424 },
  { id: 'dist-namakkal', name: 'Namakkal', nameTa: 'நாமக்கல்', state: 'Tamil Nadu', latitude: 11.2189, longitude: 78.1674 },
  { id: 'dist-nilgiris', name: 'Nilgiris', nameTa: 'நீலகிரி', state: 'Tamil Nadu', latitude: 11.4102, longitude: 76.6950 },
  { id: 'dist-perambalur', name: 'Perambalur', nameTa: 'பெரம்பலூர்', state: 'Tamil Nadu', latitude: 11.2342, longitude: 78.8821 },
  { id: 'dist-pudukkottai', name: 'Pudukkottai', nameTa: 'புதுக்கோட்டை', state: 'Tamil Nadu', latitude: 10.3797, longitude: 78.8208 },
  { id: 'dist-ramanathapuram', name: 'Ramanathapuram', nameTa: 'ராமநாதபுரம்', state: 'Tamil Nadu', latitude: 9.3639, longitude: 78.8395 },
  { id: 'dist-ranipet', name: 'Ranipet', nameTa: 'ராணிப்பேட்டை', state: 'Tamil Nadu', latitude: 12.9280, longitude: 79.3330 },
  { id: 'dist-salem', name: 'Salem', nameTa: 'சேலம்', state: 'Tamil Nadu', latitude: 11.6643, longitude: 78.1460 },
  { id: 'dist-sivaganga', name: 'Sivaganga', nameTa: 'சிவகங்கை', state: 'Tamil Nadu', latitude: 9.8433, longitude: 78.4809 },
  { id: 'dist-tenkasi', name: 'Tenkasi', nameTa: 'தென்காசி', state: 'Tamil Nadu', latitude: 8.9594, longitude: 77.3152 },
  { id: 'dist-thanjavur', name: 'Thanjavur', nameTa: 'தஞ்சாவூர்', state: 'Tamil Nadu', latitude: 10.7870, longitude: 79.1378 },
  { id: 'dist-theni', name: 'Theni', nameTa: 'தேனி', state: 'Tamil Nadu', latitude: 10.0104, longitude: 77.4768 },
  { id: 'dist-thoothukudi', name: 'Thoothukudi', nameTa: 'தூத்துக்குடி', state: 'Tamil Nadu', latitude: 8.7642, longitude: 78.1348 },
  { id: 'dist-trichy', name: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', state: 'Tamil Nadu', latitude: 10.7905, longitude: 78.7047 },
  { id: 'dist-tirunelveli', name: 'Tirunelveli', nameTa: 'திருநெல்வேலி', state: 'Tamil Nadu', latitude: 8.7139, longitude: 77.7567 },
  { id: 'dist-tirupathur', name: 'Tirupathur', nameTa: 'திருப்பத்தூர்', state: 'Tamil Nadu', latitude: 12.4925, longitude: 78.5678 },
  { id: 'dist-tiruppur', name: 'Tiruppur', nameTa: 'திருப்பூர்', state: 'Tamil Nadu', latitude: 11.1085, longitude: 77.3411 },
  { id: 'dist-tiruvallur', name: 'Tiruvallur', nameTa: 'திருவள்ளூர்', state: 'Tamil Nadu', latitude: 13.1432, longitude: 79.9083 },
  { id: 'dist-tiruvannamalai', name: 'Tiruvannamalai', nameTa: 'திருவண்ணாமலை', state: 'Tamil Nadu', latitude: 12.2253, longitude: 79.0747 },
  { id: 'dist-tiruvarur', name: 'Tiruvarur', nameTa: 'திருவாரூர்', state: 'Tamil Nadu', latitude: 10.7661, longitude: 79.6344 },
  { id: 'dist-vellore', name: 'Vellore', nameTa: 'வேலூர்', state: 'Tamil Nadu', latitude: 12.9165, longitude: 79.1325 },
  { id: 'dist-villupuram', name: 'Villupuram', nameTa: 'விழுப்புரம்', state: 'Tamil Nadu', latitude: 11.9401, longitude: 79.4861 },
  { id: 'dist-virudhunagar', name: 'Virudhunagar', nameTa: 'விருதுநகர்', state: 'Tamil Nadu', latitude: 9.5680, longitude: 77.9624 }
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
 * Estimates machinery transit ETA based on realistic average tractor/harvester rural transit speed (~25 km/h).
 * Returns null if distance is unavailable.
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
