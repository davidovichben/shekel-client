import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MemberService } from '../../core/services/network/member.service';
import { Member } from '../../core/entities/member.entity';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
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
      width: '900px',
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
    this.router.navigate(['/community/edit', member.id]);
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
  activeTab = 'all';
  members: Member[] = [];
  totalMembers = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  selectedMembers: Set<string> = new Set();

  sortBy = 'fullName';
  sortOptions = [
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
    { id: 'all', label: 'כל חברי הקהילה', count: 0 },
    { id: 'permanent', label: 'חברים קבועים', count: 0 },
    { id: 'guest', label: 'אורחים', count: 0 },
    { id: 'familyMember', label: 'בני משפחה', count: 0 },
    { id: 'supplier', label: 'ספקים', count: 0 },
    { id: 'primaryAdmin', label: 'מנהלים', count: 0 },
    { id: 'other', label: 'אחרים', count: 0 }
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
    this.sortBy = value;
    this.currentPage = 1;
    this.loadMembers();
  }

  loadMembers(): void {
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy
    };

    if (this.activeTab !== 'all') {
      params.type = this.activeTab;
    }

    this.isLoading = true;
    this.memberService.getAll(params).subscribe({
      next: (response) => {
        this.members = response.rows;
        this.totalMembers = response.counts.totalRows;
        this.totalPages = response.counts.totalPages;
        this.updateTabCounts(response.counts);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMembers();
  }

  private updateTabCounts(counts: any): void {
    const types = counts.types || {};
    this.tabs.forEach(tab => {
      if (tab.id === 'all') {
        tab.count = counts.totalRows || 0;
      } else {
        tab.count = types[tab.id] || 0;
      }
    });
  }

  getMemberTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      'permanent': 'קבוע',
      'familyMember': 'בן משפחה',
      'guest': 'אורח',
      'supplier': 'ספק',
      'other': 'אחר',
      'primaryAdmin': 'מנהל'
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

  toggleAllSelection(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.members.forEach(m => this.selectedMembers.add(m.id));
    } else {
      this.selectedMembers.clear();
    }
  }

  isMemberSelected(memberId: string): boolean {
    return this.selectedMembers.has(memberId);
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
    } else {
      console.log(`Bulk action: ${action}`, Array.from(this.selectedMembers));
    }
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
        this.memberService.deleteMany(ids).subscribe({
          next: () => {
            this.selectedMembers.clear();
            this.loadMembers();
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'ייצוא לקובץ',
        message: 'בחר את סוג הייצוא:',
        confirmText: 'ייצא את כל החברים',
        cancelText: 'ייצא את החברים המוצגים'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Export all members
        this.exportMembers();
      } else if (result === false) {
        // Export shown members
        this.exportMembers(this.members.map(m => m.id));
      }
    });
  }

  private exportMembers(ids?: string[]): void {
    this.memberService.export(ids).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting members:', error);
      }
    });
  }
}
