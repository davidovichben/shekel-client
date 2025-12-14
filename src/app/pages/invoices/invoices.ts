import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../../shared/components/export-dialog/export-dialog';
import { ShareDialogComponent } from '../../shared/components/share-dialog/share-dialog';
import { InvoiceFormComponent } from './invoice-form/invoice-form';
import { MemberViewComponent } from '../community/member-view/member-view';
import { MemberService } from '../../core/services/network/member.service';
import { Member } from '../../core/entities/member.entity';

interface Invoice {
  id: string;
  payerId: string;
  payerName: string;
  invoiceNumber: string;
  totalAmount: number;
  type: string;
  hebrewDate: string;
  gregorianDate: string;
  paymentMethod: string;
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
  private memberService = inject(MemberService);

  invoices: Invoice[] = [];
  totalInvoices = 0;
  isLoadingMember = false;
  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 1;
  isLoading = false;
  selectedInvoices: Set<string> = new Set();

  activeTab = 'all';
  tabs: { id: string; label: string; count: number | null }[] = [
    { id: 'all', label: 'כל החשבוניות', count: 64 },
    { id: 'auto', label: 'חשבוניות שנוצרו אוטומטית', count: 153 },
    { id: 'digital', label: 'חשבוניות דיגיטליות', count: 71 }
  ];

  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  sortOptions = [
    { value: 'id', label: '#' },
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
    { key: 'payerName', label: 'שם משלם' },
    { key: 'invoiceNumber', label: 'מספר' },
    { key: 'totalAmount', label: 'סכום כולל' },
    { key: 'type', label: 'סוג' },
    { key: 'hebrewDate', label: 'תאריך עברי' },
    { key: 'gregorianDate', label: 'תאריך לועזי' },
    { key: 'paymentMethod', label: 'אמצעי תשלום' },
    { key: 'actions', label: 'פעולות' }
  ];

  ngOnInit(): void {
    this.loadInvoices();
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadInvoices();
  }

  onSortChange(value: string): void {
    if (this.sortBy === value) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = value;
      this.sortOrder = 'desc';
    }
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;

    // Simulated data - replace with actual service call
    setTimeout(() => {
      this.invoices = [
        { id: '1', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '2', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '3', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '4', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית זיכוי', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '5', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '6', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית זיכוי', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '7', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '8', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '9', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '10', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '11', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '12', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '13', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '14', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
        { id: '15', payerId: '1', payerName: 'מיכאל כהן', invoiceNumber: '2654', totalAmount: 280, type: 'חשבונית', hebrewDate: "כ' שבט תשפ\"ז", gregorianDate: '18/06/2025', paymentMethod: 'אשראי' },
      ];
      this.totalInvoices = 234;
      this.totalPages = Math.ceil(this.totalInvoices / this.itemsPerPage);
      this.isLoading = false;
    }, 500);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadInvoices();
    }
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

  areAllSelected(): boolean {
    return this.invoices.length > 0 && this.invoices.every(i => this.selectedInvoices.has(i.id));
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.invoices.forEach(i => this.selectedInvoices.add(i.id));
    } else {
      this.invoices.forEach(i => this.selectedInvoices.delete(i.id));
    }
  }

  onBulkAction(action: string): void {
    if (this.selectedInvoices.size === 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: {
          icon: 'triangle-warning',
          title: 'שים לב',
          message: 'יש לבחור לפחות פריט אחד לפני ביצוע פעולה קולקטיבית',
          confirmText: 'הבנתי'
        }
      });
      return;
    }
    console.log(`Bulk action: ${action}`, Array.from(this.selectedInvoices));
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
        selectedCount: this.selectedInvoices.size,
        tabName: currentTab?.label
      }
    });

    dialogRef.afterClosed().subscribe((result: ExportDialogResult | undefined) => {
      if (!result || !result.fileType) return;

      if (result.exportScope === 'selected' && this.selectedInvoices.size > 0) {
        // Export only selected rows
        this.exportInvoices(undefined, Array.from(this.selectedInvoices), result.fileType);
      } else {
        // Export all rows in current tab context
        this.exportInvoices(this.activeTab !== 'all' ? this.activeTab : undefined, undefined, result.fileType);
      }
    });
  }

  private exportInvoices(type?: string, ids?: string[], fileType?: string): void {
    console.log('Exporting invoices:', { type, ids, fileType });
    // TODO: Implement actual export via service
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(InvoiceFormComponent, {
      width: '900px',
      maxWidth: '90vw',
      panelClass: 'invoice-form-dialog-panel',
      autoFocus: false,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInvoices();
      }
    });
  }

  openEditDialog(invoice: Invoice): void {
    const dialogRef = this.dialog.open(InvoiceFormComponent, {
      width: '900px',
      maxWidth: '90vw',
      panelClass: 'invoice-form-dialog-panel',
      autoFocus: false,
      disableClose: false,
      data: { invoice }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadInvoices();
      }
    });
  }

  openMemberView(invoice: Invoice): void {
    this.isLoadingMember = true;
    this.memberService.getOne(invoice.payerId).subscribe({
      next: (member: Member) => {
        this.isLoadingMember = false;
        const dialogRef = this.dialog.open(MemberViewComponent, {
          width: '95vw',
          maxWidth: '1400px',
          height: '720px',
          panelClass: 'member-view-dialog',
          autoFocus: false,
          disableClose: true,
          data: { memberId: invoice.payerId, member }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadInvoices();
          }
        });
      },
      error: (error) => {
        this.isLoadingMember = false;
        console.error('Error loading member:', error);
      }
    });
  }

  shareInvoice(invoice: Invoice): void {
    this.openShareDialog([invoice.id]);
  }

  private openShareDialog(invoiceIds: string[]): void {
    this.dialog.open(ShareDialogComponent, {
      width: '600px',
      panelClass: 'share-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        entityType: 'invoices',
        selectedIds: invoiceIds,
        title: invoiceIds.length === 1 ? 'שתף חשבונית' : 'שתף חשבוניות'
      }
    });
  }

  duplicateInvoice(invoice: Invoice): void {
    console.log('Duplicate invoice:', invoice.id);
  }
}
