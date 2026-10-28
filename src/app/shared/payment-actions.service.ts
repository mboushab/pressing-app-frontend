import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { InvoiceService } from '../services/invoice-service';
import { Invoice, PaymentStatus } from '../types/invoice';
import { ConfirmService } from './confirm/confirm.service';
import { I18nService } from './i18n/i18n.service';
import { PrintService } from './print/print.service';
import { paymentStatusLabel } from './status';
import { ToastService } from './toast/toast.service';

type PayableInvoice = Pick<Invoice, 'id' | 'amount' | 'paid_amount' | 'client'>;

/**
 * Payment changes shared by the invoice list and the invoice details:
 * each one is confirmed first, and a receipt can be printed after a payment.
 */
@Injectable({ providedIn: 'root' })
export class PaymentActions {
  private readonly invoiceService = inject(InvoiceService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly print = inject(PrintService);

  async markPaid(invoice: PayableInvoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.paid_title'),
      message: this.i18n.t('confirm.paid_message', {
        name: invoice.client.name,
        amount: this.i18n.money(invoice.amount),
      }),
      confirmLabel: this.i18n.t('common.confirm'),
    });
    if (confirmed && (await this.save(invoice, 'paid'))) await this.offerPrint(invoice);
  }

  async recordPartial(invoice: PayableInvoice): Promise<void> {
    const total = Number(invoice.amount);
    const amount = await this.confirm.askAmount({
      title: this.i18n.t('confirm.partial_title'),
      message: this.i18n.t('partial.message', {
        name: invoice.client.name,
        total: this.i18n.money(total),
        paid: this.i18n.money(invoice.paid_amount),
      }),
      confirmLabel: this.i18n.t('common.confirm'),
      label: this.i18n.t('invoice.amount_received_total'),
      initial: Number(invoice.paid_amount) || null,
      max: total,
      error: this.i18n.t('invoice.amount_range', { max: this.i18n.money(total) }),
      hint: (value) =>
        value >= total
          ? this.i18n.t('partial.hint_full')
          : this.i18n.t('partial.hint', { rest: this.i18n.money(total - value) }),
    });
    if (amount === null) return;
    // receiving the whole amount is simply "paid"
    const saved =
      amount >= total
        ? await this.save(invoice, 'paid')
        : await this.save(invoice, 'partial_paid', amount);
    if (saved) await this.offerPrint(invoice);
  }

  async markNotPaid(invoice: PayableInvoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.not_paid_title'),
      message: this.i18n.t('confirm.not_paid_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.not_paid_ok'),
      tone: 'danger',
    });
    if (confirmed) await this.save(invoice, 'not_paid');
  }

  printInvoice(invoice: PayableInvoice): Promise<void> {
    return this.print.printInvoice(invoice.id);
  }

  private async offerPrint(invoice: PayableInvoice): Promise<void> {
    const wantsPrint = await this.confirm.ask({
      title: this.i18n.t('print.offer_title'),
      message: this.i18n.t('print.offer_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('print.short'),
    });
    if (wantsPrint) await this.print.printInvoice(invoice.id);
  }

  private async save(
    invoice: PayableInvoice,
    status: PaymentStatus,
    paid_amount?: number,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.invoiceService.updatePaymentStatus(invoice.id, status, paid_amount),
      );
    } catch {
      this.toast.error(this.i18n.t('toast.payment_error'));
      return false;
    }
    this.toast.success(
      this.i18n.t('toast.payment_updated', { status: this.i18n.t(paymentStatusLabel[status]) }),
    );
    this.invoiceService.updateInvoiceList();
    return true;
  }
}
