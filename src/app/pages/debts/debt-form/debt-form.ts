import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DebtService } from '../../../core/services/network/debt.service';
import { DebtStatus } from '../../../core/entities/debt.entity';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';

export interface DebtFormDialogData {
  debt?: {
    id: string;
    memberId: string;
    fullName: string;
    amount: number;
    description: string;
    hebrewDate: string;
    gregorianDate: string;
    autoPaymentApproved: boolean;
    status: DebtStatus;
    debtType?: string;
    lastReminder?: string | null;
  };
}

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, MemberAutocompleteComponent],
  templateUrl: './debt-form.html',
  styleUrl: './debt-form.sass'
})
export class DebtFormComponent implements OnInit {
  private debtService = inject(DebtService);
  private dialogRef = inject(MatDialogRef<DebtFormComponent>);
  private data: DebtFormDialogData = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  debtId = '';

  debtorType: 'individual' | 'group' = 'individual';

  debt = {
    memberId: '',
    fullName: '',
    amount: 0,
    description: '',
    hebrewDate: '',
    gregorianDate: '',
    autoPaymentApproved: false,
    status: DebtStatus.Pending as DebtStatus,
    debtType: '',
    lastReminder: null as string | null
  };

  debtTypeOptions = [
    { value: 'neder_shabbat', label: 'נדר שבת' },
    { value: 'tikun_nezek', label: 'תיקון נזק' },
    { value: 'dmei_chaver', label: 'דמי חבר' },
    { value: 'kiddush', label: 'קידוש שבת' },
    { value: 'other', label: 'אחר' }
  ];

  sendReminderOnCreate = false;
  isSubmitting = false;

  ngOnInit(): void {
    if (this.data?.debt) {
      this.isEditMode = true;
      this.debtId = this.data.debt.id;
      this.debt = {
        memberId: this.data.debt.memberId || '',
        fullName: this.data.debt.fullName || '',
        amount: this.data.debt.amount || 0,
        description: this.data.debt.description || '',
        hebrewDate: this.data.debt.hebrewDate || '',
        gregorianDate: this.data.debt.gregorianDate || '',
        autoPaymentApproved: this.data.debt.autoPaymentApproved || false,
        status: this.data.debt.status || DebtStatus.Pending,
        debtType: this.data.debt.debtType || '',
        lastReminder: this.data.debt.lastReminder || null
      };
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    
    // Check if it's already in DD/MM/YYYY format
    if (typeof dateString === 'string' && dateString.includes('/')) {
      return dateString;
    }
    
    // Try to parse as Date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if can't parse
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onSendReminder(): void {
    // TODO: Implement send reminder API call
    console.log('Send reminder for debt:', this.debtId);
  }

  onPay(): void {
    // TODO: Implement pay debt API call
    console.log('Pay debt:', this.debtId);
  }

  onDelete(): void {
    if (!this.debtId) return;
    
    this.debtService.delete(this.debtId).subscribe({
      next: () => {
        this.dialogRef.close({ deleted: true });
      },
      error: (error) => {
        console.error('Error deleting debt:', error);
      }
    });
  }

  onMemberSelected(member: Member): void {
    this.debt.memberId = member.id;
    this.debt.fullName = member.fullName;
  }

  onSubmit(): void {
    if (!this.debt.fullName || !this.debt.amount) {
      return;
    }

    this.isSubmitting = true;

    const request = this.isEditMode
      ? this.debtService.update(this.debtId, this.debt)
      : this.debtService.create(this.debt);

    request.subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving debt:', error);
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
