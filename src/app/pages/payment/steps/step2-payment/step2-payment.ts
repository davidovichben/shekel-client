import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CreditCardComponent, CreditCardData } from '../../../../shared/components/credit-card/credit-card';
import { MemberCreditCardService, MemberCreditCard } from '../../../../core/services/network/member-credit-card.service';

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
export class Step2PaymentComponent implements OnInit, OnChanges {
  private memberCreditCardService = inject(MemberCreditCardService);

  @Input() paymentDetails: PaymentDetails = {
    amount: 10,
    installments: 1,
    description: '',
    paymentMethod: 'credit'
  };
  @Input() memberId = '';
  @Input() payerName = ''; // Cardholder name from payer details (firstName + lastName)
  @Output() paymentDetailsChange = new EventEmitter<PaymentDetails>();
  @Output() validationStateChange = new EventEmitter<Step2ValidationState>();

  useNewCard = false;
  selectedCardId = '';
  newCardSaved = false;
  savingCard = false;
  isLoadingCards = false;

  newCard: NewCardData = {
    cardNumber: '',
    expiry: '',
    cvv: '',
    saveCard: true
  };

  savedCards: CreditCardData[] = [];

  ngOnInit(): void {
    if (this.memberId) {
      this.loadCreditCards();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload credit cards when memberId changes
    if (changes['memberId'] && !changes['memberId'].firstChange && this.memberId) {
      this.loadCreditCards();
    }
  }

  private loadCreditCards(): void {
    if (!this.memberId) {
      console.log('No memberId provided, cannot load credit cards');
      return;
    }

    console.log('Loading credit cards for memberId:', this.memberId);
    this.isLoadingCards = true;
    this.savedCards = []; // Clear previous cards
    this.selectedCardId = ''; // Reset selection
    
    this.memberCreditCardService.getByMember(this.memberId).subscribe({
      next: (cards) => {
        console.log('Credit cards loaded:', cards);
        this.savedCards = cards.map(card => ({
          id: card.id,
          type: card.type,
          lastFourDigits: card.lastFourDigits,
          holderName: card.holderName,
          expiryDate: card.expiryDate
        }));
        // Auto-select default card or first card
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          console.log('Auto-selecting default card:', defaultCard.id);
          this.selectCard({ id: defaultCard.id, type: defaultCard.type, lastFourDigits: defaultCard.lastFourDigits, holderName: defaultCard.holderName, expiryDate: defaultCard.expiryDate });
        } else if (this.savedCards.length > 0) {
          console.log('Auto-selecting first card:', this.savedCards[0].id);
          this.selectCard(this.savedCards[0]);
        } else {
          console.log('No credit cards found for this member');
        }
        this.isLoadingCards = false;
        this.emitValidationState();
      },
      error: (error) => {
        console.error('Error loading credit cards:', error);
        this.isLoadingCards = false;
        this.emitValidationState();
      }
    });
  }

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
    const cardNumber = this.newCard.cardNumber?.replace(/\s/g, '') || '';
    const expiry = this.newCard.expiry?.trim() || '';
    const cvv = this.newCard.cvv?.trim() || '';
    
