import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, formatSupabaseError } from './client';
import { Machinery, MachineryBooking, BookingStatus, MachineryType, MachineryTracking, Profile } from '@/types';
import { MOCK_MACHINERY, MOCK_BOOKINGS } from '@/lib/mock-data';
import { DEMO_MACHINERY_DRIVERS } from '@/lib/machinery-drivers-data';

interface RawMachineryRow {
  id: string;
  provider_id: string;
  name: string;
  type: string;
  description: string;
  price_per_hour: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  available: boolean;
  image_url?: string;
  is_demo?: boolean | null;
  service_type?: string | null;
  driver_name?: string | null;
  experience_years?: number | null;
  created_at: string;
  updated_at?: string;
  profiles?: {
    id: string;
    name: string;
    phone: string;
    location: string;
    role: string;
  } | null;
}

interface RawMachineryBookingRow {
  id: string;
  farmer_id: string;
  machinery_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  machinery?: {
    id: string;
    name: string;
    type: string;
    price_per_hour: number;
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    image_url?: string;
    profiles?: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
}

interface RawTrackingRow {
  id: string;
  booking_id: string;
  provider_id: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  recorded_at: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Fetch all machinery from Supabase or fallback
 */
export async function getMachinery(): Promise<{
  data: Machinery[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
        const { data, error } = await supabase
        .from('machinery')
        .select(`
          id,
          provider_id,
          name,
          type,
          description,
          price_per_hour,
          location,
          latitude,
          longitude,
          available,
          image_url,
          is_demo,
          service_type,
          driver_name,
          experience_years,
          created_at,
          updated_at,
          profiles:provider_id (
            id,
            name,
            phone,
            location,
            role
          )
        `)
        .order('name', { ascending: true });

      if (error) {
        console.warn('Supabase getMachinery notice, using fallback:', formatSupabaseError(error));
        return { data: getFallbackMachinery(), error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        const mapped: Machinery[] = (data as unknown as RawMachineryRow[]).map((row) => ({
          id: row.id,
          provider_id: row.provider_id,
          name: row.name,
          type: row.type as MachineryType,
          description: row.description,
          price_per_hour: Number(row.price_per_hour),
          location: row.location,
          latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : undefined,
          longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : undefined,
          available: row.available,
          image_url: row.image_url,
          isDemo: Boolean(row.is_demo),
          service_type: row.service_type || undefined,
          driver_name: row.driver_name || undefined,
          experience_years: row.experience_years ? Number(row.experience_years) : undefined,
          created_at: row.created_at,
          updated_at: row.updated_at || row.created_at,
          provider: row.profiles ? {
            id: row.profiles.id,
            name: row.profiles.name,
            phone: row.profiles.phone,
            location: row.profiles.location,
            email: '',
            role: 'machinery_provider',
            created_at: row.created_at
          } : undefined
        }));
        return { data: mapped, error: null, isConfigured: true };
      }
    } catch (err) {
      console.warn('Unexpected notice in getMachinery, using fallback:', formatSupabaseError(err));
      return { data: getFallbackMachinery(), error: null, isConfigured: true };
    }
  }

  return { data: getFallbackMachinery(), error: null, isConfigured: isSupabaseConfigured };
}

function getFallbackMachinery(): Machinery[] {
  const realMapped = MOCK_MACHINERY.map((m) => ({ ...m, isDemo: false }));
  const demoMapped = DEMO_MACHINERY_DRIVERS.map((m) => ({ ...m, isDemo: true }));
  return [...realMapped, ...demoMapped];
}

/**
 * Fetch reservations for a farmer or machinery provider
 */
export async function getMachineryBookings(farmerId?: string, providerId?: string): Promise<{
  data: MachineryBooking[];
  error: Error | null;
  isConfigured: boolean;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('machinery_bookings')
        .select(`
          id,
          farmer_id,
          machinery_id,
          booking_date,
          start_time,
          end_time,
          status,
          total_amount,
          created_at,
          updated_at,
          machinery (
            id,
            name,
            type,
            price_per_hour,
            location,
            latitude,
            longitude,
            image_url,
            profiles:provider_id (
              id,
              name,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (farmerId) {
        query = query.eq('farmer_id', farmerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase getMachineryBookings error:', error);
        return { data: MOCK_BOOKINGS, error: null, isConfigured: true };
      }

      if (data && data.length > 0) {
        let mapped: MachineryBooking[] = (data as unknown as RawMachineryBookingRow[]).map((row) => ({
          id: row.id,
          farmer_id: row.farmer_id,
          machinery_id: row.machinery_id,
          booking_date: row.booking_date,
          start_time: row.start_time,
          end_time: row.end_time,
          status: row.status as BookingStatus,
          total_amount: Number(row.total_amount),
          created_at: row.created_at,
          updated_at: row.updated_at || row.created_at,
          machinery: row.machinery ? {
            id: row.machinery.id,
            provider_id: row.machinery.profiles?.id || '',
            name: row.machinery.name,
            type: row.machinery.type as MachineryType,
            description: '',
            price_per_hour: Number(row.machinery.price_per_hour),
            location: row.machinery.location,
            latitude: row.machinery.latitude !== null && row.machinery.latitude !== undefined ? Number(row.machinery.latitude) : undefined,
            longitude: row.machinery.longitude !== null && row.machinery.longitude !== undefined ? Number(row.machinery.longitude) : undefined,
            available: true,
            image_url: row.machinery.image_url,
            created_at: row.created_at,
            updated_at: row.created_at,
            provider: row.machinery.profiles ? {
              id: row.machinery.profiles.id,
              name: row.machinery.profiles.name,
              phone: row.machinery.profiles.phone,
              email: '',
              role: 'machinery_provider',
              location: row.machinery.location,
              created_at: row.created_at
            } : undefined
          } : undefined
        }));

        if (providerId) {
          mapped = mapped.filter((b) => b.machinery?.provider_id === providerId);
        }

        return { data: mapped, error: null, isConfigured: true };
      }
    } catch (err) {
      console.error('Unexpected error in getMachineryBookings:', err);
      return { data: MOCK_BOOKINGS, error: null, isConfigured: true };
    }
  }

  return { data: MOCK_BOOKINGS, error: null, isConfigured: isSupabaseConfigured };
}

/**
 * Insert new machinery reservation into Supabase
 */
export async function createMachineryBooking(payload: {
  farmerId: string;
  machineryId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
}): Promise<{
  data: MachineryBooking | null;
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('machinery_bookings')
        .insert({
          farmer_id: payload.farmerId,
          machinery_id: payload.machineryId,
          booking_date: payload.bookingDate,
          start_time: payload.startTime,
          end_time: payload.endTime,
          total_amount: payload.totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase createMachineryBooking error:', error);
        const fallbackBooking: MachineryBooking = {
          id: `bk-${Date.now()}`,
          farmer_id: payload.farmerId,
          machinery_id: payload.machineryId,
          booking_date: payload.bookingDate,
          start_time: payload.startTime,
          end_time: payload.endTime,
          total_amount: payload.totalAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return { data: fallbackBooking, error: null };
      }

      return { data: data as MachineryBooking, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create machinery booking');
      return { data: null, error };
    }
  }

  const localBooking: MachineryBooking = {
    id: `bk-${Date.now()}`,
    farmer_id: payload.farmerId,
    machinery_id: payload.machineryId,
    booking_date: payload.bookingDate,
    start_time: payload.startTime,
    end_time: payload.endTime,
    total_amount: payload.totalAmount,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return { data: localBooking, error: null };
}

/**
 * Strict Machinery Booking State Machine Transitions
 * Prevents invalid state jumps (e.g. pending -> completed, cancelled -> in_progress)
 */
export const VALID_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['on_the_way', 'cancelled'],
  rejected: [], // Terminal state
  on_the_way: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [] // Terminal state
};

export function isValidBookingTransition(currentStatus: BookingStatus, newStatus: BookingStatus): boolean {
  if (currentStatus === newStatus) return true; // Idempotent
  const allowed = VALID_BOOKING_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(newStatus));
}

/**
 * Update the lifecycle status of a machinery reservation with transition validation
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  currentStatus?: BookingStatus
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  if (currentStatus && !isValidBookingTransition(currentStatus, status)) {
    return {
      success: false,
      error: new Error(`Illegal booking transition: cannot move from '${currentStatus}' to '${status}'`)
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('machinery_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.error('Supabase updateBookingStatus error:', error);
        return { success: false, error: new Error(error.message) };
      }
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update booking status');
      return { success: false, error };
    }
  }

  return { success: true, error: null };
}

/**
 * Cancel an existing reservation
 */
export async function cancelMachineryBooking(bookingId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  return updateBookingStatus(bookingId, 'cancelled');
}

/**
 * Save / Upsert latest real-time GPS coordinates of active machinery provider
 */
export async function saveMachineryLocation(payload: {
  bookingId?: string;
  booking_id?: string;
  providerId?: string;
  provider_id?: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  recorded_at?: string;
}): Promise<{
  data: MachineryTracking | null;
  error: Error | null;
}> {
  const bookingId = payload.bookingId || payload.booking_id || '';
  const providerId = payload.providerId || payload.provider_id || '';

  const record = {
    booking_id: bookingId,
    provider_id: providerId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed: payload.speed ?? null,
    heading: payload.heading ?? null,
    accuracy: payload.accuracy ?? null,
    recorded_at: payload.recorded_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('machinery_tracking')
        .upsert(record, { onConflict: 'booking_id' })
        .select()
        .single();

      if (error) {
        console.error('Supabase saveMachineryLocation error:', error);
        return { data: null, error: new Error(error.message || 'Failed to save machinery location to database') };
      }

      return { data: data as MachineryTracking, error: null };
    } catch (err) {
      console.error('saveMachineryLocation exception:', err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err) || 'Machinery location save exception') };
    }
  }

  const localTracking: MachineryTracking = {
    id: `trk-${Date.now()}`,
    ...record
  };
  return { data: localTracking, error: null };
}

/**
 * Fetch latest GPS location for an active booking
 */
export async function getMachineryLocation(bookingId: string): Promise<{
  data: MachineryTracking | null;
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('machinery_tracking')
        .select('*')
        .eq('booking_id', bookingId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Supabase getMachineryLocation error:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: (data as MachineryTracking) || null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch machinery location');
      return { data: null, error };
    }
  }

  return { data: null, error: null };
}

/**
 * Real-time subscription to active machinery tracking updates
 * Uses Supabase Realtime channel postgres_changes.
 * Falls back to 10s interval polling if Realtime is unconfigured or disconnects.
 * Returns an unsubscribe callback for clean component unmounting.
 */
export function subscribeToMachineryTracking(
  bookingId: string,
  onUpdate: (location: MachineryTracking) => void
): () => void {
  let isCleanedUp = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  // 1. Initial fetch
  getMachineryLocation(bookingId).then(({ data }) => {
    if (data && !isCleanedUp) {
      onUpdate(data);
    }
  });

  // 2. Supabase Realtime channel subscription
  let channel: RealtimeChannel | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      channel = supabase
        .channel(`tracking:${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'machinery_tracking',
            filter: `booking_id=eq.${bookingId}`
          },
          (payload) => {
            if (!isCleanedUp && payload.new) {
              onUpdate(payload.new as MachineryTracking);
            }
          }
        )
        .subscribe((status) => {
          // If Realtime is unavailable or timed out, start fallback polling
          if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            startFallbackPolling();
          }
        });
    } catch (err) {
      console.warn('Realtime subscription failed, engaging fallback polling:', err);
      startFallbackPolling();
    }
  } else {
    startFallbackPolling();
  }

  function startFallbackPolling() {
    if (pollInterval || isCleanedUp) return;
    pollInterval = setInterval(async () => {
      if (isCleanedUp) return;
      const { data } = await getMachineryLocation(bookingId);
      if (data && !isCleanedUp) {
        onUpdate(data);
      }
    }, 10000);
  }

  // Return cleanup function
  return () => {
    isCleanedUp = true;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (channel && supabase) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

/**
 * Update an existing machinery equipment record in Supabase
 */
export async function updateMachineryRecord(
  machineryId: string,
  updates: Partial<Machinery>
): Promise<{
  data: Machinery | null;
  error: Error | null;
}> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price_per_hour !== undefined) payload.price_per_hour = Number(updates.price_per_hour);
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.latitude !== undefined) payload.latitude = updates.latitude;
  if (updates.longitude !== undefined) payload.longitude = updates.longitude;
  if (updates.available !== undefined) payload.available = updates.available;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('machinery').update(payload)
        .eq('id', machineryId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase updateMachineryRecord error:', error.message);
        return {
          data: null,
          error: new Error(error.message || 'Failed to update machinery record in database')
        };
      } else if (data) {
        return { data: data as Machinery, error: null };
      }
    } catch (err: any) {
      console.error('updateMachineryRecord exception:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err) || 'Machinery update exception')
      };
    }
  }

  // Fallback / Offline (Supabase not configured in current environment)
  return {
    data: { id: machineryId, ...updates } as Machinery,
    error: null
  };
}

