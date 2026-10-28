import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Invoice } from '../../types/invoice';
import { PaymentActions } from '../../shared/payment-actions.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { TranslatePipe } from '../../shared/i18n/i18n.pipes';
import { paymentStatusClass, paymentStatusLabel } from '../../shared/status';

/** Payment badge of an invoice row; clicking it opens the payment actions. */
@Component({
  selector: 'app-payment-menu',
  imports: [MatIcon, TranslatePipe],
  template: `
    <button
      type="button"
      [class]="
        paymentStatusClass[invoice().status] +
        ' cursor-pointer gap-0.5 hover:ring-2 hover:ring-offset-1 hover:ring-slate-300'
      "
      aria-haspopup="menu"
      [attr.aria-expanded]="position() !== null"
      [title]="'payment.change' | t"
      (click)="toggle($event)"
    >
      {{ paymentStatusLabel[invoice().status] | t }}
      <mat-icon class="!size-4 !text-[16px]">expand_more</mat-icon>
    </button>

    @if (position(); as pos) {
      <ul
        role="menu"
        class="fixed z-50 min-w-52 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
        [style.top.px]="pos.top"
        [style.left.px]="pos.left"
        [style.right.px]="pos.right"
      >
        @if (invoice().status !== 'paid') {
          <li role="none">
            <button role="menuitem" [class]="item" (click)="run($event, 'paid')">
              <mat-icon class="!text-green-600">payments</mat-icon> {{ 'invoice.paid_in_full' | t }}
            </button>
          </li>
          <li role="none">
            <button role="menuitem" [class]="item" (click)="run($event, 'partial')">
              <mat-icon class="!text-orange-500">price_change</mat-icon>
              {{ 'invoice.partial_payment' | t }}
            </button>
          </li>
        }
        @if (invoice().status !== 'not_paid') {
          <li role="none">
            <button role="menuitem" [class]="item" (click)="run($event, 'print')">
              <mat-icon class="!text-slate-500">print</mat-icon> {{ 'print.action' | t }}
            </button>
          </li>
          <li role="none" class="border-t border-slate-100 mt-1 pt-1">
            <button role="menuitem" [class]="item" (click)="run($event, 'not_paid')">
              <mat-icon class="!text-red-500">money_off</mat-icon> {{ 'invoice.mark_not_paid' | t }}
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class PaymentMenu {
  private readonly payments = inject(PaymentActions);
  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  invoice = input.required<Invoice>();

  readonly paymentStatusClass = paymentStatusClass;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly item =
    'flex w-full items-center gap-2 px-3 py-2 text-start text-slate-700 cursor-pointer hover:bg-slate-50';

  /** where the open menu is drawn (fixed, so the table's scroll area does not clip it) */
  readonly position = signal<{ top: number; left: number | null; right: number | null } | null>(
    null,
  );

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.position()) {
      this.position.set(null);
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const rtl = this.i18n.dir() === 'rtl';
    this.position.set({
      top: rect.bottom + 4,
      left: rtl ? null : rect.left,
      right: rtl ? window.innerWidth - rect.right : null,
    });
  }

  run(event: Event, action: 'paid' | 'partial' | 'not_paid' | 'print'): void {
    event.stopPropagation();
    this.position.set(null);
    const invoice = this.invoice();
    if (action === 'paid') void this.payments.markPaid(invoice);
    if (action === 'partial') void this.payments.recordPartial(invoice);
    if (action === 'not_paid') void this.payments.markNotPaid(invoice);
    if (action === 'print') void this.payments.printInvoice(invoice);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.position.set(null);
  }

  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  close(): void {
    this.position.set(null);
  }
}
