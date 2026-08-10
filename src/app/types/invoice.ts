export interface product {
  product: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: string;
}

export interface InvoiceDetails {
  id: string;
  client_id: string;
  amount: string;
  status: string;
  details: product[];
}