/**
 * Update machinery provider business profile in Supabase profiles & auth metadata
 */
export async function updateProviderProfile(
  providerId: string,
  updates: {
    provider_name?: string;
    full_name?: string;
    phone?: string;
    business_address?: string;
    state?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    machinery_types?: string[];
    price_per_hour?: number;
    rental_terms?: string;
  }
): Promise<{
  data: Partial<Profile> | null;
  error: Error | null;
}> {
  const profilePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (updates.full_name) profilePayload.name = updates.full_name;
  if (updates.phone) profilePayload.phone = updates.phone;
  if (updates.business_address) {
    profilePayload.location = updates.business_address;
    profilePayload.business_address = updates.business_address;
  }
  if (updates.provider_name) profilePayload.provider_name = updates.provider_name;
  if (updates.state) profilePayload.state = updates.state;
  if (updates.district) profilePayload.district = updates.district;
  if (updates.latitude !== undefined) profilePayload.latitude = updates.latitude;
  if (updates.longitude !== undefined) profilePayload.longitude = updates.longitude;
  if (updates.machinery_types) profilePayload.machinery_types = updates.machinery_types;
  if (updates.price_per_hour !== undefined) profilePayload.price_per_hour = updates.price_per_hour;
  if (updates.rental_terms) profilePayload.rental_terms = updates.rental_terms;

  if (isSupabaseConfigured && supabase) {
    try {
      const targetId = providerId || (await supabase.auth.getUser()).data.user?.id;
      if (targetId) {
        const { data, error } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', targetId)
          .select()
          .maybeSingle();

        try {
          await supabase.auth.updateUser({ data: profilePayload });
        } catch {}

        if (error) {
          console.error('Supabase updateProviderProfile error:', error.message);
          return {
            data: null,
            error: new Error(error.message || 'Failed to update provider profile in database')
          };
        } else if (data) {
          return { data: { ...(data as Profile), ...updates }, error: null };
        }
      } else {
        return {
          data: null,
          error: new Error('Cannot update provider profile: User is not authenticated')
        };
      }
    } catch (err: any) {
      console.error('updateProviderProfile caught exception:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err) || 'Provider profile update exception')
      };
    }
  }

  // Fallback / Offline (Supabase not configured in current environment)
  return {
    data: { id: providerId, ...updates },
    error: null
  };
}

