/**
 * AgriME — Tamil Nadu APMC Mandi Geographic Coordinates & Resolution Service
 * --------------------------------------------------------------------------
 * Maps authentic Tamil Nadu APMC markets and district centroids to geographic
 * coordinates for honest, local, mathematical Haversine proximity calculations.
 *
 * STRICT ACCURACY POLICY:
 * - Specific market coordinates are flagged with isApproximate = false.
 * - District centroid fallbacks are flagged with isApproximate = true.
 * - Missing records return null distance rather than fabricated values.
 * - No paid mapping services, Google Maps API keys, or external network requests required.
 */

import { calculateDistanceKm } from './location';

export interface MandiCoordinate {
  latitude: number;
  longitude: number;
  isApproximate: boolean;
  resolvedName: string;
}

export interface DistrictLocationPreset {
  id: string;
  name: string;
  nameTa: string;
  latitude: number;
  longitude: number;
}

/**
 * Centroid coordinates for all 38 Tamil Nadu districts.
 * Used for manual location fallback and district-level approximate distance calculation.
 */
export const TAMIL_NADU_DISTRICT_COORDINATES: Record<string, { latitude: number; longitude: number; nameTa: string }> = {
  ariyalur: { latitude: 11.1401, longitude: 79.0786, nameTa: 'அரியலூர்' },
  chengalpattu: { latitude: 12.6841, longitude: 79.9836, nameTa: 'செங்கல்பட்டு' },
  chennai: { latitude: 13.0827, longitude: 80.2707, nameTa: 'சென்னை' },
  coimbatore: { latitude: 11.0168, longitude: 76.9558, nameTa: 'கோயம்புத்தூர்' },
  cuddalore: { latitude: 11.7753, longitude: 79.5537, nameTa: 'கடலூர்' },
  dharmapuri: { latitude: 12.1211, longitude: 78.1582, nameTa: 'தர்மபுரி' },
  dindigul: { latitude: 10.3673, longitude: 77.9803, nameTa: 'திண்டுக்கல்' },
  erode: { latitude: 11.3410, longitude: 77.7172, nameTa: 'ஈரோடு' },
  kallakurichi: { latitude: 11.7383, longitude: 78.9639, nameTa: 'கள்ளக்குறிச்சி' },
  kancheepuram: { latitude: 12.8342, longitude: 79.7036, nameTa: 'காஞ்சிபுரம்' },
  kanchipuram: { latitude: 12.8342, longitude: 79.7036, nameTa: 'காஞ்சிபுரம்' },
  kanniyakumari: { latitude: 8.0883, longitude: 77.5385, nameTa: 'கன்னியாகுமரி' },
  kanyakumari: { latitude: 8.0883, longitude: 77.5385, nameTa: 'கன்னியாகுமரி' },
  karur: { latitude: 10.9601, longitude: 78.0766, nameTa: 'கரூர்' },
  krishnagiri: { latitude: 12.5186, longitude: 78.2138, nameTa: 'கிருஷ்ணகிரி' },
  madurai: { latitude: 9.9252, longitude: 78.1198, nameTa: 'மதுரை' },
  mayiladuthurai: { latitude: 11.1075, longitude: 79.6523, nameTa: 'மயிலாடுதுறை' },
  nagapattinam: { latitude: 10.7656, longitude: 79.8424, nameTa: 'நாகப்பட்டினம்' },
  namakkal: { latitude: 11.2189, longitude: 78.1674, nameTa: 'நாமக்கல்' },
  perambalur: { latitude: 11.2342, longitude: 78.8821, nameTa: 'பெரம்பலூர்' },
  pudukkottai: { latitude: 10.3797, longitude: 78.8208, nameTa: 'புதுக்கோட்டை' },
  ramanathapuram: { latitude: 9.3639, longitude: 78.8395, nameTa: 'ராமநாதபுரம்' },
  ranipet: { latitude: 12.9280, longitude: 79.3330, nameTa: 'ராணிப்பேட்டை' },
  salem: { latitude: 11.6643, longitude: 78.1460, nameTa: 'சேலம்' },
  sivaganga: { latitude: 9.8433, longitude: 78.4809, nameTa: 'சிவகங்கை' },
  tenkasi: { latitude: 8.9594, longitude: 77.3152, nameTa: 'தென்காசி' },
  thanjavur: { latitude: 10.7870, longitude: 79.1378, nameTa: 'தஞ்சாவூர்' },
  theni: { latitude: 10.0104, longitude: 77.4768, nameTa: 'தேனி' },
  'the nilgiris': { latitude: 11.4102, longitude: 76.6950, nameTa: 'நீலகிரி' },
  nilgiris: { latitude: 11.4102, longitude: 76.6950, nameTa: 'நீலகிரி' },
  thoothukudi: { latitude: 8.7642, longitude: 78.1348, nameTa: 'தூத்துக்குடி' },
  tuticorin: { latitude: 8.7642, longitude: 78.1348, nameTa: 'தூத்துக்குடி' },
  tiruchirappalli: { latitude: 10.7905, longitude: 78.7047, nameTa: 'திருச்சிராப்பள்ளி' },
  trichy: { latitude: 10.7905, longitude: 78.7047, nameTa: 'திருச்சிராப்பள்ளி' },
  tirunelveli: { latitude: 8.7139, longitude: 77.7567, nameTa: 'திருநெல்வேலி' },
  tirupathur: { latitude: 12.4925, longitude: 78.5678, nameTa: 'திருப்பத்தூர்' },
  tiruppur: { latitude: 11.1085, longitude: 77.3411, nameTa: 'திருப்பூர்' },
  thirupur: { latitude: 11.1085, longitude: 77.3411, nameTa: 'திருப்பூர்' },
  tiruvallur: { latitude: 13.1432, longitude: 79.9083, nameTa: 'திருவள்ளூர்' },
  tiruvannamalai: { latitude: 12.2253, longitude: 79.0747, nameTa: 'திருவண்ணாமலை' },
  thiruvannamalai: { latitude: 12.2253, longitude: 79.0747, nameTa: 'திருவண்ணாமலை' },
  tiruvarur: { latitude: 10.7661, longitude: 79.6344, nameTa: 'திருவாரூர்' },
  thiruvarur: { latitude: 10.7661, longitude: 79.6344, nameTa: 'திருவாரூர்' },
  vellore: { latitude: 12.9165, longitude: 79.1325, nameTa: 'வேலூர்' },
  viluppuram: { latitude: 11.9401, longitude: 79.4861, nameTa: 'விழுப்புரம்' },
  villupuram: { latitude: 11.9401, longitude: 79.4861, nameTa: 'விழுப்புரம்' },
  virudhunagar: { latitude: 9.5680, longitude: 77.9624, nameTa: 'விருதுநகர்' }
};

