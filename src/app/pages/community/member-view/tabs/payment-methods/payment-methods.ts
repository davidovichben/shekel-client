import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../../core/entities/member.entity';
import { MemberCreditCardService, MemberCreditCard } from '../../../../../core/services/network/member-credit-card.service';

@Component({
  selector: 'app-member-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      if (cards.length > 0) {
        this.selectedCardId = cards[0].id;
      }
    });
  }

  selectCard(card: MemberCreditCard): void {
    this.selectedCardId = card.id;
  }

  onAddCard(): void {
    console.log('Add new card');
  }

  onCreateStandingOrder(): void {
    console.log('Create standing order');
  }
}
