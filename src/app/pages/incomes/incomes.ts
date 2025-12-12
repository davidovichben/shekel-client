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
import { IncomeService } from '../../core/services/network/income.service';
import { Income, IncomeStatus, IncomeCategory, PaymentType } from '../../core/entities/income.entity';
import { ChipComponent, ChipVariant } from '../../shared/components/chip/chip';
import { convertToHebrewDate } from '../../core/utils/hebrew-date.util';
import { StatsPanelComponent, StatsData } from '../../shared/components/stats-panel/stats-panel';

@Component({
  selector: 'app-incomes',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DataTableComponent, AdditionalFiltersComponent, ChipComponent, StatsPanelComponent],
  templateUrl: './incomes.html',
  styleUrl: './incomes.sass'
})
export class IncomesComponent implements OnInit {
  private dialog = inject(MatDialog);
  private incomeService = inject(IncomeService);

  incomes: Income[] = [];
  totalIncomes = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalSum = 0;
  isLoading = false;
  selectedIncomes: Set<string> = new Set();
  stats: StatsData | null = null;
  isLoadingStats = false;

  activeTab = 'all';
  tabs = [
    { id: 'all', label: 'כל ההכנסות', count: 0 },
    { id: 'collected', label: 'הכנסות שנגבו', count: 0 },
    { id: 'pending', label: 'הכנסות עתידיות', count: 0 }
  ];

  sortBy = 'receipt_date';
  sortOptions = [
    { value: 'receipt_date', label: 'תאריך' },
    { value: 'amount', label: 'סכום' },
    { value: 'type', label: 'קטגוריה' },
    { value: 'status', label: 'סטטוס' },
    { value: 'payment_method', label: 'סוג תשלום' },
    { value: 'user', label: 'משלם' }
  ];

  displayRange = 'all';
  displayRangeOptions = [
    { value: 'all', label: 'מאז ומעולם' },
    { value: 'month', label: 'חודש אחרון' },
    { value: 'year', label: 'שנה אחרונה' }
  ];

  tableColumns = [
    { key: 'description', label: 'תיאור הכנסה' },
    { key: 'paymentType', label: 'סוג תשלום' },
    { key: 'category', label: 'קטגוריה' },
    { key: 'amount', label: 'סכום' },
    { key: 'hebrewDate', label: 'תאריך עברי' },
    { key: 'gregorianDate', label: 'תאריך לועזי' },
    { key: 'payerName', label: 'שם משלם' },
    { key: 'number', label: 'מספר' },
    { key: 'status', label: 'סטטוס' },
    { key: 'receipt', label: 'קבלה' },
    { key: 'actions', label: 'פעולות', class: 'col-actions' }
  ];

  ngOnInit(): void {
    this.loadTabCounts();
    this.loadIncomes();
    this.loadStats();
  }

