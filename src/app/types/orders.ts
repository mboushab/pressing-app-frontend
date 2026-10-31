export type OrderStatus =
  | 'REQUESTED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'AT_CENTER'
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'RETURN_SCHEDULED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COLLECTED'
  | 'COMPLETED'
  | 'CANCELLED';
export type PickupMode = 'HOME_PICKUP' | 'SELF_DROPOFF';
export type ReturnMode = 'HOME_DELIVERY' | 'PICKUP_AT_CENTER';
export type PaymentMethod = 'CASH' | 'BANKILY' | 'MASRIVI' | 'SEDAD' | 'OTHER';
export type HandoverKind =
  | 'CUSTOMER_TO_COURIER'
  | 'COURIER_TO_CENTER'
  | 'CUSTOMER_TO_CENTER'
  | 'CENTER_TO_COURIER'
  | 'COURIER_TO_CUSTOMER'
  | 'CENTER_TO_CUSTOMER';
export type IssueType =
  | 'COUNT_MISMATCH'
  | 'HANDOVER_OVERDUE'
  | 'PIN_LOCKED'
  | 'MISSION_FAILED'
  | 'CUSTOMER_DISPUTE'
  | 'CENTER_CLOSED'
  | 'NO_COURIER';

/** An app order in the pressing's list. Amounts are strings with 2 decimals. */
export interface OrderSummary {
  id: string;
  number: number;
  center_id: string;
  status: OrderStatus;
  pickup_mode: PickupMode;
  return_mode: ReturnMode;
  items_total: string;
  delivery_fee_total: string;
  delivery_fee_status: 'UNPAID' | 'COLLECTED_BY_COURIER' | 'PAID';
  declared_count: number;
  created_at: string;
  customer_name: string | null;
  customer_phone: string;
  open_issues?: number;
  pickup_at?: string | null;
  return_at?: string | null;
}

export interface OrderItem {
  clothes_id: string | null;
  name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Address {
  label: string | null;
  address_text: string;
  landmark: string | null;
}

export interface Handover {
  id: string;
  kind: HandoverKind;
  method: 'PIN' | 'BUTTON';
  status: 'PENDING' | 'CONFIRMED' | 'RESOLVED' | 'CANCELLED';
  item_count: number | null;
  due_at: string | null;
}

/** Someone who had the clothes: the customer, a courier, or the pressing (with the staff member). */
export interface CustodyParty {
  type: 'CUSTOMER' | 'COURIER' | 'CENTER';
  name: string | null;
  phone?: string;
  staff?: string | null;
}

/** One handover of the chain of custody. */
export interface CustodyStep {
  id: string;
  kind: HandoverKind;
  from: CustodyParty;
  to: CustodyParty;
  at: string;
  /** PIN = customer's code, BUTTON = pressing's confirmation, MANUAL = settled by a person */
  proof: 'PIN' | 'BUTTON' | 'MANUAL';
  note: string | null;
  item_count: number | null;
  location: { latitude: number; longitude: number; accuracy_m: number | null } | null;
  photos: { id: string; url: string; created_at: string }[];
}

export interface Custody {
  holder: CustodyParty | null;
  steps: CustodyStep[];
}

export interface Issue {
  id: string;
  type: IssueType;
  status: 'OPEN' | 'RESOLVED';
  details: Record<string, unknown> | null;
  resolution: string | null;
  created_at: string;
}

/** An order as the pressing sees it (the customer's name and phone only). */
export interface OrderDetail extends Omit<OrderSummary, 'customer_name' | 'customer_phone'> {
  pickup_fee: string;
  return_fee: string;
  pickup_address: Address | null;
  return_address: Address | null;
  picked_count: number | null;
  received_count: number | null;
  note: string | null;
  invoice_id: string | null;
  cancel_reason: string | null;
  /** the pressing could not receive the clothes: the customer chooses another pressing or date */
  center_unavailable_at: string | null;
  center_unavailable_reason: string | null;
  /** collection as soon as possible (no slot): the courier is due at pickup_due_at */
  pickup_asap: boolean;
  pickup_due_at: string | null;
  customer: { name: string | null; phone: string };
  items: OrderItem[];
  slots: { pickup?: { starts_at: string; ends_at: string }; return?: { starts_at: string; ends_at: string } };
  cleaning_payment: { status: 'not_paid' | 'partial_paid' | 'paid'; amount: string; paid_amount: string } | null;
  pending_change: { id: string; return_mode: ReturnMode; return_slot_id: string | null } | null;
  handovers: Handover[];
  missions: { id: string; leg: 'PICKUP' | 'RETURN'; status: string; courier_name: string | null }[];
  issues: Issue[];
  delivery_payments: {
    id: string;
    amount: string;
    method: PaymentMethod;
    collected_by_type: 'COURIER' | 'CENTER';
    status: 'COLLECTED' | 'RECEIVED' | 'VOIDED';
    created_at: string;
  }[];
  timeline: { type: string; to_status: OrderStatus | null; actor_type: string; note: string | null; created_at: string }[];
}

export interface OpenIssue {
  id: string;
  order_id: string;
  number: number;
  type: IssueType;
  details: Record<string, unknown> | null;
  created_at: string;
  center_name?: string;
}

export interface CourierCash {
  id: string;
  order_id: string;
  number: number;
  amount: string;
  method: PaymentMethod;
  reference: string | null;
  created_at: string;
  courier_name: string | null;
  courier_phone: string | null;
}

export interface Mission {
  id: string;
  leg: 'PICKUP' | 'RETURN';
  status: 'UNASSIGNED' | 'ASSIGNED';
  order_id: string;
  number: number;
  order_status: OrderStatus;
  center_name: string;
  starts_at: string | null;
  ends_at: string | null;
  courier_id: string | null;
  courier_name: string | null;
  address: Address | null;
  customer_name: string | null;
  customer_phone: string;
}

export interface Courier {
  id: string;
  phone: string;
  name: string;
  center_id: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
}
