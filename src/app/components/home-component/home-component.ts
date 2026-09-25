import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { InvoiceService } from '../../services/invoice-service';
import { UserService } from '../../services/user-sevice';
import { Invoice } from '../../types/invoice';
import { classNames } from '../../shared/styles/class-names';
import { paymentStatusClass, paymentStatusLabel } from '../../shared/status';
import { ToastService } from '../../shared/toast/toast.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService } from '../../shared/i18n/i18n.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';

@Component({
  selector: 'app-home-component',
  imports: [RouterLink, MatIcon, ...I18N_PIPES],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly confirm = inject(ConfirmService);

  readonly classNames = classNames;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly paymentStatusClass = paymentStatusClass;
  readonly username = inject(UserService).getUsername();
  readonly now = new Date();

  readonly invoices = this.invoiceService.getAllInvoice(signal(''));

  readonly toClean = computed(() =>
    this.invoices()
      .filter((i) => i.clothes_status === 'not_cleaned')
      // oldest first: those have been waiting the longest
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  );
  readonly ready = computed(() => this.invoices().filter((i) => i.clothes_status === 'cleaned'));
  readonly readyUnpaid = computed(() => this.ready().filter((i) => i.status !== 'paid'));
  readonly unpaidTotal = computed(() =>
    this.invoices().reduce((sum, i) => sum + this.balance(i), 0),
  );
  readonly today = computed(() => {
    const day = new Date().toDateString();
    return this.invoices().filter((i) => new Date(i.created_at).toDateString() === day);
  });

  balance(invoice: Invoice): number {
    return Number(invoice.amount) - Number(invoice.paid_amount);
  }

  async markReady(invoice: Invoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.clothes_ready_title'),
      message: this.i18n.t('confirm.clothes_ready_message', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('confirm.clothes_ready_ok'),
    });
    if (!confirmed) return;
    this.invoiceService.updateClothesStatus(invoice.id, 'cleaned').subscribe({
      next: () => {
        this.toast.success(this.i18n.t('toast.clothes_ready', { name: invoice.client.name }));
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error('Could not update the clothes status.'),
    });
  }
}
