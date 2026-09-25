import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { Drawer } from '../../shared/drawer/drawer';
import { CreateInvoice } from '../create-invoice/create-invoice';
import { SearchComponent } from '../search-component/search-component';
import { InvoiceDetailsComponent } from '../invoice-details-component/invoice-details-component';

type InvoiceFilter = 'all' | 'to_clean' | 'ready' | 'unpaid';

@Component({
  selector: 'app-invoices-component',
  imports: [
    CurrencyPipe,
    DatePipe,
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
        ['all', 'All'],
        ['to_clean', 'To clean'],
        ['ready', 'Ready'],
        ['unpaid', 'Unpaid'],
      ] as [InvoiceFilter, string][]
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
    this.toast.success('Invoice created.');
    this.invoiceID.set(invoiceId);
  }

  toggleClothesStatus(invoice: Invoice): void {
    const next: ClothesStatus = invoice.clothes_status === 'cleaned' ? 'not_cleaned' : 'cleaned';
    this.invoiceService.updateClothesStatus(invoice.id, next).subscribe({
      next: () => {
        this.toast.success(`${invoice.client.name}: ${clothesStatusLabel[next].toLowerCase()}.`);
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error('Could not update the clothes status.'),
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (!confirm(`Delete the invoice of ${invoice.client.name}? This cannot be undone.`)) return;
    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: () => {
        if (this.invoiceID() === invoice.id) this.invoiceID.set(null);
        this.toast.success('Invoice deleted.');
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error('Could not delete the invoice.'),
    });
  }
}
