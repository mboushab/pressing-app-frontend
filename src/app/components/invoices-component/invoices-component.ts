import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ClothesStatus, Invoice } from '../../types/invoice';
import { UserService } from '../../services/user-sevice';
import { InvoiceService } from '../../services/invoice-service';
import { classNames } from '../../shared/styles/class-names';
import {
  clothesStatusClass,
  clothesStatusLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from '../../shared/status';
import { ToastService } from '../../shared/toast/toast.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';
import { Drawer } from '../../shared/drawer/drawer';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { CreateInvoice } from '../create-invoice/create-invoice';
import { SearchComponent } from '../search-component/search-component';
import { InvoiceDetailsComponent } from '../invoice-details-component/invoice-details-component';

type InvoiceFilter = 'all' | 'to_clean' | 'ready' | 'unpaid';

@Component({
  selector: 'app-invoices-component',
  imports: [
    ...I18N_PIPES,
    MatIcon,
    CreateInvoice,
    SearchComponent,
    InvoiceDetailsComponent,
    Drawer,
  ],
  templateUrl: './invoices-component.html',
  styleUrl: './invoices-component.css',
})
export class InvoicesComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  readonly isAdmin = inject(UserService).isAdmin();

  readonly classNames = classNames;
  readonly paymentStatusLabel = paymentStatusLabel;
  readonly paymentStatusClass = paymentStatusClass;
  readonly clothesStatusLabel = clothesStatusLabel;
  readonly clothesStatusClass = clothesStatusClass;

  // ?new=1 (from the dashboard) opens the create form directly
  readonly showCreateForm = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('new') === '1',
  );
  readonly invoiceID = signal<string | null>(null);
  readonly searchText = signal('');
  readonly filter = signal<InvoiceFilter>('all');

  readonly invoices = this.invoiceService.getAllInvoice(this.searchText);

  private readonly matchers: Record<InvoiceFilter, (i: Invoice) => boolean> = {
    all: () => true,
    to_clean: (i) => i.clothes_status === 'not_cleaned',
    ready: (i) => i.clothes_status === 'cleaned',
    unpaid: (i) => i.status !== 'paid',
  };

  readonly filters = computed(() => {
    const list = this.invoices();
    return (
      [
        ['all', 'invoices.filter.all'],
        ['to_clean', 'invoices.filter.to_clean'],
        ['ready', 'invoices.filter.ready'],
        ['unpaid', 'invoices.filter.unpaid'],
      ] as [InvoiceFilter, TranslationKey][]
    ).map(([key, label]) => ({ key, label, count: list.filter(this.matchers[key]).length }));
  });

  readonly visibleInvoices = computed(() => this.invoices().filter(this.matchers[this.filter()]));

  balance(invoice: Invoice): number {
    return Number(invoice.amount) - Number(invoice.paid_amount);
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
    void this.router.navigate([], { queryParams: {} });
  }

  onInvoiceCreated(invoiceId: string): void {
    this.closeCreateForm();
    this.toast.success(this.i18n.t('toast.invoice_created'));
    this.invoiceID.set(invoiceId);
  }

  async toggleClothesStatus(invoice: Invoice): Promise<void> {
    const next: ClothesStatus = invoice.clothes_status === 'cleaned' ? 'not_cleaned' : 'cleaned';
    const ready = next === 'cleaned';
    const confirmed = await this.confirm.ask({
      title: this.i18n.t(ready ? 'confirm.clothes_ready_title' : 'confirm.clothes_to_clean_title'),
      message: this.i18n.t(
        ready ? 'confirm.clothes_ready_message' : 'confirm.clothes_to_clean_message',
        { name: invoice.client.name },
      ),
      confirmLabel: this.i18n.t(ready ? 'confirm.clothes_ready_ok' : 'confirm.clothes_to_clean_ok'),
    });
    if (!confirmed) return;

    this.invoiceService.updateClothesStatus(invoice.id, next).subscribe({
      next: () => {
        this.toast.success(
          this.i18n.t(ready ? 'toast.clothes_ready' : 'toast.clothes_to_clean', {
            name: invoice.client.name,
          }),
        );
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error(this.i18n.t('toast.clothes_error')),
    });
  }

  async deleteInvoice(invoice: Invoice): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.delete_title'),
      message: this.i18n.t('invoices.confirm_delete', { name: invoice.client.name }),
      confirmLabel: this.i18n.t('common.delete'),
      tone: 'danger',
    });
    if (!confirmed) return;
    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        if (this.invoiceID() === invoice.id) this.invoiceID.set(null);
        this.toast.success(this.i18n.t('toast.invoice_deleted'));
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error(this.i18n.t('toast.invoice_delete_error')),
    });
  }
}
