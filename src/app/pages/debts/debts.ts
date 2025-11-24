import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

interface Debt {
  id: string;
  fullName: string;
  autoPaymentApproved: boolean;
  amount: number;
  hebrewDate: string;
  gregorianDate: string;
  description: string;
  lastReminder: string | null;
  status: 'active' | 'paid';
}

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DataTableComponent],
  templateUrl: './debts.html',
  styleUrl: './debts.sass'
})
export class DebtsComponent implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);

  navigateToCreate(): void {
    this.router.navigate(['/debts/new']);
  }

  navigateToEdit(debt: Debt): void {
    this.router.navigate(['/debts/edit', debt.id]);
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

    // Simulated data - replace with actual service call
    setTimeout(() => {
      this.debts = [
        { id: '1', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שבת', lastReminder: '14/08/2025', status: 'active' },
        { id: '2', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', lastReminder: null, status: 'active' },
        { id: '3', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שבת', lastReminder: '14/08/2025', status: 'active' },
        { id: '4', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שבת', lastReminder: null, status: 'paid' },
        { id: '5', fullName: 'מיכאל כהן', autoPaymentApproved: false, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'מעודת הודיה', lastReminder: '14/08/2025', status: 'active' },
        { id: '6', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שבת', lastReminder: '14/08/2025', status: 'active' },
        { id: '7', fullName: 'מיכאל כהן', autoPaymentApproved: false, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שבת', lastReminder: '14/08/2025', status: 'active' },
        { id: '8', fullName: 'מיכאל כהן', autoPaymentApproved: false, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'קידוש שבת בבוקר', lastReminder: null, status: 'paid' },
        { id: '9', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שבת', lastReminder: '14/08/2025', status: 'active' },
        { id: '10', fullName: 'מיכאל כהן', autoPaymentApproved: true, amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'נדר שמחת תורה', lastReminder: '14/08/2025', status: 'active' },
      ];
      this.totalDebts = 234;
      this.totalPages = Math.ceil(this.totalDebts / this.itemsPerPage);
      this.isLoading = false;
    }, 500);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDebts();
  }

  getTotalAmount(): number {
    return 873; // From design
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
        width: '400px',
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
}
