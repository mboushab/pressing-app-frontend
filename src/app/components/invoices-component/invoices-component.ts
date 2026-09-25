import { Component, computed, inject, signal, effect, WritableSignal } from '@angular/core';
import { ClothesStatus, Invoice } from '../../types/invoice';
import { CurrencyPipe } from '@angular/common';
import { UserService } from '../../services/user-sevice';
import { classNames } from '../../shared/styles/class-names';
import { CreateInvoice } from '../create-invoice/create-invoice';
import { SearchComponent } from '../search-component/search-component';
import { InvoiceDetailsComponent } from '../invoice-details-component/invoice-details-component';
import { HttpClient } from '@angular/common/http';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  debounce,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  Subject,
  switchMap,
  switchMapTo,
} from 'rxjs';
import { InvoiceService } from '../../services/invoice-service';

@Component({
  selector: 'app-invoices-component',
  imports: [CurrencyPipe, CreateInvoice, SearchComponent, InvoiceDetailsComponent],
  templateUrl: './invoices-component.html',
  styleUrl: './invoices-component.css',
  standalone: true,
})
export class InvoicesComponent {
  readonly userService = inject(UserService);
  readonly invoiceService = inject(InvoiceService);

  readonly http = inject(HttpClient);
  showCreateForm: WritableSignal<boolean> = signal(false);

  invoiceID = signal<string | null>(null);

  searchText = signal('');

  readonly invoices = this.invoiceService.getAllInvoice(this.searchText);

  classNames = classNames;

  createInvoice(): void {
    console.log('creating invoice');
  }

  deleteInvoice(id: string): void {
    this.invoiceService.deleteInvoice(id, () => {
      this.invoiceService.updateInvoiceList();
    });
  }

  onSelectedInvoiceChange(index: string): void {
    this.invoiceID.set(index);
  }

  setClothesStatus($event: Event, invoice: Invoice): void {
    const select = $event.target as HTMLSelectElement;
    const status = select.value as ClothesStatus;
    this.invoiceService.updateClothesStatus(invoice.id, status).subscribe({
      next: () => this.invoiceService.updateInvoiceList(),
      error: (error) => {
        console.error('Error while updating clothes status', error);
        select.value = invoice.clothes_status;
      },
    });
  }

  onSearch(query: string): void {
    console.log('Searching for:', query);
    // Implement the logic to filter invoices based on the search query
  }
}
