import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ScheduleService } from '../../services/schedule-service';
import { UserService } from '../../services/user-sevice';
import { ReceptionPause, Schedule } from '../../types/schedule';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';

// Monday first; 0 = Sunday as in the API
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** A weekday being edited: closed, one range, or two (with a break). */
interface DayRow {
  weekday: number;
  open: boolean;
  first: { opens_at: string; closes_at: string };
  second: { opens_at: string; closes_at: string } | null;
}

/**
 * Opening hours of the pressing: couriers only come when it is open, and the
 * reception switch stops new app orders for a while (any member). Hours and
 * closures are set by the pressing's admins.
 */
@Component({
  selector: 'app-hours-page',
  imports: [...I18N_PIPES, FormsModule, MatIcon],
  template: `
    <section [class]="classNames.container + ' space-y-5'">
      <div [class]="classNames.pageHeader + ' !mb-0'">
        <div>
          <h1 [class]="classNames.pageTitle">{{ 'nav.hours' | t }}</h1>
          <p class="text-sm text-slate-500">{{ 'hours.subtitle' | t }}</p>
        </div>
      </div>

      @if (schedule(); as s) {
        <!-- reception -->
        <div [class]="classNames.card + ' p-4'">
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
              [class]="s.reception.receiving ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
            >
              <mat-icon class="!text-[18px] !size-5">{{ s.reception.receiving ? 'check_circle' : 'pause_circle' }}</mat-icon>
              {{ receptionLabel() }}
            </span>
            <span class="text-sm text-slate-500">{{ openLabel() }}</span>
          </div>
          <p class="mt-2 text-sm text-slate-500">{{ 'hours.reception_hint' | t }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            @if (s.reception.receiving) {
              @for (p of pauses; track p.key) {
                <button type="button" [class]="classNames.buttonSecondary" (click)="pause(p.key)">
                  <mat-icon class="!text-[18px] !size-5">pause</mat-icon> {{ p.label | t }}
                </button>
              }
            } @else {
              <button type="button" [class]="classNames.buttonPrimary" (click)="pause('OFF')">
                <mat-icon>play_arrow</mat-icon> {{ 'hours.resume' | t }}
              </button>
            }
          </div>
        </div>

        <!-- weekly hours -->
        <div [class]="classNames.card + ' p-4'">
          <h2 class="font-semibold text-slate-800">{{ 'hours.week' | t }}</h2>
          <p class="mb-3 text-sm text-slate-500">
            {{ (s.hours.length ? 'hours.week_hint' : 'hours.always_open') | t }}
          </p>
          <div class="divide-y divide-slate-100">
            @for (day of days(); track day.weekday) {
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                <label class="flex w-32 items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    [attr.aria-label]="weekdayLabel(day.weekday)"
                    [disabled]="!isAdmin"
                    [(ngModel)]="day.open"
                  />
                  {{ weekdayLabel(day.weekday) }}
                </label>
                @if (day.open) {
                  <span class="flex items-center gap-1" dir="ltr">
                    <input type="time" [disabled]="!isAdmin" [(ngModel)]="day.first.opens_at" [class]="timeInput" />
                    –
                    <input type="time" [disabled]="!isAdmin" [(ngModel)]="day.first.closes_at" [class]="timeInput" />
                  </span>
                  @if (day.second; as second) {
                    <span class="flex items-center gap-1" dir="ltr">
                      <input type="time" [disabled]="!isAdmin" [(ngModel)]="second.opens_at" [class]="timeInput" />
                      –
                      <input type="time" [disabled]="!isAdmin" [(ngModel)]="second.closes_at" [class]="timeInput" />
                    </span>
                  }
                  @if (isAdmin) {
                    <button type="button" class="text-sm text-cyan-700 hover:underline cursor-pointer" (click)="toggleBreak(day)">
                      {{ (day.second ? 'hours.no_break' : 'hours.add_break') | t }}
                    </button>
                  }
                } @else {
                  <span class="text-sm text-slate-400">{{ 'hours.closed' | t }}</span>
                }
              </div>
            }
          </div>
          @if (hoursError(); as e) {
            <p [class]="classNames.fieldError">{{ e | t }}</p>
          }
          @if (isAdmin) {
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" [class]="classNames.buttonPrimary" [disabled]="saving()" (click)="saveHours()">
                {{ 'common.save' | t }}
              </button>
              <button type="button" [class]="classNames.buttonSecondary" (click)="copyMonday()">
                {{ 'hours.copy_monday' | t }}
              </button>
            </div>
          }
        </div>

        <!-- closures -->
        <div [class]="classNames.card + ' p-4'">
          <h2 class="font-semibold text-slate-800">{{ 'hours.closures' | t }}</h2>
          <p class="mb-3 text-sm text-slate-500">{{ 'hours.closures_hint' | t }}</p>
          @for (c of s.closures; track c.id) {
            <div class="flex items-center gap-3 border-b border-slate-100 py-2 last:border-b-0">
              <span class="flex-1 text-sm">
                <span class="font-medium text-slate-800">{{ c.day + 'T12:00:00Z' | appDate: 'long' }}</span>
                @if (c.reason) {
                  <span class="text-slate-500"> — {{ c.reason }}</span>
                }
              </span>
              @if (isAdmin) {
                <button type="button" [class]="classNames.iconButtonDanger" [attr.aria-label]="'common.delete' | t" (click)="removeClosure(c.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>
          } @empty {
            <p class="text-sm text-slate-400">{{ 'hours.no_closure' | t }}</p>
          }
          @if (isAdmin) {
            <div class="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label for="closure-day" [class]="classNames.label">{{ 'hours.closure_day' | t }}</label>
                <input id="closure-day" type="date" [min]="today" [(ngModel)]="closureDay" [class]="classNames.input" />
              </div>
              <div class="min-w-48 flex-1">
                <label for="closure-reason" [class]="classNames.label">{{ 'hours.closure_reason' | t }}</label>
                <input id="closure-reason" [(ngModel)]="closureReason" maxlength="255" [class]="classNames.input" />
              </div>
              <button type="button" [class]="classNames.buttonSecondary" [disabled]="!closureDay" (click)="addClosure()">
                <mat-icon>event_busy</mat-icon> {{ 'hours.close_day' | t }}
              </button>
            </div>
          }
        </div>
      } @else {
        <p [class]="classNames.empty">{{ 'common.loading' | t }}</p>
      }
    </section>
  `,
})
export class HoursPage {
  private readonly service = inject(ScheduleService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);

