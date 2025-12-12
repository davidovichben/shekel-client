import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/local/user.service';

@Component({
  selector: 'app-security-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-tab.html',
  styleUrl: './security-tab.sass'
})
export class SecurityTabComponent {
  private userService = inject(UserService);

  email = this.userService.user()?.email || '';
  isSendingReset = false;
  resetEmailSent = false;

  @Output() sendPasswordReset = new EventEmitter<string>();
  @Output() deleteAccount = new EventEmitter<void>();

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
    this.deleteAccount.emit();
  }
}
