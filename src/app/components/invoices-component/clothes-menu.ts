import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Invoice } from '../../types/invoice';
import { ClothesActions } from '../../shared/clothes-actions.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { TranslatePipe } from '../../shared/i18n/i18n.pipes';
import { clothesStatusClass, clothesStatusLabel } from '../../shared/status';

/** Clothes badge of an invoice row; clicking it opens the next steps (ready, picked up…). */
@Component({
  selector: 'app-clothes-menu',
  imports: [MatIcon, TranslatePipe],
  template: `
    <button
      type="button"
      [class]="
        clothesStatusClass[invoice().clothes_status] +
        ' cursor-pointer gap-0.5 hover:ring-2 hover:ring-offset-1 hover:ring-slate-300'
      "
      aria-haspopup="menu"
      [attr.aria-expanded]="position() !== null"
      [title]="'clothes.change' | t"
      (click)="toggle($event)"
    >
      {{ clothesStatusLabel[invoice().clothes_status] | t }}
      <mat-icon class="!size-4 !text-[16px]">expand_more</mat-icon>
    </button>

    @if (position(); as pos) {
      <ul
        role="menu"
        class="fixed z-50 min-w-52 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
        [style.top.px]="pos.top"
        [style.left.px]="pos.left"
        [style.right.px]="pos.right"
      >
        @switch (invoice().clothes_status) {
          @case ('not_cleaned') {
            <li role="none">
              <button role="menuitem" [class]="item" (click)="run($event, 'ready')">
                <mat-icon class="!text-sky-600">done_all</mat-icon> {{ 'invoices.mark_ready' | t }}
              </button>
            </li>
          }
          @case ('cleaned') {
            <li role="none">
              <button role="menuitem" [class]="item" (click)="run($event, 'pickup')">
                <mat-icon class="!text-green-600">shopping_bag</mat-icon>
                {{ 'invoice.mark_picked_up' | t }}
              </button>
            </li>
            <li role="none" class="border-t border-slate-100 mt-1 pt-1">
              <button role="menuitem" [class]="item" (click)="run($event, 'to_clean')">
                <mat-icon class="!text-amber-600 rtl:-scale-x-100">undo</mat-icon>
                {{ 'invoices.mark_to_clean' | t }}
              </button>
            </li>
          }
          @case ('picked_up') {
            <li role="none">
              <button role="menuitem" [class]="item" (click)="run($event, 'undo_pickup')">
                <mat-icon class="!text-red-500 rtl:-scale-x-100">undo</mat-icon>
                {{ 'invoice.undo_pickup' | t }}
              </button>
            </li>
          }
        }
      </ul>
    }
  `,
})
export class ClothesMenu {
  private readonly actions = inject(ClothesActions);
  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  invoice = input.required<Invoice>();

  readonly clothesStatusClass = clothesStatusClass;
  readonly clothesStatusLabel = clothesStatusLabel;
  readonly item =
    'flex w-full items-center gap-2 px-3 py-2 text-start text-slate-700 cursor-pointer hover:bg-slate-50';

  /** where the open menu is drawn (fixed, so the table's scroll area does not clip it) */
  readonly position = signal<{ top: number; left: number | null; right: number | null } | null>(
    null,
  );

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.position()) {
      this.position.set(null);
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const rtl = this.i18n.dir() === 'rtl';
    this.position.set({
      top: rect.bottom + 4,
      left: rtl ? null : rect.left,
      right: rtl ? window.innerWidth - rect.right : null,
    });
  }

  run(event: Event, action: 'ready' | 'to_clean' | 'pickup' | 'undo_pickup'): void {
    event.stopPropagation();
    this.position.set(null);
    const invoice = this.invoice();
    if (action === 'ready') void this.actions.markReady(invoice);
    if (action === 'to_clean') void this.actions.markToClean(invoice);
    if (action === 'pickup') void this.actions.markPickedUp(invoice);
    if (action === 'undo_pickup') void this.actions.undoPickup(invoice);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.position.set(null);
  }

  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  close(): void {
    this.position.set(null);
  }
}
