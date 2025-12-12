import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DashboardService } from '../../core/services/network/dashboard.service';
import { DebtService } from '../../core/services/network/debt.service';
import { DashboardStats, SummaryCards, LastMonthBalance, DebtDistribution, SemiAnnualTrend } from '../../core/entities/dashboard.entity';
import { Debt, DebtStatus } from '../../core/entities/debt.entity';
import { firstValueFrom } from 'rxjs';
import { PaymentComponent } from '../payment/payment';
import { ExpenseFormComponent } from '../expenses/expense-form/expense-form';
import { ReminderDialogComponent, ReminderDialogResult } from '../../shared/components/reminder-dialog/reminder-dialog';
import { convertToHebrewDate } from '../../core/utils/hebrew-date.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.sass'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private debtService = inject(DebtService);
  private dialog = inject(MatDialog);

  summaryCards: SummaryCards | null = null;
  lastMonthBalance: LastMonthBalance | null = null;
  debtDistribution: DebtDistribution | null = null;
  semiAnnualTrend: SemiAnnualTrend | null = null;
  recentDebts: Debt[] = [];
  isLoading = false;
  isLoadingDebts = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadRecentDebts();
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.summaryCards = data.summaryCards;
        this.lastMonthBalance = data.lastMonthBalance;
        this.debtDistribution = data.debtDistribution;
        this.semiAnnualTrend = data.semiAnnualTrend;
        
        // Fix income and expenses from the last month in semiAnnualTrend
        if (this.lastMonthBalance && this.semiAnnualTrend && this.semiAnnualTrend.months.length > 0) {
          const lastMonth = this.semiAnnualTrend.months[this.semiAnnualTrend.months.length - 1];
          
          // Use income from last month in semiAnnualTrend
          if (lastMonth && parseFloat(lastMonth.income) >= 0) {
            this.lastMonthBalance.income = lastMonth.income;
          } else if (this.summaryCards?.donations) {
            // Fallback to donations amount
            this.lastMonthBalance.income = this.summaryCards.donations.amount;
          }
          
          // Use expenses from last month in semiAnnualTrend
          if (lastMonth && parseFloat(lastMonth.expenses) >= 0) {
            this.lastMonthBalance.expenses = lastMonth.expenses;
          } else if (this.summaryCards?.expenses) {
            // Fallback to expenses amount
            this.lastMonthBalance.expenses = this.summaryCards.expenses.amount;
          }
          
          // Recalculate balance
          const income = parseFloat(this.lastMonthBalance.income);
          const expenses = parseFloat(this.lastMonthBalance.expenses);
          this.lastMonthBalance.balance = (income - expenses).toFixed(2);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'שגיאה בטעינת נתוני הדשבורד';
        this.isLoading = false;
      }
    });
  }

  formatAmount(amount: string): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0 ₪';
    // Format with commas, no decimals, preserve sign for negative values
    const rounded = Math.round(num);
    return `${rounded.toLocaleString('he-IL')} ₪`;
  }

  formatAmountNoSpace(amount: string): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0₪';
    // Format with commas, no decimals, no space before shekel sign
    const rounded = Math.round(num);
    return `${rounded.toLocaleString('he-IL')}₪`;
  }

  formatAmountWithoutShekel(amount: string): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    // Format with commas, no decimals, no shekel sign
    const rounded = Math.round(num);
    return rounded.toLocaleString('he-IL');
  }

  formatPercentage(percent: number): string {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent}%`;
  }

  formatMonthLabel(month: string): string {
    // Convert "2025-01" to "01/25"
    const parts = month.split('-');
    if (parts.length === 2) {
      const year = parts[0].slice(-2);
      const monthNum = parts[1];
      return `${monthNum}/${year}`;
    }
    return month;
  }

  getDebtTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'neder_shabbat': 'נדר שבת',
      'tikun_nezek': 'תיקון נזק',
      'dmei_chaver': 'דמי חבר',
      'kiddush': 'קידוש שבת',
      'neder_yom_shabbat': 'נדר יום שבת',
      'other': 'אחר'
    };
    return labels[type] || type;
  }

  getSortedDebtCategories(): Array<{ type: string; label: string; amount: string; percentage: number }> {
    if (!this.debtDistribution || !this.debtDistribution.categories) return [];
    return [...this.debtDistribution.categories].sort((a, b) => b.percentage - a.percentage);
  }

  getDebtCategoryColor(category: { type: string; label: string; amount: string; percentage: number }, rank: number, totalCategories: number): string {
    const primaryBlue = '#0b1a51'; // Dark blue for highest percentage
    const lightBlue = '#bfc7da';   // Light gray-blue for lowest percentage
    
    if (totalCategories === 0) return primaryBlue;
    const factor = rank / (totalCategories - 1);
    
    // Interpolate between primaryBlue and lightBlue
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb1 = hexToRgb(primaryBlue);
    const rgb2 = hexToRgb(lightBlue);
    if (!rgb1 || !rgb2) return primaryBlue;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  getDebtCategoryDashArray(category: { type: string; label: string; amount: string; percentage: number }): string {
    const circumference = 2 * Math.PI * 48;
    const overlap = 2; // 2px overlap for seamless connection
    const dashLength = (circumference * category.percentage) / 100 + overlap;
    const gap = circumference - dashLength;
    return `${dashLength} ${gap}`;
  }

  getDebtCategoryDashOffset(category: { type: string; label: string; amount: string; percentage: number }, sortedCategories: Array<{ type: string; label: string; amount: string; percentage: number }>, currentIndex: number): number {
    if (currentIndex === 0) return 0;
    
    const circumference = 2 * Math.PI * 48;
    let offset = 0;
    for (let i = 0; i < currentIndex; i++) {
      const prevCategory = sortedCategories[i];
      if (prevCategory) {
        offset += (circumference * prevCategory.percentage) / 100;
      }
    }
    return -offset;
  }

  getMaxBarHeight(): number {
    if (!this.lastMonthBalance) return 100;
    const income = parseFloat(this.lastMonthBalance.income);
    const expenses = parseFloat(this.lastMonthBalance.expenses);
    const max = Math.max(income, expenses);
    // If max is 0, return 1 to avoid division by zero
    return max === 0 ? 1 : max;
  }

  getBarHeight(value: string, max: number): string {
    const num = parseFloat(value);
    if (isNaN(num) || max === 0) return '0%';
    return `${(num / max) * 100}%`;
  }

  getBarWidth(value: string, max: number): string {
    const num = parseFloat(value);
    if (isNaN(num) || max === 0) return '0%';
    return `${(num / max) * 100}%`;
  }

  getMaxTrendValue(): number {
    if (!this.semiAnnualTrend || !this.semiAnnualTrend.months.length) return 1;
    let max = 0;
    for (const month of this.semiAnnualTrend.months) {
      const income = parseFloat(month.income);
      const expenses = parseFloat(month.expenses);
      const total = income + expenses;
      max = Math.max(max, total);
    }
    // If max is 0, return 1 to avoid division by zero
    return max === 0 ? 1 : max;
  }

  getTrendBarHeight(month: { income: string; expenses: string }, max: number): string {
    const income = parseFloat(month.income);
    const expenses = parseFloat(month.expenses);
    const total = income + expenses;
    
    // If total is 0 or invalid, return minimum height
    if (isNaN(total) || total === 0) return '20px';
    
    // If max is 0, return minimum height
    if (max === 0) return '20px';
    
    // Calculate percentage height
    const percentage = (total / max) * 100;
    
    // Container height is 82px, but max bar height is 65px
    // Highest bar (100%) = 65px, others proportional
    const maxBarHeight = 65;
    const calculatedHeight = (percentage / 100) * maxBarHeight;
    
    // Ensure minimum height of 20px (only for non-zero values)
    const finalHeight = Math.max(calculatedHeight, 20);
    
    return `${finalHeight}px`;
  }

  getTrendTotal(month: { income: string; expenses: string }): string {
    const income = parseFloat(month.income);
    const expenses = parseFloat(month.expenses);
    const total = income + expenses;
    return total.toFixed(2);
  }

  getTrendBarColor(index: number): string {
    const colors = ['#DCE1EB', '#2F3264', '#ACB7D2', '#BFC8DA', '#2F3264', '#ACB7D2'];
    return colors[index % colors.length];
  }

  isNegativeBalance(balance: string): boolean {
    return parseFloat(balance) < 0;
  }

  async generateReport(type: 'expenses' | 'donations' | 'debts' | 'balance'): Promise<void> {
    try {
      let blob: Blob;
      
      switch (type) {
        case 'expenses':
          blob = await firstValueFrom(this.dashboardService.generateExpenseReport());
          break;
        case 'donations':
          blob = await firstValueFrom(this.dashboardService.generateDonationsReport());
          break;
        case 'debts':
          blob = await firstValueFrom(this.dashboardService.generateDebtsReport());
          break;
        case 'balance':
          blob = await firstValueFrom(this.dashboardService.generateBalanceReport());
          break;
        default:
          throw new Error('Invalid report type');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const currentMonth = new Date().toISOString().slice(0, 7);
      a.download = `${type}_report_${currentMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(`Error generating ${type} report:`, error);
      // TODO: Show error message to user
    }
  }

  loadRecentDebts(): void {
    this.isLoadingDebts = true;
    this.debtService.getAll({
      status: 'pending',
      limit: 4,
      sort_by: 'created_at',
      sort_order: 'desc'
    }).subscribe({
      next: (response) => {
        this.recentDebts = response.rows.slice(0, 4);
        this.isLoadingDebts = false;
      },
      error: (error) => {
        console.error('Error loading recent debts:', error);
        this.isLoadingDebts = false;
      }
    });
  }

  getHebrewDate(debt: Debt): string {
    if (debt.hebrewDate) {
      return debt.hebrewDate;
    }
    return convertToHebrewDate(debt.gregorianDate);
  }

  formatGregorianDate(date: string): string {
    if (!date) return '--';
    return date;
  }

  getStatusLabel(status: DebtStatus): string {
    const labels: Record<DebtStatus, string> = {
      'pending': 'לא שולם',
      'paid': 'שולם',
      'overdue': 'פג תוקף',
      'cancelled': 'בוטל'
    };
    return labels[status] || status;
  }

  isStatusPaid(status: DebtStatus): boolean {
    return status === 'paid' || status === 'cancelled';
  }

  sendReminder(debt: Debt): void {
    const dialogRef = this.dialog.open(ReminderDialogComponent, {
      width: '600px',
      panelClass: 'reminder-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        memberIds: [debt.memberId],
        memberCount: 1,
        memberName: debt.fullName,
        initialMessage: '',
        debtStatus: debt.status
      }
    });

    dialogRef.afterClosed().subscribe(async (result: ReminderDialogResult | undefined) => {
      if (result && result.message) {
        try {
          await firstValueFrom(this.debtService.sendReminder(debt.id));
          // Reload recent debts after sending reminder
          this.loadRecentDebts();
        } catch (error) {
          console.error('Error sending reminder:', error);
        }
      }
    });
  }

  openPaymentDialog(): void {
    const dialogRef = this.dialog.open(PaymentComponent, {
      width: '900px',
      panelClass: 'payment-dialog',
      disableClose: false,
      hasBackdrop: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardStats();
      }
    });
  }

  openExpenseDialog(): void {
    const dialogRef = this.dialog.open(ExpenseFormComponent, {
      width: '900px',
      panelClass: 'expense-form-dialog',
      disableClose: false,
      hasBackdrop: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardStats();
      }
    });
  }

  openReminderDialog(): void {
    const dialogRef = this.dialog.open(ReminderDialogComponent, {
      width: '600px',
      panelClass: 'reminder-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Handle reminder sent
      }
    });
  }
}
