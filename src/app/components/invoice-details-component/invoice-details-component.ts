import { Component, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { InvoiceService } from '../../services/invoice-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, merge, of, switchMap } from 'rxjs';
import { ClothesStatus, PaymentStatus } from '../../types/invoice';

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

  readonly selectedInvoice = toSignal(this.invoiceDetails$, {
    initialValue: null,
  });

  setClothesStatus(clothes_status: ClothesStatus): void {
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

  setPaymentStatus(status: PaymentStatus, paid_amount?: number): void {
    const id = this.invoiceID();
    if (!id) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.invoiceService.updatePaymentStatus(id, status, paid_amount).subscribe({
      next: () => {
        this.successMessage.set(`Payment marked as "${status}".`);
        this.showPartialForm.set(false);
        this.partialAmountControl.reset();
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