    // Validate card number length (13-19 digits)
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return false;
    }
    
    // Validate expiry format (MM/YY)
    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      return false;
    }
    
    // Validate CVV (3-4 digits)
    if (cvv.length < 3 || cvv.length > 4) {
      return false;
    }
    
    return true;
  }

  async saveNewCard(): Promise<void> {
    if (!this.isNewCardFormValid() || this.savingCard || !this.memberId) {
      console.log('Cannot save card:', {
        isValid: this.isNewCardFormValid(),
        saving: this.savingCard,
        memberId: this.memberId
      });
      return;
    }

    // Validate card number length
    const cardNumber = this.newCard.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      alert('מספר כרטיס לא תקין. אנא הזן מספר כרטיס בין 13 ל-19 ספרות.');
      return;
    }

    // Validate expiration format (MM/YY)
    const expiryMatch = this.newCard.expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      alert('תאריך תפוגה לא תקין. אנא הזן בפורמט MM/YY (למשל: 12/26).');
      return;
    }

    // Validate CVV
    if (this.newCard.cvv.length < 3 || this.newCard.cvv.length > 4) {
      alert('קוד CVV לא תקין. אנא הזן 3 או 4 ספרות.');
      return;
    }

    console.log('Saving new credit card...', {
      memberId: this.memberId,
      saveCard: this.newCard.saveCard,
      cardNumberLength: cardNumber.length
    });

    this.savingCard = true;
    try {
      // Extract last 4 digits
      const lastDigits = cardNumber.slice(-4);
      
      // Detect card company
      const company = this.detectCardType(cardNumber);
      
      // Format expiration (ensure MM/YY format)
      const expiration = this.newCard.expiry.trim();
      
      // Get holder name from payer details or use default
      const fullName = this.payerName?.trim() || 'Card Holder';

      // Always save the card to get an ID (required for charge API)
      // Even if user doesn't want to persist it, we need the ID for the transaction
      const cardData = {
        last_digits: lastDigits,
        company: company,
        expiration: expiration,
        full_name: fullName
      };

      console.log('Calling API to save card:', cardData);
      const savedCard = await firstValueFrom(this.memberCreditCardService.create(this.memberId, cardData));
      
      if (savedCard) {
        console.log('Card saved successfully:', savedCard);
        // Reload cards list to include the new card
        this.loadCreditCards();
        // Select the newly saved card
        this.selectedCardId = savedCard.id;
        this.paymentDetails.selectedCardId = savedCard.id;
        this.paymentDetailsChange.emit(this.paymentDetails);
        this.newCardSaved = true;
        
        // If user didn't want to save it, we could delete it after charge
        // But for now, we'll keep it since we need the ID for the charge
        if (!this.newCard.saveCard) {
          console.log('Card saved temporarily for transaction (user chose not to persist)');
        }
      }
      
      this.emitValidationState();
    } catch (error: any) {
      console.error('Error saving card:', error);
      const errorMessage = error.error?.message || error.message || 'שגיאה בשמירת הכרטיס. אנא נסה שוב.';
      alert(errorMessage);
      this.newCardSaved = false;
      this.emitValidationState();
    } finally {
      this.savingCard = false;
    }
  }

  private detectCardType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length === 0) return 'unknown';
    
    const firstDigit = cleanNumber[0];
    const firstTwo = cleanNumber.substring(0, 2);
    const firstThree = cleanNumber.substring(0, 3);
    const firstFour = cleanNumber.substring(0, 4);
    const firstSix = cleanNumber.substring(0, 6);
    
    // Visa: starts with 4
    if (firstDigit === '4') return 'visa';
    
    // Mastercard: starts with 5 or 2 (2xxx range)
    if (firstDigit === '5' || (firstDigit === '2' && parseInt(firstFour) >= 2221 && parseInt(firstFour) <= 2720)) {
      return 'mastercard';
    }
    
    // American Express: starts with 34 or 37
    if (firstTwo === '34' || firstTwo === '37') return 'amex';
    
    // Discover: starts with 60 or 65, or 622126-622925, or 644-649
    if (firstTwo === '60' || firstTwo === '65') return 'discover';
    if (firstSix.length === 6 && parseInt(firstSix) >= 622126 && parseInt(firstSix) <= 622925) return 'discover';
    if (parseInt(firstThree) >= 644 && parseInt(firstThree) <= 649) return 'discover';
    
    // JCB: starts with 35-38 (but not 35-38 that are Amex or Diners)
    if (firstTwo === '35' || firstTwo === '36' || firstTwo === '37' || firstTwo === '38') {
      // Exclude Amex (34, 37) and Diners (30, 36, 38)
      if (firstTwo === '35') return 'jcb';
      if (firstTwo === '36') return 'diners'; // Diners takes precedence
      if (firstTwo === '37') return 'amex'; // Amex takes precedence
      if (firstTwo === '38') return 'diners'; // Diners takes precedence
    }
    
    // Diners Club: starts with 30, 36, or 38
    if (firstTwo === '30' || firstTwo === '36' || firstTwo === '38') return 'diners';
    
    return 'unknown';
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
