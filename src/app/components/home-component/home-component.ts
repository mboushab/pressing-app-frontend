import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { InvoiceService } from '../../services/invoice-service';
import { UserService } from '../../services/user-sevice';
import { Invoice } from '../../types/invoice';
import { classNames } from '../../shared/styles/class-names';
import { paymentStatusClass, paymentStatusLabel } from '../../shared/status';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-home-component',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatIcon],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);

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

  markReady(invoice: Invoice): void {
    this.invoiceService.updateClothesStatus(invoice.id, 'cleaned').subscribe({
      next: () => {
        this.toast.success(`${invoice.client.name}: ready for pickup.`);
        this.invoiceService.updateInvoiceList();
      },
      error: () => this.toast.error('Could not update the clothes status.'),
    });
  }
}
