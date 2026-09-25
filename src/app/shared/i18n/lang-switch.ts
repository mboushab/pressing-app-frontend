import { Component, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-lang-switch',
  imports: [MatIcon],
  template: `
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer"
      [class]="
        dark()
          ? 'text-slate-300 hover:bg-white/10 hover:text-white'
          : 'text-slate-600 border border-slate-300 bg-white hover:bg-slate-50'
      "
      [attr.lang]="i18n.lang() === 'fr' ? 'ar' : 'fr'"
      [attr.aria-label]="i18n.lang() === 'fr' ? 'التبديل إلى العربية' : 'Passer en français'"
      (click)="i18n.toggle()"
    >
      <mat-icon class="!text-lg !size-5">translate</mat-icon>
      {{ i18n.lang() === 'fr' ? 'العربية' : 'Français' }}
    </button>
  `,
})
export class LangSwitch {
  readonly i18n = inject(I18nService);
  /** true on the dark header, false on light backgrounds */
  dark = input(false);
}
