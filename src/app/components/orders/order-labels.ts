import { inject, Injectable } from '@angular/core';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';
import { HandoverKind, IssueType, OrderStatus, PaymentMethod, PickupMode, ReturnMode } from '../../types/orders';

// colour of each status badge
const STATUS_TONE: Record<OrderStatus, string> = {
  REQUESTED: 'bg-slate-100 text-slate-700',
  PICKUP_ASSIGNED: 'bg-sky-100 text-sky-800',
  PICKED_UP: 'bg-sky-100 text-sky-800',
  AT_CENTER: 'bg-amber-100 text-amber-800',
  RECEIVED: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-violet-100 text-violet-800',
  READY: 'bg-emerald-100 text-emerald-800',
  RETURN_SCHEDULED: 'bg-emerald-100 text-emerald-800',
  OUT_FOR_DELIVERY: 'bg-sky-100 text-sky-800',
  DELIVERED: 'bg-teal-100 text-teal-800',
  COLLECTED: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

/** Translated names of the order vocabulary (statuses, modes, handovers…). */
@Injectable({ providedIn: 'root' })
export class OrderLabels {
  private readonly i18n = inject(I18nService);

  private key(prefix: string, value: string): string {
    return this.i18n.t(`${prefix}.${value}` as TranslationKey);
  }

  status(status: OrderStatus): string {
    return this.key('order.status', status);
  }

  statusTone(status: OrderStatus): string {
    return STATUS_TONE[status];
  }

  pickupMode(mode: PickupMode): string {
    return this.key('order.pickup_mode', mode);
  }

  returnMode(mode: ReturnMode): string {
    return this.key('order.return_mode', mode);
  }

  handover(kind: HandoverKind): string {
    return this.key('order.handover', kind);
  }

  issue(type: IssueType): string {
    return this.key('order.issue', type);
  }

  method(method: PaymentMethod): string {
    return this.key('order.method', method);
  }

  feeStatus(status: string): string {
    return this.key('order.fee_status', status);
  }

  event(type: string): string {
    const key = `order.event.${type}` as TranslationKey;
    const text = this.i18n.t(key);
    return text === key ? type : text;
  }
}
