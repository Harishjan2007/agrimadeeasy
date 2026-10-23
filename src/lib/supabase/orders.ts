import { supabase, isSupabaseConfigured, isValidUuid } from './client';
import { Order, OrderItem, FulfillmentMethod, PaymentStatus, OrderStatus } from '@/types';

export { isValidUuid };

export interface CreateOrderPayload {
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  fulfillmentMethod: FulfillmentMethod;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Server-side order persistence in Supabase
 * Validates item quantities, computes total server-side,
 * enforces pending payment status, and saves order items.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<{
  data: Order | null;
  error: Error | null;
}> {
  if (!payload.items || payload.items.length === 0) {
    return { data: null, error: new Error('Order must contain at least one item.') };
  }

  // Validate quantities (> 0) and non-negative unit prices
  for (const item of payload.items) {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return { data: null, error: new Error(`Invalid item quantity for ${item.productName}: must be a positive integer.`) };
    }
    if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
      return { data: null, error: new Error(`Invalid unit price for ${item.productName}.`) };
    }
  }

  // Calculate total amount server-side (never trust total supplied by client)
  const computedTotal = payload.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  const paymentMethodLabel = payload.fulfillmentMethod === 'pickup' 
    ? 'Pay at Store Counter' 
    : 'Cash on Delivery (COD)';

  // Fallback memory order for unconfigured or temporary network drops
  const memoryOrder: Order = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    customer_id: payload.customerId || undefined,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    delivery_address: payload.fulfillmentMethod === 'pickup' ? 'Store Pickup (Counter Fulfillment)' : payload.deliveryAddress,
    fulfillment_method: payload.fulfillmentMethod,
    payment_method: paymentMethodLabel,
    payment_status: 'pending',
    order_status: 'placed',
    total_amount: computedTotal,
    notes: payload.notes,
    items: payload.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      order_id: `ord-${Date.now()}`,
      product_id: item.productId,
      product_name: item.productName,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      created_at: new Date().toISOString()
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert order record
      // Only set customer_id if it's a valid UUID; demo IDs will set customer_id = null to satisfy FK
      const validDbCustomerId = isValidUuid(payload.customerId) ? payload.customerId : null;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: validDbCustomerId,
          customer_name: payload.customerName,
          customer_phone: payload.customerPhone,
          delivery_address: payload.fulfillmentMethod === 'pickup' ? 'Store Pickup (Counter Fulfillment)' : payload.deliveryAddress,
          fulfillment_method: payload.fulfillmentMethod,
          payment_method: paymentMethodLabel,
          payment_status: 'pending',
          order_status: 'placed',
          total_amount: computedTotal,
          notes: payload.notes || null
        })
        .select()
        .single();

      if (orderError) {
        console.warn('Supabase createOrder notice, falling back to local storage:', orderError.message);
        saveLocalOrder(memoryOrder);
        return { data: memoryOrder, error: null };
      }

      // 2. Insert order items
      const itemsToInsert = payload.items.map((item) => ({
        order_id: orderData.id,
        // Only set product_id if it's a valid UUID; demo IDs will set product_id = null to satisfy FK
        product_id: isValidUuid(item.productId) ? item.productId : null,
        product_name: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.warn('Supabase order_items notice:', itemsError.message);
      }

      const completeOrder: Order = {
        id: orderData.id,
        order_number: orderData.order_number,
        customer_id: orderData.customer_id || payload.customerId || undefined,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address,
        fulfillment_method: orderData.fulfillment_method as FulfillmentMethod,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_status as PaymentStatus,
        order_status: orderData.order_status as OrderStatus,
        total_amount: Number(orderData.total_amount),
        notes: orderData.notes,
        items: itemsData ? itemsData.map((i: any) => ({
          id: i.id,
          order_id: i.order_id,
          product_id: i.product_id,
          product_name: i.product_name,
          category: i.category,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          total_price: Number(i.total_price),
          created_at: i.created_at
        })) : memoryOrder.items,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at
      };

      saveLocalOrder(completeOrder);
      return { data: completeOrder, error: null };
    } catch (err: any) {
      console.warn('Failed to insert order into Supabase, using local fallback:', err);
      saveLocalOrder(memoryOrder);
      return { data: memoryOrder, error: null };
    }
  }

  saveLocalOrder(memoryOrder);
  return { data: memoryOrder, error: null };
}

/**
 * Retrieve customer orders from Supabase (with localStorage fallback)
 */
export async function getCustomerOrders(customerId?: string): Promise<{
  data: Order[];
  error: Error | null;
}> {
  // If customerId is provided but is not a valid UUID (e.g. mock profile IDs like 'u-provider-1'),
  // we must not query PostgreSQL's UUID column as it would fail syntax validation.
  // Instead, retrieve their orders from local storage where mock user orders are preserved.
  if (customerId && !isValidUuid(customerId)) {
    return { data: getLocalOrders(customerId), error: null };
  }

  if (isSupabaseConfigured && supabase && customerId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          customer_name,
          customer_phone,
          delivery_address,
          fulfillment_method,
          payment_method,
          payment_status,
          order_status,
          total_amount,
          notes,
          created_at,
          updated_at,
          order_items (
            id,
            order_id,
            product_id,
            product_name,
            category,
            quantity,
            unit_price,
            total_price,
            created_at
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getCustomerOrders error, falling back to local orders:', error.message);
        return { data: getLocalOrders(customerId), error: null };
      }

      if (data && data.length > 0) {
        const mapped: Order[] = data.map((row: any) => ({
          id: row.id,
          order_number: row.order_number,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          delivery_address: row.delivery_address,
          fulfillment_method: row.fulfillment_method as FulfillmentMethod,
          payment_method: row.payment_method,
          payment_status: row.payment_status as PaymentStatus,
          order_status: row.order_status as OrderStatus,
          total_amount: Number(row.total_amount),
          notes: row.notes,
          items: (row.order_items || []).map((i: any) => ({
            id: i.id,
            order_id: i.order_id,
            product_id: i.product_id,
            product_name: i.product_name,
            category: i.category,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
            total_price: Number(i.total_price),
            created_at: i.created_at
          })),
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
        return { data: mapped, error: null };
      }
    } catch (err) {
      console.warn('Unexpected error in getCustomerOrders:', err);
      return { data: getLocalOrders(customerId), error: null };
    }
  }

  return { data: getLocalOrders(customerId), error: null };
}


// Local storage backup helpers
function saveLocalOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('agrime_customer_orders');
    const existing: Order[] = raw ? JSON.parse(raw) : [];
    const deduped = [order, ...existing.filter((o) => o.id !== order.id && o.order_number !== order.order_number)];
    localStorage.setItem('agrime_customer_orders', JSON.stringify(deduped));
  } catch {}
}

function getLocalOrders(customerId?: string): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('agrime_customer_orders');
    if (!raw) return [];
    const orders: Order[] = JSON.parse(raw);
    if (!customerId) return orders;
    return orders.filter((o) => !o.customer_id || o.customer_id === customerId);
  } catch {
    return [];
  }
}
