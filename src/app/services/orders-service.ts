import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CourierCash, OpenIssue, OrderDetail, OrderSummary, PaymentMethod } from '../types/orders';

export type OrderGroup = 'incoming' | 'cleaning' | 'ready' | 'done';
export interface ItemCount {
  clothes_id: string;
  quantity: number;
}

/** App orders of the current pressing (the server limits everything to it). */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  list(group: OrderGroup) {
    return this.http.get<OrderSummary[]>('/api/center/orders', { params: { group } });
  }

  get(id: string) {
    return this.http.get<OrderDetail>(`/api/center/orders/${id}`);
  }

  /** Reception from a courier, with the pieces counted. */
  receive(id: string, itemCount: number) {
    return this.http.post<OrderDetail>(`/api/center/orders/${id}/receive`, { item_count: itemCount });
  }

  settleCount(id: string, resolution: string, items: ItemCount[]) {
    return this.http.post<OrderDetail>(`/api/center/orders/${id}/settle-count`, { resolution, items });
  }

  /** Pieces dropped off at the counter (null = as ordered). */
  countAtCounter(handoverId: string, items: ItemCount[] | null) {
    return this.http.put<{ item_count: number; items_total: string }>(
      `/api/center/handovers/${handoverId}/items`,
      items ? { items } : {},
    );
  }

  confirmWithPin(handoverId: string, pin: string) {
    return this.http.post<OrderDetail>(`/api/center/handovers/${handoverId}/confirm`, { pin });
  }

  resolveHandover(handoverId: string, reason: string, itemCount?: number) {
    return this.http.post<OrderDetail>(`/api/center/handovers/${handoverId}/resolve`, {
      reason,
      item_count: itemCount,
    });
  }

  step(id: string, to: 'IN_PROGRESS' | 'READY') {
    return this.http.post<OrderDetail>(`/api/center/orders/${id}/step`, { to });
  }

  handToCourier(id: string) {
    return this.http.post<OrderDetail>(`/api/center/orders/${id}/hand-to-courier`, {});
  }

  cancel(id: string, reason: string) {
    return this.http.post<OrderDetail>(`/api/center/orders/${id}/cancel`, { reason });
  }

  recordDeliveryPayment(id: string, payment: { amount: number; method: PaymentMethod; reference?: string }) {
    return this.http.post<OrderDetail>(`/api/center/orders/${id}/delivery-payments`, payment);
  }

  decideChange(requestId: string, approve: boolean) {
    return this.http.post<OrderDetail>(`/api/center/change-requests/${requestId}/decide`, { approve });
  }

  resolveIssue(issueId: string, resolution: string) {
    return this.http.post<OrderDetail>(`/api/center/issues/${issueId}/resolve`, { resolution });
  }

  issues() {
    return this.http.get<OpenIssue[]>('/api/center/issues');
  }

  courierCash() {
    return this.http.get<CourierCash[]>('/api/center/delivery-payments');
  }

  receiveCourierCash(paymentId: string) {
    return this.http.post(`/api/center/delivery-payments/${paymentId}/receive`, {});
  }
}
