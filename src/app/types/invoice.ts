export interface InvoiceDetailItem {
  product: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceClient {
  id: string;
  name: string;
  phone_number: string;
}

export type ClothesStatus = 'not_cleaned' | 'cleaned';
export type PaymentStatus = 'not_paid' | 'partial_paid' | 'paid';

export interface Invoice {
  id: string;
  client_id: string;
  amount: number;
  clothes_status: ClothesStatus;
  status: PaymentStatus;
  paid_amount: number;
  created_at: string;
  client: InvoiceClient;
}

export interface InvoiceDetails extends Invoice {
  details: InvoiceDetailItem[];
}

export interface CreateInvoicePayload {
  client_id: string;
  amount: number;
  status: PaymentStatus;
  paid_amount?: number;
  clothes_status: ClothesStatus;
  details: { product: string; quantity: number; unit_price: number }[];
}

/** @deprecated use InvoiceDetailItem */
export type product = InvoiceDetailItem;
