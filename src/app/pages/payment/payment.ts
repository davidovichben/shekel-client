import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Step1PayerComponent, PayerDetails } from './steps/step1-payer/step1-payer';
import { Step2PaymentComponent, PaymentDetails, Step2ValidationState } from './steps/step2-payment/step2-payment';
import { Step3InvoiceComponent } from './steps/step3-invoice/step3-invoice';
import { MemberService } from '../../core/services/network/member.service';

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
export class PaymentComponent implements OnInit {
  currentStep = 1;
  steps = [
    { number: 1, label: 'פרטי משלם' },
    { number: 2, label: 'פרטי תשלום' },
    { number: 3, label: 'פרטי חשבונית' },
    { number: 4, label: 'סיום ואישור תשלום' }
  ];

  createReceipt = true;
  isProcessing = false;
  memberId = '';

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
    @Optional() @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    if (this.data?.memberId) {
      this.memberId = this.data.memberId;
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

  async onContinue(): Promise<void> {
    if (this.currentStep === 3) {
      this.isProcessing = true;
      // Mock 5 second wait for payment processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      this.isProcessing = false;
      this.currentStep = 4;
    } else if (this.currentStep < 4) {
      this.currentStep++;
      this.updateButtonText();
    } else {
      this.onSubmit();
    }
  }

  downloadInvoice(): void {
    // TODO: Implement invoice download
    console.log('Downloading invoice...');
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
    if (stepNumber === this.currentStep) {
      // On step 4, show it as completed instead of active
      return this.currentStep === 4 ? 'completed' : 'active';
    }
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