  readonly classNames = classNames;
  readonly timeInput = 'rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50';
  readonly isAdmin = inject(UserService).isAdmin();
  readonly today = new Date().toISOString().slice(0, 10);
  readonly schedule = signal<Schedule | null>(null);
  readonly days = signal<DayRow[]>([]);
  readonly saving = signal(false);
  readonly hoursError = signal<TranslationKey | null>(null);
  closureDay = '';
  closureReason = '';

  readonly pauses: { key: ReceptionPause; label: TranslationKey }[] = [
    { key: '1H', label: 'hours.pause_1h' },
    { key: '2H', label: 'hours.pause_2h' },
    { key: 'NEXT_OPENING', label: 'hours.pause_next' },
    { key: 'INDEFINITE', label: 'hours.pause_indefinite' },
  ];

  readonly receptionLabel = computed(() => {
    const r = this.schedule()?.reception;
    if (!r || r.receiving) return this.i18n.t('hours.receiving');
    return r.paused_until
      ? this.i18n.t('hours.paused_until', { until: this.i18n.date(r.paused_until, 'short') })
      : this.i18n.t('hours.paused');
  });

  readonly openLabel = computed(() => {
    const st = this.schedule()?.status;
    if (!st) return '';
    if (st.open_now) {
      return st.closes_at
        ? this.i18n.t('hours.open_until', { time: this.i18n.date(st.closes_at, 'short') })
        : this.i18n.t('hours.open');
    }
    return st.next_opening
      ? this.i18n.t('hours.closed_until', { time: this.i18n.date(st.next_opening, 'short') })
      : this.i18n.t('hours.closed');
  });

