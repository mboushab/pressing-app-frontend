import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { DeliveryService } from '../../services/delivery-service';
import { Courier } from '../../types/orders';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService } from '../../shared/i18n/i18n.service';

/** Courier accounts: they sign in to the app with their phone number (platform admin). */
@Component({
  selector: 'app-couriers-panel',
  imports: [...I18N_PIPES, ReactiveFormsModule, MatIcon],
  template: `
    <form [formGroup]="form" (ngSubmit)="create()" [class]="classNames.card + ' mb-4 flex flex-wrap items-end gap-3 p-4'">
      <div class="min-w-40 flex-1">
        <label for="courier-name" [class]="classNames.label">{{ 'couriers.name' | t }}</label>
        <input id="courier-name" formControlName="name" [class]="classNames.input" />
      </div>
      <div class="min-w-40 flex-1">
        <label for="courier-phone" [class]="classNames.label">{{ 'couriers.phone' | t }}</label>
        <input id="courier-phone" formControlName="phone" inputmode="tel" dir="ltr" [class]="classNames.input" placeholder="22 00 00 00" />
      </div>
      <button type="submit" [class]="classNames.buttonPrimary"><mat-icon>person_add</mat-icon> {{ 'couriers.add' | t }}</button>
      @if (error()) {
        <p class="w-full text-sm text-red-700">{{ error() }}</p>
      }
    </form>

    <div [class]="classNames.card">
      @for (c of couriers(); track c.id) {
        <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
          <span class="flex-1">
            <span class="font-medium text-slate-800">{{ c.name }}</span>
            <span class="block text-sm text-slate-500" dir="ltr">{{ c.phone }}</span>
          </span>
          @if (c.status === 'SUSPENDED') {
            <span class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{{ 'couriers.suspended' | t }}</span>
          }
          <button type="button" [class]="classNames.buttonSecondary" (click)="toggle(c)">
            {{ (c.status === 'ACTIVE' ? 'couriers.suspend' : 'couriers.reactivate') | t }}
          </button>
        </div>
      } @empty {
        <p [class]="classNames.empty">{{ (loaded() ? 'couriers.empty' : 'common.loading') | t }}</p>
      }
    </div>
  `,
})
export class CouriersPanel {
  private readonly delivery = inject(DeliveryService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);

  readonly classNames = classNames;
  readonly couriers = signal<Courier[]>([]);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = inject(FormBuilder).group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^\s*(\+?222)?[\s.-]*[234](\s*\d){7}\s*$/)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.delivery.couriers().subscribe({
      next: (couriers) => {
        this.couriers.set(couriers);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('delivery.error.load')),
    });
  }

  create(): void {
    if (this.form.invalid) {
      this.error.set(this.i18n.t('couriers.error.invalid'));
      return;
    }
    const { name, phone } = this.form.getRawValue();
    this.delivery.createCourier({ name: name!.trim(), phone: phone! }).subscribe({
      next: (courier) => {
        this.error.set(null);
        this.form.reset();
        this.toast.success(this.i18n.t('couriers.added', { name: courier.name }));
        this.load();
      },
      error: (err) =>
        this.error.set(this.i18n.t(err.error?.code === 'PHONE_TAKEN' ? 'couriers.error.taken' : 'couriers.error.invalid')),
    });
  }

  async toggle(courier: Courier): Promise<void> {
    const suspending = courier.status === 'ACTIVE';
    const ok = await this.confirm.ask({
      title: this.i18n.t(suspending ? 'couriers.suspend' : 'couriers.reactivate'),
      message: this.i18n.t(suspending ? 'couriers.suspend_confirm' : 'couriers.reactivate_confirm', { name: courier.name }),
      confirmLabel: this.i18n.t(suspending ? 'couriers.suspend' : 'couriers.reactivate'),
      tone: suspending ? 'danger' : 'primary',
    });
    if (!ok) return;
    this.delivery.setCourierStatus(courier.id, suspending ? 'SUSPENDED' : 'ACTIVE').subscribe({
      next: () => this.load(),
      error: () => this.toast.error(this.i18n.t('order.error.action')),
    });
  }
}
