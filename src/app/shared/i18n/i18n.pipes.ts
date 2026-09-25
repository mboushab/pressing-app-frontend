import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, TranslationKey } from './i18n.service';

// Impure so they re-run when the language signal changes.

@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(key: TranslationKey, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}

@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(value: number | string | null | undefined): string {
    return this.i18n.money(value);
  }
}

@Pipe({ name: 'appDate', pure: false })
export class AppDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(
    value: string | Date | null | undefined,
    format: 'date' | 'datetime' | 'short' | 'long' = 'datetime',
  ): string {
    return this.i18n.date(value, format);
  }
}

export const I18N_PIPES = [TranslatePipe, MoneyPipe, AppDatePipe] as const;
