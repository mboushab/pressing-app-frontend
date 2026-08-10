import { Component, computed, inject, input, output, Signal } from '@angular/core';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { InvoiceDetails } from '../../types/invoice';
import { MatButtonModule } from '@angular/material/button';
import { InvoiceService } from '../../services/invoice-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-invoice-details',
  imports: [CurrencyPipe, MatButtonModule],
  templateUrl: './invoice-details-component.html',
  styleUrl: './invoice-details-component.css',
  standalone: true,
})
export class InvoiceDetailsComponent {
  readonly invoiceService = inject(InvoiceService);

  invoiceID = input<string | null>(null);

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
}
