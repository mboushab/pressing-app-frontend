import { Component, HostListener, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/** Side panel with a backdrop; closes on backdrop click or Escape. */
@Component({
  selector: 'app-drawer',
  imports: [MatIcon],
  template: `
    <div class="fixed inset-0 z-40 bg-slate-900/40" (click)="closed.emit()"></div>
    <aside
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
      class="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col bg-slate-50 shadow-2xl"
    >
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <h2 class="text-lg font-semibold text-slate-800">{{ title() }}</h2>
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label="Close"
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
