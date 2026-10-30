import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { classNames } from '../../shared/styles/class-names';
import { SlotsPanel } from './slots-panel';
import { FeesPanel } from './fees-panel';
import { MissionsPanel } from './missions-panel';
import { CouriersPanel } from './couriers-panel';
import { IssuesPanel } from './issues-panel';
import { CentersService } from '../../services/centers-service';
import { UserService } from '../../services/user-sevice';
import { Center } from '../../types/centers';

/** Delivery set-up of the platform admin: slots with their capacity, and delivery fees. */
@Component({
  selector: 'app-delivery-page',
  imports: [...I18N_PIPES, MatIcon, SlotsPanel, FeesPanel, MissionsPanel, CouriersPanel, IssuesPanel],
  template: `
    <section [class]="classNames.container">
      <div [class]="classNames.pageHeader">
        <div>
          <h1 [class]="classNames.pageTitle">{{ 'nav.delivery' | t }}</h1>
          <p class="text-sm text-slate-500">{{ 'delivery.subtitle' | t }}</p>
        </div>
      </div>

      <div class="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist">
        @for (t of tabs; track t.key) {
          <button
            type="button"
            role="tab"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm cursor-pointer"
            [class]="
              tab() === t.key
                ? 'border-cyan-700 bg-cyan-700 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            "
            [attr.aria-selected]="tab() === t.key"
            (click)="tab.set(t.key)"
          >
            <mat-icon class="!text-[18px] !size-5">{{ t.icon }}</mat-icon>
            {{ t.label | t }}
          </button>
        }
      </div>

      <!-- slots and fees belong to one pressing -->
      @if ((tab() === 'slots' || tab() === 'fees') && centers().length > 1) {
        <div class="mb-4 max-w-xs">
          <label for="delivery-center" [class]="classNames.label">{{ 'delivery.center' | t }}</label>
          <select id="delivery-center" [class]="classNames.input" [value]="centerId()" (change)="centerId.set($any($event.target).value)">
            @for (c of centers(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>
      }

      @switch (tab()) {
        @case ('missions') {
          <app-missions-panel />
        }
        @case ('slots') {
          <app-slots-panel [centerId]="centerId()" />
        }
        @case ('fees') {
          <app-fees-panel [centerId]="centerId()" />
        }
        @case ('couriers') {
          <app-couriers-panel />
        }
        @case ('issues') {
          <app-issues-panel />
        }
      }
    </section>
  `,
})
export class DeliveryPage {
  readonly classNames = classNames;
  readonly centers = signal<Center[]>([]);
  /** Pressing whose slots and fees are shown: the user's own, else the first active one. */
  readonly centerId = signal<string | null>(inject(UserService).getCenterId());
  readonly tab = signal<'missions' | 'slots' | 'fees' | 'couriers' | 'issues'>('missions');
  readonly tabs = [
    { key: 'missions', label: 'delivery.tab.missions', icon: 'route' },
    { key: 'slots', label: 'delivery.tab.slots', icon: 'event_available' },
    { key: 'fees', label: 'delivery.tab.fees', icon: 'local_shipping' },
    { key: 'couriers', label: 'delivery.tab.couriers', icon: 'two_wheeler' },
    { key: 'issues', label: 'delivery.tab.issues', icon: 'warning' },
  ] as const;

  constructor() {
    inject(CentersService)
      .list()
      .subscribe((centers) => {
        const active = centers.filter((c) => c.status === 'ACTIVE');
        this.centers.set(active);
        if (!active.some((c) => c.id === this.centerId())) this.centerId.set(active[0]?.id ?? null);
      });
  }
}
