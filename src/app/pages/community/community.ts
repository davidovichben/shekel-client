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

  navigateToCreate(): void {
    this.router.navigate(['/community/new']);
  }

  navigateToEdit(member: Member): void {
    this.router.navigate(['/community/edit', member.id]);
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

  loadMembers(): void {
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
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

    // Handle bulk action based on type
    console.log(`Bulk action: ${action}`, Array.from(this.selectedMembers));
  }

  // Delete functionality
  openDeleteDialog(member: Member): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'מחיקת חבר',
        message: `האם אתה בטוח שברצונך למחוק את ${member.fullName}?`,
        confirmText: 'מחק',
        cancelText: 'ביטול'
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
}
