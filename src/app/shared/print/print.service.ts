import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { InvoiceService } from '../../services/invoice-service';
import { InvoiceDetails } from '../../types/invoice';
import { ToastService } from '../toast/toast.service';
import { I18nService } from '../i18n/i18n.service';

/** Invoice receipts: loads the invoice, shows the receipt preview, prints it from there. */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  /** invoice shown in the preview and printed */
  readonly invoice = signal<InvoiceDetails | null>(null);
  readonly previewOpen = signal(false);
  readonly printedAt = signal(new Date());

  async printInvoice(invoiceId: string): Promise<void> {
    let invoice: InvoiceDetails | null;
    try {
      invoice = await firstValueFrom(this.invoiceService.getInvoiceDetails(invoiceId));
    } catch {
      invoice = null;
    }
    if (!invoice) {
      this.toast.error(this.i18n.t('print.error'));
      return;
    }
    this.printedAt.set(new Date());
    this.invoice.set(invoice);
    this.previewOpen.set(true);
  }

  print(): void {
    this.printedAt.set(new Date());
    // let the new time render before the print dialog freezes the page
    setTimeout(() => window.print());
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }
}
