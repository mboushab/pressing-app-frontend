import { Injectable, computed, effect, signal } from '@angular/core';
import { translations } from './translations';

export type Lang = 'fr' | 'ar';
export type TranslationKey = keyof (typeof translations)['fr'];

const STORAGE_KEY = 'lang';
// Intl locales used to format numbers, amounts and dates.
// Arabic uses Latin digits, as is usual in Mauritania.
const intlLocale: Record<Lang, string> = { fr: 'fr-FR', ar: 'ar-MR-u-nu-latn' };
export const CURRENCY = 'MRU';
export const TIME_ZONE = 'Africa/Nouakchott';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.readStoredLang());
  readonly dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  readonly locale = computed(() => intlLocale[this.lang()]);

  constructor() {
    effect(() => {
      const root = document.documentElement;
      root.lang = this.lang();
      root.dir = this.dir();
      document.title = this.t('app.name');
      try {
        localStorage.setItem(STORAGE_KEY, this.lang());
      } catch {
        // storage unavailable: the choice just won't be remembered
      }
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  toggle(): void {
    this.lang.update((l) => (l === 'fr' ? 'ar' : 'fr'));
  }

  /** Translate a key, replacing {placeholders} with params. */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text: string = translations[this.lang()][key] ?? translations.fr[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  }

  money(value: number | string | null | undefined): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: CURRENCY,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  date(value: string | Date | null | undefined, format: 'date' | 'datetime' | 'short' | 'long'): string {
    if (!value) return '';
    const options: Record<typeof format, Intl.DateTimeFormatOptions> = {
      date: { day: '2-digit', month: '2-digit', year: 'numeric' },
      datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      short: { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' },
      long: { weekday: 'long', day: 'numeric', month: 'long' },
    };
    // the business runs on Nouakchott time (UTC+0), whatever the browser's zone
    return new Intl.DateTimeFormat(this.locale(), { ...options[format], timeZone: TIME_ZONE }).format(new Date(value));
  }

  private readStoredLang(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'fr' || stored === 'ar') return stored;
    } catch {
      // ignore
    }
    return 'fr';
  }
}
