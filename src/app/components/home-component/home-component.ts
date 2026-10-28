import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { StatsService } from '../../services/stats-service';
import { DashboardStats } from '../../types/stats';
import { classNames } from '../../shared/styles/class-names';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';
import { ToastService } from '../../shared/toast/toast.service';
import { RevenueChart } from './revenue-chart';

type PeriodPreset = 'today' | 'last7' | 'last30' | 'month' | 'last_month' | 'year';

const pad = (n: number) => String(n).padStart(2, '0');
/** local calendar day as YYYY-MM-DD */
const day = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function presetRange(preset: PeriodPreset, now = new Date()): { from: string; to: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysAgo = (n: number) => new Date(y, m, now.getDate() - n);
  switch (preset) {
    case 'today':
      return { from: day(now), to: day(now) };
    case 'last7':
      return { from: day(daysAgo(6)), to: day(now) };
    case 'last30':
      return { from: day(daysAgo(29)), to: day(now) };
    case 'month':
      return { from: day(new Date(y, m, 1)), to: day(now) };
    case 'last_month':
      return { from: day(new Date(y, m - 1, 1)), to: day(new Date(y, m, 0)) };
    case 'year':
      return { from: day(new Date(y, 0, 1)), to: day(now) };
  }
}

/** Admin dashboard: how much the shop bills and actually collects, and where it comes from. */
@Component({
  selector: 'app-home-component',
  imports: [RouterLink, NgTemplateOutlet, MatIcon, RevenueChart, ...I18N_PIPES],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
  private readonly statsService = inject(StatsService);
  private readonly toast = inject(ToastService);
  readonly i18n = inject(I18nService);

  readonly classNames = classNames;
  readonly presets: { key: PeriodPreset; label: TranslationKey }[] = [
    { key: 'today', label: 'dash.preset.today' },
    { key: 'last7', label: 'dash.preset.last7' },
    { key: 'last30', label: 'dash.preset.last30' },
    { key: 'month', label: 'dash.preset.month' },
    { key: 'last_month', label: 'dash.preset.last_month' },
    { key: 'year', label: 'dash.preset.year' },
  ];

  readonly preset = signal<PeriodPreset>('month');
  readonly loading = signal(true);
  readonly failed = signal(false);

  /** latest figures; they stay on screen (dimmed) while another period loads or if it fails */
  readonly stats = toSignal<DashboardStats | null, null>(
    toObservable(this.preset).pipe(
      map((preset) => presetRange(preset)),
      tap(() => this.loading.set(true)),
      switchMap(({ from, to }) =>
        this.statsService.getDashboard(from, to).pipe(
          tap(() => {
            this.failed.set(false);
            this.loading.set(false);
          }),
          catchError(() => {
            this.failed.set(true);
            this.loading.set(false);
            this.toast.error(this.i18n.t('dash.error'));
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly topItemMax = computed(() =>
    Math.max(1, ...(this.stats()?.topItems.map((i) => i.revenue) ?? [])),
  );

  /** relative change vs the previous period, or null when there is nothing to compare to */
  change(current: number, previous: number): number | null {
    if (!previous) return null;
    return (current - previous) / previous;
  }

  percent(ratio: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(ratio);
  }

  round(value: number): number {
    return Math.round(value);
  }

  signedPercent(ratio: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), {
      style: 'percent',
      maximumFractionDigits: 0,
      signDisplay: 'exceptZero',
    }).format(ratio);
  }
}
