import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CreditCardData {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'diners';
  lastFourDigits: string;
  holderName: string;
  expiryDate: string;
}

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-card.html',
  styleUrl: './credit-card.sass'
})
export class CreditCardComponent {
  @Input() card!: CreditCardData;
  @Input() selected = false;
  @Output() select = new EventEmitter<CreditCardData>();

  getCardLogoPath(): string {
    const ext = this.card.type === 'visa' ? 'png' : 'svg';
    return `/assets/img/credit_cards/${this.card.type}.${ext}`;
  }

  onClick(): void {
    this.select.emit(this.card);
  }
}
