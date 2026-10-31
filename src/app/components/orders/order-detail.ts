import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { ItemCount, OrdersService } from '../../services/orders-service';
import { ClothesList } from '../../services/clothes-list';
import { UserService } from '../../services/user-sevice';
import { Clothe } from '../../types/clothes';
import { Custody, CustodyParty, Handover, Issue, OrderDetail as Order, PaymentMethod } from '../../types/orders';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';
import { OrderLabels } from './order-labels';

// server refusals with a message of their own
const ERROR_KEYS: Record<string, TranslationKey> = {
  PIN_INVALID: 'order.error.PIN_INVALID',
  PIN_LOCKED: 'order.error.PIN_LOCKED',
  PIN_NOT_ACTIVE: 'order.error.PIN_NOT_ACTIVE',
  CLEANING_NOT_PAID: 'order.error.CLEANING_NOT_PAID',
  COUNT_STILL_DIFFERENT: 'order.error.COUNT_STILL_DIFFERENT',
  NOT_CANCELLABLE: 'order.error.NOT_CANCELLABLE',
  SLOT_FULL: 'order.error.SLOT_FULL',
  INVALID_TRANSITION: 'order.error.INVALID_TRANSITION',
};

type Prompt = { kind: 'cancel' } | { kind: 'issue'; issue: Issue } | { kind: 'manual'; handover: Handover };

