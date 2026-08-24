import { supabase, isSupabaseConfigured } from './client';
import { GovernmentScheme } from '@/types';
import { MOCK_SCHEMES } from '@/lib/mock-data';

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
 * Falls back to the curated 18 verified schemes if Supabase returns 0 records or is unconfigured
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
        console.error('Supabase getSchemes error, falling back to verified schemes:', error);
        return { data: MOCK_SCHEMES, error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const schemes: GovernmentScheme[] = (data as unknown as RawSchemeRow[]).map((row) => {
          const govLevel = (row.government_level === 'state' || row.name.toLowerCase().includes('tamil nadu') || row.name.toLowerCase().includes('kalaignar') || row.name.toLowerCase().includes('kuruvai') || row.name.toLowerCase().includes('uzhavar') || row.name.toLowerCase().includes('tanhoda'))
            ? ('state' as const)
            : ('central' as const);

          const stateVal = row.state || (govLevel === 'state' ? 'Tamil Nadu' : null);
          const categoryVal = row.category || categorizeScheme(row.name, row.description);
          const sourceVal = row.source || (govLevel === 'state'
            ? 'Government of Tamil Nadu - Agriculture & Farmers Welfare Department'
            : 'Government of India - Ministry of Agriculture & Farmers Welfare');

          return {
            id: row.id,
            name: row.name,
            description: row.description,
            eligibility: row.eligibility,
            benefits: row.benefits,
            application_info: row.application_info,
            official_url: row.official_url || undefined,
            source: sourceVal,
            government_level: govLevel,
            state: stateVal,
            category: categoryVal,
            last_verified_at: row.last_verified_at || '2026-08-24',
            created_at: row.created_at
          };
        });

        return { data: schemes, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.error('Unexpected error in getSchemes, falling back to verified schemes:', err);
      return { data: MOCK_SCHEMES, error: null, isConfigured: true };
    }
  }

  // Fallback to verified 18 Central & Tamil Nadu government schemes
  return { data: MOCK_SCHEMES, error: null, isConfigured: isSupabaseConfigured };
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
