import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categories-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-tab.html',
  styleUrl: './categories-tab.sass'
})
export class CategoriesTabComponent {
  memberTypes: string[] = ['קבוע', 'אורח', 'בן משפחה', 'מנהל', 'ספק'];
  expenseTypes: string[] = ['החזקת בית הכנסת', 'ציוד וריהוט', 'הנהלה ושכר', 'ביטוחים', 'תפעול פעילויות', 'ספקים ובעלי מקצוע'];
  newMemberType = '';
  newExpenseType = '';

  addMemberType(): void {
    if (this.newMemberType.trim()) {
      this.memberTypes.push(this.newMemberType.trim());
      this.newMemberType = '';
    }
  }

  removeMemberType(type: string): void {
    this.memberTypes = this.memberTypes.filter(t => t !== type);
  }

  addExpenseType(): void {
    if (this.newExpenseType.trim()) {
      this.expenseTypes.push(this.newExpenseType.trim());
      this.newExpenseType = '';
    }
  }

  removeExpenseType(type: string): void {
    this.expenseTypes = this.expenseTypes.filter(t => t !== type);
  }
}
