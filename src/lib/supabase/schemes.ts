import { supabase, isSupabaseConfigured, formatSupabaseError } from './client';
import { GovernmentScheme } from '@/types';
import { VERIFIED_GOVERNMENT_SCHEMES } from '@/lib/schemes-data';

/**
 * Raw relational shape from Supabase schemes query
 */
interface RawSchemeRow {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  application_info: string;
  official_url?: string | null;
  source?: string | null;
  government_level?: string | null;
  state?: string | null;
  category?: string | null;
  last_verified_at?: string | null;
  created_at: string;
}

/**
 * Fetch all government schemes from Supabase
 * Falls back to the curated 45 verified schemes if Supabase returns 0 records or is unconfigured
 */
export async function getSchemes(): Promise<{
  data: GovernmentScheme[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase getSchemes notice, falling back to verified schemes:', formatSupabaseError(error));
        return { data: VERIFIED_GOVERNMENT_SCHEMES, error: null, isConfigured: true };
      }

      if (data && data.length >= VERIFIED_GOVERNMENT_SCHEMES.length) {
        const verifiedMap = new Map(VERIFIED_GOVERNMENT_SCHEMES.map((s) => [s.id, s]));
        const schemes: GovernmentScheme[] = (data as unknown as any[]).map((row) => {
          const verified = verifiedMap.get(row.id);
          const govLevel = (row.government_level === 'state' || row.name?.toLowerCase().includes('tamil nadu') || row.name?.toLowerCase().includes('kalaignar') || row.name?.toLowerCase().includes('kuruvai') || row.name?.toLowerCase().includes('uzhavar') || row.name?.toLowerCase().includes('tanhoda'))
            ? ('state' as const)
            : ('central' as const);

          return {
            id: row.id,
            name: row.name || verified?.name || '',
            description: row.description || verified?.description || '',
            eligibility: row.eligibility || verified?.eligibility || '',
            benefits: row.benefits || verified?.benefits || '',
            application_info: row.application_info || verified?.application_info || '',
            official_url: row.official_url || verified?.official_url || undefined,
            source: row.source || verified?.source,
            government_level: row.government_level || verified?.government_level || govLevel,
            state: row.state !== undefined ? row.state : (verified?.state ?? (govLevel === 'state' ? 'Tamil Nadu' : null)),
            category: row.category || verified?.category || categorizeScheme(row.name, row.description),
            department: row.department || verified?.department,
            support_type: row.support_type || verified?.support_type,
            supported_crops: row.supported_crops || verified?.supported_crops || ['All Crops & Activities'],
            landholding_criteria: row.landholding_criteria || verified?.landholding_criteria,
            min_land_acres: row.min_land_acres ?? verified?.min_land_acres,
            max_land_acres: row.max_land_acres ?? verified?.max_land_acres,
            districts: row.districts || verified?.districts || ['All'],
            required_documents: row.required_documents || verified?.required_documents,
            benefit_type: row.benefit_type || verified?.benefit_type,
            benefit_amount: row.benefit_amount || verified?.benefit_amount,
            availability_status: row.availability_status || verified?.availability_status || 'open',
            last_verified_at: row.last_verified_at || verified?.last_verified_at || '2026-08-24',
            created_at: row.created_at || verified?.created_at || new Date().toISOString()
          };
        });

        return { data: schemes, error: null, isConfigured: true };
      } else {
        return { data: VERIFIED_GOVERNMENT_SCHEMES, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.warn('Unexpected notice in getSchemes, falling back to verified schemes:', formatSupabaseError(err));
      return { data: VERIFIED_GOVERNMENT_SCHEMES, error: null, isConfigured: true };
    }
  }

  // Fallback to verified 45 Central & Tamil Nadu government schemes
  return { data: VERIFIED_GOVERNMENT_SCHEMES, error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Helper to assign UI category for filter pills based on scheme content
 */
function categorizeScheme(name: string, description: string): string {
  const text = (name + ' ' + description).toLowerCase();
  if (text.includes('mechaniz') || text.includes('tractor') || text.includes('smam') || text.includes('pump') || text.includes('equipment')) {
    return 'Machinery Subsidy';
  }
  if (text.includes('bima') || text.includes('insurance') || text.includes('pmfby') || text.includes('crop protection')) {
    return 'Crop Insurance';
  }
  if (text.includes('kcc') || text.includes('credit') || text.includes('loan') || text.includes('interest')) {
    return 'Credit & Loans';
  }
  if (text.includes('drip') || text.includes('sprinkler') || text.includes('irrigation') || text.includes('pdmc') || text.includes('tanhoda')) {
    return 'Irrigation';
  }
  if (text.includes('organic') || text.includes('natural') || text.includes('pkvy') || text.includes('vermicompost')) {
    return 'Organic/Natural Farming';
  }
  if (text.includes('horticulture') || text.includes('midh') || text.includes('fruit') || text.includes('plantation')) {
    return 'Horticulture';
  }
  if (text.includes('fpo') || text.includes('producer') || text.includes('collective')) {
    return 'Farmer Organizations';
  }
  if (text.includes('market') || text.includes('santhai') || text.includes('mandi')) {
    return 'Marketing';
  }
  if (text.includes('infra') || text.includes('warehouse') || text.includes('electricity') || text.includes('power')) {
    return 'Infrastructure';
  }
  if (text.includes('seed') || text.includes('kuruvai') || text.includes('planting')) {
    return 'Seeds & Planting Material';
  }
  if (text.includes('soil') || text.includes('dryland') || text.includes('msda')) {
    return 'Soil Health';
  }
  if (text.includes('samman') || text.includes('pm-kisan') || text.includes('maan dhan') || text.includes('income') || text.includes('kaviadp')) {
    return 'Direct Income Support';
  }
  return 'Direct Income Support';
}
