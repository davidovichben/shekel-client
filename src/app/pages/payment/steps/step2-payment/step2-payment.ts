import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditCardComponent, CreditCardData } from '../../../../shared/components/credit-card/credit-card';
import { MemberCreditCardService } from '../../../../core/services/network/member-credit-card.service';
import { BillingService } from '../../../../core/services/network/billing.service';
import { TranzilaPaymentComponent, TranzilaResponse } from '../../../../shared/components/tranzila-payment/tranzila-payment';

export interface PaymentDetails {
  amount: number;
  installments: number;
  description: string;
  paymentMethod: 'credit' | 'standingOrder';
  selectedCardId?: string;
  type?: string;
}

export interface Step2ValidationState {
  isValid: boolean;
  newCardSaved: boolean;
  paymentComplete: boolean;
}

@Component({
  selector: 'app-step2-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, CreditCardComponent, TranzilaPaymentComponent],
  templateUrl: './step2-payment.html',
  styleUrl: './step2-payment.sass'
})
export class Step2PaymentComponent implements OnInit, OnChanges, OnDestroy {
  private memberCreditCardService = inject(MemberCreditCardService);
  private billingService = inject(BillingService);

  @Input() paymentDetails: PaymentDetails = {
    amount: 0,
    installments: 1,
    description: '',
    paymentMethod: 'credit'
  };
  @Input() memberId = '';
  @Input() payerName = '';
  @Output() paymentDetailsChange = new EventEmitter<PaymentDetails>();
  @Output() validationStateChange = new EventEmitter<Step2ValidationState>();
  @Output() continue = new EventEmitter<void>();

  useNewCard = false;
  selectedCardId = '';
  newCardSaved = false;
  isLoadingCards = false;

  // Tranzila iframe
  iframeUrl: string | null = null;
  isLoadingIframe = false;
  paymentSubmitted = false; // True after user confirms payment submission

  // Charge with existing card
  isCharging = false;
  chargeSuccess = false;
  chargeError = '';

  // Polling for new cards
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private initialCardCount = 0;

  savedCards: CreditCardData[] = [];

  ngOnInit(): void {
    if (this.memberId) {
      this.loadCreditCards();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['memberId'] && !changes['memberId'].firstChange && this.memberId) {
      this.loadCreditCards();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private loadCreditCards(): void {
    if (!this.memberId) {
      return;
    }

    this.isLoadingCards = true;
    this.savedCards = [];
    this.selectedCardId = '';

    this.memberCreditCardService.getByMember(this.memberId).subscribe({
      next: (cards) => {
        this.savedCards = cards.map(card => ({
          id: card.id,
          type: card.type,
          lastFourDigits: card.lastFourDigits,
          holderName: card.holderName,
          expiryDate: card.expiryDate
        }));
        const defaultCard = cards.find(c => c.isDefault);
        if (defaultCard) {
          this.selectCard({ id: defaultCard.id, type: defaultCard.type, lastFourDigits: defaultCard.lastFourDigits, holderName: defaultCard.holderName, expiryDate: defaultCard.expiryDate });
        } else if (this.savedCards.length > 0) {
          this.selectCard(this.savedCards[0]);
        }
        this.isLoadingCards = false;
        this.emitValidationState();
      },
      error: () => {
        this.isLoadingCards = false;
        this.emitValidationState();
      }
    });
  }

  selectCard(card: CreditCardData): void {
    this.selectedCardId = card.id;
    this.paymentDetails.selectedCardId = card.id;
    // Reset charge state when selecting a different card
    this.chargeSuccess = false;
    this.chargeError = '';
    this.paymentDetailsChange.emit(this.paymentDetails);
    this.emitValidationState();
  }

  chargeSelectedCard(): void {
    if (!this.selectedCardId || this.isCharging) return;

    this.isCharging = true;
    this.chargeError = '';

    this.billingService.charge({
      credit_card_id: parseInt(this.selectedCardId, 10),
      amount: this.paymentDetails.amount,
      description: this.paymentDetails.description,
      type: this.paymentDetails.type,
      createReceipt: true
    }).subscribe({
      next: (response) => {
        console.log('Charge successful:', response);
        this.isCharging = false;
        this.chargeSuccess = true;
        this.emitValidationState();
      },
      error: (error) => {
        console.error('Charge failed:', error);
        this.isCharging = false;
        this.chargeError = 'שגיאה בביצוע החיוב';
        this.emitValidationState();
      }
    });
  }

  private emitValidationState(): void {
    this.validationStateChange.emit({
      isValid: this.isStepValid(),
      newCardSaved: this.newCardSaved,
      paymentComplete: this.chargeSuccess || this.newCardSaved
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
        // Existing card: need card selected AND charge successful
        return !!this.selectedCardId && this.chargeSuccess;
      }
    }
    return false;
  }

  onUseNewCardChange(): void {
    this.newCardSaved = false;
    this.paymentSubmitted = false;
    if (this.useNewCard) {
      this.loadIframeUrl();
    } else {
      this.iframeUrl = null;
      this.stopPolling();
    }
    this.emitValidationState();
  }

  loadIframeUrl(): void {
    this.isLoadingIframe = true;
    this.iframeUrl = null;
    this.initialCardCount = this.savedCards.length;

    this.billingService.getMemberPaymentIframeUrl(this.memberId, this.paymentDetails.amount, this.paymentDetails.type).subscribe({
      next: (response) => {
        this.iframeUrl = response.iframe_url;
        this.isLoadingIframe = false;
      },
      error: (error) => {
        console.error('Error loading iframe URL:', error);
        this.isLoadingIframe = false;
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    // Poll every 3 seconds to check if a new card was added
    this.pollingInterval = setInterval(() => {
      this.checkForNewCards();
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private checkForNewCards(): void {
    if (!this.memberId) return;

    this.memberCreditCardService.getByMember(this.memberId).subscribe({
      next: (cards) => {
        if (cards.length > this.initialCardCount) {
          // New card was added - payment succeeded
          console.log('New card detected via polling');
          this.stopPolling();
          this.onPaymentVerified(cards);
        }
      }
    });
  }

  private onPaymentVerified(cards: any[]): void {
    console.log('Payment verified, card saved successfully');
    this.newCardSaved = true;
    // Update saved cards list
    this.savedCards = cards.map(card => ({
      id: card.id,
      type: card.type,
      lastFourDigits: card.lastFourDigits,
      holderName: card.holderName,
      expiryDate: card.expiryDate
    }));
    // Select the newest card (last one)
    if (this.savedCards.length > 0) {
      const newestCard = this.savedCards[this.savedCards.length - 1];
      this.selectedCardId = newestCard.id;
      this.paymentDetails.selectedCardId = newestCard.id;
      this.paymentDetailsChange.emit(this.paymentDetails);
    }
    // Emit validation state to enable next step
    this.emitValidationState();
  }

  onCardStored(response: TranzilaResponse): void {
    console.log('onCardStored called with:', response);
    if (response.success) {
      console.log('Payment submitted, hiding form and starting verification...');
      // Hide form immediately to prevent double submission
      this.paymentSubmitted = true;
      // Start polling to verify the card was saved
      this.startPolling();
    }
  }

  onCardStoreError(response: TranzilaResponse): void {
    console.error('Card store failed:', response.error);
  }

  onManualSubmit(): void {
    // Manual fallback when postMessage isn't working
    console.log('Manual submit clicked');
    this.paymentSubmitted = true;
    this.startPolling();
  }

  onBackToForm(): void {
    this.useNewCard = false;
    this.iframeUrl = null;
    this.stopPolling();
  }

  onContinue(): void {
    this.continue.emit();
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
