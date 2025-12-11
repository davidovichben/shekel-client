import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpenseService } from '../../../core/services/network/expense.service';
import { Expense, ExpenseStatus, ExpenseType, ExpenseFrequency } from '../../../core/entities/expense.entity';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload';

export interface ExpenseFormDialogData {
  expense?: Expense;
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, MemberAutocompleteComponent, ToggleSwitchComponent, FileUploadComponent],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.sass'
})
export class ExpenseFormComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private dialogRef = inject(MatDialogRef<ExpenseFormComponent>);
  private data: ExpenseFormDialogData = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  expenseId = '';
  isSubmitting = false;

  expense = {
    description: '',
    type: '',
    amount: 0,
    date: '',
    supplierId: null as string | number | null,
    supplierName: '',
    status: ExpenseStatus.Pending as ExpenseStatus,
    frequency: ExpenseFrequency.OneTime as ExpenseFrequency
  };

  isPaid = false;
  receiptFile: File | null = null;
  existingReceiptPath: string | null = null;

  expenseTypeOptions = [
    { value: ExpenseType.Food, label: 'מזון' },
    { value: ExpenseType.Maintenance, label: 'תחזוקת בית הכנסת' },
    { value: ExpenseType.Equipment, label: 'ציוד וריהוט' },
    { value: ExpenseType.Insurance, label: 'ביטוחים' },
    { value: ExpenseType.Operations, label: 'תפעול פעילויות' },
    { value: ExpenseType.Suppliers, label: 'ספקים ובעלי מקצוע' },
    { value: ExpenseType.Management, label: 'הנהלה ושכר' }
  ];

  frequencyOptions = [
    { value: ExpenseFrequency.Fixed, label: 'קבועה' },
    { value: ExpenseFrequency.Recurring, label: 'חוזר' },
    { value: ExpenseFrequency.OneTime, label: 'חד פעמי' }
  ];

  ngOnInit(): void {
    if (this.data?.expense) {
      this.isEditMode = true;
      this.expenseId = this.data.expense.id;
      
      // Format date for date input (YYYY-MM-DD)
      let formattedDate = '';
      if (this.data.expense.date) {
        const date = new Date(this.data.expense.date);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        } else {
          // If date is already in YYYY-MM-DD format, use it directly
          formattedDate = this.data.expense.date;
        }
      }
      
      this.expense = {
        description: this.data.expense.description || '',
        type: this.data.expense.type || '',
        amount: parseFloat(this.data.expense.amount) || 0,
        date: formattedDate,
        supplierId: this.data.expense.supplierId || null,
        supplierName: this.data.expense.supplierName || '',
        status: this.data.expense.status || ExpenseStatus.Pending,
        frequency: this.data.expense.frequency as ExpenseFrequency || ExpenseFrequency.OneTime
      };
      this.isPaid = this.expense.status === ExpenseStatus.Paid;
      this.existingReceiptPath = this.data.expense.receipt || null;
    } else {
      // Set default date to today
      const today = new Date();
      this.expense.date = today.toISOString().split('T')[0];
    }
  }

  onPaidToggleChange(paid: boolean): void {
    this.isPaid = paid;
    this.expense.status = paid ? ExpenseStatus.Paid : ExpenseStatus.Pending;
  }

  onMemberSelected(member: Member): void {
    this.expense.supplierId = member.id;
    this.expense.supplierName = member.fullName;
  }

  onReceiptFileSelected(file: File): void {
    this.receiptFile = file;
  }

  onSubmit(): void {
    // Validation
    if (!this.expense.type || !this.expense.amount || !this.expense.date || !this.expense.frequency || !this.expense.supplierId) {
      return;
    }

    this.isSubmitting = true;

    // Prepare expense data
    const expenseToSave: Partial<Expense> = {
      description: this.expense.description,
      type: this.expense.type,
      amount: this.expense.amount.toFixed(2),
      date: this.expense.date, // Already in YYYY-MM-DD format
      status: this.expense.status,
      frequency: this.expense.frequency
    };

    if (this.expense.supplierId) {
      expenseToSave.supplierId = this.expense.supplierId;
    }

    const request = this.isEditMode
      ? this.expenseService.update(this.expenseId, expenseToSave, this.receiptFile || undefined)
      : this.expenseService.create(expenseToSave, this.receiptFile || undefined);

    request.subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving expense:', error);
        this.isSubmitting = false;
      }
    });
  }

  onDelete(): void {
    if (!this.expenseId) return;

    this.expenseService.delete(this.expenseId).subscribe({
      next: () => {
        this.dialogRef.close({ deleted: true });
      },
      error: (error) => {
        console.error('Error deleting expense:', error);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

