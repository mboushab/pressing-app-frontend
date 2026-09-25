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

  setClothesStatus(clothes_status: ClothesStatus): void {
    const id = this.invoiceID();
    if (!id) return;
    this.invoiceService.updateClothesStatus(id, clothes_status).subscribe({
      next: () => {
        this.toast.success(
          this.i18n.t(clothes_status === 'cleaned' ? 'toast.clothes_ready' : 'toast.clothes_to_clean', {
            name: this.selectedInvoice()?.client.name ?? '',
          }),
        );
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error(this.i18n.t('toast.clothes_error')),
    });
  }

  setPaymentStatus(status: PaymentStatus, paid_amount?: number): void {
    const id = this.invoiceID();
    if (!id) return;
    this.invoiceService.updatePaymentStatus(id, status, paid_amount).subscribe({
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

  openPartialForm(invoice: InvoiceDetails): void {
    this.partialAmountControl.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(Number(invoice.amount)),
    ]);
    this.partialAmountControl.setValue(Number(invoice.paid_amount) || null);
    this.showPartialForm.set(true);
  }

  submitPartialPayment(invoice: InvoiceDetails): void {
    const amount = this.partialAmountControl.value;
    if (amount === null || this.partialAmountControl.invalid) {
      this.partialAmountControl.markAsTouched();
      return;
    }
    // paying the whole amount is simply "paid"
    if (amount >= Number(invoice.amount)) this.setPaymentStatus('paid');
    else this.setPaymentStatus('partial_paid', amount);
  }
}
