import { Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DeliveryService } from '../../services/delivery-service';
import { Courier, Mission } from '../../types/orders';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';
import { OrderLabels } from '../orders/order-labels';

/** Courier trips to assign (platform admin). */
@Component({
  selector: 'app-missions-panel',
  imports: [...I18N_PIPES, MatIcon],
  template: `
    <div [class]="classNames.card">
      @for (m of missions(); track m.id) {
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-3 last:border-b-0">
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            [class]="m.leg === 'PICKUP' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'"
          >
            {{ legLabel(m.leg) }}
          </span>
          <span class="min-w-48 flex-1 text-sm">
            <span class="font-medium text-slate-800">
              #{{ m.number }} · {{ m.starts_at ? (m.starts_at | appDate: 'short') : ('missions.no_slot' | t) }}
            </span>
            <span class="block text-slate-500">
              {{ m.customer_name || m.customer_phone }} — {{ m.address?.address_text ?? m.center_name }}
            </span>
            <span class="block text-xs text-slate-500">{{ labels.status(m.order_status) }}</span>
          </span>
          <select
            class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            [attr.aria-label]="'missions.courier' | t"
            [value]="m.courier_id ?? ''"
            (change)="assign(m, $any($event.target))"
          >
            <option value="" disabled>{{ 'missions.choose' | t }}</option>
            @for (c of activeCouriers(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
          @if (m.status === 'UNASSIGNED') {
            <mat-icon class="!text-orange-500" [title]="'missions.unassigned' | t">schedule</mat-icon>
          }
        </div>
      } @empty {
        <p [class]="classNames.empty">{{ (loaded() ? 'missions.empty' : 'common.loading') | t }}</p>
      }
    </div>
  `,
})
export class MissionsPanel {
  private readonly delivery = inject(DeliveryService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);
  readonly labels = inject(OrderLabels);

  readonly classNames = classNames;
  readonly missions = signal<Mission[]>([]);
  readonly couriers = signal<Courier[]>([]);
  readonly loaded = signal(false);
  readonly activeCouriers = computed(() => this.couriers().filter((c) => c.status === 'ACTIVE'));

  constructor() {
    this.load();
    this.delivery.couriers().subscribe((couriers) => this.couriers.set(couriers));
  }

  load(): void {
    this.delivery.missions().subscribe({
      next: (missions) => {
        this.missions.set(missions);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('delivery.error.load')),
    });
  }

  legLabel(leg: Mission['leg']): string {
    return this.i18n.t(`delivery.kind.${leg}` as TranslationKey);
  }

  async assign(mission: Mission, select: HTMLSelectElement): Promise<void> {
    const courier = this.couriers().find((c) => c.id === select.value);
    if (!courier) return;
    const ok = await this.confirm.ask({
      title: this.i18n.t('missions.assign'),
      message: this.i18n.t('missions.assign_confirm', { courier: courier.name, number: mission.number }),
      confirmLabel: this.i18n.t('missions.assign'),
    });
    if (!ok) {
      select.value = mission.courier_id ?? '';
      return;
    }
    this.delivery.assignMission(mission.id, courier.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('missions.assigned', { courier: courier.name }));
        this.load();
      },
      error: () => {
        this.toast.error(this.i18n.t('order.error.action'));
        this.load();
      },
    });
  }
}
