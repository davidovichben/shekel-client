import { Component, Inject, OnInit, Optional, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Step1PayerComponent, PayerDetails } from './steps/step1-payer/step1-payer';
import { Step2PaymentComponent, PaymentDetails, Step2ValidationState } from './steps/step2-payment/step2-payment';
import { Step3InvoiceComponent } from './steps/step3-invoice/step3-invoice';
import { MemberService } from '../../core/services/network/member.service';
import { BillingService } from '../../core/services/network/billing.service';
import { IncomeService } from '../../core/services/network/income.service';

export interface PaymentDialogData {
  memberId?: string;
  memberName?: string;
  amount?: number;
  debtIds?: string[]; // Array of debt IDs to pay (API will handle status update)
  isDebtPayment?: boolean; // Flag to indicate if this is a debt payment
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
  memberName = '';
  receiptType = 'other';
  chargeError: string | null = null;
  chargeResponse: any = null;

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
    installments: 1,
    description: '',
    paymentMethod: 'credit'
  };

  step2ValidationState: Step2ValidationState = {
    isValid: false,
    newCardSaved: false,
    paymentComplete: false
  };

  transaction: TransactionSummary = {
    description: '',
    amount: 0,
    installments: 0,
    vat: 0,
    vatPercent: 17,
    total: 0
  };

  private billingService = inject(BillingService);
  private incomeService = inject(IncomeService);

  @ViewChild(Step3InvoiceComponent) step3Invoice?: Step3InvoiceComponent;

  constructor(
    public dialogRef: MatDialogRef<PaymentComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private memberService: MemberService
  ) {}

  ngOnInit(): void {
    if (this.data?.memberId) {
      this.memberId = this.data.memberId;
    }
    if (this.data?.memberName) {
      this.memberName = this.data.memberName;
    }
    if (this.data?.amount !== undefined) {
      this.paymentDetails.amount = this.data.amount;
    }
    // Always update transaction summary with initial values
    this.updateTransactionSummary();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPaymentDetailsChange(details: PaymentDetails): void {
    this.paymentDetails = details;
    this.updateTransactionSummary();
  }

  onPayerDetailsChange(details: PayerDetails): void {
    this.payerDetails = details;
    // If member is selected, update memberId
    // This will be handled by step1-payer component when member is selected
  }

  onMemberIdChange(memberId: string): void {
    this.memberId = memberId;
    // Update memberName if we have the member data
    // This will be handled by step1-payer component
  }

  onStep2ValidationStateChange(state: Step2ValidationState): void {
    this.step2ValidationState = state;
  }

  private updateTransactionSummary(): void {
    const amount = this.paymentDetails.amount || 0;
    
    // For debt payments:
    // - Single debt: amount is exact (no VAT to add)
    // - Bulk debts: amount already includes VAT (× 1.17), so we need to extract subtotal and VAT
    const isDebtPayment = this.data?.isDebtPayment && this.data?.debtIds;
    const isBulkDebtPayment = isDebtPayment && this.data.debtIds!.length > 1;
    
    let subtotal = amount;
    let vat = 0;
    let total = amount;
    
    if (isBulkDebtPayment) {
      // Amount already includes VAT, so calculate subtotal and VAT
      // total = subtotal × 1.17
      // subtotal = total / 1.17
      subtotal = Math.round((amount / 1.17) * 100) / 100;
      vat = Math.round((amount - subtotal) * 100) / 100;
      total = amount;
    } else if (isDebtPayment) {
      // Single debt: amount is exact, no VAT
      subtotal = amount;
      vat = 0;
      total = amount;
    } else {
      // Regular payment: add VAT
      vat = Math.round(amount * (this.transaction.vatPercent / 100) * 100) / 100;
      total = Math.round((amount + vat) * 100) / 100;
    }

    this.transaction.description = this.paymentDetails.description;
    this.transaction.amount = subtotal;
    this.transaction.installments = this.paymentDetails.installments;
    this.transaction.vat = vat;
    this.transaction.total = total;
  }

  onContinue(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('=== onContinue CALLED ===');
    console.log('currentStep:', this.currentStep);
    console.log('canContinue():', this.canContinue());
    console.log('isProcessing:', this.isProcessing);
    console.log('paymentDetails:', JSON.stringify(this.paymentDetails, null, 2));
    console.log('memberId:', this.memberId);
    console.log('receiptType:', this.receiptType);
    
    if (this.isProcessing) {
      console.log('Already processing, ignoring click');
      return;
    }
    
    if (!this.canContinue()) {
      console.log('Cannot continue - validation failed');
      alert('לא ניתן להמשיך - יש למלא את כל השדות הנדרשים');
      return;
    }

    if (this.currentStep === 3) {
      // Step 3: Process the charge
      console.log('Processing charge on step 3');
      this.processCharge().catch(error => {
        console.error('Error in processCharge:', error);
      });
    } else if (this.currentStep < 4) {
      this.currentStep++;
      this.updateButtonText();
    } else {
      this.onSubmit();
    }
  }

  private async processCharge(): Promise<void> {
    console.log('processCharge called', {
      paymentMethod: this.paymentDetails.paymentMethod,
      selectedCardId: this.paymentDetails.selectedCardId,
      amount: this.paymentDetails.amount,
      receiptType: this.receiptType
    });

    if (this.paymentDetails.paymentMethod !== 'credit') {
      // Standing order - not supported by billing charge API
      this.chargeError = 'תשלום במס"ב אינו נתמך כרגע';
      this.isProcessing = false;
      return;
    }

    if (!this.paymentDetails.selectedCardId) {
      this.chargeError = 'יש לבחור כרטיס אשראי';
      this.isProcessing = false;
      return;
    }

    // If card ID is 'new_card', it means user entered a card but it wasn't saved
    // This shouldn't happen if saveNewCard() always saves the card, but handle it just in case
    if (this.paymentDetails.selectedCardId === 'new_card') {
      this.chargeError = 'יש לשמור את הכרטיס לפני ביצוע החיוב';
      this.isProcessing = false;
      return;
    }

    // Validate amount
    if (this.paymentDetails.amount < 0.01) {
      this.chargeError = 'סכום חייב להיות גדול או שווה ל-0.01';
      this.isProcessing = false;
      return;
    }

    // Validate credit card ID is a number
    const creditCardId = parseInt(this.paymentDetails.selectedCardId);
    if (isNaN(creditCardId) || creditCardId <= 0) {
      this.chargeError = 'מספר כרטיס אשראי לא תקין';
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    this.chargeError = null;

    try {
      const chargeRequest: any = {
        credit_card_id: creditCardId,
        amount: this.transaction.total, // Use total amount (includes VAT for bulk debts)
        description: this.paymentDetails.description || undefined,
        type: this.receiptType || 'other',
        createReceipt: this.createReceipt
      };

      // Add debt payment parameters if this is a debt payment
      if (this.data?.debtIds && this.data.debtIds.length > 0) {
        if (this.data.debtIds.length === 1) {
          // Single debt payment
          chargeRequest.debt_id = parseInt(this.data.debtIds[0]);
          chargeRequest.amount = this.paymentDetails.amount; // Exact debt amount for single debt
        } else {
          // Bulk debt payment
          chargeRequest.debt_ids = this.data.debtIds.map(id => parseInt(id));
          chargeRequest.amount = this.transaction.total; // Amount with VAT for bulk debts
        }
      }

      let response: any;

      if (this.createReceipt) {
        // Generate PDF from invoice preview
        if (!this.step3Invoice) {
          throw new Error('Invoice preview component not found');
        }

        console.log('Generating PDF receipt...');
        const pdfBlob = await this.step3Invoice.generateReceiptPdf();
        console.log('PDF generated, size:', pdfBlob.size, 'bytes');

        // Send charge request with PDF file
        console.log('Sending charge request with PDF:', chargeRequest);
        response = await firstValueFrom(this.billingService.chargeWithReceipt(chargeRequest, pdfBlob));
      } else {
        // Send regular charge request without PDF
        console.log('Sending charge request:', chargeRequest);
        response = await firstValueFrom(this.billingService.charge(chargeRequest));
      }

      console.log('Charge response:', response);
      
      if (response.success && response.receipt) {
        this.chargeResponse = response;
        this.isProcessing = false;
        
        // Debts are automatically updated to paid status by the API
        // No need to update separately - API handles it via debt_id/debt_ids parameters
        
        this.currentStep = 4;
      } else {
        throw new Error('תגובת השרת לא תקינה');
      }
    } catch (error: any) {
      console.error('Charge error:', error);
      // Extract error message from API response
      let errorMessage = 'שגיאה בחיוב הכרטיס';
      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.errors) {
          // Handle validation errors
          const errors = error.error.errors;
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0] as string;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.chargeError = errorMessage;
      this.isProcessing = false;
    }
  }


  onReceiptTypeChange(type: string): void {
    this.receiptType = type;
  }

  getPayerFullName(): string {
    const firstName = this.payerDetails.firstName?.trim() || '';
    const lastName = this.payerDetails.lastName?.trim() || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || '';
  }

  downloadInvoice(): void {
    if (this.chargeResponse?.receipt?.id) {
      // Download receipt using income service
      this.incomeService.downloadReceipt(String(this.chargeResponse.receipt.id)).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt_${this.chargeResponse.receipt.receipt_number}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading receipt:', error);
        }
      });
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
        // For credit card payment, need valid card selection
        if (this.paymentDetails.paymentMethod === 'credit') {
          return !!(
            this.paymentDetails.amount >= 0.01 &&
            this.paymentDetails.installments > 0 &&
            this.paymentDetails.installments <= 32 &&
            this.step2ValidationState.isValid
          );
        }
        // For standing order, just need amount (but API doesn't support it yet)
        return !!(
          this.paymentDetails.amount >= 0.01
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
