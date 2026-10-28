export interface PeriodTotals {
  invoices: number;
  billed: number;
  collected: number;
  pieces: number;
  averageTicket: number;
  /** 0..1 share of the period's billing already paid */
  collectionRate: number;
  newClients: number;
  activeClients: number;
  returningClients: number;
}

export interface SeriesPoint {
  /** YYYY-MM-DD, or YYYY-MM for monthly series */
  bucket: string;
  billed: number;
  collected: number;
}

export interface DashboardStats {
  period: { from: string; to: string; days: number; granularity: 'day' | 'month' };
  previousPeriod: { from: string; to: string };
  current: PeriodTotals;
  previous: PeriodTotals;
  outstanding: { invoices: number; amount: number; olderThan30Days: number };
  series: SeriesPoint[];
  topItems: { product: string; quantity: number; revenue: number }[];
  topClients: {
    id: string;
    name: string;
    phone_number: string;
    invoices: number;
    billed: number;
    owed: number;
  }[];
}
