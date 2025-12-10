import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MemberService } from '../../core/services/network/member.service';
import { Member } from '../../core/entities/member.entity';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../../shared/components/export-dialog/export-dialog';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { MemberViewComponent } from './member-view/member-view';
import { MemberFormComponent } from './member-form/member-form';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DataTableComponent],
  templateUrl: './community.html',
  styleUrl: './community.sass'
})
export class CommunityComponent implements OnInit {
  private memberService = inject(MemberService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  openCreateMemberDialog(): void {
    const dialogRef = this.dialog.open(MemberFormComponent, {
      width: '70%',
      panelClass: 'member-form-dialog-panel',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  navigateToEdit(member: Member): void {
    const dialogRef = this.dialog.open(MemberFormComponent, {
      width: '70%',
      panelClass: 'member-form-dialog-panel',
      autoFocus: false,
      data: { member }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  navigateToMember(member: Member): void {
    // Pre-fetch member data before opening dialog
    this.memberService.getOne(member.id).subscribe({
      next: (fullMember: Member) => {
        const dialogRef = this.dialog.open(MemberViewComponent, {
          width: '95vw',
          maxWidth: '1400px',
          height: '720px',
          panelClass: 'member-view-dialog',
          autoFocus: false,
          data: { memberId: member.id, member: fullMember }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadMembers();
          }
        });
      },
      error: (error) => {
        console.error('Error loading member:', error);
      }
    });
  }

  searchText = '';
  activeSearchText = '';
  activeTab = 'all';
  members: Member[] = [];
  totalMembers = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  selectedMembers: Set<string> = new Set();

  sortBy = 'fullName';
  sortOrder: 'asc' | 'desc' = 'desc';
  sortOptions = [
    { value: 'id', label: '#' },
    { value: 'fullName', label: 'שם מלא' },
    { value: 'type', label: 'סוג חבר' },
    { value: 'balance', label: 'יתרת חשבון' },
    { value: 'mobile', label: 'סלולר' },
    { value: 'lastMessageDate', label: 'תאריך הודעה אחרונה' },
    { value: 'groups', label: 'קבוצות' }
  ];

  tableColumns = [
    { key: 'fullName', label: 'שם מלא' },
    { key: 'type', label: 'סוג חבר' },
    { key: 'balance', label: 'יתרת חשבון' },
    { key: 'mobile', label: 'סלולר' },
    { key: 'lastMessageDate', label: 'תאריך הודעה אחרונה' },
    { key: 'groups', label: 'קבוצות' },
    { key: 'actions', label: 'פעולות', class: 'col-actions' }
  ];

  tabs = [
    { id: 'all', label: 'כל חברי הקהילה', count: null as number | null },
    { id: 'permanent', label: 'חברים קבועים', count: null as number | null },
    { id: 'guest', label: 'אורחים', count: null as number | null },
    { id: 'family_member', label: 'בני משפחה', count: null as number | null },
    { id: 'supplier', label: 'ספקים', count: null as number | null },
    { id: 'primary_admin', label: 'מנהלים', count: null as number | null },
    { id: 'other', label: 'אחרים', count: null as number | null }
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.currentPage = 1;
    this.loadMembers();
  }

  onSortChange(value: string): void {
    if (this.sortBy === value) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = value;
      this.sortOrder = 'desc';
    }
    this.currentPage = 1;
    this.loadMembers();
  }

  onSearch(): void {
    this.activeSearchText = this.searchText.trim();
    this.currentPage = 1;
    this.loadMembers();
  }

  onResetSearch(): void {
    const wasSearchActive = this.activeSearchText !== '';
    this.searchText = '';
    this.activeSearchText = '';
    if (wasSearchActive) {
      this.currentPage = 1;
      this.loadMembers();
    }
  }

  loadMembers(): void {
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    if (this.activeSearchText) {
      params.search = this.activeSearchText;
    }

    if (this.activeTab !== 'all') {
      params.type = this.activeTab;
    }

    this.isLoading = true;
    this.memberService.getAll(params).subscribe({
      next: (response) => {
        this.members = response.rows || [];
        this.totalMembers = response.counts?.['total_rows'] || this.members.length;
        this.totalPages = response.counts?.['total_pages'] || Math.ceil(this.totalMembers / this.itemsPerPage) || 1;
        this.updateTabCounts(response.counts || {});
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadMembers();
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

  private updateTabCounts(counts: any): void {
    const types = counts.types || {};
    // Sum all type counts for total members
    const totalMembers = Object.values(types).reduce((sum: number, count) => sum + (count as number), 0);
    this.tabs.forEach(tab => {
      if (tab.id === 'all') {
        tab.count = totalMembers || counts.totalRows || 0;
      } else {
        tab.count = types[tab.id] || 0;
      }
    });
  }

  getMemberTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      'permanent': 'קבוע',
      'familyMember': 'בן משפחה',
      'family_member': 'בן משפחה',
      'guest': 'אורח',
      'supplier': 'ספק',
      'other': 'אחר',
      'primaryAdmin': 'מנהל ראשי',
      'primary_admin': 'מנהל ראשי',
      'secondaryAdmin': 'מנהל משני',
      'secondary_admin': 'מנהל משני'
    };
    return typeNames[type] || type;
  }

  getTotalBalance(): number {
    return this.members.reduce((sum, m) => sum + parseFloat(m.balance), 0);
  }

  // Selection functionality
  toggleMemberSelection(memberId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedMembers.add(memberId);
    } else {
      this.selectedMembers.delete(memberId);
    }
  }

  isMemberSelected(memberId: string): boolean {
    return this.selectedMembers.has(memberId);
  }

  areAllSelected(): boolean {
    return this.members.length > 0 && this.members.every(m => this.selectedMembers.has(m.id));
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.members.forEach(m => this.selectedMembers.add(m.id));
    } else {
      this.members.forEach(m => this.selectedMembers.delete(m.id));
    }
  }

  // Bulk actions
  onBulkAction(action: string): void {
    if (this.selectedMembers.size === 0) {
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
    } else {
      console.log(`Bulk action: ${action}`, Array.from(this.selectedMembers));
    }
  }

  private bulkPrint(): void {
    const selectedIds = Array.from(this.selectedMembers);
    const selectedMembers = this.members.filter(m => selectedIds.includes(m.id));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = selectedMembers.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>${m.fullName}</td>
        <td>${this.getMemberTypeName(m.type)}</td>
        <td>₪${m.balance}</td>
        <td style="direction: ltr; text-align: left;">${m.mobile || ''}</td>
        <td>${m.lastMessageDate || '--'}</td>
        <td>${m.groups && m.groups.length > 0 ? m.groups.join(', ') : 'לא משויך לקבוצות'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>הדפסת חברים</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
          th { background: #f5f5f5; }
          h1 { font-size: 18px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>רשימת חברים נבחרים (${selectedMembers.length})</h1>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>שם מלא</th>
              <th>סוג חבר</th>
              <th>יתרת חשבון</th>
              <th>סלולר</th>
              <th>תאריך הודעה אחרונה</th>
              <th>קבוצות</th>
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

  private bulkDelete(): void {
    const selectedIds = Array.from(this.selectedMembers);
    const selectedMemberNames = this.members
      .filter(m => selectedIds.includes(m.id))
      .map(m => m.fullName);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'מחיקת חברים',
        message: `האם אתה בטוח שברצונך למחוק ${selectedMemberNames.length} חברים?`,
        confirmText: 'מחק',
        cancelText: 'ביטול',
        items: selectedMemberNames
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const ids = Array.from(this.selectedMembers);
        const deletedNames = [...selectedMemberNames];
        this.memberService.deleteMany(ids).subscribe({
          next: () => {
            this.selectedMembers.clear();
            this.loadMembers();
            this.dialog.open(ConfirmDialogComponent, {
              width: '400px',
              panelClass: 'confirm-dialog-panel',
              backdropClass: 'confirm-dialog-backdrop',
              enterAnimationDuration: '0ms',
              exitAnimationDuration: '0ms',
              data: {
                title: 'המחיקה בוצעה בהצלחה',
                message: `${deletedNames.length} חברים נמחקו:`,
                confirmText: 'סגור',
                items: deletedNames
              }
            });
          },
          error: (error) => {
            console.error('Error deleting members:', error);
          }
        });
      }
    });
  }

  // Delete functionality
  openDeleteDialog(member: Member): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'האם אתה בטוח שאתה רוצה למחוק את הרשומה?',
        description: `הרשומה למחיקה: ${member.fullName}`,
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
        this.memberService.delete(member.id).subscribe({
          next: () => {
            this.loadMembers();
          },
          error: (error) => {
            console.error('Error deleting member:', error);
          }
        });
      }
    });
  }

  copyToClipboard(member: Member): void {
    const text = `${member.fullName} - ${member.mobile || ''} - ${member.email || ''}`;
    navigator.clipboard.writeText(text);
  }

  sendMessage(member: Member): void {
    console.log('Send message to:', member.id);
  }

  openExportDialog(): void {
    const tabLabel = this.tabs.find(t => t.id === this.activeTab)?.label || 'כל החברים';
    const selectionCount = this.selectedMembers.size;

    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '600px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'ייצוא לקובץ',
        message: 'בחר את סוג הייצוא:',
        confirmText: `ייצא את כל הרשומות (${tabLabel})`,
        cancelText: `ייצא ${selectionCount} פריטים שנבחרו`,
        cancelDisabled: selectionCount === 0
      }
    });

    dialogRef.afterClosed().subscribe((result: ExportDialogResult | undefined) => {
      if (!result) return;

      if (result.exportAll) {
        // Export all rows in current tab context
        this.exportMembers(this.activeTab !== 'all' ? this.activeTab : undefined, undefined, result.fileType);
      } else if (selectionCount > 0) {
        // Export selected rows
        this.exportMembers(undefined, Array.from(this.selectedMembers), result.fileType);
      }
    });
  }

  private exportMembers(type?: string, ids?: string[], fileType?: string): void {
    this.memberService.export(type, ids, fileType).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let extension = fileType || 'xlsx';
        if (extension === 'xls') extension = 'xlsx';
        a.download = `members.${extension}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting members:', error);
      }
    });
  }
}
