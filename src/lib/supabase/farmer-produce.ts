import { supabase, isSupabaseConfigured } from './client';
import { 
  FarmerProduceListing, 
  ProduceRequest, 
  ListingStatus, 
  ProduceRequestStatus,
  Profile 
} from '@/types';

interface RawProduceListingRow {
  id: string;
  farmer_id: string;
  crop_name: string;
  category?: string | null;
  quantity: number | string;
  unit: string;
  asking_price: number | string;
  price_unit: string;
  location: string;
  available_date: string;
  description?: string | null;
  image_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: any;
}

interface RawProduceRequestRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  requested_quantity: number | string;
  message?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  farmer_produce_listings?: RawProduceListingRow | null;
  buyer_profile?: any;
  farmer_profile?: any;
  profiles?: any;
}

function mapProfile(raw: any): Profile | undefined {
  if (!raw) return undefined;
  return {
    id: raw.id,
    name: raw.name || raw.full_name || 'Farmer',
    full_name: raw.full_name || raw.name || 'Farmer',
    email: raw.email || '',
    phone: raw.phone || '',
    role: raw.role || 'farmer',
    location: raw.location || '',
    created_at: raw.created_at || new Date().toISOString()
  };
}

function mapListingRow(row: RawProduceListingRow): FarmerProduceListing {
  return {
    id: row.id,
    farmer_id: row.farmer_id,
    crop_name: row.crop_name,
    category: row.category || 'Cereals',
    quantity: Number(row.quantity),
    unit: row.unit || 'Quintal',
    asking_price: Number(row.asking_price),
    price_unit: row.price_unit || '₹/Quintal',
    location: row.location,
    available_date: row.available_date,
    description: row.description || undefined,
    image_url: row.image_url || undefined,
    status: (row.status as ListingStatus) || 'active',
    created_at: row.created_at,
    updated_at: row.updated_at,
    farmer: mapProfile(row.profiles)
  };
}

/**
 * Fetch produce listings with optional filters
 */
