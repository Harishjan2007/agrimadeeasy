import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import { Machinery, MachineryBooking, BookingStatus, MachineryType, MachineryTracking } from '@/types';
import { MOCK_MACHINERY, MOCK_BOOKINGS } from '@/lib/mock-data';

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
        console.error('Supabase getMachinery error, using fallback:', error);
        return { data: MOCK_MACHINERY, error: null, isConfigured: true };
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
      console.error('Unexpected error in getMachinery, using fallback:', err);
      return { data: MOCK_MACHINERY, error: null, isConfigured: true };
    }
  }

  return { data: MOCK_MACHINERY, error: null, isConfigured: isSupabaseConfigured };
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
  bookingId: string;
  providerId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
}): Promise<{
  data: MachineryTracking | null;
  error: Error | null;
}> {
  const record = {
    booking_id: payload.bookingId,
    provider_id: payload.providerId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed: payload.speed ?? null,
    heading: payload.heading ?? null,
    accuracy: payload.accuracy ?? null,
    recorded_at: new Date().toISOString(),
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
        const fallback: MachineryTracking = {
          id: `trk-${Date.now()}`,
          ...record
        };
        return { data: fallback, error: null };
      }

      return { data: data as MachineryTracking, error: null };
    } catch (err) {
      console.warn('saveMachineryLocation exception, using local state:', err);
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

