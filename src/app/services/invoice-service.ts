import { inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  Observable,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { CreateInvoicePayload, Invoice, InvoiceDetails } from '../types/invoice';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  readonly http = inject(HttpClient);

  refresh$ = new Subject<void>();

  getAllInvoice(query: Signal<string>) {
    return toSignal(
      merge(
        of(query()),
        this.refresh$.pipe(map(() => query())),
        toObservable(query).pipe(
          debounceTime(2000),
          distinctUntilChanged(),
          map(() => query()),
        ),
      ).pipe(
        switchMap((searchTerm) =>
          this.http.get<Invoice[]>(`/api/invoices?search=${searchTerm}`).pipe(
            catchError((error) => {
              console.error('Error while fetching clients list ' + error);
              return of([]);
            }),
          ),
        ),
      ),
      { initialValue: [] as Invoice[] },
    );
  }

  deleteInvoice(invoiceId: string, claback: () => void) {
    return this.http.delete(`/api/invoices/${invoiceId}`).subscribe({
      next: () => {
        confirm('Deleting invoices sucesss ');
        claback();
      },
      error: (error) => console.error('Error while deleting ' + error),
    });
  }

  getInvoiceDetails(id: string | null): Observable<InvoiceDetails | null> {
    if (id === null) return of(null);
    return this.http.get<InvoiceDetails>(`/api/invoices/${id}`);
  }

  createInvoice(payload: CreateInvoicePayload): Observable<{ invoiceId: string }> {
    return this.http.post<{ invoiceId: string }>('/api/invoices/create-invoice', payload);
  }

  updateClothesStatus(
    invoiceId: string,
    clothes_status: 'not_cleaned' | 'cleaned',
  ): Observable<void> {
    return this.http.patch<void>(`/api/invoices/${invoiceId}`, { clothes_status });
  }

  updatePaymentStatus(
    invoiceId: string,
    payment_status: 'not_paid' | 'partial_paid' | 'paid',
    paid_amount?: number,
  ): Observable<void> {
    return this.http.patch<void>(`/api/invoices/${invoiceId}`, { payment_status, paid_amount });
  }

  updateInvoiceList(): void {
    this.refresh$.next();
  }
}
