import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DebtService } from '../../../core/services/network/debt.service';
import { DebtStatus } from '../../../core/entities/debt.entity';
import { AliyahType } from '../../../core/entities/vow-set.entity';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch';

export interface VowSetFormDialogData {
  // No data needed - this is always a create form
}

interface VowItemForm {
  memberId: string;
  fullName: string;
  aliyahType: string;
  amount: number;
  sendReminder: boolean;
}

@Component({
  selector: 'app-vow-set-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, MemberAutocompleteComponent, DialogHeaderComponent, ToggleSwitchComponent],
  templateUrl: './vow-set-form.html',
  styleUrl: './vow-set-form.sass'
})
export class VowSetFormComponent implements OnInit {
  private debtService = inject(DebtService);
  private dialogRef = inject(MatDialogRef<VowSetFormComponent>);
  private data: VowSetFormDialogData = inject(MAT_DIALOG_DATA);

  @ViewChild(MemberAutocompleteComponent) memberAutocomplete?: MemberAutocompleteComponent;

  vowSet = {
    gregorianDate: '',
    hebrewDate: '',
    description: ''
  };

  vows: VowItemForm[] = [];

  // Form fields for adding new vow
  newVow = {
    memberId: '',
    fullName: '',
    aliyahType: '',
    amount: 0,
    sendReminder: false as boolean // Default to false - user must explicitly enable reminder
  };

  onReminderToggleChange(value: boolean): void {
    console.log('Toggle changed to:', value, 'Type:', typeof value);
    // Explicitly update the value to ensure it's set correctly
    this.newVow.sendReminder = value === true;
    console.log('newVow.sendReminder is now:', this.newVow.sendReminder, 'Type:', typeof this.newVow.sendReminder);
  }

  aliyahOptions = [
    { value: AliyahType.Rishona, label: 'ראשונה' },
    { value: AliyahType.Shniya, label: 'שנייה' },
    { value: AliyahType.Shlishit, label: 'שלישית' },
    { value: AliyahType.Reviit, label: 'רביעית' },
    { value: AliyahType.Chamishit, label: 'חמישית' },
    { value: AliyahType.Shishit, label: 'שישית' },
    { value: AliyahType.Shviit, label: 'שביעית' },
    { value: AliyahType.Maftir, label: 'מפטיר' },
    { value: AliyahType.Hagbaha, label: 'הגבהה' },
    { value: AliyahType.Glila, label: 'גלילה' },
    { value: AliyahType.Petichta, label: 'פתיחה' },
    { value: AliyahType.Other, label: 'אחר' }
  ];

  isSubmitting = false;

  ngOnInit(): void {
    // Start with empty form - no edit mode needed
  }

  addVow(): void {
    // Convert amount to number and validate
    const amount = Number(this.newVow.amount);
    
    // Validate required fields - member must be selected
    if (!this.newVow.memberId || !this.newVow.fullName) {
      console.warn('Cannot add vow: missing member', {
        memberId: this.newVow.memberId,
        fullName: this.newVow.fullName
      });
      return;
    }

    if (!amount || amount <= 0 || isNaN(amount)) {
      console.warn('Cannot add vow: invalid amount', {
        amount: this.newVow.amount,
        converted: amount
      });
      return;
    }

    // Add the vow to the list
    // Read sendReminder value - ensure it's a proper boolean
    // The value should be directly from newVow.sendReminder which is bound via ngModel
    const sendReminderValue = this.newVow.sendReminder === true;
    
    const vowToAdd: VowItemForm = {
      memberId: this.newVow.memberId,
      fullName: this.newVow.fullName,
      aliyahType: this.newVow.aliyahType || '',
      amount: amount,
      sendReminder: sendReminderValue
    };

    this.vows.push(vowToAdd);
    console.log('=== ADDING VOW ===');
    console.log('newVow.sendReminder BEFORE conversion:', this.newVow.sendReminder, 'Type:', typeof this.newVow.sendReminder);
    console.log('sendReminderValue AFTER conversion:', sendReminderValue, 'Type:', typeof sendReminderValue);
    console.log('Vow added to list:', {
      member: vowToAdd.fullName,
      amount: vowToAdd.amount,
      sendReminder_in_vow: vowToAdd.sendReminder,
      sendReminder_type: typeof vowToAdd.sendReminder,
      will_display_reminder: vowToAdd.sendReminder === true
    });
    console.log('Total vows in list:', this.vows.length);
    console.log('Last vow sendReminder:', this.vows[this.vows.length - 1].sendReminder);
    console.log('==================');

    // Don't reset form - keep all values for adding more vows
    // User can manually change values if needed
  }

  removeVow(index: number): void {
    // Get all valid vows to find the actual index
    const validVows = this.vows.filter(v => v.memberId && v.amount > 0);
    if (index >= 0 && index < validVows.length) {
      const vowToRemove = validVows[index];
      const actualIndex = this.vows.indexOf(vowToRemove);
      if (actualIndex >= 0) {
        this.vows.splice(actualIndex, 1);
      }
    }
  }

  onMemberSelected(member: Member): void {
    this.newVow.memberId = member.id;
    this.newVow.fullName = member.fullName;
  }

  getAliyahLabel(value: string): string {
    const option = this.aliyahOptions.find(opt => opt.value === value);
    return option ? option.label : value || 'לא נבחר';
  }

  hasNoValidVows(): boolean {
    return this.vows.length === 0 || this.vows.every(v => !v.memberId || v.amount === 0);
  }

  private convertDateToApiFormat(dateString: string): string {
    if (!dateString) return '';
    // Convert from yyyy-mm-dd (HTML date input) to DD/MM/YYYY (API format)
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    return dateString;
  }

  onSubmit(): void {
    // Validate required fields
    if (!this.vowSet.gregorianDate) {
      return;
    }

    // Validate at least one vow with member and amount
    const validVows = this.vows.filter(v => v.memberId && v.amount > 0);
    if (validVows.length === 0) {
      return;
    }

    this.isSubmitting = true;

    // Convert date to API format
    const apiDate = this.convertDateToApiFormat(this.vowSet.gregorianDate);

    // Build debt objects for bulk create
    const debts = validVows.map(vow => {
      // Construct description: vowSet.description + " - " + aliyahType label
      const aliyahLabel = this.getAliyahLabel(vow.aliyahType);
      let description = '';
      
      if (this.vowSet.description && vow.aliyahType) {
        description = `${this.vowSet.description} - ${aliyahLabel}`;
      } else if (this.vowSet.description) {
        description = this.vowSet.description;
      } else if (vow.aliyahType) {
        description = aliyahLabel;
      }

      return {
        memberId: vow.memberId,
        debtType: 'neder_shabbat',
        amount: vow.amount,
        description: description,
        gregorianDate: apiDate,
        sendImmediateReminder: vow.sendReminder || false,
        status: DebtStatus.Pending
      };
    });

    this.debtService.bulkCreate(debts).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error creating vow debts:', error);
        this.isSubmitting = false;
        // TODO: Show error message to user
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
