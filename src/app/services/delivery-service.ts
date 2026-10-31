import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { DeliverySlot, FeeRule, SlotGeneration, SlotKind } from '../types/delivery';
import { Courier, Mission, OpenIssue } from '../types/orders';

/** Slots and delivery fees, managed by the platform admin. */
@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly http = inject(HttpClient);

  // slots: any pressing for the platform admin (/api/admin), or the user's own pressing (/api/center)
  private slotsPath(own: boolean) {
    return own ? '/api/center/slots' : '/api/admin/slots';
  }

  /** from/to are calendar days (YYYY-MM-DD), both included; centerId null = the user's own pressing. */
  getSlots(centerId: string | null, from: string, to: string) {
    const params: Record<string, string> = centerId ? { center_id: centerId, from, to } : { from, to };
    return this.http.get<DeliverySlot[]>(this.slotsPath(!centerId), { params });
  }

  generateSlots(body: SlotGeneration) {
    return this.http.post<{ created: number; skipped: number; outside_hours: number }>(
      `${this.slotsPath(!body.center_id)}/generate`,
      body,
    );
  }

  updateSlot(id: string, changes: Partial<Pick<DeliverySlot, 'capacity' | 'status'>>, own = false) {
    return this.http.patch<DeliverySlot>(`${this.slotsPath(own)}/${id}`, changes);
  }

  deleteSlot(id: string, own = false) {
    return this.http.delete(`${this.slotsPath(own)}/${id}`);
  }

  getFeeRules(centerId: string) {
    return this.http.get<{ current: Partial<Record<SlotKind, FeeRule>>; rules: FeeRule[] }>(
      '/api/admin/fee-rules',
      { params: { center_id: centerId } },
    );
  }

  missions() {
    return this.http.get<Mission[]>('/api/admin/missions');
  }

  assignMission(missionId: string, courierId: string) {
    return this.http.post(`/api/admin/missions/${missionId}/assign`, { courier_id: courierId });
  }

  couriers() {
    return this.http.get<Courier[]>('/api/admin/couriers');
  }

  createCourier(courier: { name: string; phone: string }) {
    return this.http.post<Courier>('/api/admin/couriers', courier);
  }

  setCourierStatus(id: string, status: Courier['status']) {
    return this.http.patch<Courier>(`/api/admin/couriers/${id}`, { status });
  }

  issues() {
    return this.http.get<OpenIssue[]>('/api/admin/issues');
  }

  resolveIssue(issueId: string, resolution: string) {
    return this.http.post(`/api/admin/issues/${issueId}/resolve`, { resolution });
  }

  /** Default amount of a leg for every pressing. */
  setDefaultFee(leg: SlotKind, amount: number) {
    return this.http.post<FeeRule>('/api/admin/fee-rules', { leg, amount });
  }
}
