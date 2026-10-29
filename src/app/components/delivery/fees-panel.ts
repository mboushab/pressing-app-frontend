import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { DeliveryService } from '../../services/delivery-service';
import { UserService } from '../../services/user-sevice';
import { FeeRule, SlotKind } from '../../types/delivery';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { Drawer } from '../../shared/drawer/drawer';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';

/**
 * Delivery fees: one fixed amount per leg, paid by the customer, separate from
 * cleaning. Set here as the default of every pressing; a change applies to new
 * orders only and the previous amounts stay in the history.
 */
@Component({
  selector: 'app-fees-panel',
  imports: [...I18N_PIPES, ReactiveFormsModule, MatIcon, Drawer],
  templateUrl: './fees-panel.html',
})
export class FeesPanel {
  private readonly delivery = inject(DeliveryService);
  private readonly centerId = inject(UserService).getCenterId();
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);

  readonly classNames = classNames;
  readonly legs: SlotKind[] = ['PICKUP', 'RETURN'];
  readonly current = signal<Partial<Record<SlotKind, FeeRule>>>({});
  readonly rules = signal<FeeRule[]>([]);
  readonly loaded = signal(false);
  readonly editing = signal<SlotKind | null>(null);
  readonly saving = signal(false);
  readonly error = signal<TranslationKey | null>(null);

  /** Default amounts (every pressing), newest first. */
  readonly history = computed(() => this.rules().filter((r) => r.center_id === null));

  readonly form = inject(FormBuilder).group({
    amount: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100000)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.centerId) return this.loaded.set(true);
    this.delivery.getFeeRules(this.centerId).subscribe({
      next: ({ current, rules }) => {
        this.current.set(current ?? {});
        this.rules.set(rules);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('delivery.error.load')),
    });
  }

  legLabel(leg: SlotKind): string {
    return this.i18n.t(`delivery.leg.${leg}` as TranslationKey);
  }

  legHint(leg: SlotKind): string {
    return this.i18n.t(`delivery.leg_hint.${leg}` as TranslationKey);
  }

  edit(leg: SlotKind): void {
    const amount = this.current()[leg]?.amount;
    this.form.setValue({ amount: amount === undefined ? null : Number(amount) });
    this.error.set(null);
    this.editing.set(leg);
  }

  async save(): Promise<void> {
    const leg = this.editing();
    if (this.form.invalid || leg === null) {
      this.form.markAllAsTouched();
      return;
    }
    const amount = Number(this.form.value.amount);
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('delivery.fee_confirm_title'),
      message: this.i18n.t('delivery.fee_confirm', {
        leg: this.legLabel(leg),
        amount: this.i18n.money(amount),
      }),
      confirmLabel: this.i18n.t('common.save'),
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.delivery.setDefaultFee(leg, amount).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toast.success(this.i18n.t('delivery.toast.fee_saved'));
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('delivery.error.save');
      },
    });
  }
}