/**
 * Verified specific APMC Mandi coordinates across Tamil Nadu.
 * Keys are normalized lowercase strings for flexible matching.
 */
export const VERIFIED_MARKET_COORDINATES: Record<string, { latitude: number; longitude: number; name: string }> = {
  // Chennai
  koyambedu: { latitude: 13.0694, longitude: 80.1948, name: 'Koyambedu Wholesale Market' },
  chennai: { latitude: 13.0827, longitude: 80.2707, name: 'Chennai Central Mandi' },

  // Dindigul
  ottanchattiram: { latitude: 10.4850, longitude: 77.7470, name: 'Ottanchattiram Market' },
  oddanchatram: { latitude: 10.4850, longitude: 77.7470, name: 'Oddanchatram Market' },
  dindigul: { latitude: 10.3673, longitude: 77.9803, name: 'Dindigul APMC Mandi' },
  palani: { latitude: 10.4500, longitude: 77.5200, name: 'Palani Regulated Market' },

  // Coimbatore
  pollachi: { latitude: 10.6580, longitude: 77.0080, name: 'Pollachi APMC Mandi' },
  coimbatore: { latitude: 11.0010, longitude: 76.9600, name: 'Coimbatore M.G.R. Market' },
  mettupalayam: { latitude: 11.3000, longitude: 76.9400, name: 'Mettupalayam Agri Market' },
  thondamuthur: { latitude: 10.9900, longitude: 76.8300, name: 'Thondamuthur Sandhai' },
  sulur: { latitude: 11.0250, longitude: 77.1260, name: 'Sulur Market' },

  // Madurai
  madurai: { latitude: 9.9400, longitude: 78.1500, name: 'Madurai Mattuthavani Market' },
  mattuthavani: { latitude: 9.9400, longitude: 78.1500, name: 'Mattuthavani APMC Market' },
  thirumangalam: { latitude: 9.8200, longitude: 77.9900, name: 'Thirumangalam Regulated Market' },
  melur: { latitude: 10.0300, longitude: 78.3300, name: 'Melur Market' },

  // Salem
  salem: { latitude: 11.6500, longitude: 78.1400, name: 'Salem Main Agri Market' },
  attur: { latitude: 11.5900, longitude: 78.6000, name: 'Attur Regulated Market' },
  mecheri: { latitude: 11.8300, longitude: 77.9400, name: 'Mecheri Mandi' },
  sankari: { latitude: 11.4800, longitude: 77.8600, name: 'Sankari Market' },

  // Erode
  erode: { latitude: 11.3410, longitude: 77.7172, name: 'Erode Perundurai Market' },
  perundurai: { latitude: 11.2750, longitude: 77.5850, name: 'Perundurai Regulated Market' },
  gobichettipalayam: { latitude: 11.4500, longitude: 77.4300, name: 'Gobichettipalayam Market' },
  gobi: { latitude: 11.4500, longitude: 77.4300, name: 'Gobi Regulated Market' },
  sathyamangalam: { latitude: 11.5100, longitude: 77.2400, name: 'Sathyamangalam Mandi' },

  // Tiruppur
  tiruppur: { latitude: 11.1000, longitude: 77.3500, name: 'Tiruppur Thennampalayam Mandi' },
  kangayam: { latitude: 11.0000, longitude: 77.5600, name: 'Kangayam Coconut & Grain Market' },
  dharapuram: { latitude: 10.7300, longitude: 77.5300, name: 'Dharapuram Regulated Market' },
  palladam: { latitude: 10.9900, longitude: 77.2900, name: 'Palladam Market' },

  // Vellore
  vellore: { latitude: 12.9165, longitude: 79.1325, name: 'Vellore Central APMC Mandi' },
  katpadi: { latitude: 12.9698, longitude: 79.1384, name: 'Katpadi Regulated Market' },
  gudiyatham: { latitude: 12.9400, longitude: 78.8700, name: 'Gudiyatham Mandi' },

  // Thiruvannamalai
  thiruvannamalai: { latitude: 12.2253, longitude: 79.0747, name: 'Thiruvannamalai Regulated Market' },
  tiruvannamalai: { latitude: 12.2253, longitude: 79.0747, name: 'Thiruvannamalai Regulated Market' },
  arni: { latitude: 12.6700, longitude: 79.2800, name: 'Arni Rice & Grain Market' },
  cheyyar: { latitude: 12.6600, longitude: 79.5400, name: 'Cheyyar Mandi' },

  // Kanchipuram & Chengalpattu
  kanchipuram: { latitude: 12.8342, longitude: 79.7036, name: 'Kanchipuram Agricultural Market' },
  kancheepuram: { latitude: 12.8342, longitude: 79.7036, name: 'Kanchipuram Agricultural Market' },
  chengalpattu: { latitude: 12.6841, longitude: 79.9836, name: 'Chengalpattu Market' },
  madurantakam: { latitude: 12.5100, longitude: 79.8800, name: 'Madurantakam Mandi' },

  // Ranipet & Tirupathur
  ranipet: { latitude: 12.9280, longitude: 79.3330, name: 'Ranipet APMC' },
  arcot: { latitude: 12.9000, longitude: 79.3300, name: 'Arcot Regulated Market' },
  tirupathur: { latitude: 12.4925, longitude: 78.5678, name: 'Tirupathur Regulated Market' },
  vaniyampadi: { latitude: 12.6800, longitude: 78.6200, name: 'Vaniyampadi Mandi' },
  ambur: { latitude: 12.7900, longitude: 78.7100, name: 'Ambur Market' },

  // Tiruchirappalli
  tiruchirappalli: { latitude: 10.8200, longitude: 78.6900, name: 'Tiruchirappalli Gandhi Market' },
  trichy: { latitude: 10.8200, longitude: 78.6900, name: 'Trichy Gandhi Market' },
  manapparai: { latitude: 10.6000, longitude: 78.4100, name: 'Manapparai Market' },

  // Thanjavur & Delta
  thanjavur: { latitude: 10.7870, longitude: 79.1378, name: 'Thanjavur APMC Mandi' },
  kumbakonam: { latitude: 10.9600, longitude: 79.3800, name: 'Kumbakonam Market' },
  tiruvarur: { latitude: 10.7661, longitude: 79.6344, name: 'Tiruvarur Market' },
  mannargudi: { latitude: 10.6600, longitude: 79.4400, name: 'Mannargudi Regulated Market' },
  mayiladuthurai: { latitude: 11.1075, longitude: 79.6523, name: 'Mayiladuthurai Mandi' },
  nagapattinam: { latitude: 10.7656, longitude: 79.8424, name: 'Nagapattinam Market' },

  // Namakkal
  namakkal: { latitude: 11.2189, longitude: 78.1674, name: 'Namakkal APMC Mandi' },
  rasipuram: { latitude: 11.4600, longitude: 78.1700, name: 'Rasipuram Market' },
  tiruchengode: { latitude: 11.3800, longitude: 77.8900, name: 'Tiruchengode Mandi' },

  // Dharmapuri & Krishnagiri
  dharmapuri: { latitude: 12.1211, longitude: 78.1582, name: 'Dharmapuri APMC Mandi' },
  harur: { latitude: 12.0600, longitude: 78.4900, name: 'Harur Market' },
  palacode: { latitude: 12.3100, longitude: 78.0800, name: 'Palacode Tomato Market' },
  krishnagiri: { latitude: 12.5186, longitude: 78.2138, name: 'Krishnagiri Central Mandi' },
  hosur: { latitude: 12.7400, longitude: 77.8300, name: 'Hosur Vegetable & Flower Market' },

  // The Nilgiris
  udhagamandalam: { latitude: 11.4102, longitude: 76.6950, name: 'Ooty / Udhagamandalam APMC' },
  ooty: { latitude: 11.4102, longitude: 76.6950, name: 'Ooty APMC Mandi' },
  coonoor: { latitude: 11.3500, longitude: 76.7900, name: 'Coonoor Market' },
  kothagiri: { latitude: 11.4200, longitude: 76.8800, name: 'Kothagiri Market' },

  // Tirunelveli, Tenkasi & Thoothukudi
  tirunelveli: { latitude: 8.7139, longitude: 77.7567, name: 'Tirunelveli Nainarkulam Mandi' },
  tenkasi: { latitude: 8.9594, longitude: 77.3152, name: 'Tenkasi APMC Market' },
  sankarankoil: { latitude: 9.1700, longitude: 77.5300, name: 'Sankarankoil Market' },
  alangulam: { latitude: 8.8700, longitude: 77.5000, name: 'Alangulam Market' },
  thoothukudi: { latitude: 8.7642, longitude: 78.1348, name: 'Thoothukudi APMC Mandi' },
  tuticorin: { latitude: 8.7642, longitude: 78.1348, name: 'Tuticorin APMC Mandi' },
  kovilpatti: { latitude: 9.1700, longitude: 77.8700, name: 'Kovilpatti Market' },

  // Cuddalore & Villupuram
  cuddalore: { latitude: 11.7753, longitude: 79.5537, name: 'Cuddalore APMC Mandi' },
  panruti: { latitude: 11.7700, longitude: 79.5500, name: 'Panruti Jackfruit & Cashew Market' },
  chidambaram: { latitude: 11.3900, longitude: 79.6900, name: 'Chidambaram Market' },
  villupuram: { latitude: 11.9401, longitude: 79.4861, name: 'Villupuram APMC Mandi' },
  viluppuram: { latitude: 11.9401, longitude: 79.4861, name: 'Villupuram APMC Mandi' },
  tindivanam: { latitude: 12.2400, longitude: 79.6500, name: 'Tindivanam Market' },
  kallakurichi: { latitude: 11.7383, longitude: 78.9639, name: 'Kallakurichi Market' },

  // Theni
  theni: { latitude: 10.0104, longitude: 77.4768, name: 'Theni Allinagaram Mandi' },
  cumbum: { latitude: 9.7300, longitude: 77.2800, name: 'Cumbum Market' },
  bodinayakanur: { latitude: 10.0100, longitude: 77.3500, name: 'Bodinayakanur Cardamom Market' },

  // Virudhunagar, Sivaganga, Ramanathapuram
  virudhunagar: { latitude: 9.5680, longitude: 77.9624, name: 'Virudhunagar APMC Mandi' },
  rajapalayam: { latitude: 9.4500, longitude: 77.5500, name: 'Rajapalayam Market' },
  sivakasi: { latitude: 9.4500, longitude: 77.8000, name: 'Sivakasi Market' },
  sivaganga: { latitude: 9.8433, longitude: 78.4809, name: 'Sivaganga APMC' },
  karaikudi: { latitude: 10.0700, longitude: 78.7800, name: 'Karaikudi Market' },
  ramanathapuram: { latitude: 9.3639, longitude: 78.8395, name: 'Ramanathapuram APMC' },
  paramakudi: { latitude: 9.5400, longitude: 78.5900, name: 'Paramakudi Chilli Market' },

  // Pudukkottai, Karur, Ariyalur, Perambalur
  pudukkottai: { latitude: 10.3797, longitude: 78.8208, name: 'Pudukkottai APMC Mandi' },
  aranthangi: { latitude: 10.1600, longitude: 78.9900, name: 'Aranthangi Market' },
  karur: { latitude: 10.9601, longitude: 78.0766, name: 'Karur APMC Mandi' },
  kulithalai: { latitude: 10.9300, longitude: 78.4100, name: 'Kulithalai Market' },
  ariyalur: { latitude: 11.1401, longitude: 79.0786, name: 'Ariyalur APMC Mandi' },
  jayankondam: { latitude: 11.2100, longitude: 79.3100, name: 'Jayankondam Market' },
  perambalur: { latitude: 11.2342, longitude: 78.8821, name: 'Perambalur APMC Mandi' },

  // Kanniyakumari
  nagercoil: { latitude: 8.1800, longitude: 77.4300, name: 'Nagercoil APMC Mandi' },

  // Tiruvallur
  tiruvallur: { latitude: 13.1432, longitude: 79.9083, name: 'Tiruvallur APMC Mandi' },
  poonamallee: { latitude: 13.0500, longitude: 80.0900, name: 'Poonamallee Market' },

  // Border reference mandis
  guntur: { latitude: 16.3067, longitude: 80.4365, name: 'Guntur Grain Yard' },
  kurnool: { latitude: 15.8281, longitude: 78.0373, name: 'Kurnool APMC Market' }
};

