import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Member } from '../../../../../core/entities/member.entity';
import { Debt, DebtStatus } from '../../../../../core/entities/debt.entity';
import { DebtService } from '../../../../../core/services/network/debt.service';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { ReminderDialogComponent, ReminderDialogResult } from '../../../../../shared/components/reminder-dialog/reminder-dialog';

@Component({
  selector: 'app-member-open-debts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-debts.html',
  styleUrl: './open-debts.sass'
})
export class MemberOpenDebtsComponent implements OnInit {
  private debtService = inject(DebtService);
  private dialog = inject(MatDialog);

  @Input() member: Member | null = null;

  debts: Debt[] = [];
  totalDebts = 0;
  totalAmount = 0;
  isLoading = false;
  isSending = false;
  selectedDebts: Set<string> = new Set();

  ngOnInit(): void {
    if (this.member) {
      this.loadDebts();
    }
  }

  loadDebts(): void {
    if (!this.member) return;

    this.isLoading = true;
    this.debtService.getByMemberOpen(this.member.id).subscribe({
      next: (response) => {
        this.debts = response.rows;
        this.totalDebts = response.counts?.totalRows || response.rows.length;
        this.calculateTotalAmount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading debts:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateTotalAmount(): void {
    this.totalAmount = this.debts.reduce((sum, debt) => sum + debt.amount, 0);
  }

  getStatusLabel(status: DebtStatus): string {
    const labels: Record<string, string> = {
      [DebtStatus.Pending]: 'ממתין',
      [DebtStatus.Paid]: 'שולם',
      [DebtStatus.Overdue]: 'איחור תשלום',
      [DebtStatus.Cancelled]: 'בוטל'
    };
    return labels[status] || status;
  }

  getDebtTypeLabel(description: string): string {
    // Map debt types to Hebrew labels
    const types: Record<string, string> = {
      'neder_shabbat': 'נדר שבת',
      'tikun_nezek': 'תיקון נזק',
      'dmei_chaver': 'דמי חבר',
      'kiddush': 'קידוש שבת',
      'neder_yom_shabbat': 'נדר יום שבת',
      'other': 'אחר'
    };
    return types[description] || description || 'נדר יום שבת';
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

  toggleAllSelection(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.debts.forEach(d => this.selectedDebts.add(d.id));
    } else {
      this.selectedDebts.clear();
    }
  }

  isDebtSelected(debtId: string): boolean {
    return this.selectedDebts.has(debtId);
  }

  isAllSelected(): boolean {
    return this.debts.length > 0 && this.selectedDebts.size === this.debts.length;
  }

  // Actions
  onPaySelectedDebts(): void {
    if (this.selectedDebts.size === 0) return;
    console.log('Pay selected debts:', Array.from(this.selectedDebts));
  }

  onSendReminders(): void {
    if (this.selectedDebts.size === 0) return;
    console.log('Send reminders for:', Array.from(this.selectedDebts));
  }

  onPrint(): void {
    window.print();
  }

  onExportToFile(): void {
    console.log('Export to file');
  }

  // Row actions
  onSendReminder(debt: Debt): void {
    const dialogRef = this.dialog.open(ReminderDialogComponent, {
      width: '750px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        memberIds: [debt.memberId],
        memberCount: 1,
        memberName: debt.fullName,
        debtDescription: this.getDebtTypeLabel(debt.debtType || ''),
        debtAmount: debt.amount
      }
    });

    dialogRef.afterClosed().subscribe((result: ReminderDialogResult | undefined) => {
      if (result && result.message) {
        this.isSending = true;
        this.debtService.sendReminder(debt.id, result.message).subscribe({
          next: (updatedDebt) => {
            this.isSending = false;
            const index = this.debts.findIndex(d => d.id === debt.id);
            if (index !== -1) {
              this.debts[index] = updatedDebt;
            }
            this.dialog.open(ConfirmDialogComponent, {
              width: '400px',
              panelClass: 'confirm-dialog-panel',
              data: {
                title: 'ההודעה נשלחה בהצלחה',
                message: `הודעת תזכורת נשלחה ל-${debt.fullName}`,
                confirmText: 'סגור'
              }
            });
          },
          error: (error) => {
            this.isSending = false;
            console.error('Error sending reminder:', error);
            this.dialog.open(ConfirmDialogComponent, {
              width: '400px',
              panelClass: 'confirm-dialog-panel',
              data: {
                icon: 'triangle-warning',
                title: 'שגיאה בשליחת ההודעה',
                message: 'אירעה שגיאה בעת שליחת הודעת התזכורת. אנא נסה שוב.',
                confirmText: 'סגור'
              }
            });
          }
        });
      }
    });
  }

  onEditDebt(debt: Debt): void {
    // TODO: Open edit debt dialog
    console.log('Edit debt:', debt.id);
  }

  onDeleteDebt(debt: Debt): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'confirm-dialog-panel',
      data: {
        title: 'מחיקת חוב',
        message: 'האם אתה בטוח שברצונך למחוק את החוב?',
        confirmText: 'מחק',
        cancelText: 'ביטול'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.debtService.delete(debt.id).subscribe({
          next: () => {
            this.debts = this.debts.filter(d => d.id !== debt.id);
            this.calculateTotalAmount();
          },
          error: (error) => {
            console.error('Error deleting debt:', error);
          }
        });
      }
    });
  }

  onViewDebt(debt: Debt): void {
    // TODO: Open view debt dialog/panel
    console.log('View debt:', debt.id);
  }
}
