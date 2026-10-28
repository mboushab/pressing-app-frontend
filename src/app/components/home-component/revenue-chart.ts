import { Component, computed, inject, input, signal } from '@angular/core';
import { SeriesPoint } from '../../types/stats';
import { I18nService } from '../../shared/i18n/i18n.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';

const WIDTH = 800;
const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 64 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const MAX_X_LABELS = 8;

/** Rounded 1/2/2.5/5 × 10^n step so the axis shows clean numbers. */
function niceStep(max: number, ticks: number): number {
  const rough = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough);
  return step ?? 10 * magnitude;
}

/** Column path with a 4px rounded data-end and a square base. */
function columnPath(x: number, y: number, w: number, baseline: number): string {
  const h = baseline - y;
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${baseline}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${baseline}Z`;
}

/** Billed vs collected per day or month: grouped columns, one axis. */
@Component({
  selector: 'app-revenue-chart',
  imports: [...I18N_PIPES],
  styles: `
    :host {
      display: block;
      --series-billed: #2a78d6;
      --series-collected: #eb6834;
      --grid: #e1e0d9;
      --baseline: #c3c2b7;
      --muted: #898781;
    }
    .group:focus {
      outline: none;
    }
    .group:focus .hit,
    .group:hover .hit {
      fill: rgba(11, 11, 11, 0.04);
    }
  `,
  template: `
    <!-- legend: always present for two series -->
    <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-2">
      <span class="inline-flex items-center gap-1.5">
        <span class="inline-block size-3 rounded-sm" style="background: var(--series-billed)"></span>
        {{ 'dash.billed' | t }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="inline-block size-3 rounded-sm" style="background: var(--series-collected)"></span>
        {{ 'dash.collected' | t }}
      </span>
      <button
        type="button"
        class="ms-auto text-sm text-cyan-700 underline cursor-pointer"
        [attr.aria-pressed]="showTable()"
        (click)="showTable.set(!showTable())"
      >
        {{ (showTable() ? 'dash.show_chart' : 'dash.show_table') | t }}
      </button>
    </div>

    @if (showTable()) {
      <div class="max-h-72 overflow-y-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs uppercase text-slate-500">
              <th class="py-1 text-start">{{ 'dash.period' | t }}</th>
              <th class="py-1 text-end">{{ 'dash.billed' | t }}</th>
              <th class="py-1 text-end">{{ 'dash.collected' | t }}</th>
            </tr>
          </thead>
          <tbody class="tabular-nums">
            @for (point of series(); track point.bucket) {
              <tr class="border-t border-slate-100">
                <td class="py-1">{{ bucketLabel(point.bucket, true) }}</td>
                <td class="py-1 text-end">{{ point.billed | money }}</td>
                <td class="py-1 text-end">{{ point.collected | money }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <!-- the time axis stays left-to-right in both languages -->
      <div class="relative" dir="ltr">
        <svg
          [attr.viewBox]="'0 0 ' + width + ' ' + height"
          class="block w-full h-auto"
          role="img"
          [attr.aria-label]="'dash.chart_label' | t"
        >
          <!-- gridlines and y ticks -->
          @for (tick of yTicks(); track tick.value) {
            <line
              [attr.x1]="margin.left"
              [attr.x2]="width - margin.right"
              [attr.y1]="tick.y"
              [attr.y2]="tick.y"
              [attr.stroke]="tick.value === 0 ? 'var(--baseline)' : 'var(--grid)'"
              stroke-width="1"
            />
            <!-- right-aligned against the plot in both directions -->
            <text
              [attr.x]="margin.left - 8"
              [attr.y]="tick.y"
              [attr.direction]="i18n.dir()"
              [attr.text-anchor]="i18n.dir() === 'rtl' ? 'start' : 'end'"
              dominant-baseline="middle"
              font-size="11"
              fill="var(--muted)"
              class="tabular-nums"
            >
              {{ tick.label }}
            </text>
          }

          @for (group of groups(); track group.bucket; let i = $index) {
            <g
              class="group"
              tabindex="0"
              [attr.aria-label]="group.aria"
              (pointerenter)="hovered.set(i)"
              (pointerleave)="hovered.set(null)"
              (focus)="hovered.set(i)"
              (blur)="hovered.set(null)"
            >
              <!-- the whole column band is the hit target -->
              <rect
                class="hit"
                [attr.x]="group.x0"
                [attr.y]="margin.top"
                [attr.width]="group.width"
                [attr.height]="plotHeight"
                fill="transparent"
              />
              <path [attr.d]="group.billedPath" fill="var(--series-billed)" />
              <path [attr.d]="group.collectedPath" fill="var(--series-collected)" />
              @if (group.label) {
                <text
                  [attr.x]="group.cx"
                  [attr.y]="height - 8"
                  text-anchor="middle"
                  font-size="11"
                  fill="var(--muted)"
                >
                  {{ group.label }}
                </text>
              }
            </g>
          }
        </svg>

        @if (hoveredGroup(); as g) {
          <div
            class="pointer-events-none absolute top-0 z-10 min-w-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
            [style.left.%]="(g.cx / width) * 100"
            [attr.dir]="i18n.dir()"
          >
            <p class="text-xs text-slate-500 mb-1">{{ g.fullLabel }}</p>
            <p class="flex items-center gap-2">
              <span class="inline-block h-0.5 w-3" style="background: var(--series-billed)"></span>
              <strong class="font-semibold">{{ g.billed | money }}</strong>
              <span class="text-slate-500">{{ 'dash.billed' | t }}</span>
            </p>
            <p class="flex items-center gap-2">
              <span class="inline-block h-0.5 w-3" style="background: var(--series-collected)"></span>
              <strong class="font-semibold">{{ g.collected | money }}</strong>
              <span class="text-slate-500">{{ 'dash.collected' | t }}</span>
            </p>
          </div>
        }
      </div>
    }
  `,
})
export class RevenueChart {
  readonly i18n = inject(I18nService);

  series = input.required<SeriesPoint[]>();
  granularity = input.required<'day' | 'month'>();

  readonly width = WIDTH;
  readonly height = HEIGHT;
  readonly margin = MARGIN;
  readonly plotHeight = PLOT_H;
  readonly showTable = signal(false);
  readonly hovered = signal<number | null>(null);

  private readonly scale = computed(() => {
    const max = Math.max(0, ...this.series().flatMap((p) => [p.billed, p.collected]));
    const step = max > 0 ? niceStep(max, 4) : 1;
    const top = step * Math.max(1, Math.ceil(max / step));
    return { step, top, y: (v: number) => MARGIN.top + PLOT_H - (v / top) * PLOT_H };
  });

  readonly yTicks = computed(() => {
    const { step, top, y } = this.scale();
    const compact = new Intl.NumberFormat(this.i18n.locale(), { notation: 'compact' });
    const ticks = [];
    for (let v = 0; v <= top + step / 2; v += step) {
      ticks.push({ value: v, y: y(v), label: compact.format(v) });
    }
    return ticks;
  });

  readonly groups = computed(() => {
    const points = this.series();
    const { y } = this.scale();
    const baseline = MARGIN.top + PLOT_H;
    const band = PLOT_W / Math.max(1, points.length);
    // two columns per band, a 2px surface gap between them, never wider than 24px
    const barW = Math.max(2, Math.min(24, (band - 8) / 2 - 1));
    const labelEvery = Math.ceil(points.length / MAX_X_LABELS);
    this.i18n.lang(); // re-label when the language changes

    return points.map((p, i) => {
      const x0 = MARGIN.left + i * band;
      const cx = x0 + band / 2;
      const fullLabel = this.bucketLabel(p.bucket, true);
      return {
        bucket: p.bucket,
        billed: p.billed,
        collected: p.collected,
        x0,
        cx,
        width: band,
        billedPath: columnPath(cx - barW - 1, y(p.billed), barW, baseline),
        collectedPath: columnPath(cx + 1, y(p.collected), barW, baseline),
        label: i % labelEvery === 0 ? this.bucketLabel(p.bucket, false) : '',
        fullLabel,
        aria: `${fullLabel}: ${this.i18n.t('dash.billed')} ${this.i18n.money(p.billed)}, ${this.i18n.t('dash.collected')} ${this.i18n.money(p.collected)}`,
      };
    });
  });

  readonly hoveredGroup = computed(() => {
    const i = this.hovered();
    return i === null ? null : (this.groups()[i] ?? null);
  });

  bucketLabel(bucket: string, long: boolean): string {
    const monthly = this.granularity() === 'month';
    // short day labels under the axis: digits only, so no bidi marks end up in the LTR axis
    if (!monthly && !long) {
      const [, month, dayOfMonth] = bucket.split('-');
      return `${dayOfMonth}/${month}`;
    }
    const date = new Date(monthly ? `${bucket}-01T00:00:00` : `${bucket}T00:00:00`);
    const options: Intl.DateTimeFormatOptions = monthly
      ? { month: long ? 'long' : 'short', ...(long ? { year: 'numeric' } : {}) }
      : long
        ? { weekday: 'short', day: 'numeric', month: 'long' }
        : { day: '2-digit', month: '2-digit' };
    return new Intl.DateTimeFormat(this.i18n.locale(), options)
      .format(date)
      .replace(/[\u200e\u200f\u061c]/g, '');
  }
}
