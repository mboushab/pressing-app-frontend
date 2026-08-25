import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClothesList } from '../../services/clothes-list';
import { Clothe } from '../../types/clothes';
import { classNames } from '../../shared/styles/class-names';

@Component({
  selector: 'app-clothes-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clothes-component.html',
  styleUrl: './clothes-component.css',
  standalone: true,
})
export class ClothesComponent {
  private clothesService = inject(ClothesList);
  private fb = inject(FormBuilder);

  classNames = classNames;
  clothes = signal<Clothe[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [null, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.loadClothes();
  }

  loadClothes(): void {
    this.clothesService.getClothes().subscribe({
      next: (data) => this.clothes.set(data),
      error: (err) => console.error('Error loading clothes', err),
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
    this.form.reset();
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.form.invalid) return;
    const { name, price } = this.form.value;
    const id = this.editingId();

    if (id !== null) {
      this.clothesService.updateClothes({ name, price }, id).subscribe({
        next: () => {
          this.closeForm();
          this.loadClothes();
        },
        error: (err) => this.errorMessage.set(err.error?.message ?? 'Update failed'),
      });
    } else {
      this.clothesService.createClothes({ name, price }).subscribe({
        next: () => {
          this.closeForm();
          this.loadClothes();
        },
        error: (err) => this.errorMessage.set(err.error?.message ?? 'Create failed'),
      });
    }
  }

  delete(id: number): void {
    this.clothesService.deleteClothes(id).subscribe({
      next: () => this.loadClothes(),
      error: (err) => console.error('Error deleting clothe', err),
    });
  }
}
