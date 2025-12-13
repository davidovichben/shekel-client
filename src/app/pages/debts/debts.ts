import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { AdditionalFiltersComponent } from '../../shared/components/additional-filters/additional-filters';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../../shared/components/export-dialog/export-dialog';
import { ReminderDialogComponent, ReminderDialogResult } from '../../shared/components/reminder-dialog/reminder-dialog';
import { PaymentComponent } from '../payment/payment';
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
    // Make a single request - API returns counts for all statuses in response.counts
    this.debtService.getAll({ page: 1, limit: 1 }).subscribe({
      next: (response: any) => {
        // API returns: { counts: { all: X, pending: Y, paid: Z, totalRows: N, totalPages: M } }
        const counts = response.counts || {};

        const allCount = counts['all'] || 0;
        const pendingCount = counts['pending'] || 0;
        const paidCount = counts['paid'] || 0;

        this.tabs.find(t => t.id === 'all')!.count = allCount;
        this.tabs.find(t => t.id === 'active')!.count = pendingCount;
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

  formatGregorianDate(dateString: string | null | undefined): string {
    if (!dateString) return '--';

    // Handle ISO date format (e.g., "2026-01-01T00:00:00.000000Z")
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If not a valid date, check if it's already formatted
      if (dateString.includes('/')) {
        return dateString;
      }
      return dateString;
    }

    // Format as DD/MM/YYYY for display
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  areAllSelected(): boolean {
    return this.debts.length > 0 && this.debts.every(d => this.selectedDebts.has(d.id));
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.debts.forEach(d => this.selectedDebts.add(d.id));
    } else {
      this.debts.forEach(d => this.selectedDebts.delete(d.id));
    }
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

    if (action === 'print') {
      this.bulkPrint();
    } else if (action === 'message') {
      this.bulkSendMessage();
    } else if (action === 'document') {
      this.bulkGenerateDocument();
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
          firstValueFrom(this.debtService.delete(id))
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
        <td>${d.amount} ₪</td>
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
    const selectedDebts = this.debts.filter(d => selectedIds.includes(d.id));

    // Get unique member IDs from selected debts
    const memberIds = [...new Set(selectedDebts.map(d => d.memberId).filter(id => id))];

    const dialogRef = this.dialog.open(ReminderDialogComponent, {
      width: '750px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        memberIds: memberIds,
        memberCount: memberIds.length
      }
    });

    dialogRef.afterClosed().subscribe(async (result: ReminderDialogResult | undefined) => {
      if (result && result.message) {
        try {
          // Send reminder for each selected debt
          const reminderPromises = selectedIds.map(id =>
            firstValueFrom(this.debtService.sendReminder(id))
          );

          await Promise.all(reminderPromises);

          this.selectedDebts.clear();
          this.loadDebts();
          this.loadTabCounts();
          this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            panelClass: 'confirm-dialog-panel',
            backdropClass: 'confirm-dialog-backdrop',
            enterAnimationDuration: '0ms',
            exitAnimationDuration: '0ms',
            data: {
              title: 'ההודעות נשלחו בהצלחה',
              message: `הודעות תזכורת נשלחו ל-${selectedIds.length} חובות`,
              confirmText: 'סגור'
            }
          });
        } catch (error) {
          console.error('Error sending reminders:', error);
        }
      }
    });
  }

  private bulkGenerateDocument(): void {
    const selectedIds = Array.from(this.selectedDebts);
    const selectedDebts = this.debts.filter(d => selectedIds.includes(d.id));

    if (selectedDebts.length === 0) {
      return;
    }

    // Check if any selected debts are already paid
    const paidDebts = selectedDebts.filter(d => this.isStatusPaid(d.status));
    if (paidDebts.length > 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'confirm-dialog-panel',
        backdropClass: 'confirm-dialog-backdrop',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
        data: {
          title: 'שים לב',
          message: 'חלק מהחובות שבחרת כבר שולמו, הסר והמשך',
          confirmText: 'הבנתי'
        }
      });
      return;
    }

    // Check if all selected debts belong to the same member
    const memberIds = [...new Set(selectedDebts.map(d => d.memberId).filter(id => id))];

    if (memberIds.length > 1) {
      // Different members - show error
      this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'confirm-dialog-panel',
        backdropClass: 'confirm-dialog-backdrop',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
        data: {
          title: 'שים לב',
          message: 'לא ניתן לבצע תשלום אחד לחברים שונים',
          confirmText: 'הבנתי'
        }
      });
      return;
    }

    // All debts belong to the same member
    const commonMemberId = memberIds[0];
    const commonMemberName = selectedDebts[0].fullName;
    
    // Calculate amount based on single vs bulk payment
    // Single debt: amount = debt.amount (exact, no VAT)
    // Bulk debts: amount = sum(debt.amounts) × 1.17 (includes 17% VAT)
    let totalAmount: number;
    if (selectedDebts.length === 1) {
      totalAmount = selectedDebts[0].amount; // Exact amount for single debt
    } else {
      const subtotal = selectedDebts.reduce((sum, debt) => sum + debt.amount, 0);
      totalAmount = Math.round(subtotal * 1.17 * 100) / 100; // Add 17% VAT for bulk debts
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'בצע תשלום על החובות הנבחרים',
        message: 'בלחיצה על כפתור האישור התשלום ייגבה מכל הרשומות הנבחרות.',
        buttons: [
          {
            text: ' אישור וביצוע תשלום',
            type: 'primary',
            action: 'confirm'
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Open payment dialog with pre-filled data
        const paymentDialogRef = this.dialog.open(PaymentComponent, {
          width: '80%',
          panelClass: 'payment-dialog-panel',
          backdropClass: 'payment-dialog-backdrop',
          autoFocus: false,
          data: {
            memberId: commonMemberId,
            memberName: commonMemberName,
            amount: totalAmount,
            debtIds: selectedIds, // Pass all selected debt IDs
            isDebtPayment: true // Flag to indicate this is a debt payment
          }
        });

        // Reload debts after payment dialog closes (in case payment was successful)
        paymentDialogRef.afterClosed().subscribe(paymentResult => {
          if (paymentResult) {
            this.selectedDebts.clear(); // Clear selection after successful payment
            this.loadDebts();
            this.loadTabCounts();
          }
        });
      }
    });
  }

  sendReminder(debt: Debt): void {
    // Don't send reminder if debt is paid
    if (this.isStatusPaid(debt.status)) {
      return;
    }

    // Pre-fill message with debt type and amount
    const debtTypeLabel = this.getDebtTypeLabel(debt.debtType);
    const messageTemplate = `שלום,
זוהי הודעת תזכורת לתשלום חוב: ${debtTypeLabel} על סך ${debt.amount} ₪ מבית הכנסת "אהל יצחק", נבקשך להסדיר את התשלום בהקדם.
בתודה מראש
גבאי בית הכנסת - רבי שלמה.`;

    const dialogRef = this.dialog.open(ReminderDialogComponent, {
      width: '750px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        memberIds: debt.memberId ? [debt.memberId] : [],
        memberCount: 1,
        memberName: debt.fullName,
        initialMessage: messageTemplate,
        debtStatus: debt.status
      }
    });

    dialogRef.afterClosed().subscribe(async (result: ReminderDialogResult | undefined) => {
      if (result && result.message) {
        try {
          await firstValueFrom(this.debtService.sendReminder(debt.id));

          this.loadDebts();
          this.loadTabCounts();
          this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            panelClass: 'confirm-dialog-panel',
            backdropClass: 'confirm-dialog-backdrop',
            enterAnimationDuration: '0ms',
            exitAnimationDuration: '0ms',
            data: {
              title: 'ההודעה נשלחה בהצלחה',
              message: `הודעת תזכורת נשלחה ל-${debt.fullName}`,
              confirmText: 'סגור'
            }
          });
        } catch (error) {
          console.error('Error sending reminder:', error);
        }
      }
    });
  }

  openPaymentDialog(debt: Debt): void {
    // Don't open payment dialog if debt is paid
    if (this.isStatusPaid(debt.status)) {
      return;
    }

    const dialogRef = this.dialog.open(PaymentComponent, {
      width: '80%',
      panelClass: 'payment-dialog-panel',
      backdropClass: 'payment-dialog-backdrop',
      autoFocus: false,
      data: {
        memberId: debt.memberId,
        memberName: debt.fullName,
        amount: debt.amount, // Exact debt amount for single debt (no VAT)
        debtIds: [debt.id], // Pass single debt ID
        isDebtPayment: true // Flag to indicate this is a debt payment
      }
    });

    // Reload debts after payment dialog closes (in case payment was successful)
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDebts();
        this.loadTabCounts();
      }
    });
  }

  private bulkCopy(): void {
    const selectedIds = Array.from(this.selectedDebts);
    const selectedDebts = this.debts.filter(d => selectedIds.includes(d.id));

    // Format debts as text for clipboard
    const text = selectedDebts.map(d =>
      `${d.fullName} - ${d.description} - ${d.amount} ₪ - ${d.gregorianDate}`
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
            icon: 'trash-white-icon',
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
        selectedCount: this.selectedDebts.size,
        tabName: currentTab?.label
      }
    });

    dialogRef.afterClosed().subscribe((result: ExportDialogResult | undefined) => {
      if (!result || !result.fileType) return;

      if (result.exportScope === 'selected' && this.selectedDebts.size > 0) {
        // Export only selected rows
        this.exportDebts(undefined, Array.from(this.selectedDebts), result.fileType);
      } else {
        // Export all rows in current tab context
        // Map activeTab to status: 'all' -> undefined, 'active' -> 'pending', 'paid' -> 'paid'
        const status = this.activeTab === 'all' ? undefined : (this.activeTab === 'active' ? 'pending' : 'paid');
        this.exportDebts(status, undefined, result.fileType);
      }
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
