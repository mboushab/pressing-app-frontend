import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { InvoiceService } from '../services/invoice-service';
import { ClothesStatus, Invoice } from '../types/invoice';
import { ConfirmService } from './confirm/confirm.service';
import { I18nService, TranslationKey } from './i18n/i18n.service';
import { ToastService } from './toast/toast.service';

type ClothesInvoice = Pick<Invoice, 'id' | 'amount' | 'paid_amount' | 'client'>;

/**
 * Clothes status changes shared by the invoice list and the invoice details:
 * to clean -> ready -> picked up, each one confirmed first.
 */
@Injectable({ providedIn: 'root' })
export class ClothesActions {
  private readonly invoiceService = inject(InvoiceService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  async markReady(invoice: ClothesInvoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.clothes_ready_title'),
      message: this.i18n.t('confirm.clothes_ready_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.clothes_ready_ok'),
    });
    if (confirmed) await this.save(invoice, 'cleaned', 'toast.clothes_ready');
  }

  async markToClean(invoice: ClothesInvoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.clothes_to_clean_title'),
      message: this.i18n.t('confirm.clothes_to_clean_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.clothes_to_clean_ok'),
    });
    if (confirmed) await this.save(invoice, 'not_cleaned', 'toast.clothes_to_clean');
  }

  async markPickedUp(invoice: ClothesInvoice): Promise<void> {
    // warn when the client leaves with the clothes without having paid everything
    const balance = Number(invoice.amount) - Number(invoice.paid_amount);
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.pickup_title'),
      message:
        balance > 0
          ? this.i18n.t('confirm.pickup_unpaid_message', {
              name: invoice.client.name,
              amount: this.i18n.money(balance),
            })
          : this.i18n.t('confirm.pickup_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.pickup_ok'),
      tone: balance > 0 ? 'danger' : 'primary',
    });
    if (confirmed) await this.save(invoice, 'picked_up', 'toast.clothes_picked_up');
  }

  async undoPickup(invoice: ClothesInvoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.undo_pickup_title'),
      message: this.i18n.t('confirm.undo_pickup_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.undo_pickup_ok'),
      tone: 'danger',
    });
    if (confirmed) await this.save(invoice, 'cleaned', 'toast.clothes_pickup_undone');
  }

  private async save(
    invoice: ClothesInvoice,
    status: ClothesStatus,
    successKey: TranslationKey,
  ): Promise<void> {
    try {
      await firstValueFrom(this.invoiceService.updateClothesStatus(invoice.id, status));
    } catch (err) {
      this.toast.error(
        this.i18n.t(
          err instanceof HttpErrorResponse && err.status === 409
            ? 'clothes.error.not_ready'
            : 'toast.clothes_error',
        ),
      );
      return;
    }
    this.toast.success(this.i18n.t(successKey, { name: invoice.client.name }));
    this.invoiceService.updateInvoiceList();
  }
}
