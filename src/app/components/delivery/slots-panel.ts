import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { DeliveryService } from '../../services/delivery-service';
import { DeliverySlot, SlotKind } from '../../types/delivery';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { Drawer } from '../../shared/drawer/drawer';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TIME_ZONE, TranslationKey } from '../../shared/i18n/i18n.service';

const DAY_MS = 24 * 60 * 60 * 1000;
// Monday first; 0 = Sunday as in the API
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const mondayOf = (date: Date) => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY_MS);
};

@Component({
  selector: 'app-slots-panel',
  imports: [...I18N_PIPES, ReactiveFormsModule, MatIcon, Drawer],
  templateUrl: './slots-panel.html',
})
export class SlotsPanel {
  private readonly delivery = inject(DeliveryService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  /** Pressing whose set-up is shown, chosen on the delivery page. */
  readonly centerId = input<string | null>(null);
  /** the pressing's own slots (its admins), instead of the one given by centerId */
  readonly own = input(false);
  readonly classNames = classNames;
  readonly weekStart = signal(mondayOf(new Date()));
  readonly kind = signal<SlotKind | 'ALL'>('ALL');
  readonly slots = signal<DeliverySlot[]>([]);
  readonly loaded = signal(false);
  readonly showForm = signal(false);
  readonly formError = signal<TranslationKey | null>(null);
  readonly saving = signal(false);

  readonly kinds = [
    { key: 'ALL', label: 'delivery.kind.all' },
    { key: 'PICKUP', label: 'delivery.kind.PICKUP' },
    { key: 'RETURN', label: 'delivery.kind.RETURN' },
  ] as const;

  /** The 7 days of the week shown, each with its slots of the chosen kind. */
  readonly days = computed(() => {
    const start = this.weekStart().getTime();
    const kind = this.kind();
    return Array.from({ length: 7 }, (_, i) => {
      const date = isoDay(new Date(start + i * DAY_MS));
      return {
        date,
        slots: this.slots().filter(
          (s) => s.starts_at.slice(0, 10) === date && (kind === 'ALL' || s.kind === kind),
        ),
      };
    });
  });

  readonly weekLabel = computed(() => {
    const start = this.weekStart();
    const end = new Date(start.getTime() + 6 * DAY_MS);
    const format = new Intl.DateTimeFormat(this.i18n.locale(), {
      day: 'numeric',
      month: 'long',
      timeZone: TIME_ZONE,
    });
    return `${format.format(start)} – ${format.format(end)}`;
  });

  // generation form
  readonly selectedWeekdays = signal(new Set([1, 2, 3, 4, 5, 6]));
  readonly form = this.fb.group({
    kind: ['PICKUP' as SlotKind, Validators.required],
    from: ['', Validators.required],
    to: ['', Validators.required],
    capacity: [5 as number | null, [Validators.required, Validators.min(1), Validators.max(1000)]],
    times: this.fb.array([this.timeRange('09:00', '11:00'), this.timeRange('16:00', '18:00')]),
  });

  constructor() {
    // reload when the platform admin picks another pressing
    effect(() => {
      if (this.own() || this.centerId()) untracked(() => this.load());
      else this.loaded.set(true);
    });
  }

  get times(): FormArray {
    return this.form.controls.times;
  }

  load(): void {
    const from = isoDay(this.weekStart());
    const to = isoDay(new Date(this.weekStart().getTime() + 6 * DAY_MS));
    this.delivery.getSlots(this.own() ? null : this.centerId(), from, to).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('delivery.error.load')),
    });
  }

  moveWeek(weeks: number): void {
    this.weekStart.update((d) => new Date(d.getTime() + weeks * 7 * DAY_MS));
    this.load();
  }

  thisWeek(): void {
    this.weekStart.set(mondayOf(new Date()));
    this.load();
  }

  dayLabel(date: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: TIME_ZONE,
    }).format(new Date(`${date}T12:00:00Z`));
  }

  timeLabel(slot: DeliverySlot): string {
    const format = new Intl.DateTimeFormat(this.i18n.locale(), {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIME_ZONE,
    });
    return `${format.format(new Date(slot.starts_at))} – ${format.format(new Date(slot.ends_at))}`;
  }

  weekdayLabel(weekday: number): string {
    // 2023-01-01 was a Sunday
    return new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2023, 0, 1 + weekday)),
    );
  }

  readonly weekOrder = WEEK_ORDER;
  readonly slotKinds: SlotKind[] = ['PICKUP', 'RETURN'];

  kindLabel(kind: SlotKind): string {
    return this.i18n.t(`delivery.kind.${kind}` as TranslationKey);
  }

  isPast(slot: DeliverySlot): boolean {
    return new Date(slot.ends_at).getTime() < Date.now();
  }

  async changeCapacity(slot: DeliverySlot): Promise<void> {
    const capacity = await this.confirm.askAmount({
      title: this.i18n.t('delivery.capacity_title'),
      message: `${this.dayLabel(slot.starts_at.slice(0, 10))} · ${this.timeLabel(slot)}`,
      confirmLabel: this.i18n.t('common.save'),
      label: this.i18n.t('delivery.capacity'),
      initial: slot.capacity,
      max: 1000,
      error: this.i18n.t('delivery.capacity_error'),
      hint: (value) =>
        value < slot.reserved_count
          ? this.i18n.t('delivery.capacity_below', { count: slot.reserved_count })
          : this.i18n.t('delivery.places', { reserved: slot.reserved_count, capacity: value }),
    });
    if (capacity === null) return;
    this.delivery.updateSlot(slot.id, { capacity: Math.round(capacity) }, this.own()).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('delivery.toast.updated'));
        this.load();
      },
      error: (err) =>
        this.toast.error(
          this.i18n.t(
            err.error?.code === 'CAPACITY_BELOW_RESERVED'
              ? 'delivery.capacity_below'
              : 'delivery.error.save',
            { count: slot.reserved_count },
          ),
        ),
    });
  }

  async toggleStatus(slot: DeliverySlot): Promise<void> {
    const closing = slot.status === 'OPEN';
    const confirmed = await this.confirm.ask({
      title: this.i18n.t(closing ? 'delivery.close_title' : 'delivery.reopen_title'),
      message: this.i18n.t(closing ? 'delivery.close_message' : 'delivery.reopen_message', {
        slot: `${this.dayLabel(slot.starts_at.slice(0, 10))} · ${this.timeLabel(slot)}`,
      }),
      confirmLabel: this.i18n.t(closing ? 'delivery.close' : 'delivery.reopen'),
      tone: closing ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    this.delivery.updateSlot(slot.id, { status: closing ? 'CLOSED' : 'OPEN' }, this.own()).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('delivery.toast.updated'));
        this.load();
      },
      error: () => this.toast.error(this.i18n.t('delivery.error.save')),
    });
  }

  async remove(slot: DeliverySlot): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm.delete_title'),
      message: this.i18n.t('delivery.confirm_delete', {
        slot: `${this.dayLabel(slot.starts_at.slice(0, 10))} · ${this.timeLabel(slot)}`,
      }),
      confirmLabel: this.i18n.t('common.delete'),
      tone: 'danger',
    });
    if (!confirmed) return;
    this.delivery.deleteSlot(slot.id, this.own()).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('delivery.toast.deleted'));
        this.load();
      },
      error: (err) =>
        this.toast.error(
          this.i18n.t(
            err.error?.code === 'SLOT_HAS_RESERVATIONS' ? 'delivery.error.booked' : 'delivery.error.save',
          ),
        ),
    });
  }

  openForm(): void {
    const monday = this.weekStart();
    this.form.patchValue({
      from: isoDay(new Date(Math.max(monday.getTime(), Date.now()))),
      to: isoDay(new Date(monday.getTime() + 6 * DAY_MS)),
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  toggleWeekday(weekday: number): void {
    this.selectedWeekdays.update((days) => {
      const next = new Set(days);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  addTime(): void {
    this.times.push(this.timeRange('', ''));
  }

  removeTime(index: number): void {
    this.times.removeAt(index);
  }

  async generate(): Promise<void> {
    const value = this.form.getRawValue();
    const times = (value.times as { start: string; end: string }[]).filter((t) => t.start && t.end);
    if (this.form.invalid || (!this.own() && !this.centerId())) {
      this.form.markAllAsTouched();
      return;
    }
    if (value.from! > value.to!) return this.formError.set('delivery.error.period');
    if (this.selectedWeekdays().size === 0) return this.formError.set('delivery.error.weekdays');
    if (times.length === 0 || times.some((t) => t.start >= t.end)) {
      return this.formError.set('delivery.error.times');
    }
    this.formError.set(null);

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('delivery.generate'),
      message: this.i18n.t('delivery.generate_confirm', {
        kind: this.kindLabel(value.kind!),
        from: this.i18n.date(`${value.from}T12:00:00Z`, 'date'),
        to: this.i18n.date(`${value.to}T12:00:00Z`, 'date'),
        capacity: value.capacity!,
      }),
      confirmLabel: this.i18n.t('delivery.generate'),
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.delivery
      .generateSlots({
        ...(this.own() ? {} : { center_id: this.centerId()! }),
        kind: value.kind!,
        from: value.from!,
        to: value.to!,
        weekdays: [...this.selectedWeekdays()],
        times,
        capacity: Number(value.capacity),
      })
      .subscribe({
        next: ({ created, skipped, outside_hours }) => {
          this.saving.set(false);
          const done = this.i18n.t('delivery.toast.generated', { created, skipped });
          this.toast.success(
            outside_hours ? `${done} ${this.i18n.t('delivery.toast.outside_hours', { count: outside_hours })}` : done,
          );
          this.showForm.set(false);
          this.weekStart.set(mondayOf(new Date(`${value.from}T00:00:00Z`)));
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.formError.set('delivery.error.save');
        },
      });
  }

  private timeRange(start: string, end: string) {
    return this.fb.group({ start: [start], end: [end] });
  }
}