  constructor() {
    this.load();
  }

  private apply(schedule: Schedule): void {
    this.schedule.set(schedule);
    this.days.set(
      WEEK_ORDER.map((weekday) => {
        const ranges = schedule.hours.filter((h) => h.weekday === weekday);
        return {
          weekday,
          open: ranges.length > 0 || schedule.hours.length === 0,
          first: { opens_at: ranges[0]?.opens_at ?? '08:00', closes_at: ranges[0]?.closes_at ?? '20:00' },
          second: ranges[1] ? { opens_at: ranges[1].opens_at, closes_at: ranges[1].closes_at } : null,
        };
      }),
    );
  }

  load(): void {
    this.service.get().subscribe({
      next: (s) => this.apply(s),
      error: () => this.toast.error(this.i18n.t('hours.error.load')),
    });
  }

  weekdayLabel(weekday: number): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2023, 0, 1 + weekday)),
    );
  }

  toggleBreak(day: DayRow): void {
    day.second = day.second ? null : { opens_at: '16:00', closes_at: '21:00' };
    if (day.second && day.first.closes_at > '13:00') day.first.closes_at = '13:00';
    this.days.update((d) => [...d]);
  }

  /** Same hours as Monday on every open day. */
  copyMonday(): void {
    const monday = this.days()[0];
    this.days.update((days) =>
      days.map((d) =>
        d === monday || !d.open
          ? d
          : { ...d, first: { ...monday.first }, second: monday.second ? { ...monday.second } : null },
      ),
    );
  }

  saveHours(): void {
    const hours = this.days().flatMap((d) =>
      d.open ? [d.first, ...(d.second ? [d.second] : [])].map((r) => ({ weekday: d.weekday, ...r })) : [],
    );
    const invalid = hours.some((h) => !h.opens_at || !h.closes_at || h.opens_at >= h.closes_at);
    if (invalid) return this.hoursError.set('hours.error.range');
    this.hoursError.set(null);
    this.saving.set(true);
    this.service.setHours(hours).subscribe({
      next: (s) => {
        this.saving.set(false);
        this.apply(s);
        this.toast.success(this.i18n.t('hours.saved'));
      },
      error: () => {
        this.saving.set(false);
        this.hoursError.set('hours.error.range');
      },
    });
  }

  pause(pause: ReceptionPause): void {
    this.service.setReception(pause).subscribe({
      next: (s) => this.apply(s),
      error: () => this.toast.error(this.i18n.t('order.error.action')),
    });
  }

  async addClosure(): Promise<void> {
    const day = this.closureDay;
    const ok = await this.confirm.ask({
      title: this.i18n.t('hours.close_day'),
      message: this.i18n.t('hours.close_confirm', { day: this.i18n.date(`${day}T12:00:00Z`, 'long') }),
      confirmLabel: this.i18n.t('hours.close_day'),
      tone: 'danger',
    });
    if (!ok) return;
    this.service.addClosure(day, this.closureReason.trim() || null).subscribe({
      next: (r) => {
        this.closureDay = '';
        this.closureReason = '';
        this.toast.success(
          this.i18n.t('hours.closed_done', { collections: r.collections_called_off, deliveries: r.deliveries_to_move }),
        );
        this.load();
      },
      error: (err) =>
        this.toast.error(this.i18n.t(err.error?.code === 'ALREADY_CLOSED' ? 'hours.error.already' : 'order.error.action')),
    });
  }

  async removeClosure(id: string): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('hours.reopen'),
      message: this.i18n.t('hours.reopen_confirm'),
      confirmLabel: this.i18n.t('hours.reopen'),
    });
    if (!ok) return;
    this.service.removeClosure(id).subscribe({
      next: () => this.load(),
      error: () => this.toast.error(this.i18n.t('order.error.action')),
    });
  }
}
