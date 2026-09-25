import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, startWith } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { ClothesList } from '../../services/clothes-list';
import { ClientsService } from '../../services/clients-service';
import { InvoiceService } from '../../services/invoice-service';
import { Clothe } from '../../types/clothes';
import { Client } from '../../types/authenticate';
import { PaymentStatus } from '../../types/invoice';
import { classNames } from '../../shared/styles/class-names';
import { paymentStatusLabel } from '../../shared/status';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';

@Component({
  selector: 'app-create-invoice',
  imports: [ReactiveFormsModule, MatIcon, ...I18N_PIPES],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
})
export class CreateInvoice implements OnInit {
  private clothesService = inject(ClothesList);
  private clientsService = inject(ClientsService);
  private invoiceService = inject(InvoiceService);
  private i18n = inject(I18nService);
  private confirm = inject(ConfirmService);

  closeForm = output<void>();
  created = output<string>();

  readonly classNames = classNames;
  readonly paymentOptions: { value: PaymentStatus; label: TranslationKey }[] = (
    ['not_paid', 'partial_paid', 'paid'] as PaymentStatus[]
  ).map((value) => ({ value, label: paymentStatusLabel[value] }));

  readonly clothes = signal<Clothe[]>([]);
  readonly quantities = signal<Record<string, number>>({});
  readonly selectedClient = signal<Client | null>(null);
  readonly showClientDropdown = signal(false);
  readonly showNewClient = signal(false);
  readonly errorMessage = signal<TranslationKey | null>(null);
  readonly saving = signal(false);
  readonly paymentStatus = signal<PaymentStatus>('not_paid');

  readonly clientSearch = new FormControl('', { nonNullable: true });
  readonly paidAmount = new FormControl<number | null>(null);
  readonly newClientName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  readonly newClientPhone = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{8}$/)],
  });

  private readonly searchTerm = toSignal(
    this.clientSearch.valueChanges.pipe(startWith(''), debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );

  readonly filteredClients = toSignal(
    this.clientSearch.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((q) => this.clientsService.searchClients(q).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] as Client[] },
  );

  readonly total = computed(() =>
    this.clothes().reduce((sum, c) => sum + c.price * (this.quantities()[c.id] ?? 0), 0),
  );
  readonly itemCount = computed(() =>
    Object.values(this.quantities()).reduce((sum, q) => sum + q, 0),
  );

  ngOnInit(): void {
    this.clothesService.getClothes().subscribe({
      next: (data) => this.clothes.set(data),
      error: () => this.errorMessage.set('error.load_prices'),
    });
  }

  onClientInput(): void {
    this.selectedClient.set(null);
    this.showClientDropdown.set(true);
  }

  selectClient(client: Client): void {
    this.selectedClient.set(client);
    this.clientSearch.setValue(`${client.name} — ${client.phone_number}`, { emitEvent: false });
    this.showClientDropdown.set(false);
    this.showNewClient.set(false);
  }

  clearClient(): void {
    this.selectedClient.set(null);
    this.clientSearch.setValue('');
  }

  openNewClient(): void {
    // prefill with what was typed: digits go to the phone, text to the name
    const typed = this.searchTerm().trim();
    if (/^\d+$/.test(typed)) this.newClientPhone.setValue(typed);
    else this.newClientName.setValue(typed);
    this.showClientDropdown.set(false);
    this.showNewClient.set(true);
  }

  createClient(): void {
    if (this.newClientName.invalid || this.newClientPhone.invalid) {
      this.newClientName.markAsTouched();
      this.newClientPhone.markAsTouched();
      return;
    }
    const client: Client = {
      name: this.newClientName.value.trim(),
      phone_number: this.newClientPhone.value,
    };
    this.clientsService.createClient(client).subscribe({
      next: (res: { clientId: string }) => this.selectClient({ ...client, id: res.clientId }),
      error: (err: HttpErrorResponse) =>
        this.errorMessage.set(
          err.status === 409 ? 'clients.error.duplicate' : 'clients.error.create',
        ),
    });
  }

  quantity(clothe: Clothe): number {
    return this.quantities()[clothe.id] ?? 0;
  }

  setQuantity(clothe: Clothe, value: number): void {
    const qty = Math.max(0, Math.floor(Number(value) || 0));
    this.quantities.update((q) => ({ ...q, [clothe.id]: qty }));
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    const client = this.selectedClient();
    if (!client?.id) {
      this.errorMessage.set('create.error.client');
      return;
    }

    const details = this.clothes()
      .filter((c) => this.quantity(c) > 0)
      .map((c) => ({ product: c.name, unit_price: c.price, quantity: this.quantity(c) }));
    if (details.length === 0) {
      this.errorMessage.set('create.error.items');
      return;
    }

    const status = this.paymentStatus();
    let paid_amount = 0;
    if (status === 'paid') paid_amount = this.total();
    if (status === 'partial_paid') {
      paid_amount = Number(this.paidAmount.value);
      if (!(paid_amount > 0 && paid_amount < this.total())) {
        this.errorMessage.set('create.error.partial');
        return;
      }
    }

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.create_title'),
      message: this.i18n.t('confirm.create_message', {
        total: this.i18n.money(this.total()),
        name: client.name,
        count: this.itemCount(),
        status: this.i18n.t(paymentStatusLabel[status]),
      }),
      confirmLabel: this.i18n.t('confirm.create_ok'),
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.invoiceService
      .createInvoice({
        client_id: client.id,
        amount: this.total(),
        status,
        paid_amount,
        details,
        clothes_status: 'not_cleaned',
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.invoiceService.updateInvoiceList();
          this.created.emit(res.invoiceId);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set('create.error.save');
        },
      });
  }
}
