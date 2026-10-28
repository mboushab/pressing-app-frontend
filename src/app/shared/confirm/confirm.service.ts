import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  /** danger = red button (deletions), primary otherwise */
  tone?: 'danger' | 'primary';
}

export interface AmountOptions extends ConfirmOptions {
  label: string;
  initial: number | null;
  /** accepted range is 0 < amount <= max */
  max: number;
  error: string;
  /** line shown under the input, updated as the user types */
  hint: (amount: number) => string;
}

interface PendingConfirm extends ConfirmOptions {
  amount?: Omit<AmountOptions, keyof ConfirmOptions>;
  resolve: (confirmed: boolean, amount?: number) => void;
}

/** Asks the user to confirm an action in a modal dialog before it is sent to the server. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => this.open({ ...options, resolve: (ok) => resolve(ok) }));
  }

  /** Same dialog with an amount field; resolves to the amount, or null if cancelled. */
  askAmount(options: AmountOptions): Promise<number | null> {
    const { label, initial, max, error, hint, ...confirm } = options;
    return new Promise((resolve) =>
      this.open({
        ...confirm,
        amount: { label, initial, max, error, hint },
        resolve: (ok, amount) => resolve(ok && amount !== undefined ? amount : null),
      }),
    );
  }

  answer(confirmed: boolean, amount?: number): void {
    const current = this.pending();
    if (!current) return;
    this.pending.set(null);
    current.resolve(confirmed, amount);
  }

  private open(pending: PendingConfirm): void {
    // a new question replaces (and cancels) one still open
    this.pending()?.resolve(false);
    this.pending.set({ tone: 'primary', ...pending });
  }
}
