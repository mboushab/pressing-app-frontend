import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ClothesList } from '../../services/clothes-list';
import { Clothe } from '../../types/clothes';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { Drawer } from '../../shared/drawer/drawer';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';

@Component({
  selector: 'app-clothes-component',
  imports: [...I18N_PIPES, ReactiveFormsModule, MatIcon, Drawer],
  templateUrl: './clothes-component.html',
  styleUrl: './clothes-component.css',
})
export class ClothesComponent {
  private clothesService = inject(ClothesList);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  readonly classNames = classNames;
  readonly clothes = signal<Clothe[]>([]);
  readonly loaded = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal<TranslationKey | null>(null);

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
      error: () => this.toast.error(this.i18n.t('error.load_prices')),
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
        this.toast.success(this.i18n.t(id !== null ? 'toast.item_updated' : 'toast.item_added', { name }));
        this.closeForm();
        this.loadClothes();
      },
      error: (err) =>
        this.errorMessage.set(err.status === 409 ? 'prices.error.duplicate' : 'prices.error.save'),
    });
  }

  delete(clothe: Clothe): void {
    if (!confirm(this.i18n.t('prices.confirm_delete', { name: clothe.name }))) return;
    this.clothesService.deleteClothes(clothe.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('toast.item_removed', { name: clothe.name }));
        this.loadClothes();
      },
      error: () => this.toast.error(this.i18n.t('prices.error.delete', { name: clothe.name })),
    });
  }
}
