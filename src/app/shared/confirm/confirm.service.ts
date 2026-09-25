import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  /** danger = red button (deletions), primary otherwise */
  tone?: 'danger' | 'primary';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/** Asks the user to confirm an action in a modal dialog before it is sent to the server. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    // a new question replaces (and cancels) one still open
    this.pending()?.resolve(false);
    return new Promise((resolve) => this.pending.set({ tone: 'primary', ...options, resolve }));
  }

  answer(confirmed: boolean): void {
    const current = this.pending();
    if (!current) return;
    this.pending.set(null);
    current.resolve(confirmed);
  }
}
