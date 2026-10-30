import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Center, CenterDetails, CenterStatus, NewAdmin } from '../types/centers';

/** Pressings of the platform, managed by the platform admin. */
@Injectable({ providedIn: 'root' })
export class CentersService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Center[]>('/api/admin/centers');
  }

  /** A new active pressing and its first admin. */
  create(body: CenterDetails & NewAdmin) {
    return this.http.post<{ center: Center; admin: { id: string; username: string } }>('/api/admin/centers', body);
  }

  update(id: string, changes: Partial<CenterDetails>) {
    return this.http.patch<Center>(`/api/admin/centers/${id}`, changes);
  }

  setStatus(id: string, status: Exclude<CenterStatus, 'PENDING'>, reason?: string) {
    return this.http.patch<Center>(`/api/admin/centers/${id}`, { status, suspended_reason: reason });
  }

  /** Only a pressing without clients, invoices or orders (409 CENTER_HAS_DATA otherwise). */
  remove(id: string) {
    return this.http.delete(`/api/admin/centers/${id}`);
  }

  addAdmin(id: string, admin: NewAdmin) {
    return this.http.post<{ id: string; username: string }>(`/api/admin/centers/${id}/admins`, admin);
  }
}
