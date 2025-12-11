import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, SelectOption } from '../../../../../../shared/components/custom-select/custom-select';
import { GenericService } from '../../../../../../core/services/network/generic.service';

export interface BankAccountData {
  bankNumber: string;
  branchNumber: string;
  accountNumber: string;
  idNumber: string;
  fullName: string;
  authorizationFile: string;
  authorizationExpiry: string;
  chargeLimit: string;
}

@Component({
  selector: 'app-bank-account',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './bank-account.html',
  styleUrl: './bank-account.sass'
})
export class BankAccountComponent implements OnInit {
  private genericService = inject(GenericService);

  @Input() data: BankAccountData = {
    bankNumber: '',
    branchNumber: '',
    accountNumber: '',
    idNumber: '',
    fullName: '',
    authorizationFile: '',
    authorizationExpiry: '',
    chargeLimit: ''
  };
  @Output() dataChange = new EventEmitter<BankAccountData>();

  bankOptions: SelectOption[] = [];

  ngOnInit(): void {
    this.loadBanks();
  }

  private loadBanks(): void {
    this.genericService.getBanks().subscribe(banks => {
      this.bankOptions = banks.map(bank => ({ value: bank.id, label: bank.name }));
    });
  }

  onFieldChange(): void {
    this.dataChange.emit(this.data);
  }
}
