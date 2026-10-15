export type OrderStatus =
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

// Los únicos dos estados de los que ya no se puede salir.
export const FINAL_ORDER_STATUSES: OrderStatus[] = [
  'delivered',
  'cancelled'
];

// Orden en la que avanza un pedido cuando el admin lo "avanza" un paso.
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'paid',
  'processing',
  'shipped',
  'delivered'
];

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: number;
  userId: number;
  client: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal?: number;
  costoEnvio?: number;
  total: number;
  shippingAddress: string;
  status: OrderStatus;
  trackingNumber: string;
  statusHistory: OrderStatusEvent[];
  createdAt: string;
}

export function nextStatus(
  status: OrderStatus
): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(status);

  if (
    idx === -1 ||
    idx === ORDER_STATUS_FLOW.length - 1
  ) {
    return null;
  }

  return ORDER_STATUS_FLOW[idx + 1];
}

export function isFinalStatus(
  status: OrderStatus
): boolean {
  return FINAL_ORDER_STATUSES.includes(status);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> =
  window.location.pathname === '/en' ||
  window.location.pathname.startsWith('/en/')
    ? {
        paid: 'Paid',
        processing: 'Preparing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      }
    : {
        paid: 'Pagado',
        processing: 'En preparación',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
      };