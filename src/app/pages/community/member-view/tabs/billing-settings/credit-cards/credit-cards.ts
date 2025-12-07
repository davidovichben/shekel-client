import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CreditCard {
  id: string;
  type: 'visa' | 'mastercard';
  lastFourDigits: string;
  holderName: string;
  expiryDate: string;
}

@Component({
  selector: 'app-credit-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-cards.html',
  styleUrl: './credit-cards.sass'
})
export class CreditCardsComponent {
  @Input() cards: CreditCard[] = [];
  @Input() selectedCardId: string = '';
  @Output() selectedCardIdChange = new EventEmitter<string>();

  selectCard(card: CreditCard): void {
    this.selectedCardId = card.id;
    this.selectedCardIdChange.emit(card.id);
  }
}
