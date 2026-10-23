/**
 * AgriME — Tamil Nadu APMC Mandi Geographic Coordinates & Resolution Service
 * --------------------------------------------------------------------------
 * Maps authentic Tamil Nadu APMC markets and district centroids to geographic
 * coordinates for local, mathematical Haversine proximity calculations.
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
  sivagangai: { latitude: 9.8433, longitude: 78.4809, nameTa: 'சிவகங்கை' },
  tenkasi: { latitude: 8.9594, longitude: 77.3152, nameTa: 'தென்காசி' },
  thanjavur: { latitude: 10.7870, longitude: 79.1378, nameTa: 'தஞ்சாவூர்' },
  theni: { latitude: 10.0104, longitude: 77.4768, nameTa: 'தேனி' },
  'the nilgiris': { latitude: 11.4102, longitude: 76.6950, nameTa: 'நீலகிரி' },
  nilgiris: { latitude: 11.4102, longitude: 76.6950, nameTa: 'நீலகிரி' },
  thoothukudi: { latitude: 8.7642, longitude: 78.1348, nameTa: 'தூத்துக்குடி' },
  tuticorin: { latitude: 8.7642, longitude: 78.1348, nameTa: 'தூத்துக்குடி' },
  tiruchirappalli: { latitude: 10.7905, longitude: 78.7047, nameTa: 'திருச்சிராப்பள்ளி' },
  thiruchirappalli: { latitude: 10.7905, longitude: 78.7047, nameTa: 'திருச்சிராப்பள்ளி' },
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
 */