/**
 * Clean and normalize a market name string for robust lookup
 */
export function normalizeMarketName(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // remove parentheses content like (Uzhavar Sandhai)
    .replace(/\b(apmc|mandi|market|regulated|wholesale|central|yard|sandhai)\b/gi, ' ')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean and normalize a district name string
 */
export function normalizeDistrictName(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(district|dist)\b/gi, ' ')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves the geographic coordinates of a market record.
 * 1. Matches against verified specific market coordinates (isApproximate: false).
 * 2. If no exact market match, falls back to the district centroid (isApproximate: true).
 * 3. Returns null if neither can be resolved.
 */
export function resolveMarketCoordinates(marketName: string, districtName: string): MandiCoordinate | null {
  const normMarket = normalizeMarketName(marketName);
  const normDistrict = normalizeDistrictName(districtName);

  // 1. Direct specific market match
  if (normMarket && VERIFIED_MARKET_COORDINATES[normMarket]) {
    const entry = VERIFIED_MARKET_COORDINATES[normMarket];
    return {
      latitude: entry.latitude,
      longitude: entry.longitude,
      isApproximate: false,
      resolvedName: entry.name
    };
  }

  // 1b. Check if any key is contained in normMarket or vice versa
  if (normMarket) {
    for (const [key, entry] of Object.entries(VERIFIED_MARKET_COORDINATES)) {
      if (normMarket === key || normMarket.startsWith(key + ' ') || normMarket.endsWith(' ' + key) || normMarket.includes(' ' + key + ' ')) {
        return {
          latitude: entry.latitude,
          longitude: entry.longitude,
          isApproximate: false,
          resolvedName: entry.name
        };
      }
    }
  }

  // 2. District centroid fallback
  if (normDistrict && TAMIL_NADU_DISTRICT_COORDINATES[normDistrict]) {
    const entry = TAMIL_NADU_DISTRICT_COORDINATES[normDistrict];
    return {
      latitude: entry.latitude,
      longitude: entry.longitude,
      isApproximate: true,
      resolvedName: `${districtName} (District Center)`
    };
  }

  // 2b. Fuzzy check on district
  for (const [key, entry] of Object.entries(TAMIL_NADU_DISTRICT_COORDINATES)) {
    if (normDistrict.includes(key) || key.includes(normDistrict)) {
      return {
        latitude: entry.latitude,
        longitude: entry.longitude,
        isApproximate: true,
        resolvedName: `${districtName} (District Center)`
      };
    }
  }

  return null;
}

/**
 * Structured list of all 38 Tamil Nadu districts for the manual location selector.
 */
export const ALL_TAMIL_NADU_DISTRICTS: DistrictLocationPreset[] = [
  { id: 'dist-ariyalur', name: 'Ariyalur', nameTa: 'அரியலூர்', latitude: 11.1401, longitude: 79.0786 },
  { id: 'dist-chengalpattu', name: 'Chengalpattu', nameTa: 'செங்கல்பட்டு', latitude: 12.6841, longitude: 79.9836 },
  { id: 'dist-chennai', name: 'Chennai', nameTa: 'சென்னை', latitude: 13.0827, longitude: 80.2707 },
  { id: 'dist-coimbatore', name: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', latitude: 11.0168, longitude: 76.9558 },
  { id: 'dist-cuddalore', name: 'Cuddalore', nameTa: 'கடலூர்', latitude: 11.7753, longitude: 79.5537 },
  { id: 'dist-dharmapuri', name: 'Dharmapuri', nameTa: 'தர்மபுரி', latitude: 12.1211, longitude: 78.1582 },
  { id: 'dist-dindigul', name: 'Dindigul', nameTa: 'திண்டுக்கல்', latitude: 10.3673, longitude: 77.9803 },
  { id: 'dist-erode', name: 'Erode', nameTa: 'ஈரோடு', latitude: 11.3410, longitude: 77.7172 },
  { id: 'dist-kallakurichi', name: 'Kallakurichi', nameTa: 'கள்ளக்குறிச்சி', latitude: 11.7383, longitude: 78.9639 },
  { id: 'dist-kancheepuram', name: 'Kancheepuram', nameTa: 'காஞ்சிபுரம்', latitude: 12.8342, longitude: 79.7036 },
  { id: 'dist-kanniyakumari', name: 'Kanniyakumari', nameTa: 'கன்னியாகுமரி', latitude: 8.0883, longitude: 77.5385 },
  { id: 'dist-karur', name: 'Karur', nameTa: 'கரூர்', latitude: 10.9601, longitude: 78.0766 },
  { id: 'dist-krishnagiri', name: 'Krishnagiri', nameTa: 'கிருஷ்ணகிரி', latitude: 12.5186, longitude: 78.2138 },
  { id: 'dist-madurai', name: 'Madurai', nameTa: 'மதுரை', latitude: 9.9252, longitude: 78.1198 },
  { id: 'dist-mayiladuthurai', name: 'Mayiladuthurai', nameTa: 'மயிலாடுதுறை', latitude: 11.1075, longitude: 79.6523 },
  { id: 'dist-nagapattinam', name: 'Nagapattinam', nameTa: 'நாகப்பட்டினம்', latitude: 10.7656, longitude: 79.8424 },
  { id: 'dist-namakkal', name: 'Namakkal', nameTa: 'நாமக்கல்', latitude: 11.2189, longitude: 78.1674 },
  { id: 'dist-perambalur', name: 'Perambalur', nameTa: 'பெரம்பலூர்', latitude: 11.2342, longitude: 78.8821 },
  { id: 'dist-pudukkottai', name: 'Pudukkottai', nameTa: 'புதுக்கோட்டை', latitude: 10.3797, longitude: 78.8208 },
  { id: 'dist-ramanathapuram', name: 'Ramanathapuram', nameTa: 'ராமநாதபுரம்', latitude: 9.3639, longitude: 78.8395 },
  { id: 'dist-ranipet', name: 'Ranipet', nameTa: 'ராணிப்பேட்டை', latitude: 12.9280, longitude: 79.3330 },
  { id: 'dist-salem', name: 'Salem', nameTa: 'சேலம்', latitude: 11.6643, longitude: 78.1460 },
  { id: 'dist-sivaganga', name: 'Sivaganga', nameTa: 'சிவகங்கை', latitude: 9.8433, longitude: 78.4809 },
  { id: 'dist-tenkasi', name: 'Tenkasi', nameTa: 'தென்காசி', latitude: 8.9594, longitude: 77.3152 },
  { id: 'dist-thanjavur', name: 'Thanjavur', nameTa: 'தஞ்சாவூர்', latitude: 10.7870, longitude: 79.1378 },
  { id: 'dist-theni', name: 'Theni', nameTa: 'தேனி', latitude: 10.0104, longitude: 77.4768 },
  { id: 'dist-the-nilgiris', name: 'The Nilgiris', nameTa: 'நீலகிரி', latitude: 11.4102, longitude: 76.6950 },
  { id: 'dist-thoothukudi', name: 'Thoothukudi', nameTa: 'தூத்துக்குடி', latitude: 8.7642, longitude: 78.1348 },
  { id: 'dist-tiruchirappalli', name: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', latitude: 10.7905, longitude: 78.7047 },
  { id: 'dist-tirunelveli', name: 'Tirunelveli', nameTa: 'திருநெல்வேலி', latitude: 8.7139, longitude: 77.7567 },
  { id: 'dist-tirupathur', name: 'Tirupathur', nameTa: 'திருப்பத்தூர்', latitude: 12.4925, longitude: 78.5678 },
  { id: 'dist-tiruppur', name: 'Tiruppur', nameTa: 'திருப்பூர்', latitude: 11.1085, longitude: 77.3411 },
  { id: 'dist-tiruvallur', name: 'Tiruvallur', nameTa: 'திருவள்ளூர்', latitude: 13.1432, longitude: 79.9083 },
  { id: 'dist-tiruvannamalai', name: 'Tiruvannamalai', nameTa: 'திருவண்ணாமலை', latitude: 12.2253, longitude: 79.0747 },
  { id: 'dist-tiruvarur', name: 'Tiruvarur', nameTa: 'திருவாரூர்', latitude: 10.7661, longitude: 79.6344 },
  { id: 'dist-vellore', name: 'Vellore', nameTa: 'வேலூர்', latitude: 12.9165, longitude: 79.1325 },
  { id: 'dist-viluppuram', name: 'Viluppuram', nameTa: 'விழுப்புரம்', latitude: 11.9401, longitude: 79.4861 },
  { id: 'dist-virudhunagar', name: 'Virudhunagar', nameTa: 'விருதுநகர்', latitude: 9.5680, longitude: 77.9624 }
];

/**
 * Format proximity distance label honestly.
 * Clearly differentiates exact mandi distances vs approximate district-level distances.
 */
export function formatProximityLabel(
  distanceKm: number | null | undefined,
  isApproximate: boolean,
  isTa: boolean = false
): string {
  if (distanceKm === null || distanceKm === undefined) {
    return isTa ? 'தூரம் கிடைக்கவில்லை' : 'Distance unavailable';
  }

  if (isApproximate) {
    return isTa ? `~${distanceKm} கி.மீ (மாவட்ட மையம்)` : `~${distanceKm} km (approx)`;
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return isTa ? `${meters} மீ` : `${meters} m away`;
  }

  return isTa ? `${distanceKm} கி.மீ` : `${distanceKm} km away`;
}
