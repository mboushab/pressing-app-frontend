import { Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { InvoiceService } from '../../services/invoice-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-invoice-details',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './invoice-details-component.html',
  styleUrl: './invoice-details-component.css',
  standalone: true,
})
export class InvoiceDetailsComponent {
  readonly invoiceService = inject(InvoiceService);

  invoiceID = input<string | null>(null);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPartialForm = signal(false);
  partialAmountControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0),
  ]);

  private readonly refresh$ = new Subject<void>();

  private readonly invoiceDetails$ = toObservable(this.invoiceID).pipe(
    switchMap((invoiceId) =>
      this.invoiceService.getInvoiceDetails(invoiceId).pipe(
        catchError((error) => {
          console.error('Error while fetching invoice', error);
          return of(null);
        }),
      ),
    ),
  );

  readonly selectedInvoice = toSignal(this.invoiceDetails$, {
    initialValue: null,
  });

  setClothesStatus(clothes_status: 'cleaned' | 'not_cleaned'): void {
    const id = this.invoiceID();
    if (!id) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.invoiceService.updateClothesStatus(id, clothes_status).subscribe({
      next: () => {
        this.successMessage.set(`Clothes marked as "${clothes_status}".`);
        this.invoiceService.updateInvoiceList();
      },
      error: (err) =>
        this.errorMessage.set(err.error?.message ?? 'Failed to update clothes status'),
    });
  }

  setPaymentStatus(
    payment_status: 'not_paid' | 'partial_paid' | 'paid',
    paid_amount?: number,
  ): void {
    const id = this.invoiceID();
    if (!id) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.invoiceService.updatePaymentStatus(id, payment_status, paid_amount).subscribe({
      next: () => {
        this.successMessage.set(`Payment marked as "${payment_status}".`);
        this.showPartialForm.set(false);
        this.invoiceService.updateInvoiceList();
      },
      error: (err) =>
        this.errorMessage.set(err.error?.message ?? 'Failed to update payment status'),
    });
  }

  submitPartialPayment(): void {
    const amount = this.partialAmountControl.value;
    if (amount === null || this.partialAmountControl.invalid) return;
    this.setPaymentStatus('partial_paid', amount);
  }
}
