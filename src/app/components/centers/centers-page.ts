import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { CentersService } from '../../services/centers-service';
import { Center, CenterDetails } from '../../types/centers';
import { classNames } from '../../shared/styles/class-names';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { Drawer } from '../../shared/drawer/drawer';
import { I18N_PIPES } from '../../shared/i18n/i18n.pipes';
import { I18nService, TranslationKey } from '../../shared/i18n/i18n.service';

type Editing = { mode: 'create' } | { mode: 'edit'; center: Center } | { mode: 'admin'; center: Center };

const PHONE = /^\s*(\+?222)?[\s.-]*[234](\s*\d){7}\s*$/;

/**
 * Pressings of the platform (platform admin): each one is created with its
 * first admin, who then runs the pressing (prices, team, invoices, orders).
 */
@Component({
  selector: 'app-centers-page',
  imports: [...I18N_PIPES, ReactiveFormsModule, MatIcon, Drawer],
  template: `
    <section [class]="classNames.container">
      <div [class]="classNames.pageHeader">
        <div>
          <h1 [class]="classNames.pageTitle">{{ 'nav.centers' | t }}</h1>
          <p class="text-sm text-slate-500">{{ 'centers.subtitle' | t }}</p>
        </div>
        <button type="button" [class]="classNames.buttonPrimary" (click)="open({ mode: 'create' })">
          <mat-icon>add_business</mat-icon> {{ 'centers.new' | t }}
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        @for (c of centers(); track c.id) {
          <article [class]="classNames.card + ' flex flex-col gap-3 p-4'">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h2 class="text-lg font-semibold text-slate-800">{{ c.name }}</h2>
                @if (c.phone) {
                  <p class="text-sm text-slate-500" dir="ltr">{{ c.phone }}</p>
                }
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                [class]="c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
              >
                {{ statusKey(c) | t }}
              </span>
            </div>

            <p class="flex items-center gap-1.5 text-sm" [class]="c.latitude === null ? 'text-orange-600' : 'text-slate-600'">
              <mat-icon class="!text-[18px] !size-5">{{ c.latitude === null ? 'location_off' : 'location_on' }}</mat-icon>
              @if (c.latitude === null) {
                {{ 'centers.no_position' | t }}
              } @else {
                {{ c.address || '' }} <span dir="ltr">({{ c.latitude }}, {{ c.longitude }})</span>
              }
            </p>
            @if (c.status === 'SUSPENDED' && c.suspended_reason) {
              <p class="text-sm text-red-700">{{ 'centers.reason' | t: { reason: c.suspended_reason } }}</p>
            }

            <div class="text-sm text-slate-600">
              <span class="font-medium text-slate-700">{{ 'centers.admins' | t }} :</span>
              @for (a of c.admins; track a.id; let last = $last) {
                {{ a.username }}{{ last ? '' : ', ' }}
              } @empty {
                <span class="text-orange-600">{{ 'centers.no_admin' | t }}</span>
              }
            </div>
            <p class="text-xs text-slate-500">
              {{ 'centers.counts' | t: { clients: c.counts.clients, invoices: c.counts.invoices, orders: c.counts.orders } }}
            </p>

            <div class="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button type="button" [class]="classNames.buttonSecondary" (click)="open({ mode: 'edit', center: c })">
                <mat-icon class="!text-[18px] !size-5">edit</mat-icon> {{ 'centers.edit' | t }}
              </button>
              <button type="button" [class]="classNames.buttonSecondary" (click)="open({ mode: 'admin', center: c })">
                <mat-icon class="!text-[18px] !size-5">person_add</mat-icon> {{ 'centers.add_admin' | t }}
              </button>
              <button type="button" [class]="classNames.buttonSecondary" (click)="toggle(c)">
                {{ (c.status === 'ACTIVE' ? 'centers.suspend' : 'centers.reactivate') | t }}
              </button>
              <button
                type="button"
                [class]="classNames.iconButtonDanger + ' ms-auto'"
                [attr.aria-label]="'centers.delete' | t"
                [title]="(hasData(c) ? 'centers.delete_blocked' : 'centers.delete') | t"
                (click)="remove(c)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </article>
        } @empty {
          <p [class]="classNames.empty + ' md:col-span-2'">{{ (loaded() ? 'centers.empty' : 'common.loading') | t }}</p>
        }
      </div>
    </section>

    @if (editing(); as e) {
      <app-drawer [title]="drawerTitle()" (closed)="editing.set(null)">
        <!-- two form groups in one form: submitted by hand, never by the browser -->
        <form (submit)="$event.preventDefault(); save()" class="space-y-4">
          @if (e.mode !== 'admin') {
            <div [formGroup]="details" class="space-y-4">
              <div>
                <label for="center-name" [class]="classNames.label">{{ 'centers.name' | t }}</label>
                <input id="center-name" formControlName="name" [class]="classNames.input" />
              </div>
              <div>
                <label for="center-phone" [class]="classNames.label">{{ 'centers.phone' | t }}</label>
                <input id="center-phone" formControlName="phone" inputmode="tel" dir="ltr" [class]="classNames.input" placeholder="22 00 00 00" />
              </div>
              <div>
                <label for="center-address" [class]="classNames.label">{{ 'centers.address' | t }}</label>
                <input id="center-address" formControlName="address" [class]="classNames.input" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="center-lat" [class]="classNames.label">{{ 'centers.latitude' | t }}</label>
                  <input id="center-lat" formControlName="latitude" inputmode="decimal" dir="ltr" [class]="classNames.input" placeholder="18.0866" />
                </div>
                <div>
                  <label for="center-lng" [class]="classNames.label">{{ 'centers.longitude' | t }}</label>
                  <input id="center-lng" formControlName="longitude" inputmode="decimal" dir="ltr" [class]="classNames.input" placeholder="-15.9785" />
                </div>
              </div>
              <p class="text-xs text-slate-500">{{ 'centers.position_hint' | t }}</p>
            </div>
          }
          @if (e.mode !== 'edit') {
            <div [formGroup]="admin" class="space-y-4" [class.border-t]="e.mode === 'create'" [class.pt-4]="e.mode === 'create'">
              @if (e.mode === 'create') {
                <h3 class="font-semibold text-slate-800">{{ 'centers.first_admin' | t }}</h3>
              }
              <p class="text-sm text-slate-500">{{ 'centers.admin_hint' | t }}</p>
              <div>
                <label for="admin-username" [class]="classNames.label">{{ 'centers.admin_username' | t }}</label>
                <input id="admin-username" formControlName="admin_username" autocomplete="off" [class]="classNames.input" />
              </div>
              <div>
                <label for="admin-password" [class]="classNames.label">{{ 'centers.admin_password' | t }}</label>
                <input id="admin-password" type="password" formControlName="admin_password" autocomplete="new-password" [class]="classNames.input" />
              </div>
            </div>
          }
          @if (error(); as err) {
            <p [class]="classNames.fieldError">{{ err | t }}</p>
          }
          <button type="submit" [class]="classNames.buttonPrimary + ' w-full'" [disabled]="saving()">
            {{ (e.mode === 'create' ? 'centers.create' : 'common.save') | t }}
          </button>
        </form>
      </app-drawer>
    }
  `,
})
export class CentersPage {
  private readonly service = inject(CentersService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  readonly classNames = classNames;
  readonly centers = signal<Center[]>([]);
  readonly loaded = signal(false);
  readonly editing = signal<Editing | null>(null);
  readonly saving = signal(false);
  readonly error = signal<TranslationKey | null>(null);

  readonly details = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(191)]],
    phone: ['', Validators.pattern(PHONE)],
    address: ['', Validators.maxLength(255)],
    latitude: ['', [Validators.min(-90), Validators.max(90)]],
    longitude: ['', [Validators.min(-180), Validators.max(180)]],
  });
  readonly admin = this.fb.group({
    admin_username: ['', [Validators.required, Validators.minLength(3)]],
    admin_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly drawerTitle = computed(() => {
    const e = this.editing();
    if (!e) return '';
    if (e.mode === 'create') return this.i18n.t('centers.new');
    return this.i18n.t(e.mode === 'edit' ? 'centers.edit_title' : 'centers.add_admin_title', { name: e.center.name });
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.service.list().subscribe({
      next: (centers) => {
        this.centers.set(centers);
        this.loaded.set(true);
      },
      error: () => this.toast.error(this.i18n.t('centers.error.load')),
    });
  }

  statusKey(c: Center): TranslationKey {
    return c.status === 'ACTIVE' ? 'centers.status.ACTIVE' : c.status === 'SUSPENDED' ? 'centers.status.SUSPENDED' : 'centers.status.PENDING';
  }

  hasData(c: Center): boolean {
    return c.counts.clients + c.counts.invoices + c.counts.orders > 0;
  }

  open(editing: Editing): void {
    this.error.set(null);
    this.admin.reset({ admin_username: '', admin_password: '' });
    const c = editing.mode === 'edit' ? editing.center : null;
    this.details.reset({
      name: c?.name ?? '',
      phone: c?.phone ?? '',
      address: c?.address ?? '',
      latitude: c?.latitude?.toString() ?? '',
      longitude: c?.longitude?.toString() ?? '',
    });
    this.editing.set(editing);
  }

  /** Form values as the API expects them; empty fields become null. */
  private detailsBody(): CenterDetails | null {
    const v = this.details.getRawValue();
    const number = (value: string | null) => (value?.trim() ? Number(value.trim().replace(',', '.')) : null);
    const latitude = number(v.latitude);
    const longitude = number(v.longitude);
    if ((latitude === null) !== (longitude === null) || [latitude, longitude].some((n) => n !== null && !Number.isFinite(n))) {
      return null;
    }
    return {
      name: v.name!.trim(),
      phone: v.phone?.replace(/\D/g, '').slice(-8) || null,
      address: v.address?.trim() || null,
      latitude,
      longitude,
    };
  }

  save(): void {
    const e = this.editing();
    if (!e) return;
    const body = e.mode === 'admin' ? null : this.detailsBody();
    if (
      (e.mode !== 'admin' && (this.details.invalid || !body)) ||
      (e.mode !== 'edit' && this.admin.invalid)
    ) {
      this.error.set(e.mode !== 'admin' && (this.details.invalid || !body) ? 'centers.error.details' : 'centers.error.admin');
      return;
    }
    const admin = { admin_username: this.admin.value.admin_username!.trim(), admin_password: this.admin.value.admin_password! };
    const request: Observable<unknown> =
      e.mode === 'create'
        ? this.service.create({ ...body!, ...admin })
        : e.mode === 'edit'
          ? this.service.update(e.center.id, body!)
          : this.service.addAdmin(e.center.id, admin);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toast.success(
          e.mode === 'edit'
            ? this.i18n.t('centers.saved')
            : this.i18n.t('centers.admin_created', { username: admin.admin_username }),
        );
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.code === 'USERNAME_TAKEN' ? 'centers.error.taken' : 'centers.error.save');
      },
    });
  }

  async toggle(c: Center): Promise<void> {
    const suspending = c.status === 'ACTIVE';
    const ok = await this.confirm.ask({
      title: this.i18n.t(suspending ? 'centers.suspend' : 'centers.reactivate'),
      message: this.i18n.t(suspending ? 'centers.suspend_confirm' : 'centers.reactivate_confirm', { name: c.name }),
      confirmLabel: this.i18n.t(suspending ? 'centers.suspend' : 'centers.reactivate'),
      tone: suspending ? 'danger' : 'primary',
    });
    if (!ok) return;
    this.service.setStatus(c.id, suspending ? 'SUSPENDED' : 'ACTIVE').subscribe({
      next: () => this.load(),
      error: () => this.toast.error(this.i18n.t('centers.error.save')),
    });
  }

  async remove(c: Center): Promise<void> {
    if (this.hasData(c)) {
      this.toast.error(this.i18n.t('centers.delete_blocked'));
      return;
    }
    const ok = await this.confirm.ask({
      title: this.i18n.t('centers.delete'),
      message: this.i18n.t('centers.delete_confirm', { name: c.name }),
      confirmLabel: this.i18n.t('centers.delete'),
      tone: 'danger',
    });
    if (!ok) return;
    this.service.remove(c.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('centers.deleted', { name: c.name }));
        this.load();
      },
      error: (err: HttpErrorResponse) =>
        this.toast.error(this.i18n.t(err.error?.code === 'CENTER_HAS_DATA' ? 'centers.delete_blocked' : 'centers.error.save')),
    });
  }
}