  private loadTabCounts(): void {
    // Make a single request - API returns counts for all statuses in response.counts
    this.incomeService.getAll({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        // API returns: { counts: { all: X, pending: Y, paid: Z, totalRows: N, totalPages: M } }
        const counts = response.counts || {};
        
        const allCount = counts['all'] || 0;
        const pendingCount = counts['pending'] || 0;
        const paidCount = counts['paid'] || 0;

        this.tabs.find(t => t.id === 'all')!.count = allCount;
        this.tabs.find(t => t.id === 'collected')!.count = paidCount;
        this.tabs.find(t => t.id === 'pending')!.count = pendingCount;
      },
      error: (error) => {
        console.error('Error loading tab counts:', error);
      }
    });
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadIncomes();
  }

  loadIncomes(): void {
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
    if (this.activeTab === 'collected') {
      params.status = 'paid';
    } else if (this.activeTab === 'pending') {
      params.status = 'pending';
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

    // Add sorting - map frontend sort values to API sort fields
    if (this.sortBy) {
      // Map frontend sort options to API sort fields
      const sortFieldMap: Record<string, string> = {
        'receipt_date': 'receipt_date',
        'date': 'receipt_date',
        'amount': 'amount',
        'type': 'type',
        'category': 'type',
        'status': 'status',
        'user': 'user',
        'payer': 'user',
        'payment_method': 'payment_method',
        'paymentType': 'payment_method'
      };
      params.sort_by = sortFieldMap[this.sortBy] || this.sortBy;
      params.sort_order = 'desc';
    }

    this.incomeService.getAll(params).subscribe({
      next: (response) => {
        this.incomes = response.rows;
        this.totalIncomes = response.counts?.totalRows || response.rows.length;
        this.totalPages = response.counts?.totalPages || Math.ceil(this.totalIncomes / this.itemsPerPage);

        // Calculate total from rows - API returns "total" field in each row
        this.totalSum = this.incomes.reduce((sum, income) => {
          const amount = parseFloat(String(income.amount || 0));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading incomes:', error);
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.isLoadingStats = true;
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    this.incomeService.getStats(currentMonth, 3).subscribe({
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
    this.loadIncomes();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadIncomes();
  }

  formatGregorianDate(dateString: string): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getCategoryLabel(category: IncomeCategory | string): string {
    const labels: Record<IncomeCategory, string> = {
      [IncomeCategory.Vows]: 'נדרים',
      [IncomeCategory.CommunityDonations]: 'תרומות מהקהילה',
      [IncomeCategory.ExternalDonations]: 'תרומות חיצוניות',
      [IncomeCategory.Ascensions]: 'עליות',
      [IncomeCategory.OnlineDonations]: 'תרומות אונליין',
      [IncomeCategory.MembershipFees]: 'דמי חברים',
      [IncomeCategory.Other]: 'אחר'
    };
    return labels[category as IncomeCategory] || (category as string);
  }

  getPaymentTypeLabel(paymentType: PaymentType | string): string {
    // Normalize the payment type value to handle API variations
    const normalizedType = String(paymentType).toLowerCase();
    
    // Map all possible payment type values to Hebrew labels
    const labels: Record<string, string> = {
      'credit': 'אשראי',
      'credit_card': 'אשראי',
      'creditcard': 'אשראי',
      'standing_order': 'ה. קבע',
      'standingorder': 'ה. קבע',
      'masav': 'ה. קבע'
    };
    
    return labels[normalizedType] || labels[paymentType as PaymentType] || (paymentType as string);
  }

  getStatusLabel(status: IncomeStatus | string): string {
    const labels: Record<string, string> = {
      [IncomeStatus.Pending]: 'ממתין',
      [IncomeStatus.Paid]: 'שולם',
      [IncomeStatus.Cancelled]: 'בוטל',
      [IncomeStatus.Refunded]: 'הוחזר'
    };
    return labels[status] || status;
  }

  getStatusChipVariant(status: IncomeStatus | string): ChipVariant {
    switch (status) {
      case IncomeStatus.Paid:
        return 'paid';
      case IncomeStatus.Pending:
        return 'pending';
      case IncomeStatus.Cancelled:
      case IncomeStatus.Refunded:
        return 'default';
      default:
        return 'default';
    }
  }

  getHebrewDate(income: Income): string {
    if (income.hebrewDate) {
      return income.hebrewDate;
    }
    return convertToHebrewDate(income.date);
  }

  getHebrewDateTop(income: Income): string {
    const fullDate = this.getHebrewDate(income);
    if (fullDate.includes('|')) {
      return fullDate.split('|')[0];
    }
    const parts = fullDate.split(' ');
    if (parts.length >= 2) {
      return parts.slice(0, -1).join(' ');
    }
    return fullDate;
  }

  getHebrewDateBottom(income: Income): string {
    const fullDate = this.getHebrewDate(income);
    if (fullDate.includes('|')) {
      return fullDate.split('|')[1];
    }
    const parts = fullDate.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    return '';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadIncomes();
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

  toggleIncomeSelection(incomeId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIncomes.add(incomeId);
    } else {
      this.selectedIncomes.delete(incomeId);
    }
  }

  isIncomeSelected(incomeId: string): boolean {
    return this.selectedIncomes.has(incomeId);
  }

  areAllSelected(): boolean {
    return this.incomes.length > 0 && this.incomes.every(i => this.selectedIncomes.has(i.id));
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.incomes.forEach(i => this.selectedIncomes.add(i.id));
    } else {
      this.incomes.forEach(i => this.selectedIncomes.delete(i.id));
    }
  }

  onBulkAction(action: string): void {
    if (this.selectedIncomes.size === 0) {
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

    const selectedIds = Array.from(this.selectedIncomes);

    if (action === 'delete') {
      this.bulkDelete(selectedIds);
    } else if (action === 'print') {
      this.bulkPrint(selectedIds);
    } else if (action === 'share') {
      this.bulkShare(selectedIds);
    } else if (action === 'copy') {
      this.bulkCopy(selectedIds);
    }
  }

  private bulkDelete(ids: string[]): void {
    const selectedIncomeDescriptions = this.incomes
      .filter(i => ids.includes(i.id))
      .map(i => i.description || 'ללא תיאור');

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'מחיקת הכנסות',
        message: `האם אתה בטוח שברצונך למחוק ${selectedIncomeDescriptions.length} הכנסות?`,
        confirmText: 'מחק',
        cancelText: 'ביטול',
        items: selectedIncomeDescriptions.slice(0, 10)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implement bulk delete API call
        this.selectedIncomes.clear();
        this.loadIncomes();
        this.loadTabCounts();
        this.loadStats();
      }
    });
  }

  private bulkPrint(ids: string[]): void {
    const selectedIncomes = this.incomes.filter(i => ids.includes(i.id));
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = selectedIncomes.map(i => `
      <tr>
        <td>${i.description || 'ללא תיאור'}</td>
        <td>${this.getCategoryLabel(i.category)}</td>
        <td>${i.amount} ₪</td>
        <td>${this.formatGregorianDate(i.date)}</td>
        <td>${this.getStatusLabel(i.status)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>הכנסות - הדפסה</title>
          <style>
            body { font-family: 'Heebo', sans-serif; padding: 20px; direction: rtl; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>הכנסות - הדפסה</h1>
          <p>מספר רשומות: ${selectedIncomes.length}</p>
          <table>
            <thead>
              <tr>
                <th>תיאור הכנסה</th>
                <th>קטגוריה</th>
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

  private bulkShare(ids: string[]): void {
    if (ids.length === 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        panelClass: 'confirm-dialog-panel',
        backdropClass: 'confirm-dialog-backdrop',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
        data: {
          title: 'אין הכנסות נבחרות',
          message: 'נא לבחור הכנסות לשיתוף',
          confirmText: 'סגור'
        }
      });
      return;
    }

    this.openShareDialog(ids);
  }

  shareIncome(income: Income): void {
    this.openShareDialog([income.id]);
  }

  private openShareDialog(incomeIds: string[]): void {
    this.dialog.open(ShareDialogComponent, {
      width: '600px',
      panelClass: 'share-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        entityType: 'incomes',
        selectedIds: incomeIds,
        title: incomeIds.length === 1 ? 'שתף הכנסה' : 'שתף הכנסות'
      }
    });
  }

  private bulkCopy(ids: string[]): void {
    const selectedIncomes = this.incomes.filter(i => ids.includes(i.id));
    const text = selectedIncomes.map(i =>
      `${i.description || 'ללא תיאור'} - ${this.getCategoryLabel(i.category)} - ${i.amount} ₪ - ${this.formatGregorianDate(i.date)}`
    ).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      console.log('Incomes copied to clipboard');
      // TODO: Show success notification
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
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
        selectedCount: this.selectedIncomes.size,
        tabName: currentTab?.label
      }
    });

    dialogRef.afterClosed().subscribe((result: ExportDialogResult | undefined) => {
      if (!result || !result.fileType) return;

      if (result.exportScope === 'selected' && this.selectedIncomes.size > 0) {
        this.incomeService.export({
          file_type: result.fileType,
          ids: Array.from(this.selectedIncomes)
        }).subscribe({
          next: (blob) => this.downloadFile(blob, result.fileType),
          error: (error) => console.error('Error exporting selected incomes:', error)
        });
      } else {
        const exportParams: any = {
          file_type: result.fileType
        };

        if (this.activeTab === 'collected') {
          exportParams.status = 'paid';
        } else if (this.activeTab === 'pending') {
          exportParams.status = 'pending';
        }

        // Add date range if applicable
        if (this.displayRange !== 'all') {
          const dateRange = this.getDateRange(this.displayRange);
          if (dateRange.from) exportParams.date_from = dateRange.from;
          if (dateRange.to) exportParams.date_to = dateRange.to;
        }

        this.incomeService.export(exportParams).subscribe({
          next: (blob) => this.downloadFile(blob, result.fileType),
          error: (error) => console.error('Error exporting all incomes:', error)
        });
      }
    });
  }

  private downloadFile(blob: Blob, fileType: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let extension = fileType === 'xls' ? 'xlsx' : fileType;
    a.download = `incomes.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  onDownloadReceipt(income: Income): void {
    if (!income.number) return;

    this.incomeService.downloadReceipt(income.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = income.receipt?.split('/').pop() || `receipt_${income.id}.pdf`;
        a.download = filename;
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
}