export const VERIFIED_MARKET_COORDINATES: Record<string, { latitude: number; longitude: number; name: string }> = {
  koyambedu: { latitude: 13.0694, longitude: 80.1948, name: 'Koyambedu Wholesale Market' },
  chennai: { latitude: 13.0827, longitude: 80.2707, name: 'Chennai Central Mandi' },
  ottanchattiram: { latitude: 10.4850, longitude: 77.7470, name: 'Ottanchattiram Market' },
  oddanchatram: { latitude: 10.4850, longitude: 77.7470, name: 'Oddanchatram Market' },
  dindigul: { latitude: 10.3673, longitude: 77.9803, name: 'Dindigul APMC Mandi' },
  palani: { latitude: 10.4500, longitude: 77.5200, name: 'Palani Regulated Market' },
  pollachi: { latitude: 10.6609, longitude: 77.0048, name: 'Pollachi Regulated Market' },
  coimbatore: { latitude: 11.0168, longitude: 76.9558, name: 'Coimbatore Market Yard' },
  sulur: { latitude: 11.0260, longitude: 77.1260, name: 'Sulur Uzhavar Sandhai' },
  mettupalayam: { latitude: 11.3000, longitude: 76.9500, name: 'Mettupalayam Market' },
  erode: { latitude: 11.3410, longitude: 77.7172, name: 'Erode Perundurai Mandi' },
  gobichettipalayam: { latitude: 11.4549, longitude: 77.4377, name: 'Gobichettipalayam Market' },
  perundurai: { latitude: 11.2760, longitude: 77.5830, name: 'Perundurai Spices Yard' },
  salem: { latitude: 11.6643, longitude: 78.1460, name: 'Salem Leigh Bazaar Mandi' },
  attur: { latitude: 11.5975, longitude: 78.6006, name: 'Attur Regulated Market' },
  mecheri: { latitude: 11.8333, longitude: 77.9333, name: 'Mecheri Agri Market' },
  thanjavur: { latitude: 10.7870, longitude: 79.1378, name: 'Thanjavur APMC Mandi' },
  kumbakonam: { latitude: 10.9602, longitude: 79.3845, name: 'Kumbakonam Regulated Market' },
  papanasam: { latitude: 10.9250, longitude: 79.2770, name: 'Papanasam Agri Market' },
  tiruchirappalli: { latitude: 10.7905, longitude: 78.7047, name: 'Gandhi Market Trichy' },
  trichy: { latitude: 10.7905, longitude: 78.7047, name: 'Gandhi Market Trichy' },
  musiri: { latitude: 10.9380, longitude: 78.4480, name: 'Musiri Uzhavar Sandhai' },
  thottiyam: { latitude: 11.0020, longitude: 78.3280, name: 'Thottiyam Banana Yard' },
  manapparai: { latitude: 10.6080, longitude: 78.4140, name: 'Manapparai Cattle & Agri Market' },
  madurai: { latitude: 9.9252, longitude: 78.1198, name: 'Mattuthavani Central Market' },
  vadipatti: { latitude: 10.0833, longitude: 77.9667, name: 'Vadipatti Regulated Market' },
  melur: { latitude: 10.0333, longitude: 78.3333, name: 'Melur Agri Market' },
  usilampatti: { latitude: 9.9667, longitude: 77.7833, name: 'Usilampatti Market' },
  tirunelveli: { latitude: 8.7139, longitude: 77.7567, name: 'Tirunelveli Nainarkulam Mandi' },
  palayamkottai: { latitude: 8.7100, longitude: 77.7400, name: 'Palayamkottai Market' },
  ambasamudram: { latitude: 8.7000, longitude: 77.4667, name: 'Ambasamudram Yard' },
  vellore: { latitude: 12.9165, longitude: 79.1325, name: 'Vellore Central Mandi' },
  katpadi: { latitude: 12.9698, longitude: 79.1384, name: 'Katpadi Regulated Market' },
  gudiyatham: { latitude: 12.9460, longitude: 78.8715, name: 'Gudiyatham Market' },
  thiruvannamalai: { latitude: 12.2253, longitude: 79.0747, name: 'Thiruvannamalai Regulated Market' },
  tiruvannamalai: { latitude: 12.2253, longitude: 79.0747, name: 'Thiruvannamalai Regulated Market' },
  arani: { latitude: 12.6680, longitude: 79.2840, name: 'Arani Paddy Market Yard' },
  polur: { latitude: 12.5020, longitude: 79.1240, name: 'Polur Regulated Market' },
  theni: { latitude: 10.0104, longitude: 77.4768, name: 'Theni Central Mandi' },
  cumbum: { latitude: 9.7340, longitude: 77.2820, name: 'Cumbum Grapes & Cardamom Yard' },
  bodinayakanur: { latitude: 10.0100, longitude: 77.3500, name: 'Bodi Cardamom Auction Market' },
  panruti: { latitude: 11.7700, longitude: 79.5500, name: 'Panruti Jackfruit & Cashew Market' },
  cuddalore: { latitude: 11.7753, longitude: 79.5537, name: 'Cuddalore Regulated Market' },
  vriddhachalam: { latitude: 11.5200, longitude: 79.3300, name: 'Vriddhachalam Cashew Market' },
  tiruppur: { latitude: 11.1085, longitude: 77.3411, name: 'Tiruppur Thennampalayam Market' },
  kangeyam: { latitude: 11.0060, longitude: 77.5620, name: 'Kangeyam Coconut Oil Yard' },
  dharmapuri: { latitude: 12.1211, longitude: 78.1582, name: 'Dharmapuri Mango & Agri Market' },
  harur: { latitude: 12.0600, longitude: 78.4900, name: 'Harur Regulated Market' },
  krishnagiri: { latitude: 12.5186, longitude: 78.2138, name: 'Krishnagiri Mango & Tomato Yard' },
  hosur: { latitude: 12.7409, longitude: 77.8253, name: 'Hosur Flower & Vegetable Yard' },
  villupuram: { latitude: 11.9401, longitude: 79.4861, name: 'Villupuram Regulated Market' },
  tindivanam: { latitude: 12.2333, longitude: 79.6500, name: 'Tindivanam Oilseed Market' },
  kallakurichi: { latitude: 11.7383, longitude: 78.9639, name: 'Kallakurichi Corn & Rice Yard' },
  karur: { latitude: 10.9601, longitude: 78.0766, name: 'Karur Regulated Market' },
  namakkal: { latitude: 11.2189, longitude: 78.1674, name: 'Namakkal Poultry & Maize Yard' },
  pudukkottai: { latitude: 10.3797, longitude: 78.8208, name: 'Pudukkottai Market' },
  aranthangi: { latitude: 10.1600, longitude: 78.9900, name: 'Aranthangi Yard' },
  tiruvarur: { latitude: 10.7661, longitude: 79.6344, name: 'Tiruvarur Paddy Direct Hub' },
  mannargudi: { latitude: 10.6667, longitude: 79.4500, name: 'Mannargudi Regulated Market' },
  nagapattinam: { latitude: 10.7656, longitude: 79.8424, name: 'Nagapattinam Market' },
  mayiladuthurai: { latitude: 11.1075, longitude: 79.6523, name: 'Mayiladuthurai Regulated Market' },
  thoothukudi: { latitude: 8.7642, longitude: 78.1348, name: 'Thoothukudi Port Mandi' },
  kovilpatti: { latitude: 9.1700, longitude: 77.8700, name: 'Kovilpatti Chilli & Groundnut Yard' },
  virudhunagar: { latitude: 9.5680, longitude: 77.9624, name: 'Virudhunagar Grain & Spice Yard' },
  rajapalayam: { latitude: 9.4500, longitude: 77.5500, name: 'Rajapalayam Cotton & Mango Market' },
  sivagangai: { latitude: 9.8433, longitude: 78.4809, name: 'Sivaganga Agri Yard' },
  singampunari: { latitude: 10.1800, longitude: 78.4200, name: 'Singampunari Uzhavar Sandhai' },
  karaikudi: { latitude: 10.0700, longitude: 78.7800, name: 'Karaikudi Market' },
  ramanathapuram: { latitude: 9.3639, longitude: 78.8395, name: 'Ramanathapuram Yard' },
  paramakudi: { latitude: 9.5400, longitude: 78.5900, name: 'Paramakudi Chilli Yard' },
  tenkasi: { latitude: 8.9594, longitude: 77.3152, name: 'Tenkasi Regulated Market' },
  sankarankovil: { latitude: 9.1700, longitude: 77.5300, name: 'Sankarankovil Yard' },
  kanyakumari: { latitude: 8.0883, longitude: 77.5385, name: 'Nagercoil Vadasery Market' },
  nagercoil: { latitude: 8.1833, longitude: 77.4119, name: 'Nagercoil Vadasery Market' }
};

