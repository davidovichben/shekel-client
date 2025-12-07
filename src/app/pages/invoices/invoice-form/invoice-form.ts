import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InvoiceService } from '../../../core/services/network/invoice.service';
import { InvoiceStatus } from '../../../core/entities/invoice.entity';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';

export interface InvoiceFormDialogData {
  invoice?: {
    id: string;
    memberId: string;
    fullName: string;
    amount: number;
    description: string;
    hebrewDate: string;
    gregorianDate: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    invoiceType?: string;
  };
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, MemberAutocompleteComponent],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.sass'
})
export class InvoiceFormComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private dialogRef = inject(MatDialogRef<InvoiceFormComponent>);
  private data: InvoiceFormDialogData = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  invoiceId = '';

  invoice = {
    memberId: '',
    fullName: '',
    amount: 0,
    description: '',
    hebrewDate: '',
    gregorianDate: '',
    invoiceNumber: '',
    status: InvoiceStatus.Pending as InvoiceStatus,
    invoiceType: ''
  };

  invoiceTypeOptions = [
    { value: 'membership', label: 'דמי חבר' },
    { value: 'donation', label: 'תרומה' },
    { value: 'kiddush', label: 'קידוש' },
    { value: 'event', label: 'אירוע' },
    { value: 'other', label: 'אחר' }
  ];

  isSubmitting = false;

  ngOnInit(): void {
    if (this.data?.invoice) {
      this.isEditMode = true;
      this.invoiceId = this.data.invoice.id;
      this.invoice = {
        memberId: this.data.invoice.memberId || '',
        fullName: this.data.invoice.fullName || '',
        amount: this.data.invoice.amount || 0,
        description: this.data.invoice.description || '',
        hebrewDate: this.data.invoice.hebrewDate || '',
        gregorianDate: this.data.invoice.gregorianDate || '',
        invoiceNumber: this.data.invoice.invoiceNumber || '',
        status: this.data.invoice.status || InvoiceStatus.Pending,
        invoiceType: this.data.invoice.invoiceType || ''
      };
    }
  }

  onMemberSelected(member: Member): void {
    this.invoice.memberId = member.id;
    this.invoice.fullName = member.fullName;
  }

  onSubmit(): void {
    if (!this.invoice.fullName || !this.invoice.amount) {
      return;
    }

    this.isSubmitting = true;

    const request = this.isEditMode
      ? this.invoiceService.update(this.invoiceId, this.invoice)
      : this.invoiceService.create(this.invoice);

    request.subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving invoice:', error);
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
