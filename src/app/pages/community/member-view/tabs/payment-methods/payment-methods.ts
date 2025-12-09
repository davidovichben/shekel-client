import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../../core/entities/member.entity';
import { MemberCreditCardService, MemberCreditCard } from '../../../../../core/services/network/member-credit-card.service';
import { CreditCardComponent, CreditCardData } from '../../../../../shared/components/credit-card/credit-card';

@Component({
  selector: 'app-member-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, CreditCardComponent],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.sass'
})
export class MemberPaymentMethodsComponent implements OnInit {
  private memberCreditCardService = inject(MemberCreditCardService);

  @Input() member: Member | null = null;

  // Credit cards
  creditCards: MemberCreditCard[] = [];
  selectedCardId = '';

  // Bit options
  bitOption: 'none' | 'primary' | 'other' = 'none';
  bitPhoneNumber = '';

  ngOnInit(): void {
    if (this.member) {
      this.loadCreditCards();
    }
  }

  private loadCreditCards(): void {
    if (!this.member) return;

    this.memberCreditCardService.getByMember(this.member.id).subscribe(cards => {
      this.creditCards = cards;
      const defaultCard = cards.find(card => card.isDefault);
      this.selectedCardId = defaultCard?.id || (cards.length > 0 ? cards[0].id : '');
    });
  }

  selectCard(card: CreditCardData): void {
    if (!this.member || this.selectedCardId === card.id) return;

    this.selectedCardId = card.id;
    this.memberCreditCardService.setDefault(this.member.id, card.id).subscribe();
  }

  onAddCard(): void {
    console.log('Add new card');
  }

  onCreateStandingOrder(): void {
    console.log('Create standing order');
  }
}
