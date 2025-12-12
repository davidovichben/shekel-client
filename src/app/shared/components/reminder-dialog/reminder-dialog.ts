import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ReminderDialogData {
  memberIds: string[];
  memberCount: number;
  memberName?: string;
  hasNonDebtors?: boolean;
  memberBalance?: number;
  initialMessage?: string;
  debtStatus?: string; // 'pending', 'paid', 'overdue', 'cancelled'
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
export class ReminderDialogComponent {
  message = `שלום,
זוהי הודעת תזכורת לתשלום חוב: {תיאור החוב} על סך {סכום} מבית הכנסת "אהל יצחק", נבקשך להסדיר את התשלום בהקדם.
בתודה מראש
גבאי בית הכנסת - רבי שלמה.`;

  constructor(
    public dialogRef: MatDialogRef<ReminderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReminderDialogData
  ) {
    // If initial message is provided, use it instead of default
    if (data.initialMessage) {
      this.message = data.initialMessage;
    }
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

  onClose(): void {
    this.dialogRef.close();
  }

  onSend(): void {
    if (this.message.trim()) {
      this.dialogRef.close({ message: this.message });
    }
  }
}
