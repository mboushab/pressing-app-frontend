import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ClothesList } from '../../services/clothes-list';
import { ClientsService } from '../../services/clients-service';
import { InvoiceService } from '../../services/invoice-service';
import { Clothe } from '../../types/clothes';
import { Client } from '../../types/authenticate';

@Component({
  selector: 'app-create-invoice',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
  standalone: true,
})
export class CreateInvoice implements OnInit {
  private clothesService = inject(ClothesList);
  private clientsService = inject(ClientsService);
  private invoiceService = inject(InvoiceService);

  userId = input.required<string | null>({
    alias: 'currentUserId',
  });

  closeForm = output<void>();

  clothes = signal<Clothe[]>([]);
  filteredClients = signal<Client[]>([]);
  selectedClient = signal<Client | null>(null);
  clientSearch = new FormControl('');
  showClientDropdown = signal(false);
  errorMessage = signal<string | null>(null);

  invoiceForm = new FormGroup({
    clientId: new FormControl('', [Validators.required]),
    payment_status: new FormControl<'not_paid' | 'partial_paid' | 'paid'>('not_paid', [
      Validators.required,
    ]),
    clothes_status: new FormControl<'cleaned' | 'not_cleaned'>('not_cleaned', [
      Validators.required,
    ]),
    paid_amount: new FormControl<number | null>(null),
    items: new FormArray([]),
  });

  selectClient(client: Client): void {
    this.selectedClient.set(client);
    this.clientSearch.setValue(client.name, { emitEvent: false });
    this.invoiceForm.get('clientId')?.setValue(client.id ?? '');
    this.showClientDropdown.set(false);
  }

  get isPartial(): boolean {
    return this.invoiceForm.get('payment_status')?.value === 'partial_paid';
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.clothesService.getClothes().subscribe({
      next: (data) => {
        this.clothes.set(data as Clothe[]);
        this.clothes().forEach(() => {
          this.items.push(
            new FormGroup({
              quantity: new FormControl(0, [Validators.min(0)]),
            }),
          );
        });
      },
      error: (err) => console.error('Error fetching clothes', err),
    });

    this.clientSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const q = query ?? '';
          if (this.selectedClient()?.name === q) return of(this.filteredClients());
          this.selectedClient.set(null);
          this.invoiceForm.get('clientId')?.setValue('');
          this.showClientDropdown.set(true);
          return this.clientsService.searchClients(q).pipe(catchError(() => of([])));
        }),
      )
      .subscribe((data) => this.filteredClients.set(data));

    // Load initial list
    this.clientsService.searchClients('').subscribe({
      next: (data) => this.filteredClients.set(data),
      error: (err) => console.error('Error fetching clients', err),
    });
  }

  getItemTotal(index: number): number {
    const qty = this.items.at(index).get('quantity')?.value ?? 0;
    const price = this.clothes()[index]?.price ?? 0;
    return qty * price;
  }

  getTotal(): number {
    return this.clothes().reduce((sum, _, i) => sum + this.getItemTotal(i), 0);
  }

  onCancel(): void {
    this.closeForm.emit();
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) return;

    const details = this.clothes()
      .map((c, i) => ({
        product: c.name,
        unit_price: c.price,
        quantity: this.items.at(i).get('quantity')?.value ?? 0,
      }))
      .filter((item) => item.quantity > 0);

    if (details.length === 0) {
      this.errorMessage.set('Please add at least one item.');
      return;
    }

    const payment_status = this.invoiceForm.value.payment_status ?? 'not_paid';
    const paid_amount =
      payment_status === 'partial_paid'
        ? (this.invoiceForm.value.paid_amount ?? 0)
        : payment_status === 'paid'
          ? this.getTotal()
          : 0;

    const payload = {
      client_id: this.invoiceForm.value.clientId!,
      amount: this.getTotal(),
      status: payment_status,
      paid_amount,
      details,
      clothes_status: this.invoiceForm.get('clothes_status')?.value ?? 'not_cleaned',
    };

    this.invoiceService.createInvoice(payload).subscribe({
      next: () => {
        this.invoiceService.updateInvoiceList();
        this.closeForm.emit();
      },
      error: (err) => this.errorMessage.set(err.error?.message ?? 'Failed to create invoice'),
    });
  }
}
