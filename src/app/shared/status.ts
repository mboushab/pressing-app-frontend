import { ClothesStatus, PaymentStatus } from '../types/invoice';
import { TranslationKey } from './i18n/i18n.service';

const badge =
  'inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium';

export const paymentStatusLabel: Record<PaymentStatus, TranslationKey> = {
  not_paid: 'payment.not_paid',
  partial_paid: 'payment.partial_paid',
  paid: 'payment.paid',
};

export const paymentStatusClass: Record<PaymentStatus, string> = {
  not_paid: `${badge} bg-red-100 text-red-700`,
  partial_paid: `${badge} bg-orange-100 text-orange-700`,
  paid: `${badge} bg-green-100 text-green-700`,
};

export const clothesStatusLabel: Record<ClothesStatus, TranslationKey> = {
  not_cleaned: 'clothes.not_cleaned',
  cleaned: 'clothes.cleaned',
};

export const clothesStatusClass: Record<ClothesStatus, string> = {
  not_cleaned: `${badge} bg-amber-100 text-amber-800`,
  cleaned: `${badge} bg-sky-100 text-sky-700`,
};
