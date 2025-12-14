import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { AdditionalFiltersComponent } from '../../shared/components/additional-filters/additional-filters';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../../shared/components/export-dialog/export-dialog';
import { ShareDialogComponent } from '../../shared/components/share-dialog/share-dialog';
import { ExpenseFormComponent } from './expense-form/expense-form';
import { ExpenseService } from '../../core/services/network/expense.service';
import { Expense, ExpenseStatus, ExpenseType, ExpenseStats } from '../../core/entities/expense.entity';
import { ChipComponent, ChipVariant } from '../../shared/components/chip/chip';
import { convertToHebrewDate } from '../../core/utils/hebrew-date.util';
import { StatsPanelComponent, StatsData } from '../../shared/components/stats-panel/stats-panel';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DataTableComponent, AdditionalFiltersComponent, ChipComponent, StatsPanelComponent],
  templateUrl: './expenses.html',
  styleUrl: './expenses.sass'
})
export class ExpensesComponent implements OnInit {
  private dialog = inject(MatDialog);
  private expenseService = inject(ExpenseService);

  expenses: Expense[] = [];
  totalExpenses = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalSum = 0;
  isLoading = false;
  selectedExpenses: Set<string> = new Set();
  stats: StatsData | null = null;
  isLoadingStats = false;

  activeTab = 'all';
  tabs = [
    { id: 'all', label: 'כל ההוצאות', count: 0 },
    { id: 'pending', label: 'חובות לתשלום', count: 0 },
    { id: 'paid', label: 'הוצאות ששולמו', count: 0 }
  ];

  sortBy = 'date';
  sortOptions = [
    { value: 'date', label: 'תאריך' },
    { value: 'amount', label: 'סכום' },
    { value: 'type', label: 'סוג' },
    { value: 'status', label: 'סטטוס' },
    { value: 'supplier', label: 'ספק' }
  ];

  displayRange = 'all';
  displayRangeOptions = [
    { value: 'all', label: 'מאז ומעולם' },
    { value: 'month', label: 'חודש אחרון' },
    { value: 'year', label: 'שנה אחרונה' }
  ];

  tableColumns = [
    { key: 'description', label: 'תיאור הוצאה' },
    { key: 'type', label: 'סוג הוצאה' },
    { key: 'amount', label: 'סכום' },
    { key: 'hebrewDate', label: 'תאריך עברי' },
    { key: 'gregorianDate', label: 'תאריך לועזי' },
    { key: 'supplier', label: 'ספק' },
    { key: 'status', label: 'סטטוס' },
    { key: 'receipt', label: 'קבלה' },
    { key: 'actions', label: 'פעולות', class: 'col-actions' }
  ];

  ngOnInit(): void {
    this.loadTabCounts();
    this.loadExpenses();
    this.loadStats();
  }

  private loadTabCounts(): void {
    // Make a single request - API returns counts for all statuses in response.counts
    this.expenseService.getAll({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        // API returns: { counts: { all: 13, pending: 11, paid: 2, totalRows: 2, totalPages: 2 } }
        const counts = response.counts || {};
        
        const allCount = counts['all'] || 0;
        const pendingCount = counts['pending'] || 0;
        const paidCount = counts['paid'] || 0;

        this.tabs.find(t => t.id === 'all')!.count = allCount;
        this.tabs.find(t => t.id === 'pending')!.count = pendingCount;
        this.tabs.find(t => t.id === 'paid')!.count = paidCount;
      },
      error: (error) => {
        console.error('Error loading tab counts:', error);
      }
    });
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.isLoading = true;

    const params: {
      status?: string;
      page?: number;
      limit?: number;
      date_from?: string;
      date_to?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Map tab to status filter
    if (this.activeTab === 'pending') {
      params.status = 'pending';
    } else if (this.activeTab === 'paid') {
      params.status = 'paid';
    }

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
      params.sort_order = 'desc';
    }

    this.expenseService.getAll(params).subscribe({
      next: (response) => {
        this.expenses = response.rows;
        this.totalExpenses = response.counts?.totalRows || response.rows.length;
        this.totalPages = response.counts?.totalPages || Math.ceil(this.totalExpenses / this.itemsPerPage);
        
        // Update tab count for current active tab
        const currentTab = this.tabs.find(t => t.id === this.activeTab);
        if (currentTab) {
          currentTab.count = this.totalExpenses;
        }
        
        // Use totalSum from API if available, otherwise calculate from rows
        if (response.totalSum && parseFloat(String(response.totalSum)) > 0) {
          this.totalSum = parseFloat(String(response.totalSum));
        } else {
          // Calculate total from visible rows as fallback
          this.totalSum = this.expenses.reduce((sum, expense) => {
            return sum + parseFloat(String(expense.amount || 0));
          }, 0);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.isLoading = false;
      }
    });
  }

