import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../../core/entities/member.entity';
import { CustomSelectComponent, SelectOption } from '../../../../../shared/components/custom-select/custom-select';
import { ToggleSwitchComponent } from '../../../../../shared/components/toggle-switch/toggle-switch';
import { CreditCardsComponent, CreditCard } from './credit-cards/credit-cards';
import { BankAccountComponent, BankAccountData } from './bank-account/bank-account';
import { MemberCreditCardService } from '../../../../../core/services/network/member-credit-card.service';
import { MemberBillingSettingsService } from '../../../../../core/services/network/member-billing-settings.service';

@Component({
  selector: 'app-member-billing-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, ToggleSwitchComponent, CreditCardsComponent, BankAccountComponent],
  templateUrl: './billing-settings.html',
  styleUrl: './billing-settings.sass'
})
export class MemberBillingSettingsComponent implements OnInit {
  private memberCreditCardService = inject(MemberCreditCardService);
  private memberBillingSettingsService = inject(MemberBillingSettingsService);

  @Input() member: Member | null = null;

  // Billing settings
  shouldBill = true;
  billingDate = '10';
  billingType: 'credit_card' | 'bank' | 'bit' = 'credit_card';
  selectedCreditCard = '';

  // Credit cards
  creditCards: CreditCard[] = [];
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

  onShouldBillChange(): void {
    this.saveBillingSettings();
  }

  onBillingDateChange(): void {
    this.saveBillingSettings();
  }

  onBillingTypeChange(): void {
    if (this.billingType === 'credit_card' && !this.creditCardsLoaded && this.member) {
      this.loadCreditCards();
    }
    this.saveBillingSettings();
  }

  onSelectedCreditCardChange(): void {
    this.saveBillingSettings();
  }

  private saveBillingSettings(): void {
    if (!this.member) return;

    this.memberBillingSettingsService.put(this.member.id, {
      shouldBill: this.shouldBill,
      billingDate: this.billingDate,
      billingType: this.billingType,
      selectedCreditCard: this.selectedCreditCard
    }).subscribe();
  }

  private loadCreditCards(): void {
    if (!this.member) return;

    this.memberCreditCardService.getByMember(this.member.id).subscribe(cards => {
      this.creditCards = cards;
      this.creditCardsLoaded = true;
    });
  }

  private loadBillingSettings(): void {
    if (!this.member) return;

    this.memberBillingSettingsService.get(this.member.id).subscribe(settings => {
      this.shouldBill = settings.shouldBill;
      this.billingDate = settings.billingDate || '10';
      this.billingType = settings.billingType || 'credit_card';
      this.selectedCreditCard = settings.selectedCreditCard || '';

      // Load credit cards if credit_card is the default billing type
      if (this.billingType === 'credit_card') {
        this.loadCreditCards();
      }
    });

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
}
