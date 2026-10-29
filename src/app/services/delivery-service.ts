import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { DeliverySlot, FeeRule, SlotGeneration, SlotKind } from '../types/delivery';
import { Courier, Mission, OpenIssue } from '../types/orders';

/** Slots and delivery fees, managed by the platform admin. */
@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly http = inject(HttpClient);

  /** from/to are calendar days (YYYY-MM-DD), both included. */
  getSlots(centerId: string, from: string, to: string) {
    const params = { center_id: centerId, from, to };
    return this.http.get<DeliverySlot[]>('/api/admin/slots', { params });
  }

  generateSlots(body: SlotGeneration) {
    return this.http.post<{ created: number; skipped: number }>('/api/admin/slots/generate', body);
  }

  updateSlot(id: string, changes: Partial<Pick<DeliverySlot, 'capacity' | 'status'>>) {
    return this.http.patch<DeliverySlot>(`/api/admin/slots/${id}`, changes);
  }

  deleteSlot(id: string) {
    return this.http.delete(`/api/admin/slots/${id}`);
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
