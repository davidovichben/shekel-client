import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MemberService } from '../../../core/services/network/member.service';
import { Member } from '../../../core/entities/member.entity';
import { MemberGeneralComponent } from './tabs/general/general';
import { MemberOpenDebtsComponent } from './tabs/open-debts/open-debts';
import { MemberPaymentArchiveComponent } from './tabs/payment-archive/payment-archive';
import { MemberBillingSettingsComponent } from './tabs/billing-settings/billing-settings';
import { MemberPaymentMethodsComponent } from './tabs/payment-methods/payment-methods';
import { MemberGroupsComponent } from './tabs/groups/groups';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

export interface MemberViewDialogData {
  memberId: string;
  member: Member;
}

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-member-view',
  standalone: true,
  imports: [
    CommonModule,
    MemberGeneralComponent,
    MemberOpenDebtsComponent,
    MemberPaymentArchiveComponent,
    MemberBillingSettingsComponent,
    MemberPaymentMethodsComponent,
    MemberGroupsComponent
  ],
  templateUrl: './member-view.html',
  styleUrl: './member-view.sass'
})
export class MemberViewComponent implements OnInit {
  private memberService = inject(MemberService);
  private dialogRef = inject(MatDialogRef<MemberViewComponent>);
  private dialog = inject(MatDialog);
  private data: MemberViewDialogData = inject(MAT_DIALOG_DATA);

  member: Member | null = null;
  memberId = '';

  tabs: Tab[] = [
    { id: 'general', label: 'כללי' },
    { id: 'open-debts', label: 'חובות פתוחים' },
    { id: 'payment-archive', label: 'ארכיון תשלומים' },
    { id: 'billing-settings', label: 'הגדרות חיוב' },
    { id: 'payment-methods', label: 'אמצעי תשלום' },
    { id: 'groups', label: 'קבוצות' }
  ];

  activeTab = 'general';

  ngOnInit(): void {
    this.memberId = this.data.memberId;
    this.member = this.data.member;
  }

  reloadMember(): void {
    this.memberService.getOne(this.memberId).subscribe({
      next: (member: Member) => {
        this.member = member;
      },
      error: (error: Error) => {
        console.error('Error loading member:', error);
      }
    });
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  setActiveTab(tab: Tab): void {
    this.activeTab = tab.id;
  }

  onCloseClick(): void {
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'סגירת כרטיס חבר',
        message: 'האם אתה בטוח שברצונך לסגור את כרטיס החבר?',
        confirmText: 'סגור',
        cancelText: 'ביטול'
      }
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close();
      }
    });
  }

  getMemberTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'permanent': 'חבר קהילה',
      'familyMember': 'בן משפחה',
      'family_member': 'בן משפחה',
      'guest': 'אורח',
      'supplier': 'ספק',
      'primaryAdmin': 'מנהל',
      'primary_admin': 'מנהל',
      'secondaryAdmin': 'מנהל משני',
      'secondary_admin': 'מנהל משני',
      'other': 'אחר'
    };
    return types[type] || type;
  }

  getJoinDate(): string {
    // Placeholder - will be updated when we have actual join date
    return '16/08/2025';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onSaveMember(formData: Partial<Member>): void {
    if (!this.member) return;

    const snakeCaseData: Record<string, string> = {
      first_name: formData.firstName || '',
      last_name: formData.lastName || '',
      email: formData.email || '',
      mobile: formData.mobile || '',
      type: formData.type || '',
      title: formData.title || '',
      country: formData.country || '',
      city: formData.city || '',
      address: formData.address || '',
      address2: formData.address2 || '',
      zipcode: formData.zipcode || ''
    };

    this.memberService.update(this.member.id, snakeCaseData).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error: Error) => {
        console.error('Error saving member:', error);
      }
    });
  }
}
