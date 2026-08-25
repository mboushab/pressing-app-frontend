import { Component, inject, signal, effect } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Client } from '../../../types/authenticate';
import { CommonModule } from '@angular/common';
import { ClientsService } from '../../../services/clients-service';
import {
  Subject,
  merge,
  of,
  switchMap,
  map,
  catchError,
  debounceTime,
  distinctUntilChanged,
  interval,
} from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user-sevice';
import { classNames } from '../../../shared/styles/class-names';
import { SearchComponent } from '../../search-component/search-component';

@Component({
  selector: 'app-clients-component',
  imports: [CommonModule, ReactiveFormsModule, SearchComponent],
  templateUrl: './clients-component.html',
  styleUrl: './clients-component.css',
  standalone: true,
})
export class ClientsComponent {
  private readonly clientsService = inject(ClientsService);
  public userService = inject(UserService);
  private readonly fprmBuilder = inject(FormBuilder);

  private readonly refresh$ = new Subject<void>();

  queryText = signal('');

  private result$ = merge(
    of(''),
    this.refresh$.pipe(map(() => this.queryText())),
    toObservable(this.queryText).pipe(debounceTime(300), distinctUntilChanged()),
  ).pipe(
    switchMap((term) =>
      this.clientsService.getClients().pipe(
        catchError((error) => {
          console.error('Error while fetching client ', error);
          return of([]);
        }),
      ),
    ),
  );

  classNames = classNames;

  showClientForm = signal(false);

  form: FormGroup = this.fprmBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone_number: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
  });

  errorMessage: string | null = null;

  readonly clients = toSignal(this.result$, { initialValue: [] as Client[] });

  openNewClientForm(): void {
    this.showClientForm.set(true);
  }

  closeNewClientForm(): void {
    this.showClientForm.set(false);
    this.form.reset();
    this.errorMessage = null;
  }

  filterBySearch(query: string): void {
    console.log('Search query:', query);
  }
  submitCreateForm(event: Event): void {
    event.preventDefault();
    this.clientsService
      .createClient({
        name: this.form.value.name,
        phone_number: this.form.value.phone_number,
      })
      .subscribe({
        next: () => {
          this.errorMessage = null;
          this.refresh$.next();
          this.closeNewClientForm();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.error?.message || 'An error occurred while creating the client.';
        },
      });
  }

  deleteClient(id: string): void {
    const confirmDelete = confirm('are you sure you want to delete this client ?');
    if (confirmDelete) {
      this.clientsService.deleteClient(id).subscribe({
        next: (x) => {
          this.refresh$.next();
        },
        error(err) {
          console.error('something wrong occurred durring deletion client ' + id + ': ' + err);
        },
      });
    }
  }

  /* private readonly pollRefresh = effect(() => {
    const sub = interval(1000).subscribe(() => this.refresh$.next());
    return () => sub.unsubscribe();
  }); */
}
