import { supabase, isSupabaseConfigured } from './client';
import { Machinery, MachineryBooking, BookingStatus, MachineryType } from '@/types';
import { MOCK_MACHINERY, MOCK_BOOKINGS } from '@/lib/mock-data';

interface RawMachineryRow {
  id: string;
  provider_id: string;
  name: string;
  type: string;
  description: string;
  price_per_hour: number;
  location: string;
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
    image_url?: string;
    profiles?: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
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
export async function getMachineryBookings(farmerId?: string): Promise<{
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
        const mapped: MachineryBooking[] = (data as unknown as RawMachineryBookingRow[]).map((row) => ({
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
        // Return local representation
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

  // Fallback offline object
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
 * Cancel an existing reservation
 */
export async function cancelMachineryBooking(bookingId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('machinery_bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.error('Supabase cancelMachineryBooking error:', error);
        return { success: false, error: new Error(error.message) };
      }
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel booking');
      return { success: false, error };
    }
  }

  return { success: true, error: null };
}
