import { Component, input } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-invoice',
  imports: [ReactiveFormsModule],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
  standalone: true,
})
export class CreateInvoice {
  // Dans le composant enfant
  userId = input.required<string | null>({
    alias: 'currentUserId',
  });

  invoiceForm = new FormGroup({
    clientId: new FormControl('', [Validators.required]),
  });

  createInvoice(): void {
    console.log('Creating invoice for user ID:', this.userId);
    // Implement the logic to create an invoice using the userId
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      this.createInvoice();
    } else {
      console.log('Form is invalid');
    }
  }
}
