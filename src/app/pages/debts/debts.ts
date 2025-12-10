import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { AdditionalFiltersComponent } from '../../shared/components/additional-filters/additional-filters';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../../shared/components/export-dialog/export-dialog';
import { DebtFormComponent } from './debt-form/debt-form';
import { VowSetFormComponent } from './vow-set-form/vow-set-form';
import { DebtService } from '../../core/services/network/debt.service';
import { Debt, DebtStatus } from '../../core/entities/debt.entity';
import { ChipComponent, ChipVariant } from '../../shared/components/chip/chip';
import { convertToHebrewDate } from '../../core/utils/hebrew-date.util';

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
  totalSum = 0;
  isLoading = false;
  selectedDebts: Set<string> = new Set();

  activeTab = 'all';
  tabs = [
    { id: 'all', label: 'כל החובות', count: 0 },
    { id: 'active', label: 'חובות פעילים', count: 0 },
    { id: 'paid', label: 'חובות ששולמו', count: 0 }
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
    { key: 'description', label: 'תיאור חוב' },
    { key: 'amount', label: 'סכום' },
    { key: 'shouldBill', label: 'אישור תשלום אוטומטי' },
    { key: 'hebrewDate', label: 'תאריך עברי' },
    { key: 'gregorianDate', label: 'תאריך לועזי' },
    { key: 'lastReminder', label: 'תזכורת אחרונה' },
    { key: 'debtType', label: 'סוג' },
    { key: 'status', label: 'סטטוס' },
    { key: 'actions', label: 'פעולות', class: 'col-actions' }
  ];

  ngOnInit(): void {
    this.loadTabCounts();
    this.loadDebts();
  }

  private loadTabCounts(): void {
    // Load counts for all tabs
    // All debts count
    this.debtService.getAll({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        const allCount = response.counts?.totalRows || 0;
        this.tabs.find(t => t.id === 'all')!.count = allCount;
      }
    });

    // Active debts count (pending status)
    this.debtService.getAll({ status: 'pending', page: 1, limit: 1 }).subscribe({
      next: (response) => {
        const activeCount = response.counts?.totalRows || 0;
        this.tabs.find(t => t.id === 'active')!.count = activeCount;
      }
    });

    // Paid debts count
    this.debtService.getAll({ status: 'paid', page: 1, limit: 1 }).subscribe({
      next: (response) => {
        const paidCount = response.counts?.totalRows || 0;
        this.tabs.find(t => t.id === 'paid')!.count = paidCount;
      }
    });
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadDebts();
  }

  loadDebts(): void {
    this.isLoading = true;

    // Build query params based on active tab and filters
    const params: { 
      status?: string; 
      page?: number; 
      limit?: number;
      date_from?: string;
      date_to?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      should_bill?: boolean;
    } = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Map tab to status filter
    if (this.activeTab === 'active') {
      params.status = 'pending'; // Active debts are pending
    } else if (this.activeTab === 'paid') {
      params.status = 'paid';
    }
    // 'all' tab doesn't need a status filter

    // Add date range filter
    if (this.displayRange !== 'all') {
      const dateRange = this.getDateRange(this.displayRange);
      if (dateRange.from) {
        params.date_from = dateRange.from;
      }
      if (dateRange.to) {
        params.date_to = dateRange.to;
      }
    }

    // Add sorting
    if (this.sortBy) {
      params.sort_by = this.sortBy;
      params.sort_order = 'desc'; // Default to descending
    }

    // Add auto payment filter
    if (this.showAutoPaymentOnly) {
      params.should_bill = true;
    }

    this.debtService.getAll(params).subscribe({
      next: (response) => {
        this.debts = response.rows;
        this.totalDebts = response.counts?.totalRows || response.rows.length;
        this.totalPages = response.counts?.totalPages || Math.ceil(this.totalDebts / this.itemsPerPage);
        // Extract totalSum from API response (can be string or number)
        this.totalSum = response.totalSum ? parseFloat(String(response.totalSum)) : 0;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        this.isLoading = false;
        // Optionally show error message to user
      }
    });
  }

  private getDateRange(range: string): { from?: string; to?: string } {
    const today = new Date();
    const to = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    switch (range) {
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          from: monthAgo.toISOString().split('T')[0],
          to: to
        };
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return {
          from: yearAgo.toISOString().split('T')[0],
          to: to
        };
      default:
        return {}; // 'all' - no date filter
    }
  }

  onDisplayRangeChange(): void {
    this.currentPage = 1;
    this.loadDebts();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadDebts();
  }

  onAutoPaymentFilterChange(): void {
    this.currentPage = 1;
    this.loadDebts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDebts();
  }

  getTotalAmount(): number {
    return this.totalSum;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusLabel(status: DebtStatus): string {
    const labels: Record<DebtStatus, string> = {
      [DebtStatus.Pending]: 'חוב פעיל',
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

  getDebtTypeLabel(debtType?: string): string {
    if (!debtType) return '--';
    const labels: Record<string, string> = {
      'neder_shabbat': 'נדר שבת',
      'tikun_nezek': 'תיקון נזק',
      'dmei_chaver': 'דמי חבר',
      'kiddush': 'קידוש שבת',
      'neder_yom_shabbat': 'נדר יום שבת',
      'other': 'אחר'
    };
    return labels[debtType] || debtType;
  }

  getHebrewDate(debt: Debt): string {
    // If hebrewDate is already provided, use it
    if (debt.hebrewDate) {
      return debt.hebrewDate;
    }
    // Otherwise, convert from gregorianDate
    return convertToHebrewDate(debt.gregorianDate);
  }

  getHebrewDateTop(debt: Debt): string {
    const fullDate = this.getHebrewDate(debt);
    // Split by | delimiter
    if (fullDate.includes('|')) {
      return fullDate.split('|')[0];
    }
    // Fallback: try to extract day and month (everything before the year)
    const parts = fullDate.split(' ');
    if (parts.length >= 2) {
      // Return everything except the last part (year)
      return parts.slice(0, -1).join(' ');
    }
    return fullDate;
  }

  getHebrewDateBottom(debt: Debt): string {
    const fullDate = this.getHebrewDate(debt);
    // Split by | delimiter
    if (fullDate.includes('|')) {
      return fullDate.split('|')[1];
    }
    // Fallback: try to extract year (last part)
    const parts = fullDate.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 1]; // Last part is the year
    }
    return '';
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
        panelClass: 'confirm-dialog-panel',
        backdropClass: 'confirm-dialog-backdrop',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
        data: {
          title: 'שים לב',
          message: 'יש לבחור לפחות פריט אחד לפני ביצוע פעולה קולקטיבית',
          confirmText: 'הבנתי'
        }
      });
      return;
    }

    if (action === 'delete') {
      this.bulkDelete();
    } else if (action === 'print') {
      this.bulkPrint();
    } else if (action === 'message') {
      this.bulkSendMessage();
    } else if (action === 'document') {
      this.bulkGenerateDocument();
    } else if (action === 'copy') {
      this.bulkCopy();
    } else {
      console.log(`Bulk action: ${action}`, Array.from(this.selectedDebts));
    }
  }

  private bulkDelete(): void {
    const selectedIds = Array.from(this.selectedDebts);
    const selectedDebtNames = this.debts
      .filter(d => selectedIds.includes(d.id))
      .map(d => `${d.fullName} - ${d.description}`);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'מחיקת חובות',
        message: `האם אתה בטוח שברצונך למחוק ${selectedDebtNames.length} חובות?`,
        confirmText: 'מחק',
        cancelText: 'ביטול',
        items: selectedDebtNames.slice(0, 10) // Show first 10 items
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const ids = Array.from(this.selectedDebts);
        const deletedNames = [...selectedDebtNames];
        
        // Delete all selected debts
        const deletePromises = ids.map(id => 
          this.debtService.delete(id).toPromise()
        );
        
        Promise.all(deletePromises).then(() => {
          this.selectedDebts.clear();
          this.loadDebts();
          this.loadTabCounts();
          this.dialog.open(ConfirmDialogComponent, {
            width: '500px',
            panelClass: 'confirm-dialog-panel',
            backdropClass: 'confirm-dialog-backdrop',
            enterAnimationDuration: '0ms',
            exitAnimationDuration: '0ms',
            data: {
              title: 'המחיקה בוצעה בהצלחה',
              message: `${deletedNames.length} חובות נמחקו:`,
              confirmText: 'סגור',
              items: deletedNames.slice(0, 10) // Show first 10 items
            }
          });
        }).catch(error => {
          console.error('Error deleting debts:', error);
        });
      }
    });
  }

  private bulkPrint(): void {
    const selectedIds = Array.from(this.selectedDebts);
    const selectedDebts = this.debts.filter(d => selectedIds.includes(d.id));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = selectedDebts.map(d => `
      <tr>
        <td>${d.fullName}</td>
        <td>${d.description}</td>
        <td>${d.amount}₪</td>
        <td>${d.gregorianDate}</td>
        <td>${this.getStatusLabel(d.status)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>חובות - הדפסה</title>
          <style>
            body { font-family: 'Heebo', sans-serif; padding: 20px; direction: rtl; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>חובות - הדפסה</h1>
          <p>מספר רשומות: ${selectedDebts.length}</p>
          <table>
            <thead>
              <tr>
                <th>שם מלא</th>
                <th>תיאור</th>
                <th>סכום</th>
                <th>תאריך</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  private bulkSendMessage(): void {
    const selectedIds = Array.from(this.selectedDebts);
    console.log('Bulk send message for debts:', selectedIds);
    // TODO: Implement bulk message sending
  }

  private bulkGenerateDocument(): void {
    const selectedIds = Array.from(this.selectedDebts);
    console.log('Bulk generate document for debts:', selectedIds);
    // TODO: Implement bulk document generation
  }

  private bulkCopy(): void {
    const selectedIds = Array.from(this.selectedDebts);
    const selectedDebts = this.debts.filter(d => selectedIds.includes(d.id));
    
    // Format debts as text for clipboard
    const text = selectedDebts.map(d => 
      `${d.fullName} - ${d.description} - ${d.amount}₪ - ${d.gregorianDate}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      console.log('Debts copied to clipboard');
      // TODO: Show success notification
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
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

  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '600px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'ייצוא הנתונים לקובץ',
        subtitle: 'להורדה - לחץ על סוג הקובץ המבוקש'
      }
    });

    dialogRef.afterClosed().subscribe((result: ExportDialogResult | undefined) => {
      if (!result || !result.fileType) return;

      // Export all rows in current tab context
      // Map activeTab to status: 'all' -> undefined, 'active' -> 'pending', 'paid' -> 'paid'
      const status = this.activeTab === 'all' ? undefined : (this.activeTab === 'active' ? 'pending' : 'paid');
      this.exportDebts(status, undefined, result.fileType);
    });
  }

  private exportDebts(status?: string, ids?: string[], fileType?: string): void {
    this.debtService.export(status, ids, fileType).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Determine file extension based on fileType
        let extension = fileType || 'xlsx';
        if (extension === 'xls') {
          extension = 'xlsx'; // Convert xls to xlsx for download
        } else if (extension === 'csv') {
          extension = 'csv';
        } else if (extension === 'pdf') {
          extension = 'pdf';
        }
        
        a.download = `debts.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting debts:', error);
        // TODO: Show error message to user
      }
    });
  }

}
