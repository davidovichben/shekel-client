import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { InvoiceFormComponent } from './invoice-form/invoice-form';

interface Invoice {
  id: string;
  fullName: string;
  amount: number;
  hebrewDate: string;
  gregorianDate: string;
  description: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'cancelled';
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DataTableComponent],
  templateUrl: './invoices.html',
  styleUrl: './invoices.sass'
})
export class InvoicesComponent implements OnInit {
  private dialog = inject(MatDialog);

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(InvoiceFormComponent, {
      width: '500px',
      panelClass: 'invoice-form-dialog',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInvoices();
      }
    });
  }

  openEditDialog(invoice: Invoice): void {
    const dialogRef = this.dialog.open(InvoiceFormComponent, {
      width: '500px',
      panelClass: 'invoice-form-dialog',
      data: { invoice }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInvoices();
      }
    });
  }

  invoices: Invoice[] = [];
  totalInvoices = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  selectedInvoices: Set<string> = new Set();

  activeTab = 'all';
  tabs = [
    { id: 'all', label: 'כל החשבוניות', count: 64 },
    { id: 'pending', label: 'ממתינות לתשלום', count: 153 },
    { id: 'paid', label: 'שולמו', count: 71 }
  ];

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
    { key: 'invoiceNumber', label: 'מספר חשבונית' },
    { key: 'amount', label: 'סכום' },
    { key: 'hebrewDate', label: 'תאריך עברי' },
    { key: 'gregorianDate', label: 'תאריך לועזי' },
    { key: 'description', label: 'תיאור' },
    { key: 'status', label: 'סטטוס' },
    { key: 'actions', label: 'פעולות', class: 'col-actions' }
  ];

  ngOnInit(): void {
    this.loadInvoices();
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;

    // Simulated data - replace with actual service call
    setTimeout(() => {
      this.invoices = [
        { id: '1', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-001', status: 'pending' },
        { id: '2', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'תרומה', invoiceNumber: 'INV-002', status: 'paid' },
        { id: '3', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-003', status: 'pending' },
        { id: '4', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-004', status: 'paid' },
        { id: '5', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'קידוש', invoiceNumber: 'INV-005', status: 'pending' },
        { id: '6', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-006', status: 'pending' },
        { id: '7', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-007', status: 'pending' },
        { id: '8', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'תרומה', invoiceNumber: 'INV-008', status: 'paid' },
        { id: '9', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-009', status: 'pending' },
        { id: '10', fullName: 'מיכאל כהן', amount: 280, hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', description: 'דמי חבר', invoiceNumber: 'INV-010', status: 'pending' },
      ];
      this.totalInvoices = 234;
      this.totalPages = Math.ceil(this.totalInvoices / this.itemsPerPage);
      this.isLoading = false;
    }, 500);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInvoices();
  }

  getTotalAmount(): number {
    return 873;
  }

  // Selection functionality
  toggleInvoiceSelection(invoiceId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedInvoices.add(invoiceId);
    } else {
      this.selectedInvoices.delete(invoiceId);
    }
  }

  isInvoiceSelected(invoiceId: string): boolean {
    return this.selectedInvoices.has(invoiceId);
  }

  onBulkAction(action: string): void {
    if (this.selectedInvoices.size === 0) {
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
    console.log(`Bulk action: ${action}`, Array.from(this.selectedInvoices));
  }
}
