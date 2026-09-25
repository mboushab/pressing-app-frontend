import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subject, merge, switchMap, map, catchError, debounceTime, distinctUntilChanged, of } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { Client } from '../../../types/authenticate';
import { ClientsService } from '../../../services/clients-service';
import { UserService } from '../../../services/user-sevice';
import { classNames } from '../../../shared/styles/class-names';
import { ToastService } from '../../../shared/toast/toast.service';
import { Drawer } from '../../../shared/drawer/drawer';
import { SearchComponent } from '../../search-component/search-component';

@Component({
  selector: 'app-clients-component',
  imports: [ReactiveFormsModule, SearchComponent, Drawer, MatIcon],
  templateUrl: './clients-component.html',
  styleUrl: './clients-component.css',
})
export class ClientsComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);
  readonly isAdmin = inject(UserService).isAdmin();
  readonly classNames = classNames;

  private readonly refresh$ = new Subject<void>();
  readonly queryText = signal('');
  readonly loaded = signal(false);

  readonly clients = toSignal(
    merge(
      toObservable(this.queryText).pipe(debounceTime(250), distinctUntilChanged()),
      this.refresh$.pipe(map(() => this.queryText())),
    ).pipe(
      switchMap((term) =>
        this.clientsService.searchClients(term).pipe(
          catchError(() => {
            this.toast.error('Could not load clients.');
            return of([] as Client[]);
          }),
        ),
      ),
      map((clients) => {
        this.loaded.set(true);
        return clients;
      }),
    ),
    { initialValue: [] as Client[] },
  );

  readonly showClientForm = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone_number: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
  });

  openNewClientForm(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.showClientForm.set(true);
  }

  closeNewClientForm(): void {
    this.showClientForm.set(false);
  }

  submitCreateForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, phone_number } = this.form.getRawValue();
    this.saving.set(true);
    this.clientsService.createClient({ name: name.trim(), phone_number }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(`Client ${name.trim()} added.`);
        this.refresh$.next();
        this.closeNewClientForm();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(error.error?.message || 'Could not create the client.');
      },
    });
  }

  deleteClient(client: Client): void {
    if (!client.id || !confirm(`Delete client ${client.name}?`)) return;
    this.clientsService.deleteClient(client.id).subscribe({
      next: () => {
        this.toast.success(`Client ${client.name} deleted.`);
        this.refresh$.next();
      },
      error: (err: HttpErrorResponse) =>
        this.toast.error(
          err.status === 409
            ? `${client.name} has invoices and cannot be deleted.`
            : 'Could not delete the client.',
        ),
    });
  }
}
