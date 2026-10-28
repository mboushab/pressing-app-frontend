import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ConfirmService } from './confirm.service';
import { TranslatePipe } from '../i18n/i18n.pipes';
import { classNames } from '../styles/class-names';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatIcon, TranslatePipe],
  template: `
    @if (confirm.pending(); as q) {
      <div class="fixed inset-0 z-[60] bg-slate-900/50" (click)="confirm.answer(false)"></div>
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        class="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-2xl"
        (submit)="$event.preventDefault(); submit()"
      >
        <div class="flex gap-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
            [class]="q.tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-700'"
          >
            <mat-icon>{{ q.tone === 'danger' ? 'warning' : q.amount ? 'payments' : 'help' }}</mat-icon>
          </span>
          <div class="flex-1">
            <h2 id="confirm-title" class="text-lg font-semibold text-slate-800">{{ q.title }}</h2>
            <p id="confirm-message" class="mt-1 text-sm text-slate-600">{{ q.message }}</p>
          </div>
        </div>

        @if (q.amount; as a) {
          <div class="mt-4">
            <label for="confirm-amount" [class]="classNames.label">{{ a.label }}</label>
            <input
              #amountInput
              id="confirm-amount"
              type="number"
              min="0"
              step="1"
              [max]="a.max"
              [class]="classNames.input"
              [value]="amountText()"
              (input)="amountText.set($any($event.target).value)"
            />
            @if (amountValid()) {
              <p class="mt-1 text-sm text-slate-600">{{ a.hint(amountNumber()) }}</p>
            } @else if (amountText() !== '') {
              <p [class]="classNames.fieldError">{{ a.error }}</p>
            }
          </div>
        }

        <div class="mt-5 flex justify-end gap-2">
          <button
            #cancelButton
            type="button"
            [class]="classNames.buttonSecondary"
            (click)="confirm.answer(false)"
          >
            {{ 'common.cancel' | t }}
          </button>
          <button
            #confirmButton
            type="submit"
            [class]="q.tone === 'danger' ? classNames.buttonDanger : classNames.buttonPrimary"
            [disabled]="q.amount && !amountValid()"
          >
            {{ q.confirmLabel }}
          </button>
        </div>
      </form>
    }
  `,
})
export class ConfirmDialog {
  readonly confirm = inject(ConfirmService);
  readonly classNames = classNames;

  readonly amountText = signal('');
  readonly amountNumber = computed(() => Number(this.amountText()));
  readonly amountValid = computed(() => {
    const max = this.confirm.pending()?.amount?.max ?? 0;
    const value = this.amountNumber();
    return this.amountText() !== '' && Number.isFinite(value) && value > 0 && value <= max;
  });

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  constructor() {
    effect(() => {
      const q = this.confirm.pending();
      if (!q) return;
      this.amountText.set(q.amount?.initial ? String(q.amount.initial) : '');
      // focus the amount field; "Cancel" for deletions so Enter never deletes by accident
      const target = q.amount
        ? this.amountInput()
        : q.tone === 'danger'
          ? this.cancelButton()
          : this.confirmButton();
      target?.nativeElement.focus();
      if (q.amount) this.amountInput()?.nativeElement.select();
    });
  }

  submit(): void {
    const q = this.confirm.pending();
    if (!q) return;
    if (q.amount) {
      if (this.amountValid()) this.confirm.answer(true, this.amountNumber());
    } else {
      this.confirm.answer(true);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.confirm.pending()) return;
    // tells the drawer underneath not to close too
    event.preventDefault();
    this.confirm.answer(false);
  }
}