export async function fetchProduceListings(filters?: {
  status?: string;
  farmer_id?: string;
}): Promise<FarmerProduceListing[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('farmer_produce_listings')
      .select(`
        *,
        profiles:farmer_id (
          id,
          name,
          phone,
          location,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.farmer_id) {
      query = query.eq('farmer_id', filters.farmer_id);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetchProduceListings warning:', error.message);
      return [];
    }

    if (!data) return [];
    return (data as unknown as RawProduceListingRow[]).map(mapListingRow);
  } catch (err) {
    console.warn('Supabase fetchProduceListings caught error:', err);
    return [];
  }
}

/**
 * Alias for getFarmerProduceListings
 */
export async function getFarmerProduceListings() {
  const data = await fetchProduceListings({ status: 'active' });
  return { data, error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Fetch listings belonging to a specific farmer
 */
export async function getMyProduceListings(farmerId: string) {
  const data = await fetchProduceListings({ farmer_id: farmerId });
  return { data, error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Create a new produce listing
 */
export async function createProduceListing(listing: {
  farmer_id: string;
  crop_name: string;
  category?: string;
  quantity: number;
  unit: string;
  asking_price: number;
  price_unit: string;
  location: string;
  available_date: string;
  description?: string;
  image_url?: string;
}): Promise<FarmerProduceListing> {
  const timestamp = new Date().toISOString();
  const fallbackListing: FarmerProduceListing = {
    id: 'listing-' + Date.now(),
    farmer_id: listing.farmer_id,
    crop_name: listing.crop_name.trim(),
    category: listing.category || 'Cereals',
    quantity: listing.quantity,
    unit: listing.unit,
    asking_price: listing.asking_price,
    price_unit: listing.price_unit,
    location: listing.location.trim(),
    available_date: listing.available_date,
    description: listing.description?.trim() || undefined,
    image_url: listing.image_url || undefined,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp
  };

  if (!isSupabaseConfigured || !supabase) {
    return fallbackListing;
  }

  try {
    const { data, error } = await supabase
      .from('farmer_produce_listings')
      .insert({
        farmer_id: listing.farmer_id,
        crop_name: listing.crop_name.trim(),
        category: listing.category || 'Cereals',
        quantity: listing.quantity,
        unit: listing.unit,
        asking_price: listing.asking_price,
        price_unit: listing.price_unit,
        location: listing.location.trim(),
        available_date: listing.available_date,
        description: listing.description?.trim() || null,
        image_url: listing.image_url || null,
        status: 'active'
      })
      .select(`
        *,
        profiles:farmer_id (
          id,
          name,
          phone,
          location,
          role
        )
      `)
      .single();

    if (error) {
      console.warn('Supabase createProduceListing error, using fallback:', error.message);
      return fallbackListing;
    }

    return mapListingRow(data as unknown as RawProduceListingRow);
  } catch (err) {
    console.warn('Supabase createProduceListing caught error, using fallback:', err);
    return fallbackListing;
  }
}

/**
 * Update an existing produce listing
 */
export async function updateProduceListing(
  id: string,
  updates: Partial<FarmerProduceListing>
): Promise<FarmerProduceListing> {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured || !supabase) {
    return {
      id,
      farmer_id: updates.farmer_id || 'farmer-1',
      crop_name: updates.crop_name || '',
      quantity: updates.quantity || 0,
      unit: updates.unit || 'Quintal',
      asking_price: updates.asking_price || 0,
      price_unit: updates.price_unit || '₹/Quintal',
      location: updates.location || '',
      available_date: updates.available_date || timestamp,
      status: updates.status || 'active',
      created_at: updates.created_at || timestamp,
      updated_at: timestamp,
      ...updates
    } as FarmerProduceListing;
  }

  try {
    const { data, error } = await supabase
      .from('farmer_produce_listings')
      .update({
        crop_name: updates.crop_name?.trim(),
        category: updates.category,
        quantity: updates.quantity,
        unit: updates.unit,
        asking_price: updates.asking_price,
        price_unit: updates.price_unit,
        location: updates.location?.trim(),
        available_date: updates.available_date,
        description: updates.description?.trim() || null,
        status: updates.status,
        updated_at: timestamp
      })
      .eq('id', id)
      .select(`
        *,
        profiles:farmer_id (
          id,
          name,
          phone,
          location,
          role
        )
      `)
      .single();

    if (error) {
      console.warn('Supabase updateProduceListing error:', error.message);
      throw error;
    }

    return mapListingRow(data as unknown as RawProduceListingRow);
  } catch (err) {
    console.warn('Supabase updateProduceListing error:', err);
    throw err;
  }
}

/**
 * Delete a produce listing
 */
export async function deleteProduceListing(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from('farmer_produce_listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteProduceListing error:', error.message);
      throw error;
    }
  } catch (err) {
    console.warn('Supabase deleteProduceListing caught error:', err);
    throw err;
  }
}

/**
 * Create a buyer purchase request
 */
export async function createProduceRequest(request: {
  listing_id: string;
  buyer_id: string;
  farmer_id?: string;
  requested_quantity: number;
  message?: string;
}): Promise<ProduceRequest> {
  const timestamp = new Date().toISOString();
  let targetFarmerId = request.farmer_id || '';

  const fallbackRequest: ProduceRequest = {
    id: 'req-' + Date.now(),
    listing_id: request.listing_id,
    buyer_id: request.buyer_id,
    farmer_id: targetFarmerId || 'farmer-1',
    requested_quantity: request.requested_quantity,
    message: request.message?.trim() || undefined,
    status: 'pending',
    created_at: timestamp,
    updated_at: timestamp
  };

  if (!isSupabaseConfigured || !supabase) {
    return fallbackRequest;
  }

  try {
    // If farmer_id wasn't passed directly, look up the listing's farmer_id
    if (!targetFarmerId) {
      const { data: listingData } = await supabase
        .from('farmer_produce_listings')
        .select('farmer_id')
        .eq('id', request.listing_id)
        .single();
      if (listingData?.farmer_id) {
        targetFarmerId = listingData.farmer_id;
      }
    }

    const { data, error } = await supabase
      .from('produce_requests')
      .insert({
        listing_id: request.listing_id,
        buyer_id: request.buyer_id,
        farmer_id: targetFarmerId || request.buyer_id,
        requested_quantity: request.requested_quantity,
        message: request.message?.trim() || null,
        status: 'pending'
      })
      .select(`
        *,
        farmer_produce_listings (*),
        buyer_profile:buyer_id (id, name, phone, email, location, role),
        farmer_profile:farmer_id (id, name, phone, email, location, role)
      `)
      .single();

    if (error) {
      console.warn('Supabase createProduceRequest error, using fallback:', error.message);
      return fallbackRequest;
    }

    const row = data as unknown as RawProduceRequestRow;
    return {
      id: row.id,
      listing_id: row.listing_id,
      buyer_id: row.buyer_id,
      farmer_id: row.farmer_id,
      requested_quantity: Number(row.requested_quantity),
      message: row.message || undefined,
      status: (row.status as ProduceRequestStatus) || 'pending',
      created_at: row.created_at,
      updated_at: row.updated_at,
      listing: row.farmer_produce_listings ? mapListingRow(row.farmer_produce_listings) : undefined,
      buyer: mapProfile(row.buyer_profile),
      farmer: mapProfile(row.farmer_profile)
    };
  } catch (err) {
    console.warn('Supabase createProduceRequest caught error, using fallback:', err);
    return fallbackRequest;
  }
}

/**
 * Fetch incoming purchase requests received by a farmer
 */
export async function fetchFarmerRequests(farmerId: string): Promise<ProduceRequest[]> {
  if (!farmerId || !isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('produce_requests')
      .select(`
        *,
        farmer_produce_listings (*),
        buyer_profile:buyer_id (id, name, phone, email, location, role)
      `)
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchFarmerRequests error:', error.message);
      return [];
    }

    if (!data) return [];
    return (data as unknown as RawProduceRequestRow[]).map((row) => ({
      id: row.id,
      listing_id: row.listing_id,
      buyer_id: row.buyer_id,
      farmer_id: row.farmer_id,
      requested_quantity: Number(row.requested_quantity),
      message: row.message || undefined,
      status: (row.status as ProduceRequestStatus) || 'pending',
      created_at: row.created_at,
      updated_at: row.updated_at,
      listing: row.farmer_produce_listings ? mapListingRow(row.farmer_produce_listings) : undefined,
      buyer: mapProfile(row.buyer_profile)
    }));
  } catch (err) {
    console.warn('Supabase fetchFarmerRequests caught error:', err);
    return [];
  }
}

/**
 * Fetch sent purchase requests submitted by a buyer
 */
export async function fetchBuyerRequests(buyerId: string): Promise<ProduceRequest[]> {
  if (!buyerId || !isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('produce_requests')
      .select(`
        *,
        farmer_produce_listings (*),
        farmer_profile:farmer_id (id, name, phone, email, location, role)
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchBuyerRequests error:', error.message);
      return [];
    }

    if (!data) return [];
    return (data as unknown as RawProduceRequestRow[]).map((row) => ({
      id: row.id,
      listing_id: row.listing_id,
      buyer_id: row.buyer_id,
      farmer_id: row.farmer_id,
      requested_quantity: Number(row.requested_quantity),
      message: row.message || undefined,
      status: (row.status as ProduceRequestStatus) || 'pending',
      created_at: row.created_at,
      updated_at: row.updated_at,
      listing: row.farmer_produce_listings ? mapListingRow(row.farmer_produce_listings) : undefined,
      farmer: mapProfile(row.farmer_profile)
    }));
  } catch (err) {
    console.warn('Supabase fetchBuyerRequests caught error:', err);
    return [];
  }
}

/**
 * Update produce request status (accept, reject, complete)
 */
export async function updateProduceRequestStatus(
  requestId: string,
  newStatus: ProduceRequestStatus
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from('produce_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      console.warn('Supabase updateProduceRequestStatus error:', error.message);
      throw error;
    }
  } catch (err) {
    console.warn('Supabase updateProduceRequestStatus caught error:', err);
    throw err;
  }
}
