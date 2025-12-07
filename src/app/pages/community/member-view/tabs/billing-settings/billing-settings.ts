import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../../core/entities/member.entity';
import { CustomSelectComponent, SelectOption } from '../../../../../shared/components/custom-select/custom-select';
import { CreditCardsComponent, CreditCard } from './credit-cards/credit-cards';
import { BankAccountComponent, BankAccountData } from './bank-account/bank-account';
import { MemberCreditCardService } from '../../../../../core/services/network/member-credit-card.service';

@Component({
  selector: 'app-member-billing-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, CreditCardsComponent, BankAccountComponent],
  templateUrl: './billing-settings.html',
  styleUrl: './billing-settings.sass'
})
export class MemberBillingSettingsComponent implements OnInit {
  private memberCreditCardService = inject(MemberCreditCardService);

  @Input() member: Member | null = null;

  // Billing settings
  autoMonthlyCharge = true;
  autoChargeDay = '';
  paymentType: 'credit' | 'standing_order' | 'bit' = 'credit';

  // Credit cards
  creditCards: CreditCard[] = [];
  selectedCardId = '';
  creditCardsLoaded = false;

  // Bank account data
  bankAccountData: BankAccountData = {
    bankNumber: '',
    branchNumber: '',
    accountNumber: '',
    idNumber: '',
    fullName: '',
    authorizationFile: '',
    authorizationExpiry: '',
    chargeLimit: ''
  };

  chargeDayOptions: SelectOption[] = [
    { value: '1', label: 'הראשון לחודש' },
    { value: '10', label: 'העשירי לחודש' }
  ];

  ngOnInit(): void {
    if (this.member) {
      this.loadBillingSettings();
    }
  }

  onPaymentTypeChange(): void {
    if (this.paymentType === 'credit' && !this.creditCardsLoaded && this.member) {
      this.loadCreditCards();
    }
  }

  private loadCreditCards(): void {
    if (!this.member) return;

    this.memberCreditCardService.getByMember(this.member.id).subscribe(cards => {
      this.creditCards = cards;
      this.creditCardsLoaded = true;
    });
  }

  private loadBillingSettings(): void {
    // Load billing settings from member or API
    // For now, using placeholder data
    this.autoChargeDay = '10';

    // Load credit cards if credit is the default payment type
    if (this.paymentType === 'credit') {
      this.loadCreditCards();
    }

    // Sample bank account data
    this.bankAccountData = {
      bankNumber: '11',
      branchNumber: '265',
      accountNumber: '654122',
      idNumber: '6542121',
      fullName: 'שמואל לוי',
      authorizationFile: 'הרישאה.pdf',
      authorizationExpiry: '16/08/2027',
      chargeLimit: '1000'
    };
  }

  onUpdate(): void {
    console.log('Update billing settings');
  }
}
