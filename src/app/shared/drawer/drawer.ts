import { Component, HostListener, inject, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../i18n/i18n.pipes';
import { ConfirmService } from '../confirm/confirm.service';

/** Side panel with a backdrop; closes on backdrop click or Escape. */
@Component({
  selector: 'app-drawer',
  imports: [MatIcon, TranslatePipe],
  template: `
    <div class="fixed inset-0 z-40 bg-slate-900/40" (click)="closed.emit()"></div>
    <aside
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
      class="fixed inset-y-0 end-0 z-40 flex w-full max-w-xl flex-col bg-slate-50 shadow-2xl"
    >
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <h2 class="text-lg font-semibold text-slate-800">{{ title() }}</h2>
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          [attr.aria-label]="'common.close' | t"
          (click)="closed.emit()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <div class="flex-1 overflow-y-auto p-5">
        <ng-content />
      </div>
    </aside>
  `,
})
export class Drawer {
  title = input.required<string>();
  closed = output<void>();

  private readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    // Escape while a confirmation is open only closes the confirmation
    if (this.confirm.pending() || event.defaultPrevented) return;
    this.closed.emit();
  }
}
