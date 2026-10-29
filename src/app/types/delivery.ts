export type SlotKind = 'PICKUP' | 'RETURN';

/** A delivery slot as the platform admin sees it. Dates are ISO strings. */
export interface DeliverySlot {
  id: string;
  center_id: string;
  kind: SlotKind;
  starts_at: string;
  ends_at: string;
  capacity: number;
  reserved_count: number;
  status: 'OPEN' | 'CLOSED';
}

export interface SlotGeneration {
  center_id: string;
  kind: SlotKind;
  /** YYYY-MM-DD, both included */
  from: string;
  to: string;
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[];
  /** HH:MM, Nouakchott time */
  times: { start: string; end: string }[];
  capacity: number;
}

/** Delivery fee of a leg; amount is a string with 2 decimals, like other amounts. */
export interface FeeRule {
  id: string;
  center_id: string | null;
  leg: SlotKind;
  type: 'FLAT';
  amount: string;
  active_from: string;
  active_to: string | null;
}