export const ALL_TAMIL_NADU_DISTRICTS: DistrictLocationPreset[] = Object.entries(
  TAMIL_NADU_DISTRICT_COORDINATES
).map(([key, data]) => ({
  id: `preset-${key}`,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  nameTa: data.nameTa,
  latitude: data.latitude,
  longitude: data.longitude
}));

export const ALL_TAMIL_NADU_DISTRICT_NAMES: string[] = Array.from(
  new Set(ALL_TAMIL_NADU_DISTRICTS.map((d) => d.name))
).sort();

/**
 * Resolves coordinates for a market name and optional district.
 */
export function resolveMarketCoordinates(
  marketName: string,
  districtName?: string
): MandiCoordinate | null {
  if (!marketName && !districtName) return null;

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[\(\)\/\-]/g, ' ')
      .replace(/regulated market|apmc|mandi|market yard|market|uzhavar sandhai/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const normMarket = normalize(marketName || '');

  // 1. Exact or partial match in verified specific market coordinates
  for (const [key, coords] of Object.entries(VERIFIED_MARKET_COORDINATES)) {
    if (normMarket.includes(key) || key.includes(normMarket)) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        isApproximate: false,
        resolvedName: coords.name
      };
    }
  }

  // 2. Check individual tokens of market name against verified markets
  const tokens = normMarket.split(' ').filter((t) => t.length >= 3);
  for (const token of tokens) {
    if (VERIFIED_MARKET_COORDINATES[token]) {
      const coords = VERIFIED_MARKET_COORDINATES[token];
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        isApproximate: false,
        resolvedName: coords.name
      };
    }
  }

  // 3. Fallback to district centroid
  const normDistrict = (districtName || '').toLowerCase().trim();
  if (normDistrict && TAMIL_NADU_DISTRICT_COORDINATES[normDistrict]) {
    const coords = TAMIL_NADU_DISTRICT_COORDINATES[normDistrict];
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      isApproximate: true,
      resolvedName: `${districtName} (District Center)`
    };
  }

  return null;
}

/**
 * Formats proximity display label for UI cards
 */
export function formatProximityLabel(
  distanceKm: number | null,
  locationOrApproximate?: string | boolean,
  isApproximate?: boolean,
  isTa: boolean = false
): string | null {
  if (distanceKm === null || distanceKm === undefined) return null;

  const approx = typeof locationOrApproximate === 'boolean' ? locationOrApproximate : Boolean(isApproximate);
  const roundedKm = Math.round(distanceKm * 10) / 10;
  const distText =
    distanceKm < 1
      ? (isTa ? `${Math.round(distanceKm * 1000)} மீ` : `${Math.round(distanceKm * 1000)} m`)
      : (isTa ? `${roundedKm} கி.மீ` : `${roundedKm} km`);

  if (approx) {
    return isTa
      ? `📍 ~${distText} தொலைவில் (தோராயமாக)`
      : `📍 ~${distText} away (Approx.)`;
  }

  return isTa
    ? `📍 ${distText} தொலைவில்`
    : `📍 ${distText} away`;
}
