import { Component, OnInit, AfterViewInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DebtService } from '../../../core/services/network/debt.service';
import { DebtStatus } from '../../../core/entities/debt.entity';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch';
import { RadioGroupComponent } from '../../../shared/components/radio-group/radio-group';

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
    lastReminderSentAt?: string | null;
  };
}

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, MemberAutocompleteComponent, ToggleSwitchComponent, RadioGroupComponent],
  templateUrl: './debt-form.html',
  styleUrl: './debt-form.sass'
})
export class DebtFormComponent implements OnInit, AfterViewInit {
  private debtService = inject(DebtService);
  private dialogRef = inject(MatDialogRef<DebtFormComponent>);
  private data: DebtFormDialogData = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  debtId = '';

  debtorType: 'individual' | 'group' = 'individual';

  debtorTypeOptions = [
    { value: 'individual', label: 'יחיד' },
    { value: 'group', label: 'קבוצה' }
  ];

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
    lastReminder: null as string | null,
    lastReminderSentAt: null as string | null
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

  private convertDateToInputFormat(dateString: string): string {
    if (!dateString) return '';
    
    // If already in YYYY-MM-DD format (from HTML date input), return as-is
    if (dateString.includes('-') && dateString.length === 10) {
      return dateString;
    }
    
    // Try to parse MM/DD/YYYY format (from service)
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      // Convert to YYYY-MM-DD for HTML date input
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try to parse as Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  }

  private convertDateToApiFormat(dateString: string): string {
    if (!dateString) return '';
    
    // Convert from yyyy-mm-dd (HTML date input) to DD/MM/YYYY for API
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        return `${day}/${month}/${year}`;
      }
    }
    
    // If already in DD/MM/YYYY format, return as-is
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  }

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
        gregorianDate: this.convertDateToInputFormat(this.data.debt.gregorianDate || ''),
        autoPaymentApproved: this.data.debt.autoPaymentApproved || false,
        status: this.data.debt.status || DebtStatus.Pending,
        debtType: this.data.debt.debtType || '',
        lastReminder: this.data.debt.lastReminder || null,
        lastReminderSentAt: this.data.debt.lastReminderSentAt || null
      };
    }
  }

  ngAfterViewInit(): void {
    // Auto-resize textarea if it has initial content
    setTimeout(() => {
      const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
      if (textarea && this.debt.description) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }, 0);
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
    if (!this.debtId) return;
    
    this.isSubmitting = true;
    
    this.debtService.sendReminder(this.debtId).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        // Update the local debt object with the updated reminder date
        this.debt.lastReminderSentAt = result.lastReminderSentAt || null;
        // Close dialog and refresh table
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error sending reminder:', error);
        this.isSubmitting = false;
      }
    });
  }

  onPay(): void {
    if (!this.debtId) return;
    
    this.isSubmitting = true;
    
    this.debtService.update(this.debtId, {
      ...this.debt,
      status: DebtStatus.Paid
    }).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error paying debt:', error);
        this.isSubmitting = false;
      }
    });
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
    // Validation
    if (!this.debt.memberId || !this.debt.amount || !this.debt.gregorianDate) {
      console.error('Validation failed:', {
        memberId: this.debt.memberId,
        amount: this.debt.amount,
        gregorianDate: this.debt.gregorianDate
      });
      return;
    }

    this.isSubmitting = true;

    // Convert date back to API format (DD/MM/YYYY)
    const debtToSave: any = {
      memberId: this.debt.memberId,
      debtType: this.debt.debtType || 'other',
      amount: this.debt.amount,
      description: this.debt.description || '',
      gregorianDate: this.convertDateToApiFormat(this.debt.gregorianDate),
      status: this.debt.status
    };

    // For create, add sendImmediateReminder if toggle is on
    if (!this.isEditMode && this.sendReminderOnCreate) {
      debtToSave.sendImmediateReminder = true;
    }

    console.log('Saving debt:', debtToSave);

    const request = this.isEditMode
      ? this.debtService.update(this.debtId, debtToSave)
      : this.debtService.create(debtToSave);

    request.subscribe({
      next: (result) => {
        console.log('Debt saved successfully:', result);
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving debt:', error);
        console.error('Error details:', error.error || error.message);
        this.isSubmitting = false;
        // TODO: Show error message to user
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onDescriptionInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
