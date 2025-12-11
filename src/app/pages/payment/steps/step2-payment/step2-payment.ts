import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditCardComponent, CreditCardData } from '../../../../shared/components/credit-card/credit-card';

export interface PaymentDetails {
  amount: number;
  installments: number;
  description: string;
  paymentMethod: 'credit' | 'standingOrder';
  selectedCardId?: string;
}

export interface NewCardData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  saveCard: boolean;
}

export interface Step2ValidationState {
  isValid: boolean;
  newCardSaved: boolean;
}

@Component({
  selector: 'app-step2-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, CreditCardComponent],
  templateUrl: './step2-payment.html',
  styleUrl: './step2-payment.sass'
})
export class Step2PaymentComponent {
  @Input() paymentDetails: PaymentDetails = {
    amount: 0,
    installments: 0,
    description: '',
    paymentMethod: 'credit'
  };
  @Output() paymentDetailsChange = new EventEmitter<PaymentDetails>();
  @Output() validationStateChange = new EventEmitter<Step2ValidationState>();

  useNewCard = false;
  selectedCardId = '';
  newCardSaved = false;
  savingCard = false;

  newCard: NewCardData = {
    cardNumber: '',
    expiry: '',
    cvv: '',
    saveCard: true
  };

  savedCards: CreditCardData[] = [
    { id: '1', type: 'visa', lastFourDigits: '8475', holderName: 'Mota Gur', expiryDate: '15/29' },
    { id: '2', type: 'visa', lastFourDigits: '5478', holderName: 'Mota Gur', expiryDate: '15/29' },
    { id: '3', type: 'mastercard', lastFourDigits: '5172', holderName: 'Mota Gur', expiryDate: '15/29' }
  ];

  selectCard(card: CreditCardData): void {
    this.selectedCardId = card.id;
    this.paymentDetails.selectedCardId = card.id;
    this.paymentDetailsChange.emit(this.paymentDetails);
    this.emitValidationState();
  }

  private emitValidationState(): void {
    this.validationStateChange.emit({
      isValid: this.isStepValid(),
      newCardSaved: this.newCardSaved
    });
  }

  isStepValid(): boolean {
    if (this.paymentDetails.paymentMethod === 'standingOrder') {
      return true;
    }
    if (this.paymentDetails.paymentMethod === 'credit') {
      if (this.useNewCard) {
        return this.newCardSaved;
      } else {
        return !!this.selectedCardId;
      }
    }
    return false;
  }

  isNewCardFormValid(): boolean {
    return !!(
      this.newCard.cardNumber?.replace(/\s/g, '').length >= 13 &&
      this.newCard.expiry?.length === 5 &&
      this.newCard.cvv?.length >= 3
    );
  }

  async saveNewCard(): Promise<void> {
    if (!this.isNewCardFormValid() || this.savingCard) return;

    this.savingCard = true;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.newCardSaved = true;
      this.emitValidationState();
    } catch (error) {
      this.newCardSaved = false;
      this.emitValidationState();
    } finally {
      this.savingCard = false;
    }
  }

  onUseNewCardChange(): void {
    this.newCardSaved = false;
    this.emitValidationState();
  }

  onPaymentMethodChange(): void {
    this.emitValidationState();
  }

  onAmountChange(): void {
    setTimeout(() => {
      if (this.paymentDetails.amount < 0) {
        this.paymentDetails.amount = 0;
      }
      if (this.paymentDetails.amount > 100000) {
        this.paymentDetails.amount = 100000;
      }
      this.paymentDetailsChange.emit(this.paymentDetails);
    });
  }

  onInstallmentsChange(): void {
    setTimeout(() => {
      if (this.paymentDetails.installments < 0) {
        this.paymentDetails.installments = 0;
      }
      if (this.paymentDetails.installments > 32) {
        this.paymentDetails.installments = 32;
      }
      this.paymentDetailsChange.emit(this.paymentDetails);
    });
  }

  onInputChange(): void {
    this.paymentDetailsChange.emit(this.paymentDetails);
  }

  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') {
      input.select();
    }
  }
}
