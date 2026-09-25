import { Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
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

@Component({
  selector: 'app-invoice-details',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatIcon],
  templateUrl: './invoice-details-component.html',
  styleUrl: './invoice-details-component.css',
})
export class InvoiceDetailsComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);

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
        this.toast.success(`Clothes marked as ${clothesStatusLabel[clothes_status].toLowerCase()}.`);
        this.invoiceService.updateInvoiceList();
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed to update clothes status.'),
    });
  }

  setPaymentStatus(status: PaymentStatus, paid_amount?: number): void {
    const id = this.invoiceID();
    if (!id) return;
    this.invoiceService.updatePaymentStatus(id, status, paid_amount).subscribe({
      next: () => {
        this.toast.success(`Payment marked as ${paymentStatusLabel[status].toLowerCase()}.`);
        this.showPartialForm.set(false);
        this.invoiceService.updateInvoiceList();
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed to update payment.'),
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
