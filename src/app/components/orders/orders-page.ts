import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { OrderGroup, OrdersService } from '../../services/orders-service';
import { CourierCash, OpenIssue, OrderSummary } from '../../types/orders';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { Drawer } from '../../shared/drawer/drawer';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService } from '../../shared/i18n/i18n.service';
import { OrderLabels } from './order-labels';
import { OrderDetail } from './order-detail';

type Tab = OrderGroup | 'issues' | 'cash';

/** Orders placed in the mobile app, for the pressing's staff. */
@Component({
  selector: 'app-orders-page',
  imports: [...I18N_PIPES, MatIcon, Drawer, OrderDetail],
  templateUrl: './orders-page.html',
})
export class OrdersPage {
  private readonly orders = inject(OrdersService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);
  readonly labels = inject(OrderLabels);

  readonly classNames = classNames;
  readonly tabs = [
    { key: 'incoming', label: 'orders.tab.incoming', icon: 'move_to_inbox' },
    { key: 'cleaning', label: 'orders.tab.cleaning', icon: 'local_laundry_service' },
    { key: 'ready', label: 'orders.tab.ready', icon: 'check_circle' },
    { key: 'done', label: 'orders.tab.done', icon: 'inventory' },
    { key: 'issues', label: 'orders.tab.issues', icon: 'warning' },
    { key: 'cash', label: 'orders.tab.cash', icon: 'payments' },
  ] as const;
  readonly tab = signal<Tab>('incoming');
  readonly list = signal<OrderSummary[]>([]);
  readonly issues = signal<OpenIssue[]>([]);
  readonly cash = signal<CourierCash[]>([]);
  readonly loaded = signal(false);
  readonly selected = signal<string | null>(null);

  constructor() {
    this.load();
  }

  select(tab: Tab): void {
    this.tab.set(tab);
    this.load();
  }

  load(): void {
    this.loaded.set(false);
    const tab = this.tab();
    const fail = () => this.toast.error(this.i18n.t('order.error.load'));
    if (tab === 'issues') {
      this.orders.issues().subscribe({ next: (rows) => this.done(() => this.issues.set(rows)), error: fail });
    } else if (tab === 'cash') {
      this.orders.courierCash().subscribe({ next: (rows) => this.done(() => this.cash.set(rows)), error: fail });
    } else {
      this.orders.list(tab).subscribe({ next: (rows) => this.done(() => this.list.set(rows)), error: fail });
    }
  }

  private done(apply: () => void): void {
    apply();
    this.loaded.set(true);
  }

  async receiveCash(payment: CourierCash): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('orders.cash_receive'),
      message: this.i18n.t('orders.cash_confirm', {
        amount: this.i18n.money(payment.amount),
        courier: payment.courier_name ?? '',
        number: payment.number,
      }),
      confirmLabel: this.i18n.t('orders.cash_receive'),
    });
    if (!ok) return;
    this.orders.receiveCourierCash(payment.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('order.toast.payment'));
        this.load();
      },
      error: () => this.toast.error(this.i18n.t('order.error.action')),
    });
  }
}
