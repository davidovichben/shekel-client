import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BusinessService } from '../../../core/services/network/business.service';

export interface ReminderDialogData {
  memberIds: string[];
  memberCount: number;
  memberName?: string;
  hasNonDebtors?: boolean;
  memberBalance?: number;
  debtStatus?: string; // 'pending', 'paid', 'overdue', 'cancelled'
  // Debt-specific data for placeholder substitution
  debtDescription?: string;
  debtAmount?: number;
}

export interface ReminderDialogResult {
  message: string;
}

@Component({
  selector: 'app-reminder-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './reminder-dialog.html',
  styleUrl: './reminder-dialog.sass'
})
export class ReminderDialogComponent implements OnInit {
  message = '';
  isLoading = true;

  private defaultMessage = `שלום,
זוהי הודעת תזכורת לתשלום חוב: {תיאור החוב} על סך {סכום} מבית הכנסת "אהל יצחק", נבקשך להסדיר את התשלום בהקדם.
בתודה מראש
גבאי בית הכנסת - רבי שלמה.`;

  constructor(
    public dialogRef: MatDialogRef<ReminderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReminderDialogData,
    private businessService: BusinessService
  ) {}

  ngOnInit(): void {
    // Fetch business message template
    this.businessService.show().subscribe({
      next: (business: any) => {
        let template = this.defaultMessage;

        // Handle message_template as string or object
        if (business.message_template) {
          if (typeof business.message_template === 'string') {
            template = business.message_template;
          } else if (business.message_template.content) {
            template = business.message_template.content;
          }
        }

        this.message = this.substitutePlaceholders(template);
        this.isLoading = false;
      },
      error: () => {
        this.message = this.substitutePlaceholders(this.defaultMessage);
        this.isLoading = false;
      }
    });
  }

  get showWarning(): boolean {
    // If debt status is provided, check if it's paid (not active)
    if (this.data.debtStatus) {
      return this.data.debtStatus === 'paid' || this.data.debtStatus === 'cancelled';
    }
    // Otherwise, check member balance (for member reminders)
    if (this.data.memberName) {
      return (this.data.memberBalance ?? 0) >= 0;
    }
    return this.data.hasNonDebtors ?? false;
  }

  get warningMessage(): string {
    if (this.data.memberName) {
      return 'שים לב, לחבר זה אין חוב פעיל.';
    }
    return 'שים לב, נבחרו גם חברי קהילה שאינם בעלי חוב פעיל חזור אחורה והסר את הבחירה במידה ולא תרצה לשלוח להם הודעה.';
  }

  private substitutePlaceholders(template: string): string {
    // Don't substitute placeholders for bulk messages (multiple members)
    if (this.data.memberCount > 1) {
      return template;
    }

    let result = template;

    // Substitute debt description placeholders
    if (this.data.debtDescription) {
      result = result.replace(/\{תיאור החוב\}/g, this.data.debtDescription);
      result = result.replace(/\[תיאור החוב\]/g, this.data.debtDescription);
    }

    // Substitute debt amount placeholders - use debtAmount or fall back to memberBalance
    const amount = this.data.debtAmount ?? (this.data.memberBalance !== undefined ? Math.abs(this.data.memberBalance) : undefined);
    if (amount !== undefined) {
      const amountStr = `${amount} ₪`;
      result = result.replace(/\{סכום\}/g, amountStr);
      result = result.replace(/\[סכום\]/g, amountStr);
      result = result.replace(/\[סכום החוב\]/g, amountStr);
      result = result.replace(/\{סכום החוב\}/g, amountStr);
    }

    return result;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSend(): void {
    if (this.message.trim()) {
      this.dialogRef.close({ message: this.message });
    }
  }
}
