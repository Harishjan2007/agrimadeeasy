import { supabase, isSupabaseConfigured, isValidUuid } from './client';
import { Product, ProductCategory } from '@/types';
import { DEMO_PRODUCTS } from '@/lib/products-data';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

interface RawDealerRow {
  id: string;
  shop_name: string;
  phone?: string;
  address?: string;
  opening_hours?: string;
  district?: string;
  state?: string;
  verified?: boolean;
}

interface RawProductRow {
  id: string;
  dealer_id: string | null;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  pack_size?: string | null;
  unit?: string | null;
  is_demo?: boolean | null;
  created_at: string;
  updated_at: string;
  dealers?: RawDealerRow | RawDealerRow[] | null;
}

function mapRawProduct(row: RawProductRow): Product {
  const isDemo = Boolean(
    row.is_demo ?? (
      row.id.startsWith('prod-') ||
      row.id.startsWith('00000000-0000-0000-0003')
    )
  );

  const rawDealer = Array.isArray(row.dealers) ? row.dealers[0] : row.dealers;

  return {
    id: row.id,
    dealer_id: row.dealer_id || 'demo-dealer',
    name: row.name,
    category: row.category as ProductCategory,
    description: row.description || '',
    price: Number(row.price),
    stock: Number(row.stock || 0),
    pack_size: row.pack_size || undefined,
    unit: row.unit || undefined,
    isDemo,
    image_url: row.image_url || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    dealer: rawDealer ? {
      id: rawDealer.id,
      shop_name: rawDealer.shop_name,
      phone: rawDealer.phone || '+91 94431 00000',
      address: rawDealer.address || 'Tamil Nadu',
      opening_hours: rawDealer.opening_hours || 'Mon - Sat: 8:00 AM - 7:00 PM',
      profile_id: '',
      verified: rawDealer.verified ?? true,
      district: rawDealer.district,
      state: rawDealer.state,
      created_at: row.created_at
    } : undefined
  };
}

export function getFallbackProducts(category?: string): Product[] {
  const baseList = DEMO_PRODUCTS.length > 0 ? DEMO_PRODUCTS : MOCK_PRODUCTS;
  const mapped = baseList.map((p) => ({
    ...p,
    isDemo: true
  }));

  if (!category || category === 'All') {
    return mapped;
  }
  return mapped.filter((p) => p.category === category);
}

/**
 * Fetch all agricultural input products from Supabase
 */
export async function getProducts(category?: string): Promise<{
  data: Product[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          dealer_id,
          name,
          category,
          description,
          price,
          stock,
          image_url,
          pack_size,
          unit,
          is_demo,
          created_at,
          updated_at,
          dealers (
            id,
            shop_name,
            phone,
            address,
            opening_hours,
            district,
            state,
            verified
          )
        `)
        .order('is_demo', { ascending: true })
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase getProducts notice, falling back to local catalog:', error.message);
        return { data: getFallbackProducts(category), error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const mapped = (data as unknown as RawProductRow[]).map(mapRawProduct);
        return { data: mapped, error: null, isConfigured: true };
      }
    } catch (err: unknown) {
      console.warn('Unexpected error in getProducts, using fallback:', err);
      return { data: getFallbackProducts(category), error: null, isConfigured: true };
    }
  }

  return { data: getFallbackProducts(category), error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Fetch single product by id
 */
export async function getProductById(id: string): Promise<{
  data: Product | null;
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase && isValidUuid(id)) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          dealer_id,
          name,
          category,
          description,
          price,
          stock,
          image_url,
          pack_size,
          unit,
          is_demo,
          created_at,
          updated_at,
          dealers (
            id,
            shop_name,
            phone,
            address,
            opening_hours,
            district,
            state,
            verified
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (data) {
        return { data: mapRawProduct(data as unknown as RawProductRow), error: null };
      }
    } catch (err) {
      console.warn('Failed to fetch product by id from Supabase:', err);
    }
  }

  const fallback = getFallbackProducts().find((p) => p.id === id) || null;
  return { data: fallback, error: null };
}

