import { Component, inject, input, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, merge, of, switchMap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { InvoiceService } from '../../services/invoice-service';
import { ClothesStatus, InvoiceDetails, PaymentStatus } from '../../types/invoice';
import { classNames } from '../../shared/styles/class-names';
import {
  clothesStatusClass,
  clothesStatusLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from '../../shared/status';
import { ToastService } from '../../shared/toast/toast.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService } from '../../shared/i18n/i18n.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';

@Component({
  selector: 'app-invoice-details',
  imports: [...I18N_PIPES, ReactiveFormsModule, MatIcon],
  templateUrl: './invoice-details-component.html',
  styleUrl: './invoice-details-component.css',
})
export class InvoiceDetailsComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly confirm = inject(ConfirmService);

  invoiceID = input<string | null>(null);

  readonly classNames = classNames;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly paymentStatusClass = paymentStatusClass;
  readonly clothesStatusLabel = clothesStatusLabel;
  readonly clothesStatusClass = clothesStatusClass;

  readonly showPartialForm = signal(false);
  readonly partialAmountControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0.01),
  ]);

  // reload when another invoice is selected or when the invoice list is refreshed
  private readonly invoiceDetails$ = merge(
    toObservable(this.invoiceID),
    this.invoiceService.refresh$.pipe(map(() => this.invoiceID())),
  ).pipe(
    switchMap((invoiceId) =>
      this.invoiceService.getInvoiceDetails(invoiceId).pipe(
        catchError((error) => {
          console.error('Error while fetching invoice', error);
          return of(null);
        }),
      ),
    ),
  );

  readonly selectedInvoice = toSignal(this.invoiceDetails$, { initialValue: null });

  balance(invoice: InvoiceDetails): number {
    return Number(invoice.amount) - Number(invoice.paid_amount);
  }

  async setClothesStatus(clothes_status: ClothesStatus): Promise<void> {
    const invoice = this.selectedInvoice();
    if (!invoice) return;
    const ready = clothes_status === 'cleaned';
    const confirmed = await this.confirm.ask({
      title: this.i18n.t(ready ? 'confirm.clothes_ready_title' : 'confirm.clothes_to_clean_title'),
      message: this.i18n.t(
        ready ? 'confirm.clothes_ready_message' : 'confirm.clothes_to_clean_message',
        { name: invoice.client.name },
      ),
      confirmLabel: this.i18n.t(ready ? 'confirm.clothes_ready_ok' : 'confirm.clothes_to_clean_ok'),
    });
    if (!confirmed) return;

    this.invoiceService.updateClothesStatus(invoice.id, clothes_status).subscribe({
      next: () => {
        this.toast.success(
          this.i18n.t(ready ? 'toast.clothes_ready' : 'toast.clothes_to_clean', {
            name: invoice.client.name,
          }),
        );
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error(this.i18n.t('toast.clothes_error')),
    });
  }

  async markPaid(invoice: InvoiceDetails): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.paid_title'),
      message: this.i18n.t('confirm.paid_message', {
        name: invoice.client.name,
        amount: this.i18n.money(invoice.amount),
      }),
      confirmLabel: this.i18n.t('common.confirm'),
    });
    if (confirmed) this.savePayment(invoice, 'paid');
  }

  async markNotPaid(invoice: InvoiceDetails): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.not_paid_title'),
      message: this.i18n.t('confirm.not_paid_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.not_paid_ok'),
      tone: 'danger',
    });
    if (confirmed) this.savePayment(invoice, 'not_paid');
  }

  openPartialForm(invoice: InvoiceDetails): void {
    this.partialAmountControl.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(Number(invoice.amount)),
    ]);
    this.partialAmountControl.setValue(Number(invoice.paid_amount) || null);
    this.showPartialForm.set(true);
  }

  async submitPartialPayment(invoice: InvoiceDetails): Promise<void> {
    const amount = this.partialAmountControl.value;
    if (amount === null || this.partialAmountControl.invalid) {
      this.partialAmountControl.markAsTouched();
      return;
    }
    // paying the whole amount is simply "paid"
    if (amount >= Number(invoice.amount)) {
      await this.markPaid(invoice);
      return;
    }
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.partial_title'),
      message: this.i18n.t('confirm.partial_message', {
        name: invoice.client.name,
        amount: this.i18n.money(amount),
        rest: this.i18n.money(Number(invoice.amount) - amount),
      }),
      confirmLabel: this.i18n.t('common.confirm'),
    });
    if (confirmed) this.savePayment(invoice, 'partial_paid', amount);
  }

  private savePayment(invoice: InvoiceDetails, status: PaymentStatus, paid_amount?: number): void {
    this.invoiceService.updatePaymentStatus(invoice.id, status, paid_amount).subscribe({
      next: () => {
        this.toast.success(
          this.i18n.t('toast.payment_updated', { status: this.i18n.t(paymentStatusLabel[status]) }),
        );
        this.showPartialForm.set(false);
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error(this.i18n.t('toast.payment_error')),
    });
  }
}
