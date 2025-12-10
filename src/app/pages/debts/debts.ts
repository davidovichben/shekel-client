import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { AdditionalFiltersComponent } from '../../shared/components/additional-filters/additional-filters';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { DebtFormComponent } from './debt-form/debt-form';
import { VowSetFormComponent } from './vow-set-form/vow-set-form';
import { DebtService } from '../../core/services/network/debt.service';
import { Debt, DebtStatus } from '../../core/entities/debt.entity';
import { ChipComponent, ChipVariant } from '../../shared/components/chip/chip';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DataTableComponent, AdditionalFiltersComponent, ChipComponent],
  templateUrl: './debts.html',
  styleUrl: './debts.sass'
})
export class DebtsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private debtService = inject(DebtService);

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DebtFormComponent, {
      width: '900px',
      panelClass: 'debt-form-dialog',
      disableClose: false,
      hasBackdrop: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDebts();
      }
    });
  }

  openEditDialog(debt: Debt): void {
    const dialogRef = this.dialog.open(DebtFormComponent, {
      width: '900px',
      panelClass: 'debt-form-dialog',
      disableClose: false,
      hasBackdrop: true,
      data: { debt }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDebts();
      }
    });
  }

  openVowSetDialog(): void {
    const dialogRef = this.dialog.open(VowSetFormComponent, {
      width: '900px',
      panelClass: 'vow-set-form-dialog',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDebts();
      }
    });
  }

  debts: Debt[] = [];
  totalDebts = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  selectedDebts: Set<string> = new Set();

  activeTab = 'all';
  tabs = [
    { id: 'all', label: 'כל החובות', count: 64 },
    { id: 'active', label: 'חובות פעילים', count: 153 },
    { id: 'paid', label: 'חובות ששולמו', count: 71 }
  ];

  showAutoPaymentOnly = false;

  sortBy = 'date';
  sortOptions = [
    { value: 'date', label: 'תאריך' },
    { value: 'amount', label: 'סכום' },
    { value: 'name', label: 'שם' }
  ];

  displayRange = 'all';
  displayRangeOptions = [
    { value: 'all', label: 'מאז ומעולם' },
    { value: 'month', label: 'חודש אחרון' },
    { value: 'year', label: 'שנה אחרונה' }
  ];

  tableColumns = [
    { key: 'fullName', label: 'שם מלא' },
    { key: 'autoPayment', label: 'אישור תשלום אוטומטי' },
    { key: 'amount', label: 'סכום החוב' },
    { key: 'hebrewDate', label: 'תאריך עברי' },
    { key: 'gregorianDate', label: 'תאריך לועזי' },
    { key: 'description', label: 'תיאור חוב' },
    { key: 'lastReminder', label: 'תזכורת אחרונה' },
    { key: 'status', label: 'סטטוס' },
    { key: 'actions', label: 'פעולות', class: 'col-actions' }
  ];

  ngOnInit(): void {
    this.loadDebts();
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadDebts();
  }

  loadDebts(): void {
    this.isLoading = true;

    // Build query params based on active tab and filters
    const params: { status?: string; page?: number; limit?: number } = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Map tab to status filter
    if (this.activeTab === 'active') {
      // For active debts, we might need to filter for pending and overdue
      // This depends on your API - if it doesn't support multiple statuses,
      // you might need to make separate calls or use a different approach
      params.status = 'pending'; // or 'active' if your API uses that
    } else if (this.activeTab === 'paid') {
      params.status = 'paid';
    }
    // 'all' tab doesn't need a status filter

    this.debtService.getAll(params).subscribe({
      next: (response) => {
        this.debts = response.rows;
        this.totalDebts = response.counts?.totalRows || response.rows.length;
        this.totalPages = response.counts?.totalPages || Math.ceil(this.totalDebts / this.itemsPerPage);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        this.isLoading = false;
        // Optionally show error message to user
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDebts();
  }

  getTotalAmount(): number {
    return this.debts.reduce((sum, debt) => sum + debt.amount, 0);
  }

  getStatusLabel(status: DebtStatus): string {
    const labels: Record<DebtStatus, string> = {
      [DebtStatus.Pending]: 'ממתין',
      [DebtStatus.Paid]: 'שולם',
      [DebtStatus.Overdue]: 'איחור תשלום',
      [DebtStatus.Cancelled]: 'בוטל'
    };
    return labels[status] || status;
  }

  isStatusPending(status: DebtStatus): boolean {
    return status === DebtStatus.Pending;
  }

  isStatusOverdue(status: DebtStatus): boolean {
    return status === DebtStatus.Overdue;
  }

  isStatusPaid(status: DebtStatus): boolean {
    return status === DebtStatus.Paid;
  }

  isStatusCancelled(status: DebtStatus): boolean {
    return status === DebtStatus.Cancelled;
  }

  getStatusChipVariant(status: DebtStatus): ChipVariant {
    switch (status) {
      case DebtStatus.Pending:
        return 'pending';
      case DebtStatus.Paid:
        return 'paid';
      case DebtStatus.Overdue:
        return 'overdue';
      case DebtStatus.Cancelled:
        return 'cancelled';
      default:
        return 'default';
    }
  }

  // Selection functionality
  toggleDebtSelection(debtId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDebts.add(debtId);
    } else {
      this.selectedDebts.delete(debtId);
    }
  }

  isDebtSelected(debtId: string): boolean {
    return this.selectedDebts.has(debtId);
  }

  onBulkAction(action: string): void {
    if (this.selectedDebts.size === 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: {
          title: 'שים לב',
          message: 'יש לבחור לפחות פריט אחד לפני ביצוע פעולה קולקטיבית',
          confirmText: 'הבנתי',
          cancelText: ''
        }
      });
      return;
    }
    console.log(`Bulk action: ${action}`, Array.from(this.selectedDebts));
  }

  openDeleteDialog(debt: Debt): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'האם אתה בטוח שאתה רוצה למחוק את הרשומה?',
        description: `הרשומה למחיקה: ${debt.fullName}`,
        buttons: [
          {
            text: 'בטל',
            icon: 'close-icon',
            type: 'cancel',
            action: 'cancel'
          },
          {
            text: 'כן, מחק',
            icon: 'trash-icon',
            type: 'primary',
            action: 'confirm'
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.debtService.delete(debt.id).subscribe({
          next: () => {
            this.loadDebts();
          },
          error: (error) => {
            console.error('Error deleting debt:', error);
          }
        });
      }
    });
  }

}
