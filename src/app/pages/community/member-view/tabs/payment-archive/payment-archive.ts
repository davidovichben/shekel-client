import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../../core/entities/member.entity';
import { Debt, DebtStatus } from '../../../../../core/entities/debt.entity';
import { DebtService } from '../../../../../core/services/network/debt.service';

@Component({
  selector: 'app-member-payment-archive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-archive.html',
  styleUrl: './payment-archive.sass'
})
export class MemberPaymentArchiveComponent implements OnInit {
  private debtService = inject(DebtService);

  @Input() member: Member | null = null;

  payments: Debt[] = [];
  totalPayments = 0;
  totalAmount = 0;
  isLoading = false;
  selectedPayments: Set<string> = new Set();

  ngOnInit(): void {
    if (this.member) {
      this.loadPayments();
    }
  }

  loadPayments(): void {
    if (!this.member) return;

    this.isLoading = true;
    this.debtService.getByMemberClosed(this.member.id).subscribe({
      next: (response) => {
        this.payments = response.rows;
        this.totalPayments = response.counts?.totalRows || response.rows.length;
        this.calculateTotalAmount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateTotalAmount(): void {
    this.totalAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
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
  togglePaymentSelection(paymentId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedPayments.add(paymentId);
    } else {
      this.selectedPayments.delete(paymentId);
    }
  }

  toggleAllSelection(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.payments.forEach(p => this.selectedPayments.add(p.id));
    } else {
      this.selectedPayments.clear();
    }
  }

  isPaymentSelected(paymentId: string): boolean {
    return this.selectedPayments.has(paymentId);
  }

  isAllSelected(): boolean {
    return this.payments.length > 0 && this.selectedPayments.size === this.payments.length;
  }

  // Actions
  onPrint(): void {
    window.print();
  }

  onExportToFile(): void {
    console.log('Export to file');
  }

  // Row actions
  onEditPayment(payment: Debt): void {
    console.log('Edit payment:', payment.id);
  }

  onDeletePayment(payment: Debt): void {
    console.log('Delete payment:', payment.id);
  }

  onViewPayment(payment: Debt): void {
    console.log('View payment:', payment.id);
  }
}
