import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ClothesList } from '../../services/clothes-list';
import { Clothe } from '../../types/clothes';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { Drawer } from '../../shared/drawer/drawer';

@Component({
  selector: 'app-clothes-component',
  imports: [CurrencyPipe, ReactiveFormsModule, MatIcon, Drawer],
  templateUrl: './clothes-component.html',
  styleUrl: './clothes-component.css',
})
export class ClothesComponent {
  private clothesService = inject(ClothesList);
  private toast = inject(ToastService);

  readonly classNames = classNames;
  readonly clothes = signal<Clothe[]>([]);
  readonly loaded = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.loadClothes();
  }

  loadClothes(): void {
    this.clothesService.getClothes().subscribe({
      next: (data) => {
        this.clothes.set(data);
        this.loaded.set(true);
      },
      error: () => this.toast.error('Could not load the price list.'),
    });
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset();
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(clothe: Clothe): void {
    this.editingId.set(clothe.id);
    this.form.setValue({ name: clothe.name, price: clothe.price });
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.value.name!.trim();
    const price = Number(this.form.value.price);
    const id = this.editingId();
    const request$ =
      id !== null
        ? this.clothesService.updateClothes({ name, price }, id)
        : this.clothesService.createClothes({ name, price });

    request$.subscribe({
      next: () => {
        this.toast.success(id !== null ? `${name} updated.` : `${name} added.`);
        this.closeForm();
        this.loadClothes();
      },
      error: (err) => this.errorMessage.set(err.error?.message ?? 'Could not save.'),
    });
  }

  delete(clothe: Clothe): void {
    if (!confirm(`Remove ${clothe.name} from the price list?`)) return;
    this.clothesService.deleteClothes(clothe.id).subscribe({
      next: () => {
        this.toast.success(`${clothe.name} removed.`);
        this.loadClothes();
      },
      error: () => this.toast.error(`Could not remove ${clothe.name}.`),
    });
  }
}
