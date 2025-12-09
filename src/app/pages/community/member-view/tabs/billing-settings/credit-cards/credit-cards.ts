import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditCardComponent, CreditCardData } from '../../../../../../shared/components/credit-card/credit-card';

export interface CreditCard {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'diners';
  lastFourDigits: string;
  holderName: string;
  expiryDate: string;
}

@Component({
  selector: 'app-credit-cards',
  standalone: true,
  imports: [CommonModule, CreditCardComponent],
  templateUrl: './credit-cards.html',
  styleUrl: './credit-cards.sass'
})
export class CreditCardsComponent {
  @Input() cards: CreditCard[] = [];
  @Input() selectedCardId: string = '';
  @Output() selectedCardIdChange = new EventEmitter<string>();

  selectCard(card: CreditCardData): void {
    this.selectedCardId = card.id;
    this.selectedCardIdChange.emit(card.id);
  }
}
