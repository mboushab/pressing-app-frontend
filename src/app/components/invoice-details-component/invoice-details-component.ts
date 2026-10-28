import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, merge, of, switchMap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { InvoiceService } from '../../services/invoice-service';
import { InvoiceDetails } from '../../types/invoice';
import { classNames } from '../../shared/styles/class-names';
import {
  clothesStatusClass,
  clothesStatusLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from '../../shared/status';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { PaymentActions } from '../../shared/payment-actions.service';
import { ClothesActions } from '../../shared/clothes-actions.service';

@Component({
  selector: 'app-invoice-details',
  imports: [...I18N_PIPES, MatIcon],
  templateUrl: './invoice-details-component.html',
  styleUrl: './invoice-details-component.css',
})
export class InvoiceDetailsComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly payments = inject(PaymentActions);
  private readonly clothes = inject(ClothesActions);

  invoiceID = input<string | null>(null);

  readonly classNames = classNames;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly paymentStatusClass = paymentStatusClass;
  readonly clothesStatusLabel = clothesStatusLabel;
  readonly clothesStatusClass = clothesStatusClass;

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

  markReady(invoice: InvoiceDetails): void {
    void this.clothes.markReady(invoice);
  }

  markToClean(invoice: InvoiceDetails): void {
    void this.clothes.markToClean(invoice);
  }

  markPickedUp(invoice: InvoiceDetails): void {
    void this.clothes.markPickedUp(invoice);
  }

  undoPickup(invoice: InvoiceDetails): void {
    void this.clothes.undoPickup(invoice);
  }

  markPaid(invoice: InvoiceDetails): void {
    void this.payments.markPaid(invoice);
  }

  recordPartial(invoice: InvoiceDetails): void {
    void this.payments.recordPartial(invoice);
  }

  markNotPaid(invoice: InvoiceDetails): void {
    void this.payments.markNotPaid(invoice);
  }

  printInvoice(invoice: InvoiceDetails): void {
    void this.payments.printInvoice(invoice);
  }
}
