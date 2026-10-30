export type CenterStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

/** A pressing as the platform admin sees it. */
export interface Center {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: CenterStatus;
  suspended_reason: string | null;
  created_at: string;
  admins: { id: string; username: string }[];
  counts: { members: number; clients: number; invoices: number; orders: number };
}

export interface CenterDetails {
  name: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface NewAdmin {
  admin_username: string;
  admin_password: string;
}
