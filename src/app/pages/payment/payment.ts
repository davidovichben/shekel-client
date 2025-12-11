import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Step1PayerComponent, PayerDetails } from './steps/step1-payer/step1-payer';
import { Step2PaymentComponent, PaymentDetails, Step2ValidationState } from './steps/step2-payment/step2-payment';
import { Step3InvoiceComponent } from './steps/step3-invoice/step3-invoice';

export interface PaymentDialogData {
  memberId?: string;
  memberName?: string;
}

interface TransactionSummary {
  description: string;
  amount: number;
  installments: number;
  vat: number;
  vatPercent: number;
  total: number;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, Step1PayerComponent, Step2PaymentComponent, Step3InvoiceComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.sass'
})
export class PaymentComponent {
  currentStep = 1;
  steps = [
    { number: 1, label: 'פרטי משלם' },
    { number: 2, label: 'פרטי תשלום' },
    { number: 3, label: 'פרטי חשבונית' },
    { number: 4, label: 'סיום ואישור תשלום' }
  ];

  createReceipt = true;

  payerDetails: PayerDetails = {
    firstName: '',
    lastName: '',
    mobile: '',
    address: '',
    email: '',
    companyId: ''
  };

  paymentDetails: PaymentDetails = {
    amount: 0,
    installments: 0,
    description: '',
    paymentMethod: 'credit'
  };

  step2ValidationState: Step2ValidationState = {
    isValid: false,
    newCardSaved: false
  };

  transaction: TransactionSummary = {
    description: '',
    amount: 0,
    installments: 0,
    vat: 0,
    vatPercent: 17,
    total: 0
  };

  constructor(
    public dialogRef: MatDialogRef<PaymentComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData
  ) {
    if (data?.memberName) {
      const nameParts = data.memberName.split(' ');
      this.payerDetails.firstName = nameParts[0] || '';
      this.payerDetails.lastName = nameParts.slice(1).join(' ') || '';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPaymentDetailsChange(details: PaymentDetails): void {
    this.paymentDetails = details;
    this.updateTransactionSummary();
  }

  onStep2ValidationStateChange(state: Step2ValidationState): void {
    this.step2ValidationState = state;
  }

  private updateTransactionSummary(): void {
    const amount = this.paymentDetails.amount || 0;
    const vat = amount * (this.transaction.vatPercent / 100);

    this.transaction.description = this.paymentDetails.description;
    this.transaction.amount = amount;
    this.transaction.installments = this.paymentDetails.installments;
    this.transaction.vat = Math.round(vat * 100) / 100;
    this.transaction.total = Math.round((amount + vat) * 100) / 100;
  }

  onContinue(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.updateButtonText();
    } else {
      this.onSubmit();
    }
  }

  onBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateButtonText();
    }
  }

  onSubmit(): void {
    console.log('Payment submitted:', {
      payer: this.payerDetails,
      payment: this.paymentDetails,
      transaction: this.transaction
    });
    this.dialogRef.close(true);
  }

  getStepClass(stepNumber: number): string {
    if (stepNumber < this.currentStep) return 'completed';
    if (stepNumber === this.currentStep) return 'active';
    return '';
  }

  getContinueButtonText(): string {
    switch (this.currentStep) {
      case 1: return 'המשך לפרטי התשלום';
      case 2: return 'המשך לפרטי חשבונית';
      case 3: return 'המשך לסיום ואישור';
      case 4: return 'אישור ותשלום';
      default: return 'המשך';
    }
  }

  canContinue(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(
          this.payerDetails.firstName?.trim() &&
          this.payerDetails.lastName?.trim() &&
          this.payerDetails.mobile?.trim()
        );
      case 2:
        return !!(
          this.paymentDetails.amount > 0 &&
          this.paymentDetails.installments > 0 &&
          this.paymentDetails.installments <= 32 &&
          this.step2ValidationState.isValid
        );
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  }

  private updateButtonText(): void {
    // Button text is dynamically computed via getContinueButtonText()
  }
}
