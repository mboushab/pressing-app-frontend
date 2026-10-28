import { Component, computed, input } from '@angular/core';
import { InvoiceDetails } from '../../types/invoice';
import { I18N_PIPES } from '../i18n/i18n.pipes';
import { clothesStatusLabel, paymentStatusLabel } from '../status';

/**
 * Till receipt of an invoice, sized for an 80 mm thermal roll (72 mm printable).
 * Used both for the on-screen preview and for printing.
 */
@Component({
  selector: 'app-receipt',
  imports: [...I18N_PIPES],
  styles: `
    :host {
      display: block;
      width: 72mm;
      max-width: 100%;
      padding: 4mm 3mm;
      background: white;
      color: black;
      font-size: 12px;
      line-height: 1.35;
      font-variant-numeric: tabular-nums;
    }
    /* receipt look: monospace in French, Arabic keeps its own font */
    :host(:lang(fr)) {
      font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    }
    .rule {
      border-top: 1px dashed black;
      margin: 2mm 0;
    }
    .rule-strong {
      border-top: 2px solid black;
      margin: 2mm 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 2mm;
    }
  `,
  template: `
    @let inv = invoice();
    <header class="text-center">
      <!-- the shop name is Arabic: keep an Arabic font even on the monospace receipt -->
      <p class="font-['Noto_Sans_Arabic',sans-serif] text-[22px] font-bold leading-tight">
        {{ 'app.name' | t }}
      </p>
      <p>{{ 'print.phone' | t }} <span dir="ltr">33 38 36 13</span></p>
    </header>

    <div class="rule-strong"></div>
    <p class="text-center text-[14px] font-bold uppercase rtl:normal-case">
      {{ 'receipt.title' | t }}
    </p>
    <p class="text-center font-semibold" dir="ltr">N° {{ number() }}</p>
    <div class="rule"></div>

    <div class="row">
      <span>{{ 'invoices.col.date' | t }}</span><span>{{ inv.created_at | appDate: 'datetime' }}</span>
    </div>
    @if (cashier()) {
      <div class="row">
        <span>{{ 'receipt.cashier' | t }}</span><span>{{ cashier() }}</span>
      </div>
    }
    <div class="row">
      <span>{{ 'invoices.col.client' | t }}</span><strong>{{ inv.client.name }}</strong>
    </div>
    <div class="row">
      <span>{{ 'clients.phone' | t }}</span><bdi>{{ inv.client.phone_number }}</bdi>
    </div>

    <div class="rule"></div>
    @for (item of inv.details; track $index) {
      <div class="mb-1">
        <p class="font-semibold">{{ item.product }}</p>
        <div class="row">
          <span>{{ item.quantity }} × {{ item.unit_price | money }}</span>
          <span>{{ item.line_total | money }}</span>
        </div>
      </div>
    }
    <div class="row text-[11px]">
      <span>{{ 'receipt.pieces' | t: { count: pieces() } }}</span>
    </div>

    <div class="rule-strong"></div>
    <div class="row text-[16px] font-bold">
      <span>{{ 'receipt.total' | t }}</span><span>{{ inv.amount | money }}</span>
    </div>
    @if (inv.payments.length > 1) {
      @for (payment of inv.payments; track $index) {
        <div class="row text-[11px]">
          <span>{{ (payment.amount < 0 ? 'receipt.refund' : 'receipt.payment') | t }} {{ payment.created_at | appDate: 'short' }}</span>
          <span>{{ payment.amount | money }}</span>
        </div>
      }
    }
    <div class="row">
      <span>{{ 'invoice.paid' | t }}</span><span>{{ inv.paid_amount | money }}</span>
    </div>
    <div class="row font-bold">
      <span>{{ 'common.balance_due' | t }}</span><span>{{ balance() | money }}</span>
    </div>
    <p class="mt-1 text-center font-bold uppercase rtl:normal-case">
      {{ paymentStatusLabel[inv.status] | t }}
    </p>

    <div class="rule"></div>
    <div class="row">
      <span>{{ 'invoices.col.clothes' | t }}</span>
      <span>
        {{ clothesStatusLabel[inv.clothes_status] | t }}
        @if (inv.picked_up_at) {
          · {{ inv.picked_up_at | appDate: 'short' }}
        }
      </span>
    </div>

    <div class="rule"></div>
    <footer class="text-center">
      @if (inv.clothes_status !== 'picked_up') {
        <p class="font-semibold">{{ 'receipt.keep' | t }}</p>
      }
      <p class="mt-1">{{ 'print.thanks' | t }}</p>
      <p class="mt-1 text-[10px]">
        {{ 'print.printed_at' | t: { date: (printedAt() | appDate: 'datetime') } }}
      </p>
    </footer>
  `,
})
export class Receipt {
  invoice = input.required<InvoiceDetails>();
  printedAt = input.required<Date>();
  /** who prints the receipt */
  cashier = input<string>('');

  readonly paymentStatusLabel = paymentStatusLabel;
  readonly clothesStatusLabel = clothesStatusLabel;

  readonly number = computed(() => this.invoice().id.slice(0, 8).toUpperCase());
  readonly balance = computed(
    () => Number(this.invoice().amount) - Number(this.invoice().paid_amount),
  );
  readonly pieces = computed(() =>
    this.invoice().details.reduce((sum, item) => sum + Number(item.quantity), 0),
  );
}