  private getDateRange(range: string): { from?: string; to?: string } {
    const today = new Date();
    const to = today.toISOString().split('T')[0];

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
        return {};
    }
  }

  onDisplayRangeChange(): void {
    this.currentPage = 1;
    this.loadExpenses();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadExpenses();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadExpenses();
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

  getStatusLabel(status: ExpenseStatus | string): string {
    const labels: Record<string, string> = {
      'pending': 'לתשלום',
      'paid': 'שולם'
    };
    return labels[status] || status;
  }

  getStatusChipVariant(status: ExpenseStatus | string): ChipVariant {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'paid':
        return 'paid';
      default:
        return 'default';
    }
  }

  getExpenseTypeLabel(type?: string): string {
    if (!type) return '--';
    const labels: Record<string, string> = {
      'food': 'מזון',
      'maintenance': 'תחזוקת בית הכנסת',
      'equipment': 'ציוד וריהוט',
      'insurance': 'ביטוחים',
      'operations': 'תפעול פעילויות',
      'suppliers': 'ספקים ובעלי מקצוע',
      'management': 'הנהלה ושכר'
    };
    return labels[type] || type;
  }

  getHebrewDate(expense: Expense): string {
    return convertToHebrewDate(expense.date);
  }

  getHebrewDateTop(expense: Expense): string {
    const fullDate = this.getHebrewDate(expense);
    if (fullDate.includes('|')) {
      return fullDate.split('|')[0];
    }
    const parts = fullDate.split(' ');
    if (parts.length >= 2) {
      return parts.slice(0, -1).join(' ');
    }
    return fullDate;
  }

  getHebrewDateBottom(expense: Expense): string {
    const fullDate = this.getHebrewDate(expense);
    if (fullDate.includes('|')) {
      return fullDate.split('|')[1];
    }
    const parts = fullDate.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    return '';
  }

  formatGregorianDate(dateString: string): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }

  // Selection functionality
  toggleExpenseSelection(expenseId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedExpenses.add(expenseId);
    } else {
      this.selectedExpenses.delete(expenseId);
    }
  }

  isExpenseSelected(expenseId: string): boolean {
    return this.selectedExpenses.has(expenseId);
  }

  areAllSelected(): boolean {
    return this.expenses.length > 0 && this.expenses.every(e => this.selectedExpenses.has(e.id));
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.expenses.forEach(e => this.selectedExpenses.add(e.id));
    } else {
      this.expenses.forEach(e => this.selectedExpenses.delete(e.id));
    }
  }

  onBulkAction(action: string): void {
    if (this.selectedExpenses.size === 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'confirm-dialog-panel',
        backdropClass: 'confirm-dialog-backdrop',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
        data: {
          icon: 'triangle-warning',
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
    } else if (action === 'share') {
      this.bulkShare();
    } else {
      console.log(`Bulk action: ${action}`, Array.from(this.selectedExpenses));
    }
  }

  private bulkDelete(): void {
    const selectedIds = Array.from(this.selectedExpenses);
    const selectedExpenseNames = this.expenses
      .filter(e => selectedIds.includes(e.id))
      .map(e => `${e.description || 'ללא תיאור'} - ${e.amount} ₪`);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'מחיקת הוצאות',
        message: `האם אתה בטוח שברצונך למחוק ${selectedExpenseNames.length} הוצאות?`,
        confirmText: 'מחק',
        cancelText: 'ביטול',
        items: selectedExpenseNames.slice(0, 10)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const ids = Array.from(this.selectedExpenses);
        const deletedNames = [...selectedExpenseNames];

        const deletePromises = ids.map(id =>
          this.expenseService.delete(id).toPromise()
        );

        Promise.all(deletePromises).then(() => {
          this.selectedExpenses.clear();
          this.loadExpenses();
          this.loadTabCounts();
          this.loadStats();
          this.dialog.open(ConfirmDialogComponent, {
            width: '500px',
            panelClass: 'confirm-dialog-panel',
            backdropClass: 'confirm-dialog-backdrop',
            enterAnimationDuration: '0ms',
            exitAnimationDuration: '0ms',
            data: {
              title: 'המחיקה בוצעה בהצלחה',
              message: `${deletedNames.length} הוצאות נמחקו:`,
              confirmText: 'סגור',
              items: deletedNames.slice(0, 10)
            }
          });
        }).catch(error => {
          console.error('Error deleting expenses:', error);
        });
      }
    });
  }

  private bulkPrint(): void {
    const selectedIds = Array.from(this.selectedExpenses);
    const selectedExpenses = this.expenses.filter(e => selectedIds.includes(e.id));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = selectedExpenses.map(e => `
      <tr>
        <td>${e.description || 'ללא תיאור'}</td>
        <td>${this.getExpenseTypeLabel(e.type)}</td>
        <td>${e.amount} ₪</td>
        <td>${this.formatGregorianDate(e.date)}</td>
        <td>${this.getStatusLabel(e.status)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>הוצאות - הדפסה</title>
          <style>
            body { font-family: 'Assistant', sans-serif; padding: 20px; direction: rtl; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>הוצאות - הדפסה</h1>
          <p>מספר רשומות: ${selectedExpenses.length}</p>
          <table>
            <thead>
              <tr>
                <th>תיאור</th>
                <th>סוג</th>
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

  private bulkShare(): void {
    const selectedIds = Array.from(this.selectedExpenses);
    
    if (selectedIds.length === 0) {
      // No expenses selected, show message
      this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        panelClass: 'confirm-dialog-panel',
        backdropClass: 'confirm-dialog-backdrop',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
        data: {
          title: 'אין הוצאות נבחרות',
          message: 'נא לבחור הוצאות לשיתוף',
          confirmText: 'סגור'
        }
      });
      return;
    }

    this.openShareDialog(selectedIds);
  }

  shareExpense(expense: Expense): void {
    this.openShareDialog([expense.id]);
  }

  private openShareDialog(expenseIds: string[]): void {
    const dialogRef = this.dialog.open(ShareDialogComponent, {
      width: '600px',
      panelClass: 'share-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        entityType: 'expenses',
        selectedIds: expenseIds,
        title: expenseIds.length === 1 ? 'שתף הוצאה' : 'שתף הוצאות'
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ExpenseFormComponent, {
      width: '900px',
      panelClass: 'expense-form-dialog',
      disableClose: false,
      hasBackdrop: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses();
        this.loadTabCounts();
        this.loadStats();
      }
    });
  }

  openEditDialog(expense: Expense): void {
    const dialogRef = this.dialog.open(ExpenseFormComponent, {
      width: '900px',
      panelClass: 'expense-form-dialog',
      disableClose: false,
      hasBackdrop: true,
      data: { expense }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExpenses();
        this.loadTabCounts();
        this.loadStats();
      }
    });
  }

  openDeleteDialog(expense: Expense): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'האם אתה בטוח שאתה רוצה למחוק את הרשומה?',
        description: `הרשומה למחיקה: ${expense.description || 'ללא תיאור'}`,
        buttons: [
          {
            text: 'בטל',
            icon: 'close-icon',
            type: 'cancel',
            action: 'cancel'
          },
          {
            text: 'כן, מחק',
            icon: 'trash-white-icon',
            type: 'primary',
            action: 'confirm'
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.delete(expense.id).subscribe({
          next: () => {
            this.loadExpenses();
            this.loadTabCounts();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting expense:', error);
          }
        });
      }
    });
  }

  onDownloadReceipt(expense: Expense): void {
    if (!expense.receipt) return;

    this.expenseService.downloadReceipt(expense.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = expense.receipt || 'receipt.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading receipt:', error);
      }
    });
  }

  onGenerateReport(): void {
    // Open export dialog for report generation
    this.openExportDialog();
  }

  openExportDialog(): void {
    const currentTab = this.tabs.find(t => t.id === this.activeTab);
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '600px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'ייצוא הנתונים לקובץ',
        subtitle: 'להורדה - לחץ על סוג הקובץ המבוקש',
        selectedCount: this.selectedExpenses.size,
        tabName: currentTab?.label
      }
    });

    dialogRef.afterClosed().subscribe((result: ExportDialogResult | undefined) => {
      if (!result || !result.fileType) return;

      if (result.exportScope === 'selected' && this.selectedExpenses.size > 0) {
        this.exportExpenses(undefined, Array.from(this.selectedExpenses), result.fileType);
      } else {
        const status = this.activeTab === 'all' ? undefined : (this.activeTab === 'pending' ? 'pending' : 'paid');
        this.exportExpenses(status, undefined, result.fileType);
      }
    });
  }

  private exportExpenses(status?: string, ids?: string[], fileType?: string): void {
    this.expenseService.export(status, ids, fileType).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let extension = fileType || 'xlsx';
        if (extension === 'xls') {
          extension = 'xlsx';
        } else if (extension === 'csv') {
          extension = 'csv';
        } else if (extension === 'pdf') {
          extension = 'pdf';
        }

        a.download = `expenses.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting expenses:', error);
      }
    });
  }

  loadStats(): void {
    this.isLoadingStats = true;
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    this.expenseService.getStats(currentMonth, 3).subscribe({
      next: (response) => {
        this.stats = response;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoadingStats = false;
      }
    });
  }

}
