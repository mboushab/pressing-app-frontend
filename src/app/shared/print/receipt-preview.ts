import { Component, HostListener, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { PrintService } from './print.service';
import { Receipt } from './receipt';
import { TranslatePipe } from '../i18n/i18n.pipes';
import { classNames } from '../styles/class-names';
import { UserService } from '../../services/user-sevice';

/** On-screen preview of the receipt, exactly as it will be printed. */
@Component({
  selector: 'app-receipt-preview',
  imports: [MatIcon, Receipt, TranslatePipe],
  template: `
    @if (print.previewOpen() && print.invoice(); as invoice) {
      <div class="fixed inset-0 z-[55] bg-slate-900/50" (click)="print.closePreview()"></div>
      <div
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'receipt.preview' | t"
        class="fixed left-1/2 top-1/2 z-[55] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-slate-100 shadow-2xl"
      >
        <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 rounded-t-xl">
          <h2 class="font-semibold text-slate-800">{{ 'receipt.preview' | t }}</h2>
          <button
            type="button"
            [class]="classNames.iconButton"
            [attr.aria-label]="'common.close' | t"
            (click)="print.closePreview()"
          >
            <mat-icon>close</mat-icon>
          </button>
        </header>
        <!-- the paper -->
        <div class="flex-1 overflow-y-auto p-4">
          <app-receipt
            class="mx-auto shadow-md"
            [invoice]="invoice"
            [printedAt]="print.printedAt()"
            [cashier]="cashier"
          />
        </div>
        <footer class="flex justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 rounded-b-xl">
          <button type="button" [class]="classNames.buttonSecondary" (click)="print.closePreview()">
            {{ 'common.close' | t }}
          </button>
          <button type="button" [class]="classNames.buttonPrimary" (click)="print.print()" autofocus>
            <mat-icon>print</mat-icon> {{ 'print.short' | t }}
          </button>
        </footer>
      </div>
    }
  `,
})
export class ReceiptPreview {
  readonly print = inject(PrintService);
  readonly classNames = classNames;
  readonly cashier = inject(UserService).getUsername();

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.print.previewOpen()) return;
    event.preventDefault();
    this.print.closePreview();
  }
}
