import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../../core/services/local/user.service';
import { BusinessService } from '../../../../core/services/network/business.service';
import { AuthService } from '../../../../core/services/network/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-security-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-tab.html',
  styleUrl: './security-tab.sass'
})
export class SecurityTabComponent {
  private userService = inject(UserService);
  private businessService = inject(BusinessService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  email = this.userService.user()?.email || '';
  isSendingReset = false;
  resetEmailSent = false;
  isDeleting = false;
  deleteSuccess = false;

  @Output() sendPasswordReset = new EventEmitter<string>();

  onSendPasswordReset(): void {
    if (!this.email) return;

    this.isSendingReset = true;
    this.sendPasswordReset.emit(this.email);

    // Simulate success after emit
    setTimeout(() => {
      this.isSendingReset = false;
      this.resetEmailSent = true;
    }, 1000);
  }

  onDeleteAccount(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        title: 'מחיקת חשבון',
        message: 'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו בלתי הפיכה ותמחק את כל הנתונים.',
        confirmText: 'מחק חשבון',
        cancelText: 'ביטול'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isDeleting = true;
        this.businessService.delete().subscribe({
          next: () => {
            this.isDeleting = false;
            this.deleteSuccess = true;
            setTimeout(() => {
              this.authService.logout().subscribe(() => {
                this.router.navigate(['/login']);
              });
            }, 2000);
          },
          error: () => {
            this.isDeleting = false;
          }
        });
      }
    });
  }
}
