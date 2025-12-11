import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberAutocompleteComponent } from '../../../../shared/components/member-autocomplete/member-autocomplete';
import { Member } from '../../../../core/entities/member.entity';

export interface PayerDetails {
  firstName: string;
  lastName: string;
  mobile: string;
  address: string;
  email: string;
  companyId: string;
}

@Component({
  selector: 'app-step1-payer',
  standalone: true,
  imports: [CommonModule, FormsModule, MemberAutocompleteComponent],
  templateUrl: './step1-payer.html',
  styleUrls: ['./step1-payer.sass']
})
export class Step1PayerComponent {
  @Input() payerDetails: PayerDetails = {
    firstName: '',
    lastName: '',
    mobile: '',
    address: '',
    email: '',
    companyId: ''
  };
  @Input() memberId = '';
  @Output() payerDetailsChange = new EventEmitter<PayerDetails>();

  useMemberDetails = true;
  selectedMember: Member | null = null;

  onMemberSelected(member: Member): void {
    this.selectedMember = member;
    if (this.useMemberDetails) {
      this.loadMemberDetails(member);
    }
  }

  private loadMemberDetails(member: Member): void {
    this.payerDetails.firstName = member.firstName || '';
    this.payerDetails.lastName = member.lastName || '';
    this.payerDetails.mobile = member.mobile || '';
    this.payerDetails.email = member.email || '';
    this.payerDetails.address = member.address || '';
    this.payerDetailsChange.emit(this.payerDetails);
  }

  private resetPayerDetails(): void {
    this.payerDetails.firstName = '';
    this.payerDetails.lastName = '';
    this.payerDetails.mobile = '';
    this.payerDetails.email = '';
    this.payerDetails.address = '';
    this.payerDetailsChange.emit(this.payerDetails);
  }

  onUseMemberDetailsChange(): void {
    if (this.useMemberDetails && this.selectedMember) {
      this.loadMemberDetails(this.selectedMember);
    } else if (!this.useMemberDetails) {
      this.resetPayerDetails();
    }
  }
}
