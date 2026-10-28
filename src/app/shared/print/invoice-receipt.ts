import { Component, inject } from '@angular/core';
import { PrintService } from './print.service';
import { Receipt } from './receipt';
import { UserService } from '../../services/user-sevice';

/** The receipt as printed: only this is visible on paper (the app itself is print:hidden). */
@Component({
  selector: 'app-invoice-receipt',
  imports: [Receipt],
  host: { class: 'hidden print:block' },
  template: `
    @if (print.invoice(); as invoice) {
      <app-receipt [invoice]="invoice" [printedAt]="print.printedAt()" [cashier]="cashier" />
    }
  `,
})
export class InvoiceReceipt {
  readonly print = inject(PrintService);
  readonly cashier = inject(UserService).getUsername();
}
