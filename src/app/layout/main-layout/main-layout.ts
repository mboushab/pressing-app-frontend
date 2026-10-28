import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Toasts } from '../../shared/toast/toast';
import { ConfirmDialog } from '../../shared/confirm/confirm-dialog';
import { InvoiceReceipt } from '../../shared/print/invoice-receipt';
import { ReceiptPreview } from '../../shared/print/receipt-preview';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Toasts, ConfirmDialog, InvoiceReceipt, ReceiptPreview],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