/** One app order at the pressing: what happened, and the next action to do. */
@Component({
  selector: 'app-order-detail',
  imports: [...I18N_PIPES, FormsModule, MatIcon],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly orders = inject(OrdersService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);
  readonly labels = inject(OrderLabels);
  readonly isAdmin = inject(UserService).isAdmin();

  readonly orderId = input.required<string>();
  /** something changed: the list is reloaded */
  readonly changed = output<void>();

  readonly classNames = classNames;
  readonly order = signal<Order | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  // forms of the current action
  readonly pin = signal('');
  readonly receivedCount = signal<number | null>(null);
  readonly counts = signal<ItemCount[]>([]);
  readonly resolution = signal('');
  readonly prompt = signal<Prompt | null>(null);
  readonly promptText = signal('');
  /** who had the clothes, loaded when the section is opened */
  readonly custody = signal<Custody | null>(null);
  readonly promptCount = signal<number | null>(null);
  readonly payment = signal<{ amount: number | null; method: PaymentMethod; reference: string }>({
    amount: null,
    method: 'CASH',
    reference: '',
  });
  readonly prices = signal<Clothe[]>([]);
  readonly methods: PaymentMethod[] = ['CASH', 'BANKILY', 'MASRIVI', 'SEDAD', 'OTHER'];

  readonly pending = computed(() => this.order()?.handovers.find((h) => h.status === 'PENDING') ?? null);
  readonly openIssues = computed(() => this.order()?.issues.filter((i) => i.status === 'OPEN') ?? []);
  readonly countIssue = computed(() => this.openIssues().find((i) => i.type === 'COUNT_MISMATCH') ?? null);
  readonly feeDue = computed(() => {
    const order = this.order();
    if (!order) return 0;
    const paid = order.delivery_payments
      .filter((p) => p.status !== 'VOIDED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return Math.max(0, Number(order.delivery_fee_total) - paid);
  });
  readonly countTotal = computed(() => this.counts().reduce((sum, c) => sum + c.quantity, 0));

  constructor() {
    inject(ClothesList)
      .getClothes()
      .subscribe((prices) => this.prices.set(prices));
  }

  ngOnInit(): void {
    this.load();
  }

  loadCustody(): void {
    this.orders.custody(this.orderId()).subscribe({
      next: (custody) => this.custody.set(custody),
      error: () => this.toast.error(this.i18n.t('order.error.load')),
    });
  }

  /** "Courier Ahmed (+222…)", "Pressing X — sidi", "Client Aïcha (+222…)" */
  partyLabel(party: CustodyParty | null): string {
    if (!party) return '—';
    const role = this.i18n.t(`custody.party.${party.type}` as TranslationKey);
    if (party.type === 'CENTER') return `${role} ${party.name ?? ''}${party.staff ? ` — ${party.staff}` : ''}`;
    return `${role} ${party.name ?? ''}${party.phone ? ` (${party.phone})` : ''}`;
  }

  proofLabel(step: Custody['steps'][number]): string {
    return this.i18n.t(`custody.proof.${step.proof}` as TranslationKey);
  }

  mapLink(location: { latitude: number; longitude: number }): string {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  /** A printable record (complaint, police): opens in a new window and prints. */
  printCustody(): void {
    const order = this.order();
    const custody = this.custody();
    if (!order || !custody) return;
    const esc = (value: unknown) =>
      String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const rows = custody.steps
      .map(
        (s, i) => `<tr>
          <td>${i + 1}</td><td>${esc(this.i18n.date(s.at, 'datetime'))}</td>
          <td>${esc(this.partyLabel(s.from))}</td><td>${esc(this.partyLabel(s.to))}</td>
          <td>${esc(this.proofLabel(s))}${s.note ? ` — ${esc(s.note)}` : ''}</td>
          <td>${esc(s.item_count ?? '')}</td>
          <td>${s.location ? `${s.location.latitude}, ${s.location.longitude}` : '—'}</td>
          <td>${s.photos.map((p) => `<img src="${esc(p.url)}">`).join('')}</td></tr>`,
      )
      .join('');
    const html = `<!doctype html><html lang="${this.i18n.lang()}" dir="${this.i18n.lang() === 'ar' ? 'rtl' : 'ltr'}">
      <head><meta charset="utf-8"><title>${esc(this.i18n.t('custody.title'))} #${order.number}</title>
      <style>body{font-family:system-ui,sans-serif;font-size:12px;margin:24px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #999;padding:4px;vertical-align:top;text-align:start}img{width:80px;margin:2px}</style></head>
      <body><h1>${esc(this.i18n.t('custody.title'))} — #${order.number}</h1>
      <p>${esc(this.i18n.t('custody.holder'))} : <b>${esc(this.partyLabel(custody.holder))}</b></p>
      <p>${esc(this.i18n.t('custody.printed', { date: this.i18n.date(new Date(), 'datetime') }))}</p>
      <table><thead><tr><th>#</th><th>${esc(this.i18n.t('custody.col.at'))}</th><th>${esc(this.i18n.t('custody.col.from'))}</th>
      <th>${esc(this.i18n.t('custody.col.to'))}</th><th>${esc(this.i18n.t('custody.col.proof'))}</th>
      <th>${esc(this.i18n.t('custody.col.pieces'))}</th><th>GPS</th><th>${esc(this.i18n.t('custody.col.photos'))}</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
    const page = window.open('', '_blank');
    if (!page) return this.toast.error(this.i18n.t('custody.popup_blocked'));
    page.document.write(html);
    page.document.close();
    // print once the photos are loaded
    page.onload = () => page.print();
  }

  load(): void {
    this.orders.get(this.orderId()).subscribe({
      next: (order) => this.show(order),
      error: () => this.error.set(this.i18n.t('order.error.load')),
    });
  }

  private show(order: Order): void {
    this.order.set(order);
    this.pin.set('');
    this.error.set(null);
    this.receivedCount.set(order.picked_count);
    this.counts.set(
      order.items.filter((i) => i.clothes_id).map((i) => ({ clothes_id: i.clothes_id!, quantity: i.quantity })),
    );
    this.resolution.set('');
    this.payment.set({ amount: this.feeDue() || null, method: 'CASH', reference: '' });
  }

  /** Sends an action; the order shown is the one the server answers. */
  private run(request: Observable<unknown>, success: TranslationKey, reload = false): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: (result) => {
        this.busy.set(false);
        this.toast.success(this.i18n.t(success));
        this.prompt.set(null);
        if (!reload && result && typeof result === 'object' && 'status' in result) this.show(result as Order);
        else this.load();
        this.changed.emit();
      },
      error: (err) => {
        this.busy.set(false);
        const key = ERROR_KEYS[err.error?.code];
        this.error.set(key ? this.i18n.t(key) : this.i18n.t('order.error.action'));
        // a wrong code changes what the server knows (attempts): show it
        if (err.error?.code?.startsWith('PIN')) this.load();
      },
    });
  }

  // ---- articles -----------------------------------------------------------

  priceName(id: string): string {
    return (
      this.prices().find((p) => p.id === id)?.name ??
      this.order()?.items.find((i) => i.clothes_id === id)?.name ??
      '?'
    );
  }

  setQuantity(index: number, quantity: number): void {
    this.counts.update((counts) =>
      counts.map((c, i) => (i === index ? { ...c, quantity: Math.max(0, Math.round(quantity || 0)) } : c)),
    );
  }

  addArticle(clothesId: string): void {
    if (!clothesId) return;
    this.counts.update((counts) =>
      counts.some((c) => c.clothes_id === clothesId)
        ? counts.map((c) => (c.clothes_id === clothesId ? { ...c, quantity: c.quantity + 1 } : c))
        : [...counts, { clothes_id: clothesId, quantity: 1 }],
    );
  }

  private countedItems(): ItemCount[] {
    return this.counts().filter((c) => c.quantity > 0);
  }

  // ---- actions ------------------------------------------------------------

  countAtCounter(handover: Handover): void {
    this.busy.set(true);
    this.orders.countAtCounter(handover.id, this.countedItems()).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: () => {
        this.busy.set(false);
        this.error.set(this.i18n.t('order.error.action'));
      },
    });
  }

  confirmPin(handover: Handover): void {
    if (!/^\d{4}$/.test(this.pin())) return this.error.set(this.i18n.t('order.error.PIN_FORMAT'));
    this.run(this.orders.confirmWithPin(handover.id, this.pin()), 'order.toast.handover_confirmed');
  }

  async receive(): Promise<void> {
    const order = this.order()!;
    const count = this.receivedCount();
    if (count === null || count < 0) return this.error.set(this.i18n.t('order.error.count'));
    if (count !== order.picked_count) {
      const ok = await this.confirm.ask({
        title: this.i18n.t('order.receive_mismatch_title'),
        message: this.i18n.t('order.receive_mismatch', { expected: order.picked_count ?? 0, received: count }),
        confirmLabel: this.i18n.t('order.receive'),
        tone: 'danger',
      });
      if (!ok) return;
    }
    this.run(this.orders.receive(order.id, count), 'order.toast.received');
  }

  settleCount(): void {
    if (!this.resolution().trim()) return this.error.set(this.i18n.t('order.error.resolution'));
    this.run(
      this.orders.settleCount(this.order()!.id, this.resolution().trim(), this.countedItems()),
      'order.toast.count_settled',
    );
  }

  async step(to: 'IN_PROGRESS' | 'READY'): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t(to === 'IN_PROGRESS' ? 'order.start_cleaning' : 'order.mark_ready'),
      message: this.i18n.t('order.confirm_step', { number: this.order()!.number, status: this.labels.status(to) }),
      confirmLabel: this.i18n.t('common.confirm'),
    });
    if (ok) this.run(this.orders.step(this.order()!.id, to), 'order.toast.updated');
  }

  async handToCourier(): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('order.hand_to_courier'),
      message: this.i18n.t('order.confirm_hand_to_courier', { number: this.order()!.number }),
      confirmLabel: this.i18n.t('common.confirm'),
    });
    if (ok) this.run(this.orders.handToCourier(this.order()!.id), 'order.toast.handed');
  }

  async decideChange(approve: boolean): Promise<void> {
    const change = this.order()!.pending_change!;
    const ok = await this.confirm.ask({
      title: this.i18n.t(approve ? 'order.change_approve' : 'order.change_reject'),
      message: this.i18n.t('order.change_message', { mode: this.labels.returnMode(change.return_mode) }),
      confirmLabel: this.i18n.t(approve ? 'order.change_approve' : 'order.change_reject'),
      tone: approve ? 'primary' : 'danger',
    });
    if (ok) this.run(this.orders.decideChange(change.id, approve), 'order.toast.updated');
  }

  async recordPayment(): Promise<void> {
    const { amount, method, reference } = this.payment();
    if (!amount || amount <= 0) return this.error.set(this.i18n.t('order.error.amount'));
    const ok = await this.confirm.ask({
      title: this.i18n.t('order.fee_record'),
      message: this.i18n.t('order.confirm_fee', { amount: this.i18n.money(amount), method: this.labels.method(method) }),
      confirmLabel: this.i18n.t('common.confirm'),
    });
    if (ok) {
      this.run(
        this.orders.recordDeliveryPayment(this.order()!.id, { amount, method, reference: reference.trim() || undefined }),
        'order.toast.payment',
      );
    }
  }

  updatePayment(changes: Partial<{ amount: number | null; method: PaymentMethod; reference: string }>): void {
    this.payment.update((p) => ({ ...p, ...changes }));
  }

  openPrompt(prompt: Prompt): void {
    this.promptText.set('');
    this.promptCount.set(this.order()?.picked_count ?? null);
    this.error.set(null);
    this.prompt.set(prompt);
  }

  submitPrompt(): void {
    const prompt = this.prompt();
    const text = this.promptText().trim();
    if (!prompt || !text) return this.error.set(this.i18n.t('order.error.resolution'));
    if (prompt.kind === 'cancel') {
      this.run(this.orders.cancel(this.order()!.id, text), 'order.toast.cancelled');
    } else if (prompt.kind === 'issue') {
      this.run(this.orders.resolveIssue(prompt.issue.id, text), 'order.toast.issue_resolved');
    } else {
      const count = prompt.handover.kind === 'COURIER_TO_CENTER' ? (this.promptCount() ?? undefined) : undefined;
      this.run(this.orders.resolveHandover(prompt.handover.id, text, count), 'order.toast.handover_confirmed');
    }
  }

  /** Collections and drop-offs are confirmed only once the pieces are counted. */
  needsCount(handover: Handover): boolean {
    return ['CUSTOMER_TO_COURIER', 'CUSTOMER_TO_CENTER'].includes(handover.kind) && handover.item_count === null;
  }

  waiting(status: Order['status']): string {
    return this.i18n.t(`order.waiting.${status}` as TranslationKey);
  }

  cleaningPayment(order: Order): string {
    return order.cleaning_payment
      ? this.i18n.t(`payment.${order.cleaning_payment.status}` as TranslationKey)
      : this.i18n.t('order.invoice_later');
  }

  issueDetails(issue: Issue): string {
    const d = issue.details ?? {};
    if (issue.type === 'COUNT_MISMATCH') {
      return this.i18n.t('order.issue_count', { expected: String(d['expected']), received: String(d['received']) });
    }
    if (issue.type === 'MISSION_FAILED' || issue.type === 'CUSTOMER_DISPUTE') {
      return String(d['reason'] ?? d['message'] ?? '');
    }
    if (issue.type === 'HANDOVER_OVERDUE' || issue.type === 'PIN_LOCKED') {
      return d['kind'] ? this.labels.handover(d['kind'] as Handover['kind']) : '';
    }
    if (issue.type === 'NO_COURIER') return this.i18n.t('order.issue_no_courier');
    if (issue.type === 'CENTER_CLOSED') {
      // a delivery on a closed day, or a courier keeping the clothes until the opening
      return d['leg'] === 'RETURN'
        ? this.i18n.t('order.issue_closed_return', { day: this.i18n.date(`${d['day']}T12:00:00Z`, 'date') })
        : this.i18n.t('order.issue_closed_pickup', {
            opening: d['next_opening'] ? this.i18n.date(String(d['next_opening']), 'short') : '—',
          });
    }
    return '';
  }
}
