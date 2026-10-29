import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { DeliveryService } from '../../services/delivery-service';
import { OpenIssue } from '../../types/orders';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService } from '../../shared/i18n/i18n.service';
import { OrderLabels } from '../orders/order-labels';

/** Open issues of every pressing (platform admin). Count differences are settled by the pressing. */
@Component({
  selector: 'app-issues-panel',
  imports: [...I18N_PIPES, FormsModule, MatIcon],
  template: `
    <div [class]="classNames.card">
      @for (issue of issues(); track issue.id) {
        <div class="border-b border-slate-100 px-4 py-3 last:border-b-0">
          <div class="flex flex-wrap items-center gap-2">
            <mat-icon class="!text-orange-600">warning</mat-icon>
            <span class="flex-1 font-medium text-slate-800">{{ labels.issue(issue.type) }}</span>
            <span class="text-sm text-slate-500">{{ issue.center_name }} · #{{ issue.number }} · {{ issue.created_at | appDate: 'short' }}</span>
          </div>
          @if (issue.type !== 'COUNT_MISMATCH') {
            <div class="mt-2 flex gap-2">
              <input
                [class]="classNames.input"
                [placeholder]="'order.resolution' | t"
                [ngModel]="drafts()[issue.id] ?? ''"
                (ngModelChange)="setDraft(issue.id, $event)"
              />
              <button type="button" [class]="classNames.buttonSecondary" (click)="resolve(issue)">{{ 'order.issue_resolve' | t }}</button>
            </div>
          } @else {
            <p class="mt-1 text-sm text-slate-500">{{ 'issues.count_by_pressing' | t }}</p>
          }
        </div>
      } @empty {
        <p [class]="classNames.empty">{{ (loaded() ? 'orders.no_issues' : 'common.loading') | t }}</p>
      }
    </div>
  `,
})
export class IssuesPanel {
  private readonly delivery = inject(DeliveryService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  readonly labels = inject(OrderLabels);

  readonly classNames = classNames;
  readonly issues = signal<OpenIssue[]>([]);
  readonly drafts = signal<Record<string, string | undefined>>({});
  readonly loaded = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.delivery.issues().subscribe({
      next: (issues) => {
        this.issues.set(issues);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('delivery.error.load')),
    });
  }

  setDraft(id: string, text: string): void {
    this.drafts.update((d) => ({ ...d, [id]: text }));
  }

  resolve(issue: OpenIssue): void {
    const text = (this.drafts()[issue.id] ?? '').trim();
    if (!text) return this.toast.error(this.i18n.t('order.error.resolution'));
    this.delivery.resolveIssue(issue.id, text).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('order.toast.issue_resolved'));
        this.load();
      },
      error: () => this.toast.error(this.i18n.t('order.error.action')),
    });
  }
}
