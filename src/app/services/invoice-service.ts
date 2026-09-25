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
import {
  ClothesStatus,
  CreateInvoicePayload,
  Invoice,
  InvoiceDetails,
  PaymentStatus,
} from '../types/invoice';
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
          debounceTime(300),
          distinctUntilChanged(),
          map(() => query()),
        ),
      ).pipe(
        switchMap((searchTerm) =>
          this.http.get<Invoice[]>(`/api/invoices?search=${encodeURIComponent(searchTerm)}`).pipe(
            catchError((error) => {
              console.error('Error while fetching invoices list', error);
              return of([]);
            }),
          ),
        ),
      ),
      { initialValue: [] as Invoice[] },
    );
  }

  deleteInvoice(invoiceId: string): Observable<unknown> {
    return this.http.delete(`/api/invoices/${invoiceId}`);
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
    clothes_status: ClothesStatus,
  ): Observable<void> {
    return this.http.patch<void>(`/api/invoices/${invoiceId}/clothes_status`, { clothes_status });
  }

  updatePaymentStatus(
    invoiceId: string,
    status: PaymentStatus,
    paid_amount?: number,
  ): Observable<void> {
    return this.http.patch<void>(`/api/invoices/${invoiceId}/paymentstatus`, {
      status,
      paid_amount,
    });
  }

  updateInvoiceList(): void {
    this.refresh$.next();
  }
}
