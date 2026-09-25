import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ToastService } from './toast.service';
import { TranslatePipe } from '../i18n/i18n.pipes';

@Component({
  selector: 'app-toasts',
  imports: [MatIcon, TranslatePipe],
  template: `
    <div class="fixed bottom-4 end-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="status"
          class="flex items-start gap-2 rounded-lg px-4 py-3 shadow-lg text-sm text-white"
          [class]="toast.kind === 'success' ? 'bg-slate-800' : 'bg-red-600'"
        >
          <mat-icon class="shrink-0 !size-5 !text-xl">{{
            toast.kind === 'success' ? 'check_circle' : 'error'
          }}</mat-icon>
          <span class="flex-1 pt-0.5">{{ toast.message }}</span>
          <button
            type="button"
            class="opacity-70 hover:opacity-100 cursor-pointer"
            [attr.aria-label]="'common.dismiss' | t"
            (click)="toastService.dismiss(toast.id)"
          >
            <mat-icon class="!size-5 !text-xl">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  readonly toastService = inject(ToastService);
}
